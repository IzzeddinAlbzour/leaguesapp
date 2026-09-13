'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

async function requireVenueOwner() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.user.id).single();
  if (profile?.role !== 'venue_owner') redirect('/');

  const { data: venue } = await supabase.from('venues').select('id').eq('owner_id', data.user.id).single();
  if (!venue) redirect('/');

  return { supabase, venueId: venue.id };
}

// confirm/reject go through the service-role client after an ownership
// check, rather than an RLS UPDATE policy on `matches` — that keeps the
// owner from ever touching any match column except this one, with no need
// for column-level RLS.
async function setBookingStatus(matchId: string, status: 'confirmed' | 'rejected') {
  const { supabase, venueId } = await requireVenueOwner();

  const { data: match } = await supabase
    .from('matches')
    .select('id, league_id, venue_id')
    .eq('id', matchId)
    .single();
  if (!match || match.venue_id !== venueId) return;

  // A reject keeps venue_id. Clearing it made a rejected match look identical
  // to a never-assigned one — the admin lost the "who said no", and the row
  // vanished from the owner's own list, which filters by venue_id. The admin
  // reassigns via the schedule page, and setMatchSchedule resets this to
  // 'pending'. Rejecting an already-confirmed booking is allowed on purpose
  // (owner changed their mind); status is the only column that moves.
  const admin = createAdminClient();
  await admin.from('matches').update({ venue_confirmation_status: status }).eq('id', matchId);

  revalidatePath('/venue/bookings');
  revalidatePath('/venue');
}

export async function confirmBooking(matchId: string) {
  await setBookingStatus(matchId, 'confirmed');
}

export async function rejectBooking(matchId: string) {
  await setBookingStatus(matchId, 'rejected');
}

export async function addAvailabilitySlot(formData: FormData) {
  const { supabase, venueId } = await requireVenueOwner();

  const date = String(formData.get('date') ?? '');
  const startTime = String(formData.get('start_time') ?? '');
  const endTime = String(formData.get('end_time') ?? '');
  if (!date || !startTime || !endTime || startTime >= endTime) return;

  await supabase.from('venue_availability').insert({
    venue_id: venueId,
    date,
    start_time: startTime,
    end_time: endTime,
  });
  revalidatePath('/venue/availability');
}

export async function removeAvailabilitySlot(slotId: string) {
  const { supabase, venueId } = await requireVenueOwner();
  await supabase.from('venue_availability').delete().eq('id', slotId).eq('venue_id', venueId);
  revalidatePath('/venue/availability');
}

export async function updateVenueName(formData: FormData) {
  const { venueId } = await requireVenueOwner();
  const name = String(formData.get('name') ?? '').trim();
  if (!name) return;

  const admin = createAdminClient();
  await admin.from('venues').update({ name }).eq('id', venueId);
  revalidatePath('/venue/info');
}
