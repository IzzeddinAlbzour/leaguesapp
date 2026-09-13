import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { logout } from '@/app/actions/auth';
import { formatPhone } from '@/lib/phone';
import { Button, buttonClasses } from '@/components/ui/button';

export default async function Home() {
  const t = await getTranslations();
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();

  if (!auth.user) {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center gap-9 p-6">
        <div className="flex flex-col gap-1.5">
          <h1 className="display text-4xl text-accent">{t('app.name')}</h1>
          <p className="stripe-heading text-text-dim">{t('app.tagline')}</p>
        </div>

        <div className="flex gap-3">
          <Link href="/register" className={buttonClasses('accent', 'flex-1')}>
            {t('nav.register')}
          </Link>
          <Link href="/login" className={buttonClasses('outline', 'flex-1')}>
            {t('nav.login')}
          </Link>
        </div>

        <Link href="/terms" className="text-center text-xs text-text-dim underline">
          {t('terms.title')}
        </Link>
      </main>
    );
  }

  const phone = auth.user.phone ?? (auth.user.user_metadata?.phone as string | undefined) ?? '';

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', auth.user.id)
    .single();

  const { data: captainTeam } = await supabase
    .from('teams')
    .select('id, name')
    .eq('captain_id', auth.user.id)
    .maybeSingle();

  let team = captainTeam;
  if (!team) {
    const { data: membership } = await supabase
      .from('players')
      .select('team:teams(id, name)')
      .eq('profile_id', auth.user.id)
      .limit(1)
      .maybeSingle();
    const memberTeam = membership?.team as unknown as { id: string; name: string } | null;
    team = memberTeam ?? null;
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col gap-9 p-6">
      <div className="flex flex-col gap-1.5 pt-4">
        <span className="text-sm text-text-dim">{t('auth.loggedInAs')}</span>
        <h1 className="display text-2xl">{profile?.full_name || t('app.name')}</h1>
        <span dir="ltr" className="tabular text-sm text-text-dim">
          {formatPhone(phone)}
        </span>
      </div>

      <nav className="flex flex-col gap-2.5">
        {team ? (
          <Link href="/team" className={buttonClasses('accent')}>
            {team.name}
          </Link>
        ) : (
          <Link href="/team/new" className={buttonClasses('accent')}>
            {t('myTeam.createCta')}
          </Link>
        )}
        <Link href="/profile" className={buttonClasses('outline')}>
          {t('profile.title')}
        </Link>
        <Link href="/p/me" className={buttonClasses('outline')}>
          {t('profile.myCard')}
        </Link>
        {profile?.role === 'admin' && (
          <Link href="/admin" className={buttonClasses('gold')}>
            {t('admin.dashboard')}
          </Link>
        )}
        {profile?.role === 'venue_owner' && (
          <Link href="/venue" className={buttonClasses('gold')}>
            {t('venue.dashboard')}
          </Link>
        )}
      </nav>

      <form action={logout}>
        <Button type="submit" variant="ghost" className="w-full">
          {t('nav.logout')}
        </Button>
      </form>

      <Link href="/terms" className="text-center text-xs text-text-dim underline">
        {t('terms.title')}
      </Link>
    </main>
  );
}
