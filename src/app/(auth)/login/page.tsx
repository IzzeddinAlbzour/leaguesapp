'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { useTranslations } from 'next-intl';
import { login, type AuthState } from '@/app/actions/auth';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';

const initial: AuthState = { error: null };

export default function LoginPage() {
  const t = useTranslations('auth');
  const [state, action, pending] = useActionState(login, initial);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">{t('loginTitle')}</h1>

      <form action={action} className="flex flex-col gap-4">
        <Field
          label={t('phone')}
          name="phone"
          type="tel"
          inputMode="numeric"
          dir="ltr"
          required
          autoComplete="tel"
          placeholder={t('phonePlaceholder')}
          className="text-start tabular"
        />
        <Field
          label={t('password')}
          name="password"
          type="password"
          required
          autoComplete="current-password"
        />

        {state.error && (
          <p role="alert" className="text-sm text-rose">
            {t(state.error)}
          </p>
        )}

        <Button type="submit" disabled={pending} className="mt-1">
          {t(pending ? 'loginPending' : 'loginSubmit')}
        </Button>
      </form>

      <p className="text-sm text-text-dim">
        {t('noAccount')}{' '}
        <Link href="/register" className="font-medium text-accent">
          {t('registerTitle')}
        </Link>
      </p>
    </div>
  );
}
