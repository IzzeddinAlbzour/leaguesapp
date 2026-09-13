'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { useTranslations } from 'next-intl';
import { joinTeam, type JoinTeamState } from '@/app/actions/team';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';

const initial: JoinTeamState = { error: null, joined: false };

export function JoinForm({ token }: { token: string }) {
  const t = useTranslations('join');
  const tAuth = useTranslations('auth');
  const [state, action, pending] = useActionState(joinTeam.bind(null, token), initial);

  if (state.joined) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-accent">{t('success')}</p>
        <Link href="/team" className="text-sm font-medium text-accent">
          {t('goToTeam')}
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-4">
      <Field label={t('nameLabel')} name="name" />

      {state.error && (
        <p role="alert" className="text-sm text-rose">
          {tAuth(state.error)}
        </p>
      )}

      <Button type="submit" disabled={pending} className="mt-1">
        {t('submit')}
      </Button>
    </form>
  );
}
