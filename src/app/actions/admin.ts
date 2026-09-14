'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { generateSlug } from '@/lib/slug';
import { generateFixtures as computeFixtures } from '@/lib/fixtures';

async function requireAdmin() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const { data: profile } = data.user
    ? await supabase.from('profiles').select('role').eq('id', data.user.id).single()
    : { data: null };
  if (profile?.role !== 'admin') redirect('/');
  return supabase;
}

export async function createLeague(formData: FormData) {
  const supabase = await requireAdmin();

  const name = String(formData.get('name') ?? '').trim();
  const season = String(formData.get('season') ?? '').trim();
  const cityId = String(formData.get('city_id') ?? '');
  const rounds = Number(formData.get('rounds')) === 2 ? 2 : 1;
  const entryFeeRaw = String(formData.get('entry_fee') ?? '').trim();
  const depositRaw = String(formData.get('deposit_amount') ?? '').trim();

  const { data: sport } = await supabase.from('sports').select('id').eq('key', 'football').single();

  const { data: league, error } = await supabase
    .from('leagues')
    .insert({
      name,
      slug: generateSlug(),
      season,
      city_id: cityId,
      sport_id: sport!.id,
      rounds,
      entry_fee: entryFeeRaw ? Number(entryFeeRaw) : null,
      deposit_amount: depositRaw ? Number(depositRaw) : null,
      status: 'draft',
    })
    .select('id')
    .single();

  if (error || !league) throw new Error('تعذر إنشاء الدوري');

  redirect(`/admin/leagues/${league.id}`);
}

export async function addVenue(leagueId: string, formData: FormData) {
  const supabase = await requireAdmin();
  const { data: league } = await supabase.from('leagues').select('city_id').eq('id', leagueId).single();
  const name = String(formData.get('name') ?? '').trim();
  if (!name || !league) return;

  await supabase.from('venues').insert({ name, city_id: league.city_id });
  revalidatePath(`/admin/leagues/${leagueId}`);
}

export async function addTeam(leagueId: string, formData: FormData) {
  const supabase = await requireAdmin();
  const { data: league } = await supabase.from('leagues').select('city_id').eq('id', leagueId).single();
  if (!league) return;

  const name = String(formData.get('name') ?? '').trim();
  const captainName = String(formData.get('captain_name') ?? '').trim();
  const playerNames = String(formData.get('players') ?? '')
    .split('\n')
    .map((n) => n.trim())
    .filter(Boolean);

  if (!name) return;

  const { data: team, error } = await supabase
    .from('teams')
    .insert({
      name,
      slug: generateSlug(),
      city_id: league.city_id,
      captain_name: captainName || null,
    })
    .select('id')
    .single();
  if (error || !team) return;

  await supabase.from('league_teams').insert({ league_id: leagueId, team_id: team.id, paid: false });

  if (playerNames.length > 0) {
    await supabase.from('players').insert(playerNames.map((n) => ({ team_id: team.id, name: n })));
  }

  revalidatePath(`/admin/leagues/${leagueId}`);
}

export async function togglePaid(leagueId: string, teamId: string, paid: boolean) {
  const supabase = await requireAdmin();
  await supabase
    .from('league_teams')
    .update({ paid })
    .eq('league_id', leagueId)
    .eq('team_id', teamId);
  revalidatePath(`/admin/leagues/${leagueId}`);
}

const PAYMENT_METHODS = ['cash', 'bank_transfer', 'reflect', 'iburaq'] as const;

// Cash or bank transfer only — confirmed by the admin, never a gateway.
// Logs one record and, once the running total clears the deposit (or the
// full entry fee when no deposit is set), flips league_teams.paid so the
// team shows up as active everywhere else in the app.
export async function addPayment(leagueId: string, teamId: string, formData: FormData) {
  const supabase = await requireAdmin();

  const amount = Number(formData.get('amount'));
  const method = String(formData.get('method') ?? '');
  const note = String(formData.get('note') ?? '').trim();
  if (!amount || amount <= 0 || !PAYMENT_METHODS.includes(method as (typeof PAYMENT_METHODS)[number])) return;

  const { data: user } = await supabase.auth.getUser();

  await supabase.from('payments').insert({
    league_id: leagueId,
    team_id: teamId,
    amount,
    method,
    note: note || null,
    confirmed_by: user.user?.id ?? null,
  });

  const [{ data: league }, { data: payments }] = await Promise.all([
    supabase.from('leagues').select('deposit_amount, entry_fee').eq('id', leagueId).single(),
    supabase.from('payments').select('amount').eq('league_id', leagueId).eq('team_id', teamId),
  ]);
  const threshold = league?.deposit_amount ?? league?.entry_fee;
  const total = (payments ?? []).reduce((sum, p) => sum + Number(p.amount), 0);
  if (threshold && total >= Number(threshold)) {
    await supabase.from('league_teams').update({ paid: true }).eq('league_id', leagueId).eq('team_id', teamId);
  }

  revalidatePath(`/admin/leagues/${leagueId}`);
}

export async function generateLeagueFixtures(leagueId: string) {
  const supabase = await requireAdmin();

  const { data: league } = await supabase.from('leagues').select('rounds').eq('id', leagueId).single();
  const { data: teamRows } = await supabase
    .from('league_teams')
    .select('team_id')
    .eq('league_id', leagueId).eq('paid', true);

  const teamIds = (teamRows ?? []).map((r) => r.team_id);
  if (teamIds.length < 2 || !league) {
    throw new Error('لازم فريقين على الأقل لتوليد الجدول');
  }

  const fixtures = computeFixtures(teamIds, league.rounds as 1 | 2);

  const { error } = await supabase.rpc('publish_fixtures', { p_league: leagueId, p_fixtures: fixtures });
  if (error) throw new Error('تعذّر نشر الجدول. تأكد من الدفعات وإنه الجدول مش منشور من قبل.');
  revalidatePath(`/admin/leagues/${leagueId}`);
  redirect(`/admin/leagues/${leagueId}/schedule`);
}

export async function setMatchSchedule(matchId: string, formData: FormData) {
  const supabase = await requireAdmin();

  const venueId = String(formData.get('venue_id') ?? '') || null;
  const date = String(formData.get('date') ?? '');
  const time = String(formData.get('time') ?? '');
  if ((date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) || (time && !/^\d{2}:\d{2}$/.test(time))) throw new Error('راجع التاريخ والوقت');
  const { data: leagueId, error } = await supabase.rpc('schedule_match', {
    p_match: matchId, p_venue: venueId, p_local_time: date && time ? `${date}T${time}:00` : null,
  });
  if (error) throw new Error('تعذّر حفظ الموعد. راجع الملعب والتاريخ.');
  revalidatePath(`/admin/leagues/${leagueId}/schedule`);
}

export async function enterResult(matchId: string, formData: FormData) {
  const supabase = await requireAdmin();

  const homeScore = Number(formData.get('home_score'));
  const awayScore = Number(formData.get('away_score'));
  if (formData.get('home_score') === null || formData.get('away_score') === null ||
    !Number.isInteger(homeScore) || !Number.isInteger(awayScore) || homeScore < 0 || awayScore < 0 || homeScore > 100 || awayScore > 100) {
    throw new Error('راجع النتيجة: لازم أرقام صحيحة بين 0 و100');
  }

  // Each roster row is a stepper `goals_<playerId>` so a hat-trick is one
  // number, not three taps on a checkbox that can only fire once.
  const goalsByPlayer: { playerId: string; count: number }[] = [];
  for (const [key, value] of formData.entries()) {
    if (!key.startsWith('goals_')) continue;
    const count = Number(value);
    if (!Number.isInteger(count) || count < 0 || count > 100) throw new Error('راجع عدد الأهداف');
    if (count > 0) goalsByPlayer.push({ playerId: key.slice('goals_'.length), count });
  }

  const { data: leagueId, error } = await supabase.rpc('save_match_result', {
    p_match: matchId, p_home: homeScore, p_away: awayScore,
    p_goals: goalsByPlayer.map(g => ({ player_id: g.playerId, count: g.count })),
  });
  if (error || !leagueId) throw new Error('تعذّر حفظ النتيجة. راجع اللاعبين والأهداف وحاول كمان مرة.');
  revalidatePath(`/admin/leagues/${leagueId}`);
  revalidatePath(`/admin/matches/${matchId}`);
  redirect(`/admin/leagues/${leagueId}/schedule`);
}

export async function openLeague(leagueId: string) {
  const supabase = await requireAdmin();
  const { error } = await supabase.from('leagues').update({ status: 'open' }).eq('id', leagueId).eq('status', 'draft');
  if (error) throw new Error('تعذّر فتح التسجيل');
  revalidatePath(`/admin/leagues/${leagueId}`);
}
