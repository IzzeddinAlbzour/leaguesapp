import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

export default async function TermsPage() {
  const t = await getTranslations('terms');

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col gap-6 p-4 pb-10">
      <Link href="/" className="text-sm text-text-dim">
        {t('back')}
      </Link>

      <h1 className="text-xl font-bold text-accent">{t('title')}</h1>

      <section className="flex flex-col gap-1.5">
        <h2 className="text-sm font-semibold">{t('dataTitle')}</h2>
        <p className="text-sm text-text-dim">{t('dataBody')}</p>
      </section>

      <section className="flex flex-col gap-1.5">
        <h2 className="text-sm font-semibold">{t('useTitle')}</h2>
        <p className="text-sm text-text-dim">{t('useBody')}</p>
      </section>

      <section className="flex flex-col gap-1.5">
        <h2 className="text-sm font-semibold">{t('rightsTitle')}</h2>
        <p className="text-sm text-text-dim">{t('rightsBody')}</p>
      </section>

      <section className="flex flex-col gap-1.5">
        <h2 className="text-sm font-semibold">{t('contactTitle')}</h2>
        <p className="text-sm text-text-dim">{t('contactBody')}</p>
      </section>
    </main>
  );
}
