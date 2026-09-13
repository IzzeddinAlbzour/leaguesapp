import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { getFixtures, getLeagueBySlug, getStandings, getTopScorers } from '@/lib/queries';
import { FixturesList } from '@/components/fixtures-list';
import { StandingsTable } from '@/components/standings-table';
import { ScorersList } from '@/components/scorers-list';

const TAB_KEYS = ['fixtures', 'standings', 'scorers'] as const;
type TabKey = (typeof TAB_KEYS)[number];

export default async function LeaguePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { slug } = await params;
  const { tab } = await searchParams;
  const t = await getTranslations('league');

  const league = await getLeagueBySlug(slug);
  if (!league) notFound();

  const activeTab: TabKey = TAB_KEYS.includes(tab as TabKey) ? (tab as TabKey) : 'fixtures';
  const TABS = [
    { key: 'fixtures' as const, label: t('tabFixtures') },
    { key: 'standings' as const, label: t('tabStandings') },
    { key: 'scorers' as const, label: t('tabScorers') },
  ];

  const [fixtures, standings, scorers] = await Promise.all([
    activeTab === 'fixtures' ? getFixtures(league.id) : Promise.resolve([]),
    activeTab === 'standings' ? getStandings(league.id) : Promise.resolve([]),
    activeTab === 'scorers' ? getTopScorers(league.id) : Promise.resolve([]),
  ]);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col gap-4 p-4 pb-8">
      <header className="flex flex-col gap-1 pt-2">
        <h1 className="text-xl font-bold text-accent">{league.name}</h1>
        <p className="text-sm text-text-dim">
          {league.city?.name_ar} · {league.season}
        </p>
      </header>

      <nav className="flex gap-1 rounded-app border border-border bg-surface p-1">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/l/${slug}?tab=${t.key}`}
            scroll={false}
            className={`flex min-h-[var(--tap)] flex-1 items-center justify-center rounded-app text-sm font-medium transition-colors ${
              activeTab === t.key
                ? 'bg-accent text-accent-ink'
                : 'text-text-dim hover:text-text'
            }`}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      <section>
        {activeTab === 'fixtures' && <FixturesList fixtures={fixtures} leagueSlug={slug} />}
        {activeTab === 'standings' && <StandingsTable rows={standings} leagueSlug={slug} />}
        {activeTab === 'scorers' && <ScorersList scorers={scorers} />}
      </section>
    </main>
  );
}
