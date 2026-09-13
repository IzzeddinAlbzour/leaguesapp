-- Lean MVP: admin enters everything, the public reads everything.
-- Teams and players are names the admin types, not accounts (season 2 adds
-- self-serve). generateFixtures() (src/lib/fixtures.ts) populates matches.

create table venues (
  id       uuid primary key default gen_random_uuid(),
  name     text not null,
  city_id  uuid references cities not null,
  is_active boolean not null default true
);

create table teams (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  slug          text unique not null,
  city_id       uuid references cities not null,
  captain_name  text,
  created_at    timestamptz not null default now()
);

create table players (
  id       uuid primary key default gen_random_uuid(),
  team_id  uuid references teams on delete cascade not null,
  name     text not null
);

create table leagues (
  id          uuid primary key default gen_random_uuid(),
  sport_id    uuid references sports not null,
  city_id     uuid references cities not null,
  name        text not null,
  slug        text unique not null,
  season      text not null,
  rounds      smallint not null default 1 check (rounds in (1, 2)),
  status      text not null default 'draft'
              check (status in ('draft', 'open', 'active', 'finished', 'cancelled')),
  entry_fee   numeric(10, 2),
  currency    text not null default 'ILS',
  created_at  timestamptz not null default now()
);

create table league_teams (
  league_id  uuid references leagues on delete cascade not null,
  team_id    uuid references teams on delete cascade not null,
  paid       boolean not null default false,
  primary key (league_id, team_id)
);

create table matches (
  id          uuid primary key default gen_random_uuid(),
  league_id   uuid references leagues on delete cascade not null,
  round       smallint not null,
  home_team_id uuid references teams not null,
  away_team_id uuid references teams not null,
  venue_id    uuid references venues,
  kickoff_at  timestamptz,
  status      text not null default 'scheduled'
              check (status in ('scheduled', 'played', 'postponed', 'cancelled')),
  home_score  smallint,
  away_score  smallint,
  created_at  timestamptz not null default now()
);

create table match_events (
  id         uuid primary key default gen_random_uuid(),
  match_id   uuid references matches on delete cascade not null,
  player_id  uuid references players not null,
  team_id    uuid references teams not null,
  type       text not null check (type in ('goal', 'assist'))
);

-- standings: recomputed from matches every read, never stored, never drifts.
create view standings with (security_invoker = true) as
with rows as (
  select league_id, home_team_id as team_id, home_score as gf, away_score as ga
    from matches where status = 'played'
  union all
  select league_id, away_team_id, away_score, home_score
    from matches where status = 'played'
)
select
  league_id, team_id,
  count(*)                                           as played,
  count(*) filter (where gf > ga)                    as won,
  count(*) filter (where gf = ga)                     as drawn,
  count(*) filter (where gf < ga)                     as lost,
  coalesce(sum(gf), 0)                                as goals_for,
  coalesce(sum(ga), 0)                                as goals_against,
  coalesce(sum(gf - ga), 0)                           as goal_difference,
  count(*) filter (where gf > ga) * 3
    + count(*) filter (where gf = ga)                 as points
from rows
group by league_id, team_id;

create view top_scorers with (security_invoker = true) as
select m.league_id, e.player_id, count(*) as goals
from match_events e
join matches m on m.id = e.match_id
where e.type = 'goal'
group by m.league_id, e.player_id;

-- row level security --------------------------------------------------------

alter table venues       enable row level security;
alter table teams        enable row level security;
alter table players      enable row level security;
alter table leagues      enable row level security;
alter table league_teams enable row level security;
alter table matches      enable row level security;
alter table match_events enable row level security;

create policy "venues are readable by anyone"       on venues       for select using (true);
create policy "teams are readable by anyone"        on teams        for select using (true);
create policy "players are readable by anyone"      on players      for select using (true);
create policy "leagues are readable by anyone"      on leagues      for select using (true);
create policy "league_teams are readable by anyone" on league_teams for select using (true);
create policy "matches are readable by anyone"      on matches      for select using (true);
create policy "match_events are readable by anyone" on match_events for select using (true);

create policy "admin writes venues"       on venues       for all to authenticated using (is_admin()) with check (is_admin());
create policy "admin writes teams"        on teams        for all to authenticated using (is_admin()) with check (is_admin());
create policy "admin writes players"      on players      for all to authenticated using (is_admin()) with check (is_admin());
create policy "admin writes leagues"      on leagues      for all to authenticated using (is_admin()) with check (is_admin());
create policy "admin writes league_teams" on league_teams for all to authenticated using (is_admin()) with check (is_admin());
create policy "admin writes matches"      on matches      for all to authenticated using (is_admin()) with check (is_admin());
create policy "admin writes match_events" on match_events for all to authenticated using (is_admin()) with check (is_admin());
