'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { useTranslations } from 'next-intl';
import { login, type AuthState } from '@/app/actions/auth';

const initial: AuthState = { error: null };

export default function LoginPage() {
  const t = useTranslations('auth');
  const [state, action, pending] = useActionState(login, initial);

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 p-6">
      <h1 className="text-2xl font-bold">{t('loginTitle')}</h1>

      <form action={action} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-sm text-text-dim">{t('phone')}</span>
          <input
            name="phone"
            type="tel"
            inputMode="numeric"
            dir="ltr"
            required
            placeholder={t('phonePlaceholder')}
            className="rounded-lg border border-border bg-surface px-3 py-2 text-start"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm text-text-dim">{t('password')}</span>
          <input
            name="password"
            type="password"
            required
            className="rounded-lg border border-border bg-surface px-3 py-2"
          />
        </label>

        {state.error && (
          <p className="text-sm text-rose">{t(state.error)}</p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-accent px-4 py-2 font-medium text-canvas disabled:opacity-50"
        >
          {t('loginSubmit')}
        </button>
      </form>

      <p className="text-sm text-text-dim">
        {t('noAccount')}{' '}
        <Link href="/register" className="text-accent underline">
          {t('registerTitle')}
        </Link>
      </p>
    </main>
  );
}
