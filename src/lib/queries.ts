import 'server-only';
import { createClient } from '@/lib/supabase/server';

/**
 * Read-side queries shared by the public league page and the admin screens.
 * All of them hit tables/views that anon can read (see 0004 migration RLS),
 * so they work the same logged out or logged in.
 */

export async function getLeagueBySlug(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('leagues')
    .select('*, city:cities(name_ar), sport:sports(name_ar, default_players_per_side)')
    .eq('slug', slug)
    .single();
  return data;
}

export async function getTeamsInLeague(leagueId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('league_teams')
    .select('paid, team:teams(id, name, slug, captain_name)')
    .eq('league_id', leagueId);
  return (data ?? []) as unknown as Array<{
    paid: boolean;
    team: { id: string; name: string; slug: string; captain_name: string } | null;
  }>;
}

const FIXTURES_SELECT =
  'id, round, status, home_score, away_score, kickoff_at, ' +
  'home_team:teams!matches_home_team_id_fkey(id, name, slug), ' +
  'away_team:teams!matches_away_team_id_fkey(id, name, slug), ' +
  'venue:venues(name)';

export async function getFixtures(leagueId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('matches')
    .select(FIXTURES_SELECT)
    .eq('league_id', leagueId)
    .order('round', { ascending: true });
  return (data ?? []) as unknown as Array<{
    id: string;
    round: number;
    status: string;
    home_score: number | null;
    away_score: number | null;
    kickoff_at: string | null;
    home_team: { id: string; name: string; slug: string } | null;
    away_team: { id: string; name: string; slug: string } | null;
    venue: { name: string } | null;
  }>;
}

export type StandingsRow = {
  team_id: string;
  team_name: string;
  team_slug: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goals_for: number;
  goals_against: number;
  goal_difference: number;
  points: number;
};

/**
 * Standings joined with team names, sorted by the real football tiebreak:
 * points, then goal difference, then goals scored. Teams with zero matches
 * played (not yet in the `standings` view) are included at the bottom so a
 * league that hasn't kicked off still lists every team.
 */
export async function getStandings(leagueId: string): Promise<StandingsRow[]> {
  const supabase = await createClient();
  const [{ data: rows }, { data: teams }] = await Promise.all([
    supabase.from('standings').select('*').eq('league_id', leagueId),
    supabase
      .from('league_teams')
      .select('team:teams(id, name, slug)')
      .eq('league_id', leagueId),
  ]);

  const byTeam = new Map((rows ?? []).map((r) => [r.team_id, r]));

  const teamRows = (teams ?? []) as unknown as Array<{
    team: { id: string; name: string; slug: string } | null;
  }>;

  const combined: StandingsRow[] = teamRows.flatMap((t) => {
    const team = t.team;
    if (!team) return [];
    const row = byTeam.get(team.id);
    return [
      {
        team_id: team.id,
        team_name: team.name,
        team_slug: team.slug,
        played: row?.played ?? 0,
        won: row?.won ?? 0,
        drawn: row?.drawn ?? 0,
        lost: row?.lost ?? 0,
        goals_for: row?.goals_for ?? 0,
        goals_against: row?.goals_against ?? 0,
        goal_difference: row?.goal_difference ?? 0,
        points: row?.points ?? 0,
      },
    ];
  });

  return combined.sort(
    (a, b) =>
      b.points - a.points ||
      b.goal_difference - a.goal_difference ||
      b.goals_for - a.goals_for ||
      a.team_name.localeCompare(b.team_name, 'ar'),
  );
}

export type ScorerRow = { player_id: string; player_name: string; team_name: string; goals: number };

export async function getTopScorers(leagueId: string): Promise<ScorerRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('top_scorers')
    .select('player_id, goals, player:players(name, team:teams(name))')
    .eq('league_id', leagueId)
    .order('goals', { ascending: false })
    .limit(20);

  const rows = (data ?? []) as unknown as Array<{
    player_id: string | null;
    goals: number | null;
    player: { name: string; team: { name: string } | null } | null;
  }>;

  return rows.flatMap((r) => {
    if (!r.player) return [];
    return [
      {
        player_id: r.player_id!,
        player_name: r.player.name,
        team_name: r.player.team?.name ?? '',
        goals: r.goals ?? 0,
      },
    ];
  });
}

export async function getTeamBySlug(slug: string) {
  const supabase = await createClient();
  const { data: team } = await supabase.from('teams').select('*').eq('slug', slug).single();
  if (!team) return null;
  const { data: players } = await supabase
    .from('players')
    .select('id, name')
    .eq('team_id', team.id)
    .order('name');
  return { team, players: players ?? [] };
}
