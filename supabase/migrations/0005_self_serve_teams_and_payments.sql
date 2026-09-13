-- Self-serve captain/player flows + payment records + admin password reset.
-- Extends the lean MVP schema (0004) rather than replacing it: teams stay
-- admin-creatable, but a captain can now also create their own team, invite
-- players by link, and register it into an open league. `league_teams.paid`
-- stays the admin's at-a-glance override; `payments` is the detail ledger
-- behind it (cash / bank transfer / Reflect / iBuraq — no gateway, ever).

alter table teams add column captain_id uuid references profiles;
alter table teams add column invite_token text unique;

alter table players add column profile_id uuid references profiles;

alter table leagues add column deposit_amount numeric(10, 2);

create table payments (
  id           uuid primary key default gen_random_uuid(),
  league_id    uuid references leagues on delete cascade not null,
  team_id      uuid references teams on delete cascade not null,
  amount       numeric(10, 2) not null check (amount > 0),
  method       text not null check (method in ('cash', 'bank_transfer', 'reflect', 'iburaq')),
  paid_at      date not null default current_date,
  note         text,
  confirmed_by uuid references profiles,
  created_at   timestamptz not null default now()
);

-- Admin-mediated recovery: the app generates a 6-digit code, the admin reads
-- it to the user over the phone/WhatsApp, the user sets a new password with
-- it. Only ever touched by service-role server actions — no client policy
-- needed; RLS enabled with zero policies is a hard default-deny.
create table password_resets (
  id         uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles on delete cascade not null,
  code_hash  text not null,
  expires_at timestamptz not null,
  used_at    timestamptz,
  created_at timestamptz not null default now()
);

alter table payments        enable row level security;
alter table password_resets enable row level security;

create policy "payments readable by admin or the team's captain"
  on payments for select to authenticated
  using (is_admin() or team_id in (select id from teams where captain_id = auth.uid()));

create policy "admin writes payments"
  on payments for all to authenticated
  using (is_admin()) with check (is_admin());

-- Captains can create and edit their own team.
create policy "captains create their team"
  on teams for insert to authenticated
  with check (captain_id = auth.uid());

create policy "captains update their team"
  on teams for update to authenticated
  using (captain_id = auth.uid())
  with check (captain_id = auth.uid());

-- Captains manage their own team's roster (player join-by-link runs through
-- a service-role server action instead, since the joining player is not
-- the captain).
create policy "captains manage own roster"
  on players for all to authenticated
  using (team_id in (select id from teams where captain_id = auth.uid()))
  with check (team_id in (select id from teams where captain_id = auth.uid()));

-- Captains register their own team into a league that is open for signup.
create policy "captains register their team into an open league"
  on league_teams for insert to authenticated
  with check (
    team_id in (select id from teams where captain_id = auth.uid())
    and league_id in (select id from leagues where status = 'open')
  );
