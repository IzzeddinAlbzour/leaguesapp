'use client';

import Link from 'next/link';
import { Suspense, useActionState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { login, type AuthState } from '@/app/actions/auth';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';

const initial: AuthState = { error: null };

function LoginForm() {
  const t = useTranslations('auth');
  const [state, action, pending] = useActionState(login, initial);
  const next = useSearchParams().get('next');

  return (
    <form action={action} className="flex flex-col gap-4">
      {next && <input type="hidden" name="next" value={next} />}
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
      <Field label={t('password')} name="password" type="password" required autoComplete="current-password" />

      {state.error && (
        <p role="alert" className="text-sm text-rose">
          {t(state.error)}
        </p>
      )}

      <Button type="submit" disabled={pending} className="mt-1">
        {t(pending ? 'loginPending' : 'loginSubmit')}
      </Button>
    </form>
  );
}

export default function LoginPage() {
  const t = useTranslations('auth');

  return (
    <div className="flex flex-col gap-6">
      <h1 className="display text-2xl">{t('loginTitle')}</h1>

      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>

      <div className="flex flex-col gap-2 text-sm text-text-dim">
        <p>
          {t('noAccount')}{' '}
          <Link href="/register" className="font-medium text-accent">
            {t('registerTitle')}
          </Link>
        </p>
        <Link href="/reset-password" className="text-accent">
          {t('forgotPassword')}
        </Link>
      </div>
    </div>
  );
}
