import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { confirmBooking, rejectBooking } from '@/app/actions/venue';
import { buttonClasses } from '@/components/ui/button';

export default async function VenueBookingsPage() {
  const t = await getTranslations('venue.bookings');
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect('/login');

  const { data: venue } = await supabase.from('venues').select('id').eq('owner_id', auth.user.id).single();
  if (!venue) redirect('/');

  const { data: matchRows } = await supabase
    .from('matches')
    .select(
      'id, kickoff_at, venue_confirmation_status, ' +
        'home_team:teams!matches_home_team_id_fkey(name), ' +
        'away_team:teams!matches_away_team_id_fkey(name)',
    )
    .eq('venue_id', venue.id)
    .order('kickoff_at');
  const matches = matchRows as unknown as Array<{
    id: string;
    kickoff_at: string | null;
    venue_confirmation_status: string | null;
    home_team: { name: string } | null;
    away_team: { name: string } | null;
  }> | null;

  if (!matches || matches.length === 0) {
    return <p className="text-sm text-text-dim">{t('empty')}</p>;
  }

  const statusLabel: Record<string, string> = {
    pending: t('pending'),
    confirmed: t('confirmed'),
    rejected: t('rejected'),
  };

  return (
    <div className="flex flex-col gap-4">
      <h1 className="display text-2xl">{t('title')}</h1>
      <ul className="flex flex-col gap-2">
        {matches.map((m) => (
          <li key={m.id} className="flex flex-col gap-2 rounded-app border border-border bg-surface p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {m.home_team?.name} × {m.away_team?.name}
              </span>
              <span className="tabular text-xs text-text-dim">
                {m.kickoff_at ? new Date(m.kickoff_at).toLocaleString('ar') : ''}
              </span>
            </div>
            <span className="text-xs text-text-dim">
              {statusLabel[m.venue_confirmation_status ?? 'pending']}
            </span>
            {m.venue_confirmation_status === 'pending' && (
              <div className="flex gap-2">
                <form action={confirmBooking.bind(null, m.id)}>
                  <button type="submit" className={buttonClasses('accent', 'px-3 text-xs')}>
                    {t('confirm')}
                  </button>
                </form>
                <form action={rejectBooking.bind(null, m.id)}>
                  <button type="submit" className={buttonClasses('outline', 'px-3 text-xs')}>
                    {t('reject')}
                  </button>
                </form>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
