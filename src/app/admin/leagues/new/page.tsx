import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { createLeague } from '@/app/actions/admin';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';

export default async function NewLeaguePage() {
  const t = await getTranslations('admin.newLeague');
  const supabase = await createClient();
  const { data: cities } = await supabase.from('cities').select('id, name_ar').order('name_ar');

  return (
    <div className="flex flex-col gap-6">
      <h1 className="display text-2xl">{t('title')}</h1>

      <form action={createLeague} className="flex flex-col gap-4">
        <Field label={t('nameLabel')} name="name" required placeholder={t('namePlaceholder')} />
        <Field label={t('seasonLabel')} name="season" required placeholder={t('seasonPlaceholder')} />

        <label className="flex flex-col gap-1.5">
          <span className="text-sm text-text-dim">{t('cityLabel')}</span>
          <select
            name="city_id"
            required
            className="min-h-[var(--tap)] rounded-app border border-border bg-surface px-3 text-text focus:border-accent"
          >
            {cities?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name_ar}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm text-text-dim">{t('roundsLabel')}</span>
          <select
            name="rounds"
            defaultValue="1"
            className="min-h-[var(--tap)] rounded-app border border-border bg-surface px-3 text-text focus:border-accent"
          >
            <option value="1">{t('roundsOnce')}</option>
            <option value="2">{t('roundsTwice')}</option>
          </select>
        </label>

        <Field
          label={t('feeLabel')}
          name="entry_fee"
          type="number"
          inputMode="decimal"
          dir="ltr"
          className="text-start tabular"
        />

        <Field
          label={t('depositLabel')}
          name="deposit_amount"
          type="number"
          inputMode="decimal"
          dir="ltr"
          className="text-start tabular"
        />

        <Button type="submit" className="mt-1">
          {t('submit')}
        </Button>
      </form>
    </div>
  );
}
