-- reference data ------------------------------------------------------------

create table sports (
  id                        uuid primary key default gen_random_uuid(),
  key                       text unique not null,
  name_ar                   text not null,
  name_en                   text not null,
  default_players_per_side  int  not null,
  points_win                int  not null default 3,
  points_draw               int  not null default 1,
  points_loss               int  not null default 0,
  allows_draw               boolean not null default true
);

create table cities (
  id            uuid primary key default gen_random_uuid(),
  name_ar       text not null,
  name_en       text not null,
  country_code  text not null default 'PS',
  currency      text not null default 'ILS',
  timezone      text not null default 'Asia/Hebron'
);

-- identity ------------------------------------------------------------------

create type user_role as enum ('player', 'venue_owner', 'admin');

create table profiles (
  id                   uuid primary key references auth.users on delete cascade,
  full_name            text,
  phone                text unique,
  avatar_url           text,
  city_id              uuid references cities,
  birth_date           date,
  preferred_position   text,
  preferred_foot       text,
  self_rating          int check (self_rating between 1 and 5),
  role                 user_role not null default 'player',
  wa_contact_opened_at timestamptz,  -- set by the OpenWA webhook in slice 7
  created_at           timestamptz not null default now()
);

-- every auth user gets a profile row at signup
create function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, phone)
  values (new.id, new.phone);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- admin check, reused by every admin-write policy in later migrations
create function is_admin()
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- row level security --------------------------------------------------------

alter table sports   enable row level security;
alter table cities   enable row level security;
alter table profiles enable row level security;

-- reference data is public: the shareable league page must render logged out
create policy "sports are readable by anyone"
  on sports for select using (true);

create policy "cities are readable by anyone"
  on cities for select using (true);

create policy "profiles are readable by authenticated users"
  on profiles for select to authenticated using (true);

create policy "a profile is writable by its owner"
  on profiles for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "an admin can update any profile"
  on profiles for update to authenticated
  using (is_admin())
  with check (is_admin());
