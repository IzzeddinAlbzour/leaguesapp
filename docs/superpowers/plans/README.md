# Plan map — MVP to launch

The spec (`../specs/2026-09-10-leaguesapp-design.md`) is the complete definition of the launch MVP. This map breaks it into executable plans. Each plan is written in full **just before it is executed**, not upfront — slice 0's decisions reshape slice 3, so detailed plans written now would be stale by the time they ran.

Execute a plan with `superpowers:subagent-driven-development`: fresh subagent per task, review between tasks.

| Plan | Slices | Status | Spec sections | Acceptance |
|---|---|---|---|---|
| `2026-09-10-foundation.md` | fixtures fn, 0 | **written** | Data model (sports/cities/profiles), RLS helper, auth | Register + log in; Arabic RTL renders; `generateFixtures` passes 10 tests |
| `identity-and-teams.md` | 1, 2 | to write | Profiles, teams, `team_members`, `team_invites`, generated slugs, roster basics | Complete a profile with avatar; captain creates a team; 6 players join by `wa.me` link; roster shows 7 |
| `leagues-and-money.md` | 3 | to write | `leagues`, `league_teams`, `league_rosters`, `payments`, deposit-activation rule, roster lock, `docs/LAUNCH.md` | 8 teams register; captain uploads a transfer screenshot; admin confirms; team goes `active` when confirmed ≥ `deposit_amount` |
| `the-engine.md` | 4, 5 | to write | Fixtures generation into `matches`, admin venue/kickoff scheduling screen, result entry, confirmation flow, `standings` view, dispute/withdrawal via admin edit | Admin publishes 28 fixtures with venue + time; captain enters a result; opponent confirms; `standings` reorders live |
| `stats-and-cards.md` | 6 | to write | `match_events`, `player_stats` view, FIFA-style player card, top scorers, public league page polish | Player card renders real goals/assists; shareable as a link and an image |
| `notifications.md` | 7 | to write | `docs/OPENWA.md` — 5 templated messages, `wa_sends`, the #830 handshake webhook, cron for match-tomorrow, `password_resets` admin flow | The 5 messages fire on their triggers; a user without the handshake gets an in-app banner, not a dropped send |

## Cross-cutting, folded into the plan that first needs it

- **Admin panel** — role-gated `/admin` routes, built incrementally: payments queue (plan 3), scheduling + result-confirm queue + dispute/withdrawal + password-reset (plan 4), broadcast (plan 6).
- **PWA manifest + icons** — plan 2 (first slice with real UI).
- **`docs/LAUNCH.md`** — the operational runbook, written in plan 3, followed once before a real league opens.
- **Empty and error states, Arabic copy** — every plan owns the states for the screens it builds; no separate pass.
- **Deploy** — Vercel import at the end of the foundation plan; every later plan just pushes.

## Definition of "launch ready"

All six plans executed, plus: `docs/LAUNCH.md` followed for the Jenin league, real venue/referee numbers entered, the WhatsApp SIM warmed, a short Arabic terms + privacy page published, and league money in a separate bank account.
