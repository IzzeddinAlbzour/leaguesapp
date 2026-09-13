# Launch checklist

Operational steps the admin runs once, in order, before a real league opens.
Copied from `docs/superpowers/specs/2026-09-10-leaguesapp-design.md` and kept
in sync with it.

1. **Promote the first admin.** Register normally through `/register`, then
   run in the Supabase SQL editor (or ask an existing admin):
   ```sql
   update profiles set role = 'admin' where id = '<your user id>';
   ```
2. **Enter real venues** for the city, with their `price_per_slot`, from
   `/admin` → a league's setup page.
3. **Create the league** — `entry_fee`, `deposit_amount`, `rounds` — with real
   numbers for the city being launched. (`teams_max` and `starts_on` are not
   yet fields on `leagues`; the admin manages the team count and kickoff
   date operationally.)
4. **Set the league `status = 'open'`** so captains can register their own
   team from `/team/new` and register it into the league from `/team`, or
   the admin can still add a team by hand from the league's admin page.
5. **Warm the WhatsApp SIM for a week** — slice 7 only, not required for the
   MVP launch.
6. **Keep league money in a separate bank account.** Never spend deposits
   before the season ends.
7. **Publish the Arabic terms + privacy page** — `/terms` — before opening
   registration. It already states what's stored (name, phone, payment
   records; no card data).

## What's self-serve now

- **Captains** create their own team (`/team/new`), get a shareable invite
  link, and register it into any `open` league — no admin data entry
  required. The admin can still add a team by hand for a captain without an
  account.
- **Players** join a team from its invite link (`/join/[token]`) once they
  have an account; no separate roster-request flow.
- **Payments** are real records (`payments` table — amount, method, date,
  note) against `entry_fee`/`deposit_amount`, cash/bank-transfer/Reflect/
  iBuraq only, admin-confirmed from the league setup page. `league_teams.paid`
  auto-flips once the running total clears the deposit (or the full entry
  fee when no deposit is set) — **still no payment gateway, by design.**
- **Password reset** is admin-mediated end to end: `/admin/members` →
  generate a 6-digit code → read it to the user → they redeem it at
  `/reset-password`.
- **Player card** (`/p/[id]`, `/p/me`) — goals and assists, shareable.

## Known deviations from the full spec (still accepted for this MVP)

- **Result entry is admin-only.** There is no captain self-report + opponent
  confirmation handshake. The admin enters `home_score` / `away_score` and
  goal scorers directly from `/admin/matches/[id]`.
- **Notifications (slice 7)** are not built. No WhatsApp messages fire yet.
- No authenticated top bar / bottom nav shell yet — logged-in navigation is
  a link list on `/`.

## Before opening a league

- [ ] Security advisor warning "Leaked Password Protection Disabled" —
      enable in Supabase dashboard → Auth → Policies, before real user
      passwords are collected.
- [ ] `npx tsc --noEmit` clean, `npx vitest run` green, `npx next build`
      clean — re-check after any schema or dependency change.
