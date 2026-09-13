-- Venue Owner role: owner_id + fee on venues, ad-hoc availability slots, and
-- a confirmation flag on matches (a match with a venue_id IS the booking —
-- no separate bookings table, per appidea.md §9's "no auto-booking in v1").

alter table venues add column owner_id uuid references profiles;
alter table venues add column fee_per_match numeric(10, 2) not null default 0;

create table venue_availability (
  id         uuid primary key default gen_random_uuid(),
  venue_id   uuid references venues on delete cascade not null,
  date       date not null,
  start_time time not null,
  end_time   time not null,
  created_at timestamptz not null default now(),
  check (end_time > start_time)
);

alter table matches add column venue_confirmation_status text
  check (venue_confirmation_status in ('pending', 'confirmed', 'rejected'));

alter table venue_availability enable row level security;

-- Owners see and manage only their own venue's slots. Full-row access is
-- fine here — a slot has no field an owner shouldn't control.
create policy "owners manage own venue availability"
  on venue_availability for all to authenticated
  using (venue_id in (select id from venues where owner_id = auth.uid()))
  with check (venue_id in (select id from venues where owner_id = auth.uid()));

-- Owners can read their own venue and the matches assigned to it (booking
-- list + revenue view). Writing stays admin-only (existing "admin writes
-- venues" / "admin writes matches" policies) — confirm/reject and the venue
-- name edit go through service-role-checked Server Actions instead, so an
-- owner can never touch fee_per_match, owner_id, or any match column beyond
-- what those actions expose.
create policy "owners read own venue"
  on venues for select to authenticated
  using (owner_id = auth.uid());

create policy "owners read matches assigned to their venue"
  on matches for select to authenticated
  using (venue_id in (select id from venues where owner_id = auth.uid()));
