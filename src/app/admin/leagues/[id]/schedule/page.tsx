import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { setMatchSchedule } from '@/app/actions/admin';
import { localDateTime } from '@/lib/time';
import { buttonClasses } from '@/components/ui/button';

export default async function SchedulePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const t = await getTranslations('admin.schedule');
  const supabase = await createClient();

  const { data: league } = await supabase.from('leagues').select('id, name, city_id').eq('id', id).single();
  if (!league) notFound();
  const { data: city } = await supabase.from('cities').select('timezone').eq('id', league.city_id).single();
  if (!city) notFound();

  const [{ data: matches }, { data: venues }] = await Promise.all([
    supabase
      .from('matches')
      .select(
        'id, round, status, home_score, away_score, kickoff_at, venue_id, ' +
          'home_team:teams!matches_home_team_id_fkey(name), ' +
          'away_team:teams!matches_away_team_id_fkey(name)',
      )
      .eq('league_id', id)
      .order('round'),
    supabase.from('venues').select('id, name').eq('city_id', league.city_id).order('name'),
  ]) as unknown as [
    {
      data: Array<{
        id: string;
        round: number;
        status: string;
        home_score: number | null;
        away_score: number | null;
        kickoff_at: string | null;
        venue_id: string | null;
        home_team: { name: string } | null;
        away_team: { name: string } | null;
      }> | null;
    },
    { data: Array<{ id: string; name: string }> | null },
  ];

  if (!matches || matches.length === 0) {
    return <p className="text-sm text-text-dim">{t('noFixtures')}</p>;
  }

  const unassigned = matches.filter((m) => !m.venue_id || !m.kickoff_at).length;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="display text-2xl">{league.name} — {t('titleSuffix')}</h1>
        {unassigned > 0 && (
          <p className="mt-1 text-sm text-amber">{t('unassignedWarning', { count: unassigned })}</p>
        )}
      </div>

      <ul className="flex flex-col gap-2">
        {matches.map((m) => (
          <li
            key={m.id}
            className="flex flex-col gap-2 rounded-app border border-border bg-surface p-3"
          >
            <div className="flex items-center justify-between">
              <span className="truncate text-sm font-medium">
                {m.home_team?.name} × {m.away_team?.name}
              </span>
              <span className="shrink-0 text-xs text-text-dim">{t('roundPrefix')}{m.round}</span>
            </div>

            {m.status === 'played' ? (
              <div className="flex items-center justify-between">
                <span className="tabular text-sm font-semibold text-accent">
                  {m.home_score} - {m.away_score}
                </span>
                <Link href={`/admin/matches/${m.id}`} className="text-xs text-text-dim underline">
                  {t('edit')}
                </Link>
              </div>
            ) : (
              <>
                <form action={setMatchSchedule.bind(null, m.id)} className="flex flex-wrap gap-2">
                  <select
                    name="venue_id"
                    defaultValue={m.venue_id ?? ''}
                    className="min-h-[var(--tap)] flex-1 rounded-app border border-border bg-canvas px-2 text-sm"
                  >
                    <option value="">{t('venuePlaceholder')}</option>
                    {venues?.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name}
                      </option>
                    ))}
                  </select>
                  <input
                    type="date"
                    name="date"
                    defaultValue={m.kickoff_at ? localDateTime(m.kickoff_at, city.timezone).date : ''}
                    className="tabular min-h-[var(--tap)] rounded-app border border-border bg-canvas px-2 text-sm"
                  />
                  <input
                    type="time"
                    name="time"
                    defaultValue={m.kickoff_at ? localDateTime(m.kickoff_at, city.timezone).time : ''}
                    className="tabular min-h-[var(--tap)] rounded-app border border-border bg-canvas px-2 text-sm"
                  />
                  <button type="submit" className={buttonClasses('outline', 'px-3 text-xs')}>
                    {t('save')}
                  </button>
                </form>
                <Link href={`/admin/matches/${m.id}`} className="text-xs text-accent">
                  {t('enterResult')}
                </Link>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
