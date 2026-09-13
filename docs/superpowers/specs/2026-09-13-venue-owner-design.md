# Venue Owner Role — Design

Spec basis: `appidea.md` §9 (Venue/Field Owner), §28 (MVP scope).

## Decisions (confirmed with user)

1. **Onboarding**: Admin creates venue + owner account manually (phone+password, `role=venue_owner`). No self-registration in MVP.
2. **Booking = match assignment**: No standalone booking table. A match row with `venue_id` set IS the booking. No non-league venue bookings in MVP (matches appidea.md §9: "automatic venue booking not required for v1").
3. **Revenue**: `fee_per_match` (fixed, admin-set per venue) × count of matches where `venue_confirmation_status = 'confirmed'`. Counted at confirmation time, not after the match is played — keeps it a simple running total, not a settled-accounting figure.
4. **Availability**: Ad-hoc slots (owner opens specific date + time range), not a recurring weekly template. Matches owner's stated need for full flexibility.
5. **Rejection handling**: Owner reject → match's `venue_confirmation_status` becomes `rejected`, `venue_id` cleared, admin gets in-app notice to pick a new venue manually. No auto-reassignment (matches "admin manually assigns venues" in appidea.md §9).
6. **Notifications**: In-app only for MVP. Do not add a 6th OpenWA WhatsApp template — `docs/OPENWA.md` and CLAUDE.md fix the template budget at five; expanding it is a separate decision outside this feature's scope.

## Data model

```sql
alter table venues
  add column owner_id uuid references profiles(id),
  add column fee_per_match numeric not null default 0;

create table venue_availability (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references venues(id) on delete cascade,
  date date not null,
  start_time time not null,
  end_time time not null,
  created_at timestamptz not null default now()
);

alter table matches
  add column venue_confirmation_status text
    check (venue_confirmation_status in ('pending','confirmed','rejected'));
-- set to 'pending' whenever admin sets matches.venue_id; null when no venue assigned yet.
```

RLS: venue owner can select/update only rows where `venues.owner_id = auth.uid()` (venues, venue_availability) and matches where `matches.venue_id in (select id from venues where owner_id = auth.uid())` (read match info, update `venue_confirmation_status` only).

## Routes (role-gated, same app — no separate admin app, per CLAUDE.md)

- `src/app/venue/layout.tsx` — guards `role = venue_owner`, redirects otherwise (mirrors `src/app/admin/layout.tsx`).
- `src/app/venue/page.tsx` — dashboard: pending bookings count, upcoming confirmed matches, running revenue total.
- `src/app/venue/bookings/page.tsx` — list of matches assigned to this venue, grouped by pending/confirmed/rejected, confirm/reject Server Actions.
- `src/app/venue/availability/page.tsx` — add/remove `venue_availability` slots.
- `src/app/venue/info/page.tsx` — edit venue name (not fee — fee stays admin-controlled, it's platform commission-relevant).

Admin additions (new, since no admin venue management exists today):

- `src/app/admin/venues/page.tsx` — list venues, create venue (name, city, fee_per_match).
- `src/app/admin/venues/[id]/page.tsx` — edit venue, create/link owner account (phone+password → profile with `role=venue_owner`, `venues.owner_id` set).

## Server Actions (`src/app/actions/venue.ts`, new file — mirrors existing `actions/admin.ts` pattern)

- `confirmBooking(matchId)` — owner-only, sets `venue_confirmation_status='confirmed'`.
- `rejectBooking(matchId)` — owner-only, sets `venue_confirmation_status='rejected'`, clears `venue_id`.
- `addAvailabilitySlot(venueId, date, start, end)` / `removeAvailabilitySlot(id)`.

`src/app/actions/admin.ts` additions:

- `createVenue(name, cityId, feePerMatch)`.
- `createVenueOwner(venueId, phone, password)` — creates profile + auth user, sets `venues.owner_id`.

Existing schedule-assignment action (in `admin/leagues/[id]/schedule`) needs one line added: when setting `matches.venue_id`, also set `venue_confirmation_status='pending'`.

## Out of scope (per appidea.md §29)

Automatic booking, live availability search, venue PRO subscription, sponsorship — none of this in MVP.
