import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = await getTranslations('app');

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center gap-9 p-6">
      <Link href="/" className="flex flex-col gap-1.5">
        <span className="display text-4xl text-accent">{t('name')}</span>
        <span className="stripe-heading text-sm text-text-dim">{t('tagline')}</span>
      </Link>
      {children}
    </main>
  );
}
