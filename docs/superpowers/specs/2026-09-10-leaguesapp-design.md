# leaguesapp — Design

Date: 2026-09-10
Status: approved for implementation
Rev 2 (2026-09-10): closed launch gaps — account recovery, dispute/withdrawal handling, roster lock, generated slugs, deposit-activation rule, launch checklist.

## Purpose

A platform that runs amateur sports leagues in Palestine end to end: a player creates a team, joins an organised league, and the system handles opponents, fixtures, results, standings, and statistics. It replaces WhatsApp groups and Excel sheets.

First deployment: Jenin, football 7-a-side, one league. The structure must carry more sports, more cities, and more currencies without a rewrite.

## The core principle

Everything in this product orbits one engine:

```
fixtures -> results -> standings
```

Profiles, player cards, free agents, and venue dashboards are satellites. Until the standings table updates by itself after a real match, there is no product. Build nothing peripheral before that works.

## Roles

| Role | Can |
|---|---|
| Player | Register, complete profile, join a team, view fixtures, standings, stats |
| Captain | All of the above, plus create and manage a team, register it in a league, set the league roster, enter and confirm results, request a reschedule |
| Venue owner | See bookings and availability for their own venue (deferred past MVP) |
| Admin | Everything: create leagues, generate fixtures, assign venues, confirm results, confirm payments, resolve disputes |

Roles live in `profiles.role`. The admin surface is role-gated routes in the same app, not a separate application.

## Key decisions

### Standings and statistics are views, never stored counters

Stored counters drift. An admin corrects a wrong score, a match is cancelled, a team withdraws, and the numbers stay wrong forever. A view recomputes from source every time and cannot drift.

```sql
create view standings as
with rows as (
  select league_id, home_team_id as team_id, home_score gf, away_score ga
    from matches where status in ('played','walkover')
  union all
  select league_id, away_team_id, away_score, home_score
    from matches where status in ('played','walkover')
)
select league_id, team_id,
       count(*)                                    played,
       count(*) filter (where gf > ga)             won,
       count(*) filter (where gf = ga)             drawn,
       count(*) filter (where gf < ga)             lost,
       coalesce(sum(gf),0)                         goals_for,
       coalesce(sum(ga),0)                         goals_against,
       coalesce(sum(gf - ga),0)                    goal_difference,
       count(*) filter (where gf > ga) * 3
     + count(*) filter (where gf = ga)             points
from rows
group by league_id, team_id;
```

`player_stats` follows the same shape over `match_events`.

### The score is authoritative; events are attribution

`matches.home_score` and `away_score` are entered directly and are the truth. `match_events` records who scored and who assisted. **The two are not required to reconcile.** In amateur football someone will always forget to log a scorer; blocking result entry on a complete event list would stall every match day.

### One events table feeds four screens

`match_events` (goal, assist, yellow, red, own_goal) produces top scorers, player statistics, the player card, and the match timeline. One table, four surfaces.

### Sport rules are configuration, not code

`sports` carries `points_win`, `points_draw`, `points_loss`, `allows_draw`. Football, basketball, and volleyball differ by row, not by branch. No sport-plugin layer until sport #2 actually exists.

### League roster is separate from team membership

A player can belong to a team without being registered for a given season. `team_members` is the permanent squad; `league_rosters` is the official list for one league. A player may appear in only one roster per league. The captain edits the roster freely while the league is `open`; once it is `active` the roster is locked and only the admin can change it.

### Payments are records, not transactions

No gateway. The captain transfers by cash, bank, Reflect, or iBuraq, uploads a screenshot, and an admin confirms. A team's `league_teams.status` moves `pending` to `active` when its confirmed payments sum to at least `leagues.deposit_amount`. A team that is not `active` does not appear in fixtures. Whether the rest of `entry_fee` is collected up front or in instalments is the admin's arrangement with the captain — the system only tracks the running confirmed total against `entry_fee` and surfaces the shortfall.

### One admin resolves everything by editing

Every dispute, correction, and withdrawal is the admin changing a row. There is no separate arbitration flow: to resolve a disputed result the admin edits `home_score` / `away_score` and sets `admin_confirmed_at`; to accept a reschedule the admin edits `kickoff_at`; to process a withdrawal the admin sets `league_teams.status = withdrawn` and the team's `scheduled` matches to `cancelled` (played matches stay, but the `standings` view already ignores a `cancelled` match, so a half-season withdrawal simply removes that team's results). Reschedule requests and disputes reach the admin as an in-app queue item plus a WhatsApp message; neither needs its own table.

### Account recovery

Phone plus password, no SMS, no transactional email. A locked-out user contacts the admin, who triggers a reset from the admin panel: the app generates a one-time 6-digit code, the admin reads it to the user over the phone or WhatsApp, and the user sets a new password with it. Codes live in `password_resets (profile_id, code_hash, expires_at, used_at)` and expire in 30 minutes. This is enough at ~100 users; a self-service email reset is post-MVP.

### Public slugs

`teams.slug` and `leagues.slug` are generated, not derived from the Arabic name: a 10-character URL-safe nanoid. Shareable links stay ASCII and never collide. The Arabic name is always shown; the slug is only in the URL.

## Data model

```
-- reference
sports          (id, key, name_ar, name_en, default_players_per_side,
                 points_win, points_draw, points_loss, allows_draw)
cities          (id, name_ar, name_en, country_code, currency, timezone)

-- identity
profiles        (id -> auth.users, full_name, phone, avatar_url, city_id,
                 birth_date, preferred_position, preferred_foot,
                 self_rating, role, wa_contact_opened_at, created_at)
                 role: player | venue_owner | admin
                 wa_contact_opened_at: set by the OpenWA webhook once the user
                 has messaged the league number (see Notifications). Null until
                 then; WhatsApp sends are gated on it.

-- venues
venues          (id, name, city_id, owner_id, formats int[], address,
                 price_per_slot, currency, is_active)

-- teams
teams           (id, name, slug, logo_url, sport_id, city_id, captain_id,
                 level, is_recruiting, created_at)
team_members    (id, team_id, profile_id, jersey_number, status, joined_at)
                 status: pending | active | removed
                 unique (team_id, profile_id)
team_invites    (token, team_id, created_by, expires_at, used_at)

-- leagues
leagues         (id, name, slug, sport_id, city_id, season,
                 players_per_side, roster_min, roster_max, teams_max, rounds,
                 status, entry_fee, deposit_amount, currency,
                 starts_on, created_by, created_at)
                 status: draft | open | active | finished | cancelled
league_teams    (id, league_id, team_id, status, registered_at)
                 status: pending | active | withdrawn
                 unique (league_id, team_id)
league_rosters  (id, league_id, team_id, profile_id, jersey_number)
                 unique (league_id, profile_id)

-- matches
matches         (id, league_id, round, home_team_id, away_team_id, venue_id,
                 kickoff_at, status, home_score, away_score,
                 home_confirmed_at, away_confirmed_at, admin_confirmed_at,
                 motm_profile_id, created_at)
                 status: scheduled | played | postponed | cancelled | walkover
match_events    (id, match_id, profile_id, team_id, type, minute)
                 type: goal | assist | yellow | red | own_goal

-- money
payments        (id, league_id, team_id, amount, currency, method, proof_url,
                 status, note, recorded_by, confirmed_by, paid_at, created_at)
                 method: cash | bank | reflect | iburaq | other
                 status: pending | confirmed | rejected

-- auth recovery
password_resets (id, profile_id, code_hash, expires_at, used_at, created_at)
                 admin-generated 6-digit code, 30-minute expiry

-- notifications
notifications      (id, profile_id, type, title, body, link, read_at, created_at)
push_subscriptions (id, profile_id, endpoint, p256dh, auth, created_at)
wa_sends           (id, profile_id, template_key, payload jsonb, status, sent_at, created_at)
                   status: queued | sent | failed | skipped_no_contact

-- views
standings       (league_id, team_id, played, won, drawn, lost,
                 goals_for, goals_against, goal_difference, points)
player_stats    (league_id, profile_id, matches, goals, assists, yellows, reds)
```

Every table carrying league or team context also carries `sport_id`, `city_id`, or `currency` where relevant, from the first migration.

## Authorization (RLS)

| Table | Read | Write |
|---|---|---|
| `leagues`, `matches`, `teams`, `standings`, `player_stats`, `sports`, `cities`, `venues` | **anon** — the public league page must work without login | admin |
| `profiles` | authenticated | self (admin may edit any) |
| `team_members` | authenticated | team captain |
| `league_rosters` | authenticated | team captain while league is `open`; admin always |
| `matches` score fields | anon | either captain while `scheduled` / `awaiting`; admin always |
| `payments` | own team captain and admin | captain creates `pending`; only admin confirms or rejects |
| `password_resets`, `wa_sends`, `notifications`, `push_subscriptions` | none (server-only) | none (server-only, via the service role in Server Actions) |

Anonymous read on the public tables is a product requirement, not an oversight: the shareable public league page is the growth loop, and a login wall kills it. `is_admin()` is a `security definer` helper reading `profiles.role`; every admin-write policy calls it.

## Result confirmation flow

```
scheduled
   |  captain enters score + events
awaiting confirmation
   |  opposing captain confirms       -> admin confirms -> played
   |  opposing captain disputes       -> admin resolves -> played
   |  no opponent response in 48h     -> admin resolves -> played
```

Standings count only matches in `played` or `walkover`. An unconfirmed result is invisible in the table.

## Notifications (slice 7)

WhatsApp via self-hosted OpenWA, **outbound only**. Full rationale and operating rules in `docs/OPENWA.md`.

Five templated messages, nothing more:

| Message | Trigger |
|---|---|
| Your full schedule | admin publishes fixtures |
| Match tomorrow | cron, 24h before kickoff |
| A result needs your confirmation — carries a **deep link into the app**, not a reply prompt | opposing captain submitted a score |
| Payment installment due | installment date passes, still unpaid |
| Standings after the round | admin confirms the last match of a round |

**No inbound parsing.** The one inbound path is the #830 handshake: WhatsApp drops the first message to a number that has never messaged the sender, so onboarding asks the user to text the league number once. The webhook sets `profiles.wa_contact_opened_at` and does nothing else. Every send is gated on that column; a user who has not done the handshake sees an in-app banner instead.

Web Push (the `push_subscriptions` table) is a later Android-side extra, not part of slice 7.

## Build order

Each slice is one session. A slice is done when its acceptance check passes and `npx tsc --noEmit` is clean.

| # | Slice | Done when |
|---|---|---|
| — | `generateFixtures` pure function | 8 teams produce 28 matches; every pair once; no team twice in a round |
| 0 | Foundation: Next.js, Supabase, RTL, auth | Register and log in; page renders Arabic RTL |
| 1 | Profiles | Complete a profile with avatar; it persists |
| 2 | Teams | Captain creates a team; 6 players join by link; roster shows 7 |
| 3 | Leagues and payments | 8 teams registered; admin confirms payments; all `active` |
| 4 | Fixtures | Generated schedule with venue and kickoff per match |
| 5 | **Results and standings** | Enter a result, opponent confirms, table reorders — **the product exists here** |
| 6 | Stats and player card | Card renders real numbers; shareable |
| 7 | Notifications | The five WhatsApp messages fire on their triggers; the #830 handshake gates them |

Slices 0 to 5 are the MVP. Everything after is retention.

`generateFixtures` comes before slice 0 because it is the only real algorithm in the product and it needs no database, no UI, and no framework. It is the cheapest thing to build and the most expensive thing to discover broken in slice 4.

## Match venue and time

All matches are at neutral rented pitches. `home_team_id` / `away_team_id` are only a fixture-table label and first-listed ordering — there is no home advantage and no home venue. The admin assigns `venue_id` and `kickoff_at` per match after fixtures are generated; slice 4's scheduling screen is the heaviest admin surface because it sets ~28 rows.

## Launch checklist (operational, not a slice)

Before a real league opens, the admin does this once, in order — captured in `docs/LAUNCH.md` during slice 3:

1. Register normally, then an existing admin (or a one-off SQL update for the very first) sets `profiles.role = 'admin'`.
2. Enter the real venues for the city with their `price_per_slot`.
3. Create the league: `entry_fee`, `deposit_amount`, `teams_max`, `rounds`, `starts_on`, all from real Jenin numbers.
4. Set the league `status = 'open'` so captains can register.
5. Warm the WhatsApp SIM for a week (slice 7 only).
6. Keep league money in a separate bank account. Never spend deposits before the season ends.
7. Publish a short Arabic terms + privacy page (name, phone, and payment records are stored; no card data).

## Out of scope

Payment gateway, automated venue booking, live match mode, ELO rating, transfer market, knockout tournaments, AI scheduling, venue-owner dashboard, a separate admin application, multi-sport UI branching, English locale, self-service password reset.

## Open question

Real venue and referee prices in Jenin are unknown. They are league configuration (`entry_fee`, `deposit_amount`), not constants, so implementation is not blocked. The numbers must be entered before a real league opens.
