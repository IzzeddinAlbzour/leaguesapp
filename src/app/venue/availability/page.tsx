import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { addAvailabilitySlot, removeAvailabilitySlot } from '@/app/actions/venue';
import { buttonClasses } from '@/components/ui/button';
import { formatDay } from '@/lib/datetime';

export default async function VenueAvailabilityPage() {
  const t = await getTranslations('venue.availability');
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect('/login');

  const { data: venue } = await supabase.from('venues').select('id').eq('owner_id', auth.user.id).single();
  if (!venue) redirect('/');

  const { data: slots } = await supabase
    .from('venue_availability')
    .select('id, date, start_time, end_time')
    .eq('venue_id', venue.id)
    .order('date');

  return (
    <div className="flex flex-col gap-4">
      <h1 className="display text-2xl">{t('title')}</h1>

      <form action={addAvailabilitySlot} className="flex flex-wrap gap-2 rounded-app border border-border bg-surface p-3">
        <input
          type="date"
          name="date"
          aria-label={t('dateLabel')}
          className="tabular min-h-[var(--tap)] rounded-app border border-border bg-canvas px-2 text-sm"
        />
        <input
          type="time"
          name="start_time"
          aria-label={t('startLabel')}
          className="tabular min-h-[var(--tap)] rounded-app border border-border bg-canvas px-2 text-sm"
        />
        <input
          type="time"
          name="end_time"
          aria-label={t('endLabel')}
          className="tabular min-h-[var(--tap)] rounded-app border border-border bg-canvas px-2 text-sm"
        />
        <button type="submit" className={buttonClasses('accent', 'px-3 text-xs')}>
          {t('submit')}
        </button>
      </form>

      {!slots || slots.length === 0 ? (
        <p className="text-sm text-text-dim">{t('empty')}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {slots.map((s) => (
            <li key={s.id} className="flex items-center justify-between rounded-app border border-border bg-surface p-3">
              <span className="tabular text-sm">
                {formatDay(s.date)}
                {' — '}
                {/* the arrow is LTR-directional; isolate it so RTL flow doesn't flip the range */}
                <span dir="ltr">
                  {s.start_time.slice(0, 5)} → {s.end_time.slice(0, 5)}
                </span>
              </span>
              <form action={removeAvailabilitySlot.bind(null, s.id)}>
                <button type="submit" className={buttonClasses('ghost', 'px-2 text-xs')}>
                  {t('remove')}
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
