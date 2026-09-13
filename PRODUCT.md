# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

*(Inferred from `docs/superpowers/specs/2026-09-10-leaguesapp-design.md` and `CLAUDE.md` — not a live interview; confirm if wrong.)*

- **Players/captains** — amateur footballers in Palestinian cities (Jenin first), organizing into 7-a-side teams for a paid local league. Low tech-comfort baseline, Arabic-only, mostly on phones.
- **Captains** specifically: create the team, invite ~6 teammates by link, register for a league, coordinate the entry fee/deposit payment with the admin.
- **Admin** — one operator (league owner) who runs everything by hand: confirms payments, generates fixtures, assigns venues/kickoffs, enters results. No multi-admin workflow needed yet.
- **Spectators** — anyone with a league/team link, logged out, checking fixtures/standings/scorers.

## Product Purpose

A lean amateur sports league platform: register, form a team, get scheduled, see live standings and stats. Replaces a WhatsApp group + spreadsheet with one shareable site. Success = a captain can self-serve team setup and see payment status without calling the admin, and any spectator can follow a league from a link.

## Positioning

Not a booking platform, not a payments platform, not a global sports network. It is the smallest possible tool that makes a self-organized amateur league look and run like a real one — public standings, real fixtures, real stats — while every money and scheduling decision still passes through one human admin who resolves everything by editing a row. A neighboring generic "league management SaaS" could not truthfully copy the phone+password-only auth, the zero-payment-gateway money model, or the WhatsApp-based notification layer built for a market where SMS OTP and card rails are not the default.

## Operating Context

- Phone-first, low bandwidth assumed. RTL Arabic, Palestinian dialect (not MSA).
- Money moves outside the app: cash, bank transfer, Reflect, iBuraq. The admin confirms what came in; **there is no payment gateway and none is planned.**
- WhatsApp (via self-hosted OpenWA, slice 7, outbound-only) is the expected notification channel, not email/SMS.
- A season runs as: admin opens a league → captains register teams and pay → admin confirms payment and generates fixtures → admin schedules venue/kickoff per match → results come in → standings/scorers update live → season ends.

## Capabilities and Constraints

- Auth: phone + password only. No SMS OTP (cost), no email flows. Password reset is admin-mediated (admin reads the user a one-time code).
- Payments: **records only, admin-confirmed, cash/bank-transfer/Reflect/iBuraq.** No gateway integration, ever, per explicit product decision — this is final, not an open question.
- Team roster: captain manages while a league is `open`; locked once `active`, admin-only after that.
- Public pages (league, team) require no login.
- Out of scope (confirmed in CLAUDE.md): payment gateway, automated venue booking, live match mode, ELO rating, transfer market, knockout tournaments, AI scheduling, a separate admin app.
- Sport #1 is football (7-a-side); schema carries `sport_id`/`city_id`/`currency` for future sports without a plugin layer yet.

## Brand Commitments

- Name: **دوريات** ("Doriyyat" / "Leagues"). Tagline: "دوريات الهواة في فلسطين" (amateur leagues in Palestine).
- Existing visual system in `DESIGN.md`: dark-first, emerald accent (`#10b981`), IBM Plex Sans Arabic, no card walls, no gradient text, no glass-as-decoration, no emoji-as-icon.

## Evidence on Hand

- Live spec: `docs/superpowers/specs/2026-09-10-leaguesapp-design.md` (data model, RLS, build order, launch checklist).
- Shipped schema: `supabase/migrations/0004_lean_mvp_schema.sql` — deliberately leaner than the original spec (boolean `league_teams.paid`, no ledger, no `league_rosters`/`team_members` split, no `password_resets` table yet). Treat the shipped schema as current truth; extend it, don't fight it.
- Live deploy: `leaguesapp.vercel.app`.

## Product Principles

1. Admin can resolve any dispute or correction by editing a row — never build a separate arbitration/appeals flow.
2. Every screen assumes a phone, Arabic, and a user who has never used a "league management" product before — no jargon, no onboarding tour, self-evident.
3. Money stays a record, never a transaction the app initiates or moves.
4. Public read access (standings/fixtures/scorers) needs zero login friction — it's the product's shareability.
5. Build the lean version of a spec feature before its full version; a captain-facing screen should do the one task it names and nothing speculative.

## Accessibility & Inclusion

Low tech-literacy baseline assumed for players. Tap targets ≥44px (already a DESIGN.md token). No feature should require reading English.
