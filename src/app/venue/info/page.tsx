import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { updateVenueName } from '@/app/actions/venue';
import { buttonClasses } from '@/components/ui/button';

export default async function VenueInfoPage() {
  const t = await getTranslations('venue.info');
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect('/login');

  const { data: venue } = await supabase
    .from('venues')
    .select('id, name')
    .eq('owner_id', auth.user.id)
    .single();
  if (!venue) redirect('/');

  return (
    <div className="flex flex-col gap-4">
      <h1 className="display text-2xl">{t('title')}</h1>
      <form action={updateVenueName} className="flex flex-col gap-2 rounded-app border border-border bg-surface p-3">
        <input
          name="name"
          defaultValue={venue.name}
          placeholder={t('nameLabel')}
          className="min-h-[var(--tap)] rounded-app border border-border bg-canvas px-3 text-sm"
        />
        <button type="submit" className={buttonClasses('accent')}>
          {t('submit')}
        </button>
      </form>
    </div>
  );
}
