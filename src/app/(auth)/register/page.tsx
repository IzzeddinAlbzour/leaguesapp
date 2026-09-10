'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { useTranslations } from 'next-intl';
import { register, type AuthState } from '@/app/actions/auth';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';

const initial: AuthState = { error: null };

export default function RegisterPage() {
  const t = useTranslations('auth');
  const [state, action, pending] = useActionState(register, initial);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">{t('registerTitle')}</h1>

      <form action={action} className="flex flex-col gap-4">
        <Field label={t('fullName')} name="fullName" required autoComplete="name" />
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
          minLength={8}
          autoComplete="new-password"
        />

        {state.error && (
          <p role="alert" className="text-sm text-rose">
            {t(state.error)}
          </p>
        )}

        <Button type="submit" disabled={pending} className="mt-1">
          {t(pending ? 'registerPending' : 'registerSubmit')}
        </Button>
      </form>

      <p className="text-sm text-text-dim">
        {t('haveAccount')}{' '}
        <Link href="/login" className="font-medium text-accent">
          {t('loginTitle')}
        </Link>
      </p>
    </div>
  );
}
