import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { addPayment, addTeam, addVenue, generateLeagueFixtures, togglePaid } from '@/app/actions/admin';
import { Button, buttonClasses } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { ScoreboardTag } from '@/components/ui/scoreboard-tag';

export default async function LeagueSetupPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const t = await getTranslations('admin.leagueSetup');
  const tPay = await getTranslations('admin.payments');
  const supabase = await createClient();

  const { data: league } = await supabase.from('leagues').select('*, city:cities(name_ar)').eq('id', id).single();
  if (!league) notFound();

  const [{ data: leagueTeams }, { data: venues }, { data: payments }] = await Promise.all([
    supabase
      .from('league_teams')
      .select('paid, team:teams(id, name, captain_name, players(id))')
      .eq('league_id', id),
    supabase.from('venues').select('id, name').eq('city_id', league.city_id).order('name'),
    supabase.from('payments').select('team_id, amount, method, note, paid_at').eq('league_id', id),
  ]);

  const teams = (leagueTeams ?? []) as unknown as Array<{
    paid: boolean;
    team: { id: string; name: string; captain_name: string; players: { id: string }[] } | null;
  }>;

  const paidByTeam = new Map<string, number>();
  for (const p of payments ?? []) {
    paidByTeam.set(p.team_id, (paidByTeam.get(p.team_id) ?? 0) + Number(p.amount));
  }
  const threshold = league.deposit_amount ?? league.entry_fee;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="display text-2xl">{league.name}</h1>
        <p className="text-sm text-text-dim">
          {league.city?.name_ar} · {league.season} · {teams.length} {t('teamPlural')}
        </p>
        <Link href={`/l/${league.slug}`} target="_blank" className="text-sm text-accent">
          {t('viewPublic')}
        </Link>
      </div>

      {league.status === 'draft' && (
        <form action={generateLeagueFixtures.bind(null, id)}>
          <Button type="submit" disabled={teams.length < 2} className="w-full">
            {t('generateFixtures')} ({teams.length} {teams.length === 1 ? t('teamSingular') : t('teamPlural')})
          </Button>
          {teams.length < 2 && (
            <p className="mt-1.5 text-xs text-text-dim">{t('minTeams')}</p>
          )}
        </form>
      )}

      {league.status !== 'draft' && (
        <Link
          href={`/admin/leagues/${id}/schedule`}
          className={buttonClasses('outline', 'w-full')}
        >
          {t('manageSchedule')}
        </Link>
      )}

      {/* Venues */}
      <section className="flex flex-col gap-3">
        <h2 className="stripe-heading text-sm font-medium text-text-dim">{t('venuesTitle')}</h2>
        {venues && venues.length > 0 && (
          <ul className="flex flex-wrap gap-2">
            {venues.map((v) => (
              <li
                key={v.id}
                className="rounded-app border border-border bg-surface px-3 py-1.5 text-sm"
              >
                {v.name}
              </li>
            ))}
          </ul>
        )}
        <form action={addVenue.bind(null, id)} className="flex gap-2">
          <input
            name="name"
            required
            placeholder={t('venueNamePlaceholder')}
            className="min-h-[var(--tap)] flex-1 rounded-app border border-border bg-surface px-3 text-text placeholder:text-text-dim focus:border-accent"
          />
          <Button type="submit" variant="outline">
            {t('add')}
          </Button>
        </form>
      </section>

      {/* Teams + payments */}
      <section className="flex flex-col gap-3">
        <h2 className="stripe-heading text-sm font-medium text-text-dim">{t('teamsTitle')}</h2>

        {teams.length > 0 && (
          <ul className="flex flex-col gap-3">
            {teams.map((lt) => {
              const team = lt.team;
              if (!team) return null;
              const paidSoFar = paidByTeam.get(team.id) ?? 0;
              return (
                <li key={team.id} className="flex flex-col gap-3 rounded-app border border-border bg-surface p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{team.name}</p>
                      <p className="text-xs text-text-dim">
                        {team.captain_name ? `${t('captainPrefix')} ${team.captain_name} · ` : ''}
                        {team.players?.length ?? 0} {t('playerSuffix')}
                      </p>
                    </div>
                    <form action={togglePaid.bind(null, id, team.id, !lt.paid)}>
                      <button
                        type="submit"
                        className={`min-h-[var(--tap)] rounded-app px-3 text-xs font-semibold ${
                          lt.paid ? 'bg-paid/15 text-paid' : 'bg-owed/15 text-owed'
                        }`}
                      >
                        {lt.paid ? t('paid') : t('unpaid')}
                      </button>
                    </form>
                  </div>

                  <div className="flex items-center gap-2 border-t border-border pt-3">
                    <ScoreboardTag tone="gold" className="tabular">
                      {tPay('totalPaid')}: {paidSoFar}
                      {threshold ? ` / ${threshold}` : ''} {league.currency}
                    </ScoreboardTag>
                  </div>

                  <details className="text-sm">
                    <summary className="cursor-pointer text-xs text-accent">{tPay('add')}</summary>
                    <form
                      action={addPayment.bind(null, id, team.id)}
                      className="mt-2 flex flex-wrap items-end gap-2"
                    >
                      <Field
                        label={tPay('amountLabel')}
                        name="amount"
                        type="number"
                        inputMode="decimal"
                        dir="ltr"
                        required
                        className="w-28 text-start tabular"
                      />
                      <label className="flex flex-col gap-1.5">
                        <span className="text-sm text-text-dim">{tPay('methodLabel')}</span>
                        <select
                          name="method"
                          required
                          className="min-h-[var(--tap)] rounded-app border border-border bg-canvas px-2 text-sm"
                        >
                          <option value="cash">{tPay('methods.cash')}</option>
                          <option value="bank_transfer">{tPay('methods.bank_transfer')}</option>
                          <option value="reflect">{tPay('methods.reflect')}</option>
                          <option value="iburaq">{tPay('methods.iburaq')}</option>
                        </select>
                      </label>
                      <input
                        name="note"
                        placeholder={tPay('noteLabel')}
                        className="min-h-[var(--tap)] flex-1 rounded-app border border-border bg-canvas px-2 text-sm placeholder:text-text-dim"
                      />
                      <Button type="submit" variant="gold" className="text-xs">
                        {tPay('add')}
                      </Button>
                    </form>
                  </details>
                </li>
              );
            })}
          </ul>
        )}

        {league.status === 'draft' && (
          <form action={addTeam.bind(null, id)} className="flex flex-col gap-3 rounded-app border border-border bg-surface p-4">
            <Field label={t('teamNameLabel')} name="name" required />
            <Field label={t('captainNameLabel')} name="captain_name" />
            <label className="flex flex-col gap-1.5">
              <span className="text-sm text-text-dim">{t('playersLabel')}</span>
              <textarea
                name="players"
                rows={5}
                placeholder={t('playersPlaceholder')}
                className="rounded-app border border-border bg-canvas px-3 py-2 text-text placeholder:text-text-dim focus:border-accent"
              />
            </label>
            <Button type="submit" variant="outline">
              {t('addTeam')}
            </Button>
          </form>
        )}
      </section>
    </div>
  );
}
