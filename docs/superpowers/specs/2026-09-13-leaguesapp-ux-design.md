# leaguesapp UX & identity redesign — spec

Supersedes the visual system in the 2026-09-10 design spec's DESIGN.md
references (flat-emerald "Floodlight" attempt). Data model and screen
inventory below extend, not replace, the 2026-09-10 spec — read that first
for the product's core decisions (auth, payments-as-records, RLS pattern,
build order). This spec exists because that one never described a screen
inventory or a membership model expressive enough for a player who isn't
a captain and doesn't want to be.

## 1. Strategic frame

The incumbent this app competes with is a WhatsApp group plus the admin's
spreadsheet, not another sports app. ~80% of sessions are one question:
*when's my next match, where, and where does my team stand.* Every design
decision here is judged against "is this faster than the WhatsApp group."

The bragging — a good result, a hat-trick, a final table — already happens
in WhatsApp. The app doesn't compete with that channel; it feeds it. Every
result, player card, and final table renders as a designed share image.
That is the growth loop and the identity carrier in one feature, and it is
why the visual system matters more than it would for an internal tool.

**Identity name: «تحت الأضواء» — Under the Lights.** These are night
matches on rented turf under floodlights; the name and the visual world
(section 3) come directly from that, not from an invented metaphor.

## 2. Membership model (schema change)

The 2026-09-10 spec's `teams.captain_id` (single owner column, added in
migration 0005) cannot express: a player who never wants to captain, a
captain who steps down and stays a player, or a teamless player waiting to
be found. Captaincy must be a role on a roster entry, not ownership of the
team row.

```sql
alter table players add column role text not null default 'player'
  check (role in ('captain', 'player'));
alter table players add column left_at timestamptz;
alter table players add column shirt_number smallint;

alter table profiles add column looking_for_team boolean not null default false;

-- teams.captain_id (0005) is dropped once the migration below ships;
-- captaincy is derived: role = 'captain' and left_at is null.
```

- A `players` row is a membership record. It may have no `profile_id` (an
  admin-typed name, as today) or a linked account.
- A team may have more than one captain — real leagues split "collects the
  money" from "picks the lineup." RLS treats every captain equally.
- Leaving is `left_at`, never a delete. `match_events.player_id` references
  `players`, so a departed player's goals must survive them leaving —
  deleting the row would silently erase scoring history.
- A team can never reach zero captains: transferring captaincy to another
  member is required before the last captain can step down to `player`.
- RLS moves from `teams.captain_id = auth.uid()` to a security-definer
  `is_captain_of(team_id uuid) returns boolean`, mirroring the existing
  `is_admin()` pattern — a direct correlated-subquery policy on `players`
  referencing `players` again risks RLS recursion.

### The teamless-player path

Registering never forces team creation. A player with no team and no
invite code lands in a real state with two doors, not a dead end:

1. Enter an invite code (existing `/join/[token]` flow).
2. Opt into the **available-players pool** (`profiles.looking_for_team`) —
   visible to any captain with an open roster slot, who can send an invite
   without needing a phone call first.

### Captaincy transfer

`/team/captaincy` (captain-only): pick another current member, confirm,
their `role` becomes `captain`. If the acting captain is stepping down to
plain `player`, this is required first — the action that would leave a
team with zero captains is refused, not silently allowed.

## 3. Visual identity — Under the Lights

The app has no fixed brand accent. App chrome is ink and white; the one
reserved signal hue is for *live/now only*. Every other color on screen
belongs to a team. This is the core anti-slop decision: a generated UI
picks one accent and sprays it everywhere, so the fix is to not have one.

- **Team color** — `teams.color`, one of 12 pre-validated hues (AA-plus on
  both near-black and near-white), auto-assigned at creation, editable by
  a captain from team settings. Public pages, the match card, and the
  standings row all render in it.
- **Team crest** — `teams.crest_url`, nullable. Until a captain uploads
  one, the crest is a monogram: the team name's first Arabic letter, set
  in the display face, on the team's color.
- **My-team color travels** — inside a member's own team context (their
  home card, `/team`, the bottom nav's active state, the focus ring), the
  UI's signal color becomes their team's color. Free, real personalization
  with no settings screen.
- **Type, two roles.** Display: **Zain** (Arabic, weight 900 used
  deliberately, not everywhere) for scores, hero team names, page titles,
  share images. Body/UI: IBM Plex Sans Arabic, the existing family — it
  was never the problem. Numerals `tabular-nums` everywhere; oversized
  where the number *is* the content (a score, a goal tally, a countdown).
- **The match card is the atom.** One component, three densities — hero
  (home, top of a match page), row (fixture lists, schedule board), mini
  (share images, notifications). Home, the league page, the team page, and
  the admin schedule board all compose from the same object instead of
  each screen reinventing a card.
- **The app has a heartbeat.** The hero match card is not a static
  fixture — it renders one of five states from `kickoff_at`/`status`
  (section 5) and visibly changes day to day. A static table gets opened
  once; a countdown gets checked.
- **Dark-committed**, not a light/dark toggle. True near-black ground,
  near-white text — the muddy slate-on-navy that shipped earlier read as
  generated *because* the contrast was soft, not because it was dark.
  Night use, floodlit-pitch premise, cheap OLED screens: dark is the right
  call outright, and high contrast (not a light theme) is what actually
  solves daylight legibility.
- **Share images are designed**, not screenshots. Server-rendered (Satori/
  `next/og` or equivalent) at three shapes: match result poster, player
  season card, final league table. Poster-grade type and the team's own
  color, generated on every result entry and on demand from a player card.

### Explicit anti-slop bans (extends DESIGN.md's "Not this")

No fixed brand accent color anywhere in the product. No card-wall page
structure. No eyebrow/kicker labels. No gradient text. No emoji standing
in for an icon — a single real icon library, one stroke weight, used
everywhere or not at all. No accent border-left/right above 1px on any
card, row, or alert (the specific pattern the mechanical detector already
caught once in this project). No generic "AI dark SaaS" look: that means
no single flat accent-on-navy scheme reused across every screen — color
must come from the data (team, state) or it doesn't appear.

## 4. Screen inventory (A–Z)

**Shell** — bottom tab bar, 4 tabs (`الرئيسية · الدوري · فريقي ·
حسابي`), persistent once authenticated, safe-area aware. Does not exist
today; every screen in the current build is an island reached by hitting
back to `/`.

**Public, no account required:**
- League page — fixtures / standings / scorers tabs (exists, reskinned)
- **Match page** (`/l/[slug]/m/[matchId]`) — does not exist today. The
  destination for a shared link: hero match card, scorers, venue, a link
  back to the league.
- Team page (exists, reskinned; gains crest + color)
- Player card (exists as a stub; rebuilt per section 6)
- Invite landing (`/join/[token]`, exists)
- Terms (exists)

**Auth:** register, login, reset-password redeem (exist, reskinned)

**Player:**
- Home — the heartbeat card, my team's standing, latest results, my
  season tally. Real content; today's `/` is a placeholder link list.
- Available-players pool opt-in (new — section 2)
- My team (exists as `/team`, becomes read-only for a non-captain member
  plus a "leave team" action)
- Profile (exists, gains `looking_for_team` toggle)
- My card (exists as a stub; rebuilt per section 6)

**Captain (superset of player):**
- Create team (exists)
- Roster management — invite link, remove member, **invite from the
  available-players pool** (new)
- Team settings — name, color, crest upload (new; color/crest are new
  fields)
- Captaincy transfer (new — section 2)
- League registration + payment status — amount owed, deposit vs. full,
  **exactly how to pay** (who to hand cash to, bank details, Reflect/
  iBuraq handle — currently missing; a captain who doesn't know how to pay
  will call the admin, which is the failure this whole product exists to
  prevent), running total, and a distinct "paid, awaiting confirmation"
  state (section 5) so a captain who transferred money never has to guess
  whether it registered.
- Team withdrawal (new — dissolve before a league starts vs. withdraw
  mid-season are different actions with different consequences, section 5)

**Admin:**
- Admin home — **today's matches across all leagues first**, league list
  second. The current admin home is a bare league list; an admin running a
  Friday night matchday needs "what's happening today," not "what leagues
  exist."
- League create, league setup (exist, reskinned; deposit/payment-method
  fields gain the "how to pay" copy captains see)
- Payments ledger (exists as of the last session's build; gains the
  awaiting-confirmation state)
- Fixture generation (exists)
- Schedule board — the heaviest existing screen (sets ~28 rows); gains
  venue/time conflict flags
- **Matchday mode** (new) — one screen per match: score steppers plus tap-
  to-add scorers, designed for one hand, standing at the sideline, at
  night. Today's `/admin/matches/[id]` is a form; this is the same data,
  redesigned for the actual physical context it's used in.
- Members, password reset (exist)

## 5. States (every situation named in the brief)

**Account & membership**
- No account, browsing publicly → full read access, one soft (never
  blocking) CTA to register.
- Register with no invite → lands in the no-team state (two doors,
  section 2), never forced into team creation.
- Register via an invite link → auto-joined, no empty state to click
  through.
- Admin corrects a wrong phone number at signup.
- Account deletion → requested from the admin (matches the phone/password,
  no-self-service-email-reset posture already set in the 2026-09-10 spec);
  soft-deleted; the player's roster entries and match events are untouched
  so history stays intact.
- Join the wrong team → leaving is free while the league is `open`.
- Leave mid-season → `left_at` is set; goals already scored still count
  for that team in that league's history.
- Same player rostered in two different leagues → fine, no conflict.
- Same player rostered twice in one league → blocked, with a reason
  shown, not a silent failure.
- A kicked or departed player's goals stay in that league's top scorers.
- Team under its sport's minimum size at kickoff → the admin is warned
  before generating fixtures; the captain sees a nudge on `/team`.
- Duplicate team names across the app → allowed (two "شباب الحي" in
  different cities is real life); the captain is warned, not blocked, if
  one already exists in their own city.
- Team rename mid-season → allowed; the public slug never changes, so
  existing shared links keep working.
- Captain loses their phone / is unreachable → admin reassigns captaincy
  directly (an admin override of the section-2 transfer flow).

**Team lifecycle**
- Dissolve before the league starts → status `disbanded`; members are
  freed back to teamless (eligible for the available-players pool); the
  league registration is withdrawn; any confirmed payment becomes a
  refund record, not a silent deletion.
- Withdraw mid-season → admin sets `withdrawn`; that team's `scheduled`
  matches are cancelled; already-`played` matches are untouched — the
  `standings` view already excludes cancelled matches, so a half-season
  withdrawal correctly removes only the team's future results.

**Money** (this is where a wrong call directly causes phone calls to the
admin, so it gets the most explicit state list)
- Owed and unpaid — amount, deadline if one exists, and the how-to-pay
  instructions, always visible together.
- Partially paid — running total against the deposit/entry-fee threshold,
  remaining balance shown, not just a total.
- **Paid, awaiting admin confirmation** — its own distinct state, never
  collapsed into "unpaid." A captain who transferred money and sees
  "لسا ما دفعت" (current copy) will call the admin; this state is the fix.
- Confirmed / active.
- Withdrawal after a payment was already confirmed → produces a refund
  record rather than deleting the payment.
- A wrong recorded amount → the payment record is editable, and the edit
  keeps who-confirmed-when rather than overwriting silently.

**Matches** — the hero match card renders exactly one of five states,
driven by `kickoff_at` and `status`:
1. No time set yet ("الموعد لسا")
2. Scheduled, more than a few hours out (countdown)
3. Today ("اليوم")
4. Live (`status='played'` is the only "final" state the current schema
   has — a live/in-progress state is new territory a future migration
   would need if the admin wants to update a score mid-match; until then
   "today" is the closest live-adjacent state the schema supports)
5. Played (result, scorers)

Also: a postponed match shows its old time struck through, not silently
blanked. A result missing 24 hours after a scheduled kickoff surfaces as a
nag on the admin's "today's matches" home. A wrong result is corrected by
the admin editing `home_score`/`away_score` directly (2026-09-10 spec's
existing "admin resolves everything by editing" principle) — standings
recompute automatically because `standings` is a view, never a stored
counter. Scorers stay optional; the score alone is authoritative, per the
existing spec's "score is authoritative, events are attribution" decision.
The schedule board flags a venue+time double-booking at a glance instead
of the admin discovering it on matchday.

**League lifecycle** — `draft → open → active → finished → cancelled`
(status values already exist in the 2026-09-10 schema); each has a
distinct public face rather than one generic "league page" ignoring
status. `finished` gets a champion screen, final table, and a season-
review share card. A full league (`teams_max`, if/when that field exists)
or a closed one visibly stops accepting registrations rather than showing
a registration form that silently fails. A new season: teams and rosters
carry forward, stats reset per-league (already true — `standings` and
`top_scorers` are both scoped by `league_id`).

**Infrastructure**
- Slow/offline connection → show the last-known data plus "آخر تحديث
  [time]" rather than a blocking spinner — most of this content is
  read-mostly and stale-but-visible beats unavailable.
- Every list gets a skeleton shaped like its real layout, not a generic
  shimmer block.
- 200% browser zoom holds without breaking layout.
- Win/draw/loss is never color-only (a shape or label always accompanies
  the color, for color-blind and grayscale-screenshot legibility).
- A WhatsApp-shared match link renders a designed OG preview image in the
  chat itself — the link's appearance in the group matters as much as any
  in-app screen, since for most recipients it's the only impression they
  get before deciding whether to tap.

## 6. Player card & share images

Rebuild `/p/[id]` from the current stub (a circle, an initial, two
numbers) into: team crest/color as the card's ground, name in the display
face, season goal/assist tally as the oversized numbers they already are
in `StatBlock`, and a share action that renders the `next/og` season card
instead of the browser's generic share sheet screenshotting the page.

## 7. Retention — what's real

At roughly 100 users who mostly already know each other, manufactured
game mechanics (streaks, XP, badges, "N people viewed your team") read as
condescending, not motivating, and are explicitly out of scope — this is
a deliberate rejection, not an oversight.

What is being built instead, all of it traceable to a section above:
1. The heartbeat state machine on the hero match card (section 3, 5) —
   an app that visibly knows what day it is gets reopened; a static table
   does not.
2. The anticipation window — the countdown and "اليوم" states are the
   two states most sessions will land on in the 48 hours before a match.
3. The result moment — one authored count-up animation when a score
   lands (the single motion moment this spec authorizes; see section 8),
   with the share card ready in the same view.
4. Personal stake — a player's own season tally is visible on their own
   home screen, not buried in a stats page they'd have to seek out.
5. The share loop — result/table share image → posted to the team's
   WhatsApp group → a teammate taps the link → lands on the designed
   match/league page → opens the app. This is the primary growth and
   retention channel for this product, ahead of anything in-app.
6. Table narrative — each standings row can show its position delta since
   the previous round (▲2 / ▼1), which is what turns a static table into
   something worth re-checking.
7. WhatsApp as the notification layer — the five outbound-only OpenWA
   templates from the 2026-09-10 spec's slice 7 are the pull mechanism
   this market actually uses; no push notification system is proposed.
8. Season-end payoff — the `finished`-status champion screen and
   per-player season share card (section 6) give a season a visible
   ending, which is what makes the next season's opening feel like an
   event instead of a silent status flip.

## 8. Motion

One authored moment: the score count-up when a match transitions to
`played` and its card is viewed. Everything else — list appearance, tab
switches, card taps — uses a fast, consistent transform/opacity fade, no
per-section bespoke entrance animation. `prefers-reduced-motion` disables
the count-up (the number simply renders final) and shortens every other
transition to nearly instant.

## 9. Accessibility floor

44px minimum tap target (already a token, `--tap`). Text contrast AA or
better against every surface it renders on, including inside a team-color
fill — the 12-hue palette (section 3) is chosen and validated for this.
Win/draw/loss carries a shape or label, never color alone. 200% zoom does
not break any layout. Reduced motion is honored everywhere motion exists.
All copy is Palestinian-dialect Arabic; no feature requires reading
English (already a 2026-09-10 constraint, restated here because the
share-image and payment-instruction copy are new surfaces it applies to).

## 10. Schema changes this spec requires

Beyond section 2's `players`/`profiles` additions:

```sql
alter table teams add column color text; -- backfilled per-row from the
  -- 12-hue palette at creation time (round-robin or hash-of-id), never a
  -- single shared default — a shared default is exactly the fixed-accent
  -- pattern section 3 rejects.
alter table teams add column crest_url text;
-- teams.captain_id (0005) is dropped; captaincy derives from players.role.
```

RLS: replace every `captain_id = auth.uid()` policy from migration 0005
with `is_captain_of(team_id)`, a security-definer function checking for a
`players` row with `profile_id = auth.uid()`, `role = 'captain'`, and
`left_at is null` on that team — the same pattern as the existing
`is_admin()` function, chosen specifically to avoid a `players`-querying-
`players` RLS policy.

## 11. Explicitly out of scope (unchanged from 2026-09-10, restated)

Payment gateway, automated venue booking, live match mode (see section 5's
note on why "live" stays approximate), ELO rating, transfer market,
knockout tournaments, AI scheduling, a separate admin app, streaks/XP/
badges/engagement-farming mechanics (section 7), push notifications.

## 12. Open questions for implementation planning

- Whether `is_captain_of()` needs a companion `is_member_of()` for the
  roster-visibility policies non-captain members need (viewing payment
  status, for instance) — likely yes, sized during planning.
- Exact 12-hue palette values — produced and contrast-validated during
  implementation, not hand-picked here.
- Whether the "live" match state (section 5, item 4) ships in this pass
  or waits for a future `status='live'` schema addition — recommend
  deferring; today's admin workflow (enter the result after the match)
  doesn't yet produce mid-match updates for a live state to display.
