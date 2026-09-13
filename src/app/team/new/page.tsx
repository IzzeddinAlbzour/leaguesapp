import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { CreateTeamForm } from './create-team-form';

export default async function NewTeamPage() {
  const t = await getTranslations('newTeam');
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect('/login');

  const { data: existing } = await supabase
    .from('teams')
    .select('id')
    .eq('captain_id', data.user.id)
    .maybeSingle();
  if (existing) redirect('/team');

  const { data: cities } = await supabase.from('cities').select('id, name_ar').order('name_ar');

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col gap-8 p-6">
      <h1 className="display text-3xl">{t('title')}</h1>
      <CreateTeamForm cities={cities ?? []} />
    </main>
  );
}
