import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { enterResult } from '@/app/actions/admin';
import { Button } from '@/components/ui/button';

export default async function ResultEntryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const t = await getTranslations('admin.result');
  const supabase = await createClient();

  const { data: matchRow } = await supabase
    .from('matches')
    .select(
      'id, home_score, away_score, ' +
        'home_team:teams!matches_home_team_id_fkey(id, name), ' +
        'away_team:teams!matches_away_team_id_fkey(id, name)',
    )
    .eq('id', id)
    .single();
  const match = matchRow as unknown as {
    id: string;
    home_score: number | null;
    away_score: number | null;
    home_team: { id: string; name: string } | null;
    away_team: { id: string; name: string } | null;
  } | null;
  if (!match || !match.home_team || !match.away_team) notFound();

  const [{ data: homePlayers }, { data: awayPlayers }, { data: existingGoals }] = await Promise.all([
    supabase.from('players').select('id, name').eq('team_id', match.home_team.id).order('name'),
    supabase.from('players').select('id, name').eq('team_id', match.away_team.id).order('name'),
    supabase.from('match_events').select('player_id').eq('match_id', id).eq('type', 'goal'),
  ]);

  const goalCounts = new Map<string, number>();
  for (const e of existingGoals ?? []) {
    goalCounts.set(e.player_id, (goalCounts.get(e.player_id) ?? 0) + 1);
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-lg font-semibold">
        {match.home_team.name} × {match.away_team.name}
      </h1>

      <form action={enterResult.bind(null, id)} className="flex flex-col gap-6">
        <div className="flex items-center justify-center gap-4">
          <ScoreInput name="home_score" defaultValue={match.home_score} label={match.home_team.name} />
          <span className="text-xl text-text-dim">—</span>
          <ScoreInput name="away_score" defaultValue={match.away_score} label={match.away_team.name} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <RosterColumn team={match.home_team.name} players={homePlayers ?? []} goalCounts={goalCounts} noPlayersLabel={t('noPlayers')} />
          <RosterColumn team={match.away_team.name} players={awayPlayers ?? []} goalCounts={goalCounts} noPlayersLabel={t('noPlayers')} />
        </div>

        <Button type="submit" className="mt-1">
          {t('save')}
        </Button>
      </form>
    </div>
  );
}

function ScoreInput({
  name,
  defaultValue,
  label,
}: {
  name: string;
  defaultValue: number | null;
  label: string;
}) {
  return (
    <label className="flex flex-col items-center gap-1.5">
      <span className="max-w-24 truncate text-xs text-text-dim">{label}</span>
      <input
        type="number"
        name={name}
        min={0}
        required
        defaultValue={defaultValue ?? undefined}
        dir="ltr"
        className="tabular h-16 w-16 rounded-app border border-border-strong bg-surface text-center text-2xl font-bold focus:border-accent"
      />
    </label>
  );
}

function RosterColumn({
  team,
  players,
  goalCounts,
  noPlayersLabel,
}: {
  team: string;
  players: { id: string; name: string }[];
  goalCounts: Map<string, number>;
  noPlayersLabel: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <h2 className="truncate text-xs font-medium text-text-dim">{team}</h2>
      {players.length === 0 ? (
        <p className="text-xs text-text-dim">{noPlayersLabel}</p>
      ) : (
        players.map((p) => (
          <label
            key={p.id}
            className="flex items-center justify-between gap-2 rounded-app border border-border bg-surface px-2.5 py-2"
          >
            <span className="truncate text-sm">{p.name}</span>
            <input
              type="number"
              name={`goals_${p.id}`}
              min={0}
              defaultValue={goalCounts.get(p.id) ?? 0}
              dir="ltr"
              className="tabular h-8 w-12 shrink-0 rounded border border-border bg-canvas text-center text-sm focus:border-accent"
            />
          </label>
        ))
      )}
    </div>
  );
}
