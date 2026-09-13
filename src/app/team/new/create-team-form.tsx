'use client';

import { useActionState } from 'react';
import { useTranslations } from 'next-intl';
import { createTeam, type CreateTeamState } from '@/app/actions/team';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';

const initial: CreateTeamState = { error: null };

export function CreateTeamForm({ cities }: { cities: { id: string; name_ar: string }[] }) {
  const t = useTranslations('newTeam');
  const tAuth = useTranslations('auth');
  const [state, action, pending] = useActionState(createTeam, initial);

  return (
    <form action={action} className="flex flex-col gap-4">
      <Field label={t('nameLabel')} name="name" required placeholder={t('namePlaceholder')} />

      <label className="flex flex-col gap-1.5">
        <span className="text-sm text-text-dim">{t('cityLabel')}</span>
        <select
          name="city_id"
          required
          className="min-h-[var(--tap)] rounded-app border border-border bg-surface px-3 text-text focus:border-accent"
        >
          {cities.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name_ar}
            </option>
          ))}
        </select>
      </label>

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
