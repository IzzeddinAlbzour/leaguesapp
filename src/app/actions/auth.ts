'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { normalizePhone, phoneToAuthEmail } from '@/lib/phone';

export type AuthState = { error: string | null };

export async function register(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const phone = normalizePhone(String(formData.get('phone') ?? ''));
  const password = String(formData.get('password') ?? '');
  const fullName = String(formData.get('fullName') ?? '').trim();

  if (!phone) return { error: 'errorInvalidPhone' };
  if (password.length < 8) return { error: 'errorShortPassword' };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: phoneToAuthEmail(phone),
    password,
    options: { data: { phone, full_name: fullName || null } },
  });

  if (error) {
    return {
      error: error.message.toLowerCase().includes('already')
        ? 'errorPhoneTaken'
        : 'errorGeneric',
    };
  }

  if (fullName && data.user) {
    await supabase.from('profiles').update({ full_name: fullName }).eq('id', data.user.id);
  }

  revalidatePath('/', 'layout');
  redirect('/');
}

export async function login(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const phone = normalizePhone(String(formData.get('phone') ?? ''));
  const password = String(formData.get('password') ?? '');

  if (!phone) return { error: 'errorInvalidPhone' };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: phoneToAuthEmail(phone),
    password,
  });

  if (error) return { error: 'errorBadCredentials' };

  revalidatePath('/', 'layout');
  redirect('/');
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/');
}
