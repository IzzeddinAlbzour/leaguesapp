import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { createVenue } from '@/app/actions/admin';
import { buttonClasses } from '@/components/ui/button';

export default async function VenuesPage() {
  const t = await getTranslations('admin.venues');
  const supabase = await createClient();

  const [{ data: venues }, { data: cities }] = await Promise.all([
    supabase.from('venues').select('id, name, fee_per_match, owner_id').order('name'),
    supabase.from('cities').select('id, name').order('name'),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="display text-2xl">{t('title')}</h1>

      <form action={createVenue} className="flex flex-col gap-2 rounded-app border border-border bg-surface p-3">
        <input
          name="name"
          placeholder={t('namePlaceholder')}
          className="min-h-[var(--tap)] rounded-app border border-border bg-canvas px-3 text-sm"
        />
        <select
          name="city_id"
          className="min-h-[var(--tap)] rounded-app border border-border bg-canvas px-3 text-sm"
        >
          {cities?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <input
          type="number"
          name="fee_per_match"
          min="0"
          step="0.01"
          placeholder={t('feeLabel')}
          className="tabular min-h-[var(--tap)] rounded-app border border-border bg-canvas px-3 text-sm"
        />
        <button type="submit" className={buttonClasses('accent')}>
          {t('submit')}
        </button>
      </form>

      {!venues || venues.length === 0 ? (
        <p className="text-sm text-text-dim">{t('empty')}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {venues.map((v) => (
            <li key={v.id} className="rounded-app border border-border bg-surface p-3">
              <Link href={`/admin/venues/${v.id}`} className="flex items-center justify-between">
                <span className="text-sm font-medium">{v.name}</span>
                <span className="tabular text-xs text-text-dim">
                  {v.owner_id ? '' : t('noOwner')}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
