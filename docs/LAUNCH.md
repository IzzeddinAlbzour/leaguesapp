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
3. **Create the league** — `entry_fee`, `deposit_amount` (deposit tracking is
   deferred in the current lean schema; see note below), `teams_max`,
   `rounds`, `starts_on` — with real numbers for the city being launched.
4. **Set the league `status = 'open'`** so captains can register their teams.
5. **Warm the WhatsApp SIM for a week** — slice 7 only, not required for the
   MVP launch.
6. **Keep league money in a separate bank account.** Never spend deposits
   before the season ends.
7. **Publish the Arabic terms + privacy page** — `/terms` — before opening
   registration. It already states what's stored (name, phone, payment
   records; no card data).

## Known deviations from the full spec (accepted for the lean MVP)

- **Payments** are a single `league_teams.paid` boolean, confirmed by the
  admin per team — not a running ledger against `entry_fee` /
  `deposit_amount`. Good enough at league-launch scale; revisit if a league
  needs partial/instalment tracking.
- **Result entry is admin-only.** There is no captain self-report + opponent
  confirmation handshake. The admin enters `home_score` / `away_score` and
  goal scorers directly from `/admin/matches/[id]`.
- **Notifications (slice 7)** are not built. No WhatsApp messages fire yet.

## Before opening a league

- [ ] Security advisor warning "Leaked Password Protection Disabled" —
      enable in Supabase dashboard → Auth → Policies, before real user
      passwords are collected.
- [ ] `npx tsc --noEmit` clean, `npx vitest run` green, `npx next build`
      clean — re-check after any schema or dependency change.
