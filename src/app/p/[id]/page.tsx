import { notFound, redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { StatBlock } from '@/components/ui/stat-block';

export default async function PlayerCardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const t = await getTranslations('playerCard');
  const supabase = await createClient();

  const playerId = id;
  if (id === 'me') {
    const { data } = await supabase.auth.getUser();
    if (!data.user) redirect('/login');
    const { data: player } = await supabase
      .from('players')
      .select('id')
      .eq('profile_id', data.user.id)
      .limit(1)
      .maybeSingle();
    if (!player) notFound();
    redirect(`/p/${player.id}`);
  }

  const { data: player } = await supabase
    .from('players')
    .select('id, name, team:teams(name, slug)')
    .eq('id', playerId)
    .single();
  if (!player) notFound();

  const [{ count: goals }, { count: assists }] = await Promise.all([
    supabase
      .from('match_events')
      .select('id', { count: 'exact', head: true })
      .eq('player_id', playerId)
      .eq('type', 'goal'),
    supabase
      .from('match_events')
      .select('id', { count: 'exact', head: true })
      .eq('player_id', playerId)
      .eq('type', 'assist'),
  ]);

  const team = player.team as unknown as { name: string; slug: string } | null;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col gap-8 p-6">
      <div className="flex flex-col items-center gap-4 rounded-app border border-border-strong bg-surface p-8 text-center shadow-[0_0_60px_-20px_var(--pitch)]">
        <div className="flex size-20 items-center justify-center rounded-full bg-accent text-3xl font-bold text-accent-ink">
          {player.name.slice(0, 1)}
        </div>
        <div className="flex flex-col gap-1">
          <h1 className="display text-2xl">{player.name}</h1>
          {team && <span className="text-sm text-text-dim">{team.name}</span>}
        </div>
        <div className="flex w-full items-center justify-around border-t border-border pt-5">
          <StatBlock value={goals ?? 0} label={t('goals')} tone="gold" />
          <StatBlock value={assists ?? 0} label={t('assists')} tone="accent" />
        </div>
      </div>
    </main>
  );
}
