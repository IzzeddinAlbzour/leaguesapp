import Link from 'next/link';
import { useTranslations } from 'next-intl';

// Placeholder. Real home (my next match, my team's standing) arrives in slice 3.
export default function Home() {
  const t = useTranslations();

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-accent">{t('app.name')}</h1>
        <p className="text-text-dim">{t('app.tagline')}</p>
      </div>
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
    </main>
  );
}
