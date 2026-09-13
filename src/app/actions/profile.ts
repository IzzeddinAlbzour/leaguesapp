'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export async function updateProfile(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect('/login');

  const fullName = String(formData.get('full_name') ?? '').trim();
  const cityId = String(formData.get('city_id') ?? '') || null;
  const birthDate = String(formData.get('birth_date') ?? '') || null;
  const preferredPosition = String(formData.get('preferred_position') ?? '') || null;
  const preferredFoot = String(formData.get('preferred_foot') ?? '') || null;
  const selfRatingRaw = String(formData.get('self_rating') ?? '');
  const selfRating = selfRatingRaw ? Number(selfRatingRaw) : null;

  const { error } = await supabase
    .from('profiles')
    .update({
      full_name: fullName || null,
      city_id: cityId,
      birth_date: birthDate,
      preferred_position: preferredPosition,
      preferred_foot: preferredFoot,
      self_rating: selfRating,
    })
    .eq('id', data.user.id);

  if (error) throw new Error('تعذر حفظ الملف الشخصي');

  revalidatePath('/profile');
  redirect('/profile');
}
