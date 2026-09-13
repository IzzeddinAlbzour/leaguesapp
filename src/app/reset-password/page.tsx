'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { useTranslations } from 'next-intl';
import { redeemPasswordReset, type RedeemResetState } from '@/app/actions/password-reset';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';

const initial: RedeemResetState = { error: null, done: false };

export default function ResetPasswordPage() {
  const t = useTranslations('resetPassword');
  const tAuth = useTranslations('auth');
  const [state, action, pending] = useActionState(redeemPasswordReset, initial);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center gap-8 p-6">
      <div className="flex flex-col gap-1.5">
        <h1 className="display text-3xl">{t('title')}</h1>
        <p className="stripe-heading text-sm text-text-dim">{t('hint')}</p>
      </div>

      {state.done ? (
        <div className="flex flex-col gap-4">
          <p className="text-accent">{t('success')}</p>
          <Link href="/login" className="text-sm font-medium text-accent">
            {t('goToLogin')}
          </Link>
        </div>
      ) : (
        <form action={action} className="flex flex-col gap-4">
          <Field
            label={tAuth('phone')}
            name="phone"
            type="tel"
            inputMode="numeric"
            dir="ltr"
            required
            placeholder={tAuth('phonePlaceholder')}
            className="text-start tabular"
          />
          <Field
            label={t('code')}
            name="code"
            inputMode="numeric"
            dir="ltr"
            required
            maxLength={6}
            className="text-start tabular"
          />
          <Field label={t('newPassword')} name="password" type="password" required minLength={8} />

          {state.error && (
            <p role="alert" className="text-sm text-rose">
              {tAuth(state.error)}
            </p>
          )}

          <Button type="submit" disabled={pending} className="mt-1">
            {t('submit')}
          </Button>
        </form>
      )}
    </main>
  );
}
