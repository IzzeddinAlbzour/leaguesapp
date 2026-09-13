import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { updateProfile } from '@/app/actions/profile';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';

export default async function ProfilePage() {
  const t = await getTranslations('profile');
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect('/login');

  const [{ data: profile }, { data: cities }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', data.user.id).single(),
    supabase.from('cities').select('id, name_ar').order('name_ar'),
  ]);
  if (!profile) redirect('/login');

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col gap-8 p-6">
      <div className="flex flex-col gap-1.5">
        <h1 className="display text-3xl">{t('title')}</h1>
        <Link href={`/p/me`} className="stripe-heading text-sm text-accent">
          {t('myCard')}
        </Link>
      </div>

      <form action={updateProfile} className="flex flex-col gap-4">
        <Field label={t('fullName')} name="full_name" defaultValue={profile.full_name ?? ''} required />

        <label className="flex flex-col gap-1.5">
          <span className="text-sm text-text-dim">{t('city')}</span>
          <select
            name="city_id"
            defaultValue={profile.city_id ?? ''}
            className="min-h-[var(--tap)] rounded-app border border-border bg-surface px-3 text-text focus:border-accent"
          >
            <option value="">{t('unset')}</option>
            {cities?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name_ar}
              </option>
            ))}
          </select>
        </label>

        <Field label={t('birthDate')} name="birth_date" type="date" dir="ltr" defaultValue={profile.birth_date ?? ''} />

        <label className="flex flex-col gap-1.5">
          <span className="text-sm text-text-dim">{t('position')}</span>
          <select
            name="preferred_position"
            defaultValue={profile.preferred_position ?? ''}
            className="min-h-[var(--tap)] rounded-app border border-border bg-surface px-3 text-text focus:border-accent"
          >
            <option value="">{t('unset')}</option>
            <option value="gk">{t('positions.gk')}</option>
            <option value="def">{t('positions.def')}</option>
            <option value="mid">{t('positions.mid')}</option>
            <option value="fwd">{t('positions.fwd')}</option>
          </select>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm text-text-dim">{t('foot')}</span>
          <select
            name="preferred_foot"
            defaultValue={profile.preferred_foot ?? ''}
            className="min-h-[var(--tap)] rounded-app border border-border bg-surface px-3 text-text focus:border-accent"
          >
            <option value="">{t('unset')}</option>
            <option value="right">{t('feet.right')}</option>
            <option value="left">{t('feet.left')}</option>
            <option value="both">{t('feet.both')}</option>
          </select>
        </label>

        <Field
          label={t('rating')}
          name="self_rating"
          type="number"
          min={1}
          max={5}
          dir="ltr"
          className="tabular text-start"
          defaultValue={profile.self_rating ?? ''}
        />

        <Button type="submit" className="mt-1">
          {t('save')}
        </Button>
      </form>
    </main>
  );
}
