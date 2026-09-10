import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { logout } from '@/app/actions/auth';
import { formatPhone } from '@/lib/phone';

// Placeholder. Real home (my next match, my team's standing) arrives in slice 3.
export default async function Home() {
  const t = await getTranslations();
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-accent">{t('app.name')}</h1>
        <p className="text-text-dim">{t('app.tagline')}</p>
      </div>

      {data.user ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-text-dim">
            {t('auth.loggedInAs')}{' '}
            <span dir="ltr" className="tabular">
              {formatPhone(
                data.user.phone ??
                  (data.user.user_metadata?.phone as string | undefined) ??
                  '',
              )}
            </span>
          </p>
          <form action={logout}>
            <button
              type="submit"
              className="rounded-lg border border-border px-4 py-2"
            >
              {t('nav.logout')}
            </button>
          </form>
        </div>
      ) : (
        <div className="flex gap-3">
          <Link
            href="/login"
            className="rounded-lg bg-accent px-4 py-2 font-medium text-canvas"
          >
            {t('nav.login')}
          </Link>
          <Link
            href="/register"
            className="rounded-lg border border-border px-4 py-2"
          >
            {t('nav.register')}
          </Link>
        </div>
      )}
    </main>
  );
}
