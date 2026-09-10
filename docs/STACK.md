# Stack Decision — leaguesapp

Amateur sports league platform. Palestine. Web first, native mobile later.

## Constraints driving the choice

| Requirement | Consequence |
|---|---|
| Standings, fixtures, player stats | Relational data with aggregation — **SQL, not document store** |
| Arabic-first, RTL, local dialect | i18n + logical CSS properties from day one |
| Multi-sport / multi-city / multi-country later | `sport_id`, `city_id`, `currency` columns from day one — no abstraction layer yet |
| Manual payments (cash / bank / WhatsApp) | **No payment gateway.** Payment records + admin confirmation only |
| Native iOS/Android later | Backend must be client-agnostic (HTTP/SDK), not coupled to the web framework |
| $0 today | Free tiers that permit commercial use |

## The stack

| Layer | Choice | Free tier |
|---|---|---|
| Framework | **Next.js 15** (App Router) + TypeScript | — |
| UI | **Tailwind CSS v4** + shadcn/ui | free |
| i18n / RTL | **next-intl**, `dir="rtl"`, logical properties (`ms-`/`me-`/`ps-`/`pe-`) | free |
| Database | **Supabase Postgres** | 500 MB, commercial use OK |
| Auth | **Supabase Auth** — phone + password | 50k MAU |
| Storage | **Supabase Storage** (logos, avatars) | 1 GB |
| Realtime | **Supabase Realtime** (live standings) | included |
| Authorization | **Postgres RLS** — same rules for web and mobile | included |
| Hosting | **Vercel** (beta) → Cloudflare Workers or Vercel Pro at launch | see note |
| Push | **Web Push (VAPID)** + PWA install | free |
| Errors | Sentry | 5k events/mo |
| Mobile (later) | **Expo / React Native** on the same Supabase backend | EAS free tier |

## Why Supabase, not Firebase

Standings are a SQL problem:

```sql
-- one query, no client-side aggregation
select team_id,
       count(*) as played,
       sum((goals_for > goals_against)::int) * 3
     + sum((goals_for = goals_against)::int) as points,
       sum(goals_for - goals_against) as gd
from match_results group by team_id order by points desc, gd desc;
```

Firestore forces this into client code or duplicated counters that drift. Postgres also gives RLS — one authorization layer both the web app and the future mobile app inherit for free.

## Phone OTP — the one thing that is not $0

SMS costs money everywhere (~$0.04–0.08 per message to Palestine, plus a monthly number fee). Firebase and Supabase both bill it through a provider.

**v1: phone number + password.** Zero cost, zero friction, a login model the market already understands. Add real OTP once there is revenue — Supabase Auth swaps the provider without a data migration, since the phone number is already the identity.

## Hosting note

Vercel's Hobby tier forbids commercial use. The app charges money, so:

- **Beta / pre-revenue:** Vercel Hobby is fine.
- **At launch:** Cloudflare Workers via OpenNext (free tier permits commercial use), or Vercel Pro at $20/mo.

For a first season in Jenin — roughly 80 players — traffic is negligible on any of them.

## Mobile path

The web app and the future mobile app share the backend, not the UI:

```
Supabase (Postgres + Auth + Storage + RLS)
  ├── Next.js web        ← now
  └── Expo React Native  ← later, App Store + Google Play
```

Shared between them: generated TypeScript types from the database schema, and the RLS policies. Nothing else needs to be shared, so no monorepo until the mobile app actually exists.

## Deliberately not building

Payment gateway, automated venue booking, live match mode, ELO rating, transfer market, knockout tournaments, AI scheduling, a separate admin application, GraphQL, Redis, microservices.

The admin panel is role-gated routes inside the same Next.js app.

## Cost trajectory

| Stage | Monthly |
|---|---|
| Beta, one league | **$0** |
| Launch, commercial hosting | **$0–20** |
| >500 MB data or >50k MAU | +$25 (Supabase Pro) |
| Real SMS OTP | ~$5–15 |
