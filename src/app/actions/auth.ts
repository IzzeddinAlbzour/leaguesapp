'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
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

  // Create the user with the service role so no email confirmation is required
  // (auth runs on a synthesized email; there is no inbox to confirm).
  const admin = createAdminClient();
  const { error: createError } = await admin.auth.admin.createUser({
    email: phoneToAuthEmail(phone),
    password,
    email_confirm: true,
    user_metadata: { phone, full_name: fullName || null },
  });

  if (createError) {
    return {
      error: /already|registered|exists/i.test(createError.message)
        ? 'errorPhoneTaken'
        : 'errorGeneric',
    };
  }

  // full_name and phone land in profiles via the handle_new_user trigger,
  // which reads them from user_metadata.

  // Sign the new user in on this session.
  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: phoneToAuthEmail(phone),
    password,
  });
  if (signInError) return { error: 'errorGeneric' };

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
