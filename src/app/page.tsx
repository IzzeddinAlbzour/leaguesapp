import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { logout } from '@/app/actions/auth';
import { formatPhone } from '@/lib/phone';
import { Button, buttonClasses } from '@/components/ui/button';

// Placeholder. Real home (my next match, my team's standing) arrives in slice 3.
export default async function Home() {
  const t = await getTranslations();
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  const phone =
    data.user?.phone ??
    (data.user?.user_metadata?.phone as string | undefined) ??
    '';

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center gap-8 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold text-accent">{t('app.name')}</h1>
        <p className="text-text-dim">{t('app.tagline')}</p>
      </div>

      {data.user ? (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-text-dim">
            {t('auth.loggedInAs')}{' '}
            <span dir="ltr" className="tabular text-text">
              {formatPhone(phone)}
            </span>
          </p>
          <form action={logout}>
            <Button type="submit" variant="outline">
              {t('nav.logout')}
            </Button>
          </form>
        </div>
      ) : (
        <div className="flex gap-3">
          <Link href="/register" className={buttonClasses('accent', 'flex-1')}>
            {t('nav.register')}
          </Link>
          <Link href="/login" className={buttonClasses('outline', 'flex-1')}>
            {t('nav.login')}
          </Link>
        </div>
      )}
    </main>
  );
}
