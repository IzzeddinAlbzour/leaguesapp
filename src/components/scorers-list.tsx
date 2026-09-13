import { getTranslations } from 'next-intl/server';
import type { ScorerRow } from '@/lib/queries';

export async function ScorersList({ scorers }: { scorers: ScorerRow[] }) {
  const t = await getTranslations('scorers');
  if (scorers.length === 0) {
    return (
      <p className="py-10 text-center text-text-dim">
        {t('empty')}
      </p>
    );
  }

  return (
    <ol className="flex flex-col gap-1">
      {scorers.map((s, i) => (
        <li
          key={s.player_id}
          className="flex items-center gap-3 rounded-app border border-border bg-surface px-3 py-2.5"
        >
          <span className="tabular w-5 shrink-0 text-center text-sm text-text-dim">{i + 1}</span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{s.player_name}</p>
            <p className="truncate text-xs text-text-dim">{s.team_name}</p>
          </div>
          <span className="tabular shrink-0 rounded bg-surface-2 px-2 py-1 text-sm font-semibold text-accent">
            {s.goals}
          </span>
        </li>
      ))}
    </ol>
  );
}
