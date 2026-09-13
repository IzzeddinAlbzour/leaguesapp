import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getLeagueBySlug, getTeamBySlug } from '@/lib/queries';
import { createClient } from '@/lib/supabase/server';

export default async function TeamPage({
  params,
}: {
  params: Promise<{ slug: string; teamSlug: string }>;
}) {
  const { slug, teamSlug } = await params;

  const [league, result] = await Promise.all([getLeagueBySlug(slug), getTeamBySlug(teamSlug)]);
  if (!league || !result) notFound();
  const { team, players } = result;

  const supabase = await createClient();
  const { data } = await supabase
    .from('matches')
    .select(
      'id, round, status, home_score, away_score, ' +
        'home_team:teams!matches_home_team_id_fkey(name), ' +
        'away_team:teams!matches_away_team_id_fkey(name)',
    )
    .eq('league_id', league.id)
    .or(`home_team_id.eq.${team.id},away_team_id.eq.${team.id}`)
    .order('round');
  const matches = data as unknown as Array<{
    id: string;
    round: number;
    status: string;
    home_score: number | null;
    away_score: number | null;
    home_team: { name: string } | null;
    away_team: { name: string } | null;
  }> | null;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col gap-6 p-4 pb-8">
      <Link href={`/l/${slug}`} className="text-sm text-text-dim">
        ← {league.name}
      </Link>

      <header className="flex flex-col gap-1">
        <h1 className="text-xl font-bold">{team.name}</h1>
        {team.captain_name && (
          <p className="text-sm text-text-dim">الكابتن: {team.captain_name}</p>
        )}
      </header>

      <section>
        <h2 className="mb-2 text-sm font-medium text-text-dim">التشكيلة</h2>
        {players.length === 0 ? (
          <p className="text-sm text-text-dim">ما في لاعبين مسجلين لسا.</p>
        ) : (
          <ul className="flex flex-col gap-1">
            {players.map((p) => (
              <li
                key={p.id}
                className="rounded-app border border-border bg-surface px-3 py-2 text-sm"
              >
                {p.name}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-sm font-medium text-text-dim">المباريات</h2>
        {!matches || matches.length === 0 ? (
          <p className="text-sm text-text-dim">ما في مباريات لسا.</p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {matches.map((m) => (
              <li
                key={m.id}
                className="flex items-center justify-between rounded-app border border-border bg-surface px-3 py-2 text-sm"
              >
                <span className="truncate">
                  {m.home_team?.name} × {m.away_team?.name}
                </span>
                {m.status === 'played' ? (
                  <span className="tabular font-semibold">
                    {m.home_score}-{m.away_score}
                  </span>
                ) : (
                  <span className="text-text-dim">الجولة {m.round}</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
