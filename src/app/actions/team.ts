'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { generateSlug } from '@/lib/slug';

async function requireUser() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect('/login');
  return { supabase, userId: data.user.id };
}

export type CreateTeamState = { error: string | null };

export async function createTeam(_prev: CreateTeamState, formData: FormData): Promise<CreateTeamState> {
  const { supabase, userId } = await requireUser();
  const name = String(formData.get('name') ?? '').trim();
  const cityId = String(formData.get('city_id') ?? '');
  if (!name || !cityId) return { error: 'errorGeneric' };

  const { data: team, error } = await supabase
    .from('teams')
    .insert({
      name,
      city_id: cityId,
      slug: generateSlug(),
      invite_token: generateSlug(),
      captain_id: userId,
    })
    .select('id')
    .single();

  if (error || !team) return { error: 'errorGeneric' };

  revalidatePath('/team');
  redirect('/team');
}

// The joining player already has an account (register runs first); this
// only attaches their profile to the team's roster. Runs through the
// service-role client — the joining player is not the team's captain, so
// the regular RLS captain policy would refuse the insert.
export type JoinTeamState = { error: string | null; joined: boolean };

export async function joinTeam(
  token: string,
  _prev: JoinTeamState,
  formData: FormData,
): Promise<JoinTeamState> {
  const { userId } = await requireUser();
  const admin = createAdminClient();

  const { data: team } = await admin.from('teams').select('id').eq('invite_token', token).single();
  if (!team) return { error: 'errorGeneric', joined: false };

  const { data: existing } = await admin
    .from('players')
    .select('id')
    .eq('team_id', team.id)
    .eq('profile_id', userId)
    .maybeSingle();
  if (existing) return { error: null, joined: true };

  const { data: profile } = await admin.from('profiles').select('full_name').eq('id', userId).single();
  const displayName = String(formData.get('name') ?? '').trim() || profile?.full_name || 'لاعب';

  const { error } = await admin.from('players').insert({ team_id: team.id, name: displayName, profile_id: userId });
  if (error) return { error: 'errorGeneric', joined: false };

  revalidatePath('/team');
  return { error: null, joined: true };
}

export async function removePlayer(teamId: string, playerId: string) {
  const { supabase } = await requireUser();
  await supabase.from('players').delete().eq('id', playerId).eq('team_id', teamId);
  revalidatePath('/team');
}

export async function addPlayerByCaptain(teamId: string, formData: FormData) {
  const { supabase } = await requireUser();
  const name = String(formData.get('name') ?? '').trim();
  if (!name) return;
  await supabase.from('players').insert({ team_id: teamId, name });
  revalidatePath('/team');
}

export async function registerForLeague(teamId: string, leagueId: string) {
  const { supabase } = await requireUser();
  const { error } = await supabase.from('league_teams').insert({ team_id: teamId, league_id: leagueId, paid: false });
  if (!error) revalidatePath('/team');
}
