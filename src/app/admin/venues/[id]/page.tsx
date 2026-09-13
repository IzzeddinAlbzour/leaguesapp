import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { createVenueOwner } from '@/app/actions/admin';
import { buttonClasses } from '@/components/ui/button';
import { formatPhone } from '@/lib/phone';

export default async function VenueDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const t = await getTranslations('admin.venues');
  const supabase = await createClient();

  const { data: venue } = await supabase
    .from('venues')
    .select('id, name, fee_per_match, currency, owner_id, owner:profiles(full_name, phone)')
    .eq('id', id)
    .single();
  if (!venue) notFound();

  // ponytail: owner_id's uniqueness is a *partial* index (0007), which
  // PostgREST does not detect, so supabase-js's generated types still treat the
  // embed as one-to-many; it returns a single object for this FK direction
  // regardless. Cast to the real runtime shape.
  const owner = venue.owner as unknown as { full_name: string | null; phone: string } | null;

  return (
    <div className="flex flex-col gap-4">
      <h1 className="display text-2xl">{venue.name}</h1>
      <p className="tabular text-sm text-text-dim">
        {t('feeLabel')}: {venue.fee_per_match} {venue.currency}
      </p>

      {venue.owner_id ? (
        <p className="text-sm text-accent">
          {t('ownerAssigned')} — {owner?.full_name} (
          <span dir="ltr" className="tabular">
            {formatPhone(owner?.phone ?? '')}
          </span>
          )
        </p>
      ) : (
        <form
          action={createVenueOwner.bind(null, venue.id)}
          className="flex flex-col gap-2 rounded-app border border-border bg-surface p-3"
        >
          <h2 className="text-sm font-semibold">{t('assignOwnerTitle')}</h2>
          <input
            name="full_name"
            placeholder={t('fullNameLabel')}
            className="min-h-[var(--tap)] rounded-app border border-border bg-canvas px-3 text-sm"
          />
          <input
            name="phone"
            placeholder={t('phonePlaceholder')}
            className="tabular min-h-[var(--tap)] rounded-app border border-border bg-canvas px-3 text-sm"
          />
          <input
            type="password"
            name="password"
            placeholder={t('passwordLabel')}
            className="min-h-[var(--tap)] rounded-app border border-border bg-canvas px-3 text-sm"
          />
          <button type="submit" className={buttonClasses('accent')}>
            {t('assignSubmit')}
          </button>
        </form>
      )}
    </div>
  );
}
