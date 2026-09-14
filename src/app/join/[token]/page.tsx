import { notFound, redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { JoinForm } from './join-form';

export default async function JoinPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const t = await getTranslations('join');
  const supabase = await createClient();

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect(`/login?next=${encodeURIComponent(`/join/${token}`)}`);
  const admin = createAdminClient();
  const { data: invite } = await admin.from('team_invites').select('team_id').eq('token', token).single();
  if (!invite) notFound();
  const { data: team } = await supabase.from('teams').select('id, name').eq('id', invite.team_id).single();
  if (!team) notFound();

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
