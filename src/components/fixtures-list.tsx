import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

type Fixture = {
  id: string;
  round: number;
  status: string;
  home_score: number | null;
  away_score: number | null;
  kickoff_at: string | null;
  home_team: { name: string; slug: string } | null;
  away_team: { name: string; slug: string } | null;
  venue: { name: string } | null;
};

const dayFormatter = new Intl.DateTimeFormat('ar', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  numberingSystem: 'latn', // Western digits — never Arabic-Indic
});
const timeFormatter = new Intl.DateTimeFormat('ar', {
  hour: 'numeric',
  minute: '2-digit',
  numberingSystem: 'latn',
});

export async function FixturesList({ fixtures, leagueSlug }: { fixtures: Fixture[]; leagueSlug: string }) {
  const t = await getTranslations('fixtures');
  if (fixtures.length === 0) {
    return (
      <p className="py-10 text-center text-text-dim">
        {t('empty')}
      </p>
    );
  }

  const rounds = new Map<number, Fixture[]>();
  for (const f of fixtures) {
    if (!rounds.has(f.round)) rounds.set(f.round, []);
    rounds.get(f.round)!.push(f);
  }

  return (
    <div className="flex flex-col gap-6">
      {[...rounds.entries()].map(([round, matches]) => (
        <div key={round}>
          <h3 className="mb-2 px-1 text-sm font-medium text-text-dim">{t('roundPrefix')} {round}</h3>
          <ul className="flex flex-col gap-2">
            {matches.map((m) => {
              const played = m.status === 'played';
              return (
                <li
                  key={m.id}
                  className="flex items-center gap-3 rounded-app border border-border bg-surface px-3 py-3"
                >
                  <div className="flex flex-1 items-center justify-between gap-2 overflow-hidden">
                    <TeamName team={m.home_team} leagueSlug={leagueSlug} />
                    {played ? (
                      <span className="tabular shrink-0 rounded bg-surface-2 px-2 py-1 text-sm font-semibold">
                        {m.home_score} - {m.away_score}
                      </span>
                    ) : (
                      <span className="shrink-0 text-xs text-text-dim">{t('vs')}</span>
                    )}
                    <TeamName team={m.away_team} leagueSlug={leagueSlug} align="end" />
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-0.5 text-end text-xs text-text-dim">
                    {m.kickoff_at ? (
                      <>
                        <span>{dayFormatter.format(new Date(m.kickoff_at))}</span>
                        <span className="tabular">{timeFormatter.format(new Date(m.kickoff_at))}</span>
                      </>
                    ) : (
                      <span>{t('dateTbd')}</span>
                    )}
                    {m.venue && <span>{m.venue.name}</span>}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}

function TeamName({
  team,
  leagueSlug,
  align = 'start',
}: {
  team: { name: string; slug: string } | null;
  leagueSlug: string;
  align?: 'start' | 'end';
}) {
  if (!team) return <span className="text-text-dim">—</span>;
  return (
    <Link
      href={`/l/${leagueSlug}/t/${team.slug}`}
      className={`truncate text-sm font-medium ${align === 'end' ? 'text-end' : 'text-start'}`}
    >
      {team.name}
    </Link>
  );
}
