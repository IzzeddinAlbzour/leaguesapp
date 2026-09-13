import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { calculateVenueRevenue } from '@/lib/venue-revenue';

export default async function VenueDashboardPage() {
  const t = await getTranslations('venue.home');
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect('/login');

  const { data: venue } = await supabase
    .from('venues')
    .select('id, fee_per_match, currency')
    .eq('owner_id', auth.user.id)
    .single();
  if (!venue) redirect('/');

  const { data: matches } = await supabase
    .from('matches')
    .select('id, venue_confirmation_status, kickoff_at')
    .eq('venue_id', venue.id);

  const pendingCount = (matches ?? []).filter((m) => m.venue_confirmation_status === 'pending').length;
  const confirmedMatches = (matches ?? []).filter((m) => m.venue_confirmation_status === 'confirmed');
  const upcomingCount = confirmedMatches.filter(
    (m) => !m.kickoff_at || new Date(m.kickoff_at) >= new Date(),
  ).length;
  const revenue = calculateVenueRevenue(confirmedMatches.length, Number(venue.fee_per_match));

  return (
    <div className="flex flex-col gap-3">
      <p className="rounded-app border border-border bg-surface p-3 text-sm">
        {t('pendingCount', { count: pendingCount })}
      </p>
      <p className="rounded-app border border-border bg-surface p-3 text-sm">
        {t('upcomingCount', { count: upcomingCount })}
      </p>
      <p className="tabular rounded-app border border-border bg-surface p-3 text-sm font-semibold text-accent">
        {t('revenue', { amount: revenue, currency: venue.currency })}
      </p>
    </div>
  );
}
