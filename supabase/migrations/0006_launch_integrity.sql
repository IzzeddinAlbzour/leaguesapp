-- Privileged identity fields are immutable through user credentials, including direct REST calls.
grant execute on function public.is_admin() to anon, authenticated, service_role;
create or replace function public.protect_profile_identity() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if coalesce(auth.role(), '') = 'service_role' or session_user = 'postgres' and auth.uid() is null then return new; end if;
  if new.phone is distinct from old.phone or new.id is distinct from old.id
    or new.wa_contact_opened_at is distinct from old.wa_contact_opened_at
    or (new.role is distinct from old.role and not public.is_admin()) then
    raise exception 'Protected profile field';
  end if;
  return new;
end $$;
create trigger protect_profile_identity before update on public.profiles
for each row execute function public.protect_profile_identity();
revoke all on function public.protect_profile_identity() from public;
drop policy "profiles are readable by authenticated users" on public.profiles;
create policy "own profile or admin" on public.profiles for select to authenticated
using (id = auth.uid() or public.is_admin());

-- Preserve existing invitation links but remove tokens from the public teams projection.
create table public.team_invites (
  team_id uuid primary key references public.teams on delete cascade,
  token text unique not null default encode(gen_random_bytes(24), 'hex'),
  created_at timestamptz not null default now()
);
insert into public.team_invites(team_id, token)
select id, invite_token from public.teams where invite_token is not null;
alter table public.team_invites enable row level security;
create policy "captain reads invite" on public.team_invites for select to authenticated
using (public.is_admin() or team_id in (select id from public.teams where captain_id = auth.uid()));
alter table public.teams drop column invite_token;
create function public.create_team_invite() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.team_invites(team_id) values(new.id);
  if new.captain_id is not null then
    insert into public.players(team_id, profile_id, name)
    select new.id, p.id, coalesce(p.full_name, 'كابتن الفريق') from public.profiles p where p.id = new.captain_id;
  end if;
  return new;
end $$;
create trigger create_team_invite after insert on public.teams for each row execute function public.create_team_invite();
revoke all on function public.create_team_invite() from public;
create unique index players_team_profile_unique on public.players(team_id, profile_id) where profile_id is not null;

create function public.enforce_roster_lock() returns trigger language plpgsql security definer set search_path = '' as $$
declare target uuid;
begin
  target := case when TG_OP = 'DELETE' then old.team_id else new.team_id end;
  if not public.is_admin() and exists (
    select 1 from public.league_teams lt join public.leagues l on l.id = lt.league_id
    where lt.team_id = target and l.status = 'active'
  ) then raise exception 'Roster is locked'; end if;
  if TG_OP = 'UPDATE' and old.team_id <> new.team_id then raise exception 'Transfers are not enabled'; end if;
  return case when TG_OP = 'DELETE' then old else new end;
end $$;
create trigger enforce_roster_lock before insert or update or delete on public.players
for each row execute function public.enforce_roster_lock();
revoke all on function public.enforce_roster_lock() from public;

drop policy "captains register their team into an open league" on public.league_teams;
create policy "captains register unpaid into open league" on public.league_teams for insert to authenticated
with check (paid = false and team_id in (select id from public.teams where captain_id = auth.uid())
  and league_id in (select id from public.leagues where status = 'open'));
alter table public.matches add constraint valid_scores check (
  (home_score is null or home_score between 0 and 100) and
  (away_score is null or away_score between 0 and 100) and
  (status <> 'played' or (home_score is not null and away_score is not null))
);
alter table public.matches add constraint different_teams check (home_team_id <> away_team_id);
create unique index unique_round_fixture on public.matches(league_id, round, home_team_id, away_team_id);
alter table public.leagues add constraint valid_league_fees check (
  (entry_fee is null or entry_fee >= 0) and (deposit_amount is null or deposit_amount >= 0)
  and (entry_fee is null or deposit_amount is null or deposit_amount <= entry_fee)
);

-- Database owns the lock and verifies the submitted fixture set before publishing.
create function public.publish_fixtures(p_league uuid, p_fixtures jsonb) returns void
language plpgsql security definer set search_path = '' as $$
declare l public.leagues; n int; expected int;
begin
  if not public.is_admin() then raise exception 'Admin required'; end if;
  select * into strict l from public.leagues where id=p_league for update;
  if l.status not in ('draft','open') or exists(select 1 from public.matches where league_id=p_league) then
    raise exception 'Fixtures already published or league closed';
  end if;
  select count(*) into n from public.league_teams where league_id=p_league and paid;
  if n < 2 then raise exception 'At least two paid teams required'; end if;
  expected := n*(n-1)/2*l.rounds;
  if jsonb_typeof(p_fixtures) <> 'array' or jsonb_array_length(p_fixtures) <> expected then raise exception 'Invalid fixture count'; end if;
  if exists(select 1 from jsonb_to_recordset(p_fixtures) as f(round int, home uuid, away uuid)
    where f.home=f.away or f.round < 1 or f.round > (case when n%2=0 then n-1 else n end)*l.rounds
    or not exists(select 1 from public.league_teams where league_id=p_league and team_id=f.home and paid)
    or not exists(select 1 from public.league_teams where league_id=p_league and team_id=f.away and paid)) then
    raise exception 'Invalid fixture team or round';
  end if;
  if exists(select 1 from jsonb_to_recordset(p_fixtures) as f(round int, home uuid, away uuid)
    group by least(home,away),greatest(home,away) having count(*) <> l.rounds) then raise exception 'Invalid pair count'; end if;
  if exists(select 1 from (
    select f.round,f.home team from jsonb_to_recordset(p_fixtures) as f(round int,home uuid,away uuid)
    union all select f.round,f.away from jsonb_to_recordset(p_fixtures) as f(round int,home uuid,away uuid)
  ) x group by round,team having count(*)>1) then raise exception 'Team appears twice in round'; end if;
  insert into public.matches(league_id, round, home_team_id, away_team_id)
  select p_league, f.round, f.home, f.away from jsonb_to_recordset(p_fixtures) as f(round int,home uuid,away uuid);
  update public.leagues set status='active' where id=p_league;
end $$;
revoke all on function public.publish_fixtures(uuid,jsonb) from public;
grant execute on function public.publish_fixtures(uuid,jsonb) to authenticated;

create function public.save_match_result(p_match uuid, p_home int, p_away int, p_goals jsonb) returns uuid
language plpgsql security definer set search_path = '' as $$
declare m public.matches;
begin
  if not public.is_admin() then raise exception 'Admin required'; end if;
  select * into strict m from public.matches where id=p_match for update;
  if m.status='cancelled' or p_home not between 0 and 100 or p_away not between 0 and 100 or p_home is null or p_away is null then raise exception 'Invalid score'; end if;
  if jsonb_typeof(p_goals)<>'array' or jsonb_array_length(p_goals)>200 then raise exception 'Invalid goals'; end if;
  if exists(select 1 from jsonb_to_recordset(p_goals) as g(player_id uuid, count int)
    left join public.players p on p.id=g.player_id where p.id is null or p.team_id not in (m.home_team_id,m.away_team_id)
    or g.count is null or g.count not between 1 and 100) then raise exception 'Invalid scorer'; end if;
  update public.matches set home_score=p_home,away_score=p_away,status='played' where id=p_match;
  delete from public.match_events where match_id=p_match and type='goal';
  insert into public.match_events(match_id,player_id,team_id,type)
  select p_match,p.id,p.team_id,'goal' from jsonb_to_recordset(p_goals) as g(player_id uuid,count int)
  join public.players p on p.id=g.player_id cross join lateral generate_series(1,g.count);
  return m.league_id;
end $$;
revoke all on function public.save_match_result(uuid,int,int,jsonb) from public;
grant execute on function public.save_match_result(uuid,int,int,jsonb) to authenticated;

create function public.schedule_match(p_match uuid, p_venue uuid, p_local_time timestamp) returns uuid
language plpgsql security definer set search_path = '' as $$
declare m public.matches; city uuid; zone text;
begin
  if not public.is_admin() then raise exception 'Admin required'; end if;
  select * into strict m from public.matches where id=p_match for update;
  select l.city_id,c.timezone into city,zone from public.leagues l join public.cities c on c.id=l.city_id where l.id=m.league_id;
  if p_venue is not null and not exists(select 1 from public.venues where id=p_venue and city_id=city and is_active) then raise exception 'Invalid venue'; end if;
  update public.matches set venue_id=p_venue,kickoff_at=p_local_time at time zone zone where id=p_match;
  return m.league_id;
end $$;
revoke all on function public.schedule_match(uuid,uuid,timestamp) from public;
grant execute on function public.schedule_match(uuid,uuid,timestamp) to authenticated;

alter table public.password_resets add column attempts int not null default 0;
create function public.consume_password_reset(p_phone text, p_hash text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare r public.password_resets; pid uuid;
begin
  select id into pid from public.profiles where phone=p_phone;
  select * into r from public.password_resets where profile_id=pid order by created_at desc limit 1 for update;
  if r.id is null or r.used_at is not null or r.expires_at <= now() or r.attempts >= 5 then return null; end if;
  update public.password_resets set attempts=attempts+1 where id=r.id;
  if r.code_hash<>p_hash then return null; end if;
  update public.password_resets set used_at=now() where id=r.id;
  return pid;
end $$;
revoke all on function public.consume_password_reset(text,text) from public,anon,authenticated;
grant execute on function public.consume_password_reset(text,text) to service_role;

create or replace view public.standings with (security_invoker=true) as
with results as (
  select league_id,home_team_id team_id,home_score gf,away_score ga from public.matches where status='played'
  union all select league_id,away_team_id,away_score,home_score from public.matches where status='played'
)
select r.league_id,r.team_id,count(*) played,
count(*) filter(where gf>ga) won,count(*) filter(where gf=ga) drawn,count(*) filter(where gf<ga) lost,
coalesce(sum(gf),0) goals_for,coalesce(sum(ga),0) goals_against,coalesce(sum(gf-ga),0) goal_difference,
sum(case when gf>ga then s.points_win when gf=ga then s.points_draw else s.points_loss end) points
from results r join public.leagues l on l.id=r.league_id join public.sports s on s.id=l.sport_id
group by r.league_id,r.team_id;
create or replace view public.top_scorers with (security_invoker=true) as
select m.league_id,e.player_id,count(*) goals from public.match_events e join public.matches m on m.id=e.match_id
where e.type='goal' and m.status='played' group by m.league_id,e.player_id;
