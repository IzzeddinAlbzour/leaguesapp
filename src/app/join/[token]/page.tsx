import { notFound, redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { JoinForm } from './join-form';

export default async function JoinPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const t = await getTranslations('join');
  const supabase = await createClient();

  const { data: team } = await supabase.from('teams').select('id, name').eq('invite_token', token).single();
  if (!team) notFound();

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect(`/login?next=/join/${token}`);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center gap-8 p-6">
      <div className="flex flex-col gap-1.5">
        <h1 className="display text-3xl">{t('title')}</h1>
        <p className="stripe-heading text-sm text-text-dim">
          {t('teamLabel')} <span className="font-semibold text-text">{team.name}</span>
        </p>
      </div>
      <JoinForm token={token} />
    </main>
  );
}
