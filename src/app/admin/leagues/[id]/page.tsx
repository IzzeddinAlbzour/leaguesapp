import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { addTeam, addVenue, generateLeagueFixtures, togglePaid } from '@/app/actions/admin';
import { Button, buttonClasses } from '@/components/ui/button';
import { Field } from '@/components/ui/field';

export default async function LeagueSetupPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: league } = await supabase.from('leagues').select('*, city:cities(name_ar)').eq('id', id).single();
  if (!league) notFound();

  const [{ data: leagueTeams }, { data: venues }] = await Promise.all([
    supabase
      .from('league_teams')
      .select('paid, team:teams(id, name, captain_name, players(id))')
      .eq('league_id', id),
    supabase.from('venues').select('id, name').eq('city_id', league.city_id).order('name'),
  ]);

  const teams = (leagueTeams ?? []) as unknown as Array<{
    paid: boolean;
    team: { id: string; name: string; captain_name: string; players: { id: string }[] } | null;
  }>;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-lg font-semibold">{league.name}</h1>
        <p className="text-sm text-text-dim">
          {league.city?.name_ar} · {league.season} · {teams.length} فرق
        </p>
        <Link href={`/l/${league.slug}`} target="_blank" className="text-sm text-accent">
          عرض الصفحة العامة ↗
        </Link>
      </div>

      {league.status === 'draft' && (
        <form action={generateLeagueFixtures.bind(null, id)}>
          <Button type="submit" disabled={teams.length < 2} className="w-full">
            توليد جدول المباريات ({teams.length} {teams.length === 1 ? 'فريق' : 'فرق'})
          </Button>
          {teams.length < 2 && (
            <p className="mt-1.5 text-xs text-text-dim">لازم فريقين على الأقل.</p>
          )}
        </form>
      )}

      {league.status !== 'draft' && (
        <Link
          href={`/admin/leagues/${id}/schedule`}
          className={buttonClasses('outline', 'w-full')}
        >
          إدارة الجدول والنتائج ←
        </Link>
      )}

      {/* Venues */}
      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-text-dim">الملاعب</h2>
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
            placeholder="اسم الملعب"
            className="min-h-[var(--tap)] flex-1 rounded-app border border-border bg-surface px-3 text-text placeholder:text-text-dim focus:border-accent"
          />
          <Button type="submit" variant="outline">
            إضافة
          </Button>
        </form>
      </section>

      {/* Teams */}
      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-text-dim">الفرق</h2>

        {teams.length > 0 && (
          <ul className="flex flex-col gap-2">
            {teams.map((lt) => {
              const team = lt.team;
              if (!team) return null;
              return (
                <li
                  key={team.id}
                  className="flex items-center justify-between rounded-app border border-border bg-surface px-4 py-3"
                >
                  <div>
                    <p className="font-medium">{team.name}</p>
                    <p className="text-xs text-text-dim">
                      {team.captain_name ? `الكابتن: ${team.captain_name} · ` : ''}
                      {team.players?.length ?? 0} لاعب
                    </p>
                  </div>
                  <form action={togglePaid.bind(null, id, team.id, !lt.paid)}>
                    <button
                      type="submit"
                      className={`min-h-[var(--tap)] rounded-app px-3 text-xs font-semibold ${
                        lt.paid ? 'bg-paid/15 text-paid' : 'bg-unpaid/15 text-unpaid'
                      }`}
                    >
                      {lt.paid ? 'دفع' : 'ما دفعش'}
                    </button>
                  </form>
                </li>
              );
            })}
          </ul>
        )}

        {league.status === 'draft' && (
          <form action={addTeam.bind(null, id)} className="flex flex-col gap-3 rounded-app border border-border bg-surface p-4">
            <Field label="اسم الفريق" name="name" required />
            <Field label="اسم الكابتن" name="captain_name" />
            <label className="flex flex-col gap-1.5">
              <span className="text-sm text-text-dim">اللاعبين (اسم بكل سطر)</span>
              <textarea
                name="players"
                rows={5}
                placeholder={'محمد أبو الرب\nأحمد زكارنة\nيوسف قبها'}
                className="rounded-app border border-border bg-canvas px-3 py-2 text-text placeholder:text-text-dim focus:border-accent"
              />
            </label>
            <Button type="submit" variant="outline">
              إضافة الفريق
            </Button>
          </form>
        )}
      </section>
    </div>
  );
}
