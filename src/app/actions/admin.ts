'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { generateSlug } from '@/lib/slug';
import { generateFixtures as computeFixtures } from '@/lib/fixtures';
import { createAdminClient } from '@/lib/supabase/admin';
import { normalizePhone, phoneToAuthEmail } from '@/lib/phone';

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
      invite_token: generateSlug(),
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
    .eq('league_id', leagueId);

  const teamIds = (teamRows ?? []).map((r) => r.team_id);
  if (teamIds.length < 2 || !league) {
    throw new Error('لازم فريقين على الأقل لتوليد الجدول');
  }

  const fixtures = computeFixtures(teamIds, league.rounds as 1 | 2);

  await supabase.from('matches').insert(
    fixtures.map((f) => ({
      league_id: leagueId,
      round: f.round,
      home_team_id: f.home,
      away_team_id: f.away,
      status: 'scheduled',
    })),
  );

  await supabase.from('leagues').update({ status: 'active' }).eq('id', leagueId);
  revalidatePath(`/admin/leagues/${leagueId}`);
  redirect(`/admin/leagues/${leagueId}/schedule`);
}

export async function setMatchSchedule(matchId: string, formData: FormData) {
  const supabase = await requireAdmin();

  const venueId = String(formData.get('venue_id') ?? '') || null;
  const date = String(formData.get('date') ?? '');
  const time = String(formData.get('time') ?? '');
  const kickoffAt = date && time ? new Date(`${date}T${time}:00`).toISOString() : null;

  const { data: match } = await supabase
    .from('matches')
    .update({ venue_id: venueId, kickoff_at: kickoffAt })
    .eq('id', matchId)
    .select('league_id')
    .single();

  if (match) revalidatePath(`/admin/leagues/${match.league_id}/schedule`);
}

export async function enterResult(matchId: string, formData: FormData) {
  const supabase = await requireAdmin();

  const homeScore = Number(formData.get('home_score'));
  const awayScore = Number(formData.get('away_score'));

  // Each roster row is a stepper `goals_<playerId>` so a hat-trick is one
  // number, not three taps on a checkbox that can only fire once.
  const goalsByPlayer: { playerId: string; count: number }[] = [];
  for (const [key, value] of formData.entries()) {
    if (!key.startsWith('goals_')) continue;
    const count = Number(value);
    if (count > 0) goalsByPlayer.push({ playerId: key.slice('goals_'.length), count });
  }

  const { data: match, error } = await supabase
    .from('matches')
    .update({ home_score: homeScore, away_score: awayScore, status: 'played' })
    .eq('id', matchId)
    .select('id, league_id, home_team_id, away_team_id')
    .single();

  if (error || !match) throw new Error('تعذر حفظ النتيجة');

  // Replace this match's goal events wholesale — simplest correct model for
  // a correction (the admin re-enters the tally rather than editing a diff).
  await supabase.from('match_events').delete().eq('match_id', matchId).eq('type', 'goal');

  if (goalsByPlayer.length > 0) {
    const { data: players } = await supabase
      .from('players')
      .select('id, team_id')
      .in('id', goalsByPlayer.map((g) => g.playerId));
    const byId = new Map((players ?? []).map((p) => [p.id, p.team_id]));

    const events = goalsByPlayer
      .filter((g) => byId.has(g.playerId))
      .flatMap((g) =>
        Array.from({ length: g.count }, () => ({
          match_id: matchId,
          player_id: g.playerId,
          team_id: byId.get(g.playerId)!,
          type: 'goal' as const,
        })),
      );

    if (events.length > 0) await supabase.from('match_events').insert(events);
  }

  revalidatePath(`/admin/leagues/${match.league_id}`);
  revalidatePath(`/admin/matches/${matchId}`);
  redirect(`/admin/leagues/${match.league_id}/schedule`);
}

export async function createVenue(formData: FormData) {
  const supabase = await requireAdmin();

  const name = String(formData.get('name') ?? '').trim();
  const cityId = String(formData.get('city_id') ?? '');
  const feePerMatch = Number(formData.get('fee_per_match') ?? 0);
  if (!name || !cityId) return;

  await supabase.from('venues').insert({ name, city_id: cityId, fee_per_match: feePerMatch });
  revalidatePath('/admin/venues');
  redirect('/admin/venues');
}

// Admin-only account creation, same service-role pattern as register() in
// actions/auth.ts — the difference is the admin sets the role and links the
// venue afterward, since the signup trigger always defaults role to 'player'.
export async function createVenueOwner(venueId: string, formData: FormData) {
  const supabase = await requireAdmin();

  const phone = normalizePhone(String(formData.get('phone') ?? ''));
  const password = String(formData.get('password') ?? '');
  const fullName = String(formData.get('full_name') ?? '').trim();
  if (!phone || password.length < 8) return;

  const admin = createAdminClient();
  const { data: created, error } = await admin.auth.admin.createUser({
    email: phoneToAuthEmail(phone),
    password,
    email_confirm: true,
    user_metadata: { phone, full_name: fullName || null },
  });
  if (error || !created.user) return;

  await admin.from('profiles').update({ role: 'venue_owner' }).eq('id', created.user.id);
  await supabase.from('venues').update({ owner_id: created.user.id }).eq('id', venueId);

  revalidatePath(`/admin/venues/${venueId}`);
}
