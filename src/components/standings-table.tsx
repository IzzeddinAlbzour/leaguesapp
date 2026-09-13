import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import type { StandingsRow } from '@/lib/queries';

/**
 * The hardest screen in the product: Arabic team names (RTL) beside ten
 * numeric columns (LTR-read, tabular) in one row, on a 360px phone.
 *
 * Solution: position + team name are `sticky` to the row's logical start
 * (the right edge in RTL) so identity never scrolls away; the eight numeric
 * columns scroll horizontally *inside the table*, never the page. This stays
 * a real table — scanning down a column to compare teams still works —
 * instead of collapsing into cards, which would break exactly that.
 */
export async function StandingsTable({ rows, leagueSlug }: { rows: StandingsRow[]; leagueSlug: string }) {
  const t = await getTranslations('standings');
  if (rows.length === 0) {
    return (
      <p className="py-10 text-center text-text-dim">
        {t('empty')}
      </p>
    );
  }

  const cols: { key: keyof StandingsRow; label: string; tone?: 'dim' }[] = [
    { key: 'played', label: t('played') },
    { key: 'won', label: t('won') },
    { key: 'drawn', label: t('drawn'), tone: 'dim' },
    { key: 'lost', label: t('lost') },
    { key: 'goals_for', label: t('goalsFor') },
    { key: 'goals_against', label: t('goalsAgainst') },
    { key: 'goal_difference', label: t('goalDifference') },
  ];

  return (
    <div className="overflow-x-auto rounded-app border border-border">
      <table className="w-full min-w-[560px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-border text-text-dim">
            <th className="sticky inset-inline-start-0 z-10 bg-surface px-3 py-2.5 text-start font-medium">
              {t('team')}
            </th>
            {cols.map((c) => (
              <th
                key={c.key}
                className={`min-w-11 px-2 py-2.5 text-center font-medium ${c.tone === 'dim' ? 'text-text-dim' : ''}`}
              >
                {c.label}
              </th>
            ))}
            <th className="min-w-14 bg-surface-2 px-3 py-2.5 text-center font-semibold text-text">
              {t('points')}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr
              key={r.team_id}
              className="border-b border-border/60 last:border-0 hover:bg-surface-2/60"
            >
              <td className="sticky inset-inline-start-0 z-10 bg-canvas px-3 py-2.5">
                <Link
                  href={`/l/${leagueSlug}/t/${r.team_slug}`}
                  className="flex items-center gap-2.5"
                >
                  <span className="tabular w-4 shrink-0 text-start text-text-dim">{i + 1}</span>
                  <span className="truncate font-medium">{r.team_name}</span>
                </Link>
              </td>
              <td className="tabular px-2 py-2.5 text-center">{r.played}</td>
              <td className="tabular px-2 py-2.5 text-center">{r.won}</td>
              <td className="tabular px-2 py-2.5 text-center text-text-dim">{r.drawn}</td>
              <td className="tabular px-2 py-2.5 text-center">{r.lost}</td>
              <td className="tabular px-2 py-2.5 text-center">{r.goals_for}</td>
              <td className="tabular px-2 py-2.5 text-center">{r.goals_against}</td>
              <td
                className={`tabular px-2 py-2.5 text-center ${
                  r.goal_difference > 0 ? 'text-win' : r.goal_difference < 0 ? 'text-loss' : 'text-draw'
                }`}
              >
                {r.goal_difference > 0 ? '+' : ''}
                {r.goal_difference}
              </td>
              <td className="tabular bg-surface-2 px-3 py-2.5 text-center font-semibold text-text">
                {r.points}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
