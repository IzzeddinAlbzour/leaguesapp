'use server';

import { createHash, randomInt } from 'node:crypto';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { normalizePhone } from '@/lib/phone';

// Account recovery is admin-mediated, no SMS/email: the app generates a
// one-time 6-digit code, the admin reads it to the user over the phone or
// WhatsApp, the user sets a new password with it. Codes expire in 30 min.
function hashCode(code: string, profileId: string) {
  return createHash('sha256').update(`${code}:${profileId}`).digest('hex');
}

async function requireAdmin() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const { data: profile } = data.user
    ? await supabase.from('profiles').select('role').eq('id', data.user.id).single()
    : { data: null };
  if (profile?.role !== 'admin') redirect('/');
  return supabase;
}

export type TriggerResetState = { code: string | null; error: string | null };

export async function triggerPasswordReset(
  _prev: TriggerResetState,
  formData: FormData,
): Promise<TriggerResetState> {
  await requireAdmin();
  const supabase = createAdminClient();
  const profileId = String(formData.get('profile_id') ?? '');
  if (!profileId) return { code: null, error: 'errorGeneric' };

  const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
  const { error } = await supabase.from('password_resets').insert({
    profile_id: profileId,
    code_hash: hashCode(code, profileId),
    expires_at: new Date(Date.now() + 30 * 60_000).toISOString(),
  });
  if (error) return { code: null, error: 'errorGeneric' };

  return { code, error: null };
}

export type RedeemResetState = { error: string | null; done: boolean };

export async function redeemPasswordReset(
  _prev: RedeemResetState,
  formData: FormData,
): Promise<RedeemResetState> {
  const phone = normalizePhone(String(formData.get('phone') ?? ''));
  const code = String(formData.get('code') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  if (!phone || code.length !== 6) return { error: 'errorGeneric', done: false };
  if (password.length < 8) return { error: 'errorShortPassword', done: false };

  const admin = createAdminClient();
  const { data: profile } = await admin.from('profiles').select('id').eq('phone', phone).single();
  if (!profile) return { error: 'errorResetBadCode', done: false };

  const { data: consumed, error: consumeError } = await admin.rpc('consume_password_reset', {
    p_phone: phone, p_hash: hashCode(code, profile.id),
  });
  if (consumeError || consumed !== profile.id) return { error: 'errorResetBadCode', done: false };

  const { error: updateError } = await admin.auth.admin.updateUserById(profile.id, { password });
  if (updateError) return { error: 'errorGeneric', done: false };

  revalidatePath('/login');
  return { error: null, done: true };
}
