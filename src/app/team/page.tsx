import Link from 'next/link';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { addPlayerByCaptain, registerForLeague, removePlayer } from '@/app/actions/team';
import { Button, buttonClasses } from '@/components/ui/button';
import { ScoreboardTag } from '@/components/ui/scoreboard-tag';
import { CopyLinkButton } from '@/components/copy-link-button';

export default async function MyTeamPage() {
  const t = await getTranslations('myTeam');
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect('/login');

  const { data: captainTeam } = await supabase
    .from('teams')
    .select('*')
    .eq('captain_id', auth.user.id)
    .maybeSingle();

  let team = captainTeam;
  let isCaptain = Boolean(captainTeam);

  if (!team) {
    const { data: membership } = await supabase
      .from('players')
      .select('team:teams(*)')
      .eq('profile_id', auth.user.id)
      .limit(1)
      .maybeSingle();
    team = (membership?.team as typeof team) ?? null;
  }

  if (!team) {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col items-center justify-center gap-6 p-6 text-center">
        <p className="text-text-dim">{t('noTeam')}</p>
        <Link href="/team/new" className={buttonClasses('accent')}>
          {t('createCta')}
        </Link>
      </main>
    );
  }

  const [{ data: players }, { data: registrations }, { data: openLeagues }] = await Promise.all([
    supabase.from('players').select('id, name').eq('team_id', team.id).order('name'),
    supabase
      .from('league_teams')
      .select('paid, league:leagues(id, name, slug, status, entry_fee, deposit_amount)')
      .eq('team_id', team.id),
    supabase
      .from('leagues')
      .select('id, name, slug')
      .eq('city_id', team.city_id)
      .eq('status', 'open'),
  ]);

  const registeredIds = new Set((registrations ?? []).map((r) => (r.league as unknown as { id: string })?.id));
  const availableLeagues = (openLeagues ?? []).filter((l) => !registeredIds.has(l.id));

  let inviteUrl: string | null = null;
  if (team.invite_token) {
    const h = await headers();
    const host = h.get('host');
    const protocol = host?.startsWith('localhost') ? 'http' : 'https';
    inviteUrl = host ? `${protocol}://${host}/join/${team.invite_token}` : `/join/${team.invite_token}`;
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col gap-8 p-4 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="display text-2xl">{team.name}</h1>
          <ScoreboardTag tone={isCaptain ? 'pitch' : 'dim'} className="mt-1">
            {isCaptain ? t('captainBadge') : t('playerBadge')}
          </ScoreboardTag>
        </div>
      </div>

      {isCaptain && inviteUrl && (
        <section className="flex flex-col gap-2">
          <h2 className="stripe-heading text-sm font-medium text-text-dim">{t('inviteTitle')}</h2>
          <p className="text-xs text-text-dim">{t('inviteHint')}</p>
          <div className="flex items-center gap-2 rounded-app border border-border bg-surface px-3 py-2.5">
            <span dir="ltr" className="flex-1 truncate text-sm text-text-dim">
              {inviteUrl}
            </span>
            <CopyLinkButton url={inviteUrl} label={t('copy')} copiedLabel={t('copied')} />
          </div>
        </section>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="stripe-heading text-sm font-medium text-text-dim">{t('rosterTitle')}</h2>
        <ul className="flex flex-col gap-1.5">
          {(players ?? []).map((p) => (
            <li
              key={p.id}
              className="flex items-center justify-between rounded-app border border-border bg-surface px-3 py-2.5 text-sm"
            >
              <span>{p.name}</span>
              {isCaptain && (
                <form action={removePlayer.bind(null, team.id, p.id)}>
                  <button type="submit" className="text-xs text-rose">
                    {t('remove')}
                  </button>
                </form>
              )}
            </li>
          ))}
        </ul>
        {isCaptain && (
          <form action={addPlayerByCaptain.bind(null, team.id)} className="flex gap-2">
            <input
              name="name"
              required
              placeholder={t('addPlayerPlaceholder')}
              className="min-h-[var(--tap)] flex-1 rounded-app border border-border bg-surface px-3 text-text placeholder:text-text-dim focus:border-accent"
            />
            <Button type="submit" variant="outline">
              {t('addPlayer')}
            </Button>
          </form>
        )}
      </section>

      {(registrations ?? []).length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="stripe-heading text-sm font-medium text-text-dim">{t('myLeaguesTitle')}</h2>
          <ul className="flex flex-col gap-2">
            {(registrations ?? []).map((r) => {
              const league = r.league as unknown as {
                id: string;
                name: string;
                slug: string;
                entry_fee: number | null;
                deposit_amount: number | null;
              } | null;
              if (!league) return null;
              return (
                <li
                  key={league.id}
                  className="flex items-center justify-between rounded-app border border-border bg-surface px-4 py-3"
                >
                  <Link href={`/l/${league.slug}`} className="font-medium">
                    {league.name}
                  </Link>
                  <ScoreboardTag tone={r.paid ? 'pitch' : 'gold'}>
                    {r.paid ? t('paidBadge') : t('owedBadge')}
                  </ScoreboardTag>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {isCaptain && (
        <section className="flex flex-col gap-3">
          <h2 className="stripe-heading text-sm font-medium text-text-dim">{t('leaguesTitle')}</h2>
          {availableLeagues.length === 0 ? (
            <p className="text-sm text-text-dim">{t('noOpenLeagues')}</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {availableLeagues.map((l) => (
                <li
                  key={l.id}
                  className="flex items-center justify-between rounded-app border border-border bg-surface px-4 py-3"
                >
                  <span className="font-medium">{l.name}</span>
                  <form action={registerForLeague.bind(null, team.id, l.id)}>
                    <Button type="submit" variant="outline" className="text-xs">
                      {t('registerCta')}
                    </Button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </main>
  );
}
