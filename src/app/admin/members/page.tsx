import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { formatPhone } from '@/lib/phone';
import { ScoreboardTag } from '@/components/ui/scoreboard-tag';
import { ResetTrigger } from './reset-trigger';

export default async function MembersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const t = await getTranslations('admin.members');
  const supabase = await createClient();

  let query = supabase.from('profiles').select('id, full_name, phone, role').order('created_at', { ascending: false });
  if (q?.trim()) {
    query = query.or(`full_name.ilike.%${q.trim()}%,phone.ilike.%${q.trim()}%`);
  }
  const { data: members } = await query.limit(100);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="display text-2xl">{t('title')}</h1>

      <form className="flex">
        <input
          type="search"
          name="q"
          defaultValue={q ?? ''}
          placeholder={t('searchPlaceholder')}
          className="min-h-[var(--tap)] w-full rounded-app border border-border bg-surface px-3 text-text placeholder:text-text-dim focus:border-accent"
        />
      </form>

      {!members || members.length === 0 ? (
        <p className="text-sm text-text-dim">{t('noResults')}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {members.map((m) => (
            <li key={m.id} className="flex flex-col gap-2 rounded-app border border-border bg-surface p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{m.full_name ?? '—'}</p>
                  <p dir="ltr" className="tabular text-sm text-text-dim">
                    {m.phone ? formatPhone(m.phone) : '—'}
                  </p>
                </div>
                <ScoreboardTag tone={m.role === 'admin' ? 'gold' : 'dim'}>
                  {t(`role.${m.role}` as 'role.player')}
                </ScoreboardTag>
              </div>
              <ResetTrigger profileId={m.id} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
