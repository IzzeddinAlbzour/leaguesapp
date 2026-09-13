'use client';

import { useActionState } from 'react';
import { useTranslations } from 'next-intl';
import { triggerPasswordReset, type TriggerResetState } from '@/app/actions/password-reset';
import { Button } from '@/components/ui/button';

const initial: TriggerResetState = { code: null, error: null };

export function ResetTrigger({ profileId }: { profileId: string }) {
  const t = useTranslations('admin.members');
  const [state, action, pending] = useActionState(triggerPasswordReset, initial);

  return (
    <form action={action} className="flex flex-col gap-1.5">
      <input type="hidden" name="profile_id" value={profileId} />
      {state.code ? (
        <p className="tabular text-sm">
          {t('codeGenerated')} <span className="font-bold text-gold">{state.code}</span>
          <span className="ms-2 text-xs text-text-dim">{t('codeHint')}</span>
        </p>
      ) : (
        <Button type="submit" variant="outline" disabled={pending} className="self-start text-xs">
          {t('resetTrigger')}
        </Button>
      )}
    </form>
  );
}
