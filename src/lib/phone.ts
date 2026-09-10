/**
 * Palestinian mobile numbers reach Supabase in E.164 without the plus:
 * 0599123456 and 599123456 both become 972599123456.
 *
 * Returns null for anything that is not a valid 056/059 mobile number,
 * so callers can reject it before touching the network.
 */
export function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, '');
  if (/^0(5[69]\d{7})$/.test(digits)) return `972${digits.slice(1)}`;
  if (/^(5[69]\d{7})$/.test(digits)) return `972${digits}`;
  if (/^972(5[69]\d{7})$/.test(digits)) return digits;
  return null;
}

/** Display form: 059-912-3456 from any accepted input. */
export function formatPhone(raw: string): string {
  const e164 = normalizePhone(raw);
  if (!e164) return raw;
  const local = `0${e164.slice(3)}`;
  return `${local.slice(0, 3)}-${local.slice(3, 6)}-${local.slice(6)}`;
}

/**
 * The phone is the identity, but Supabase's phone provider needs a paid SMS
 * gateway. We authenticate against a synthesized email built from the E.164
 * number instead. It is never sent mail; the real phone lives in profiles.phone
 * and every screen shows that. Swapping to true phone-OTP later is a provider
 * switch with no data migration, since the number is already the key.
 */
export function phoneToAuthEmail(e164: string): string {
  return `${e164}@phone.leaguesps.com`;
}
