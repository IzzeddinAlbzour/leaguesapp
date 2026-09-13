# Venue Owner Role Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give venue owners a role-gated dashboard to confirm/reject match bookings, manage availability, and see running revenue — closing the 0%-implemented Venue Owner gap in appidea.md §9/§28.

**Architecture:** Admin creates the venue + owner account (no self-registration). A match's `venue_id` assignment IS the booking — no separate bookings table. Owner confirm/reject writes through a narrow service-role-checked Server Action (like the existing password-reset pattern), not a client-facing RLS policy on `matches`, so the owner can never touch any match column except the confirmation status.

**Tech Stack:** Next.js 15 App Router, Server Actions, Supabase (Postgres + RLS), next-intl (`src/messages/ar.json`), Tailwind v4 utility classes already defined in `src/components/ui/button.tsx` and `src/components/ui/scoreboard-tag.tsx`.

**Spec:** `docs/superpowers/specs/2026-09-13-venue-owner-design.md`

## Global Constraints

- Arabic only, Palestinian dialect, RTL. All copy goes in `src/messages/ar.json`, never hardcoded in JSX.
- Western digits, `tabular` class (see existing usage) for any figure (revenue, fees).
- Server Actions only, no API routes.
- Admin is a role-gated route in the same app (`src/app/admin`), not a separate app — venue owner follows the identical pattern at `src/app/venue`.
- No automatic booking, no bookings table, no standalone (non-match) reservations — out of scope per appidea.md §29 and the spec.
- Run `npx tsc --noEmit` clean before considering any task done.
- Migrations go in `supabase/migrations/`, numbered next after `0005_self_serve_teams_and_payments.sql` → `0006_venue_owner.sql`.

---

### Task 1: Migration — schema + RLS

**Files:**
- Create: `supabase/migrations/0006_venue_owner.sql`

**Interfaces:**
- Produces: `venues.owner_id` (uuid, nullable), `venues.fee_per_match` (numeric, default 0), `venue_availability` table (`id, venue_id, date, start_time, end_time, created_at`), `matches.venue_confirmation_status` (text, nullable, check in `('pending','confirmed','rejected')`).

- [ ] **Step 1: Write the migration**

```sql
-- Venue Owner role: owner_id + fee on venues, ad-hoc availability slots, and
-- a confirmation flag on matches (a match with a venue_id IS the booking —
-- no separate bookings table, per appidea.md §9's "no auto-booking in v1").

alter table venues add column owner_id uuid references profiles;
alter table venues add column fee_per_match numeric(10, 2) not null default 0;

create table venue_availability (
  id         uuid primary key default gen_random_uuid(),
  venue_id   uuid references venues on delete cascade not null,
  date       date not null,
  start_time time not null,
  end_time   time not null,
  created_at timestamptz not null default now(),
  check (end_time > start_time)
);

alter table matches add column venue_confirmation_status text
  check (venue_confirmation_status in ('pending', 'confirmed', 'rejected'));

alter table venue_availability enable row level security;

-- Owners see and manage only their own venue's slots. Full-row access is
-- fine here — a slot has no field an owner shouldn't control.
create policy "owners manage own venue availability"
  on venue_availability for all to authenticated
  using (venue_id in (select id from venues where owner_id = auth.uid()))
  with check (venue_id in (select id from venues where owner_id = auth.uid()));

-- Owners can read their own venue and the matches assigned to it (booking
-- list + revenue view). Writing stays admin-only (existing "admin writes
-- venues" / "admin writes matches" policies) — confirm/reject and the venue
-- name edit go through service-role-checked Server Actions instead, so an
-- owner can never touch fee_per_match, owner_id, or any match column beyond
-- what those actions expose.
create policy "owners read own venue"
  on venues for select to authenticated
  using (owner_id = auth.uid());

create policy "owners read matches assigned to their venue"
  on matches for select to authenticated
  using (venue_id in (select id from venues where owner_id = auth.uid()));
```

- [ ] **Step 2: Apply locally and regenerate types**

Run: `npx supabase db push` (or `npx supabase migration up` per your local workflow), then `npx supabase gen types typescript --local > src/types/database.ts`.
Expected: `venues`, `venue_availability`, `matches` types in `src/types/database.ts` show the new columns/table.

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: no new errors (existing code doesn't reference the new columns yet).

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/0006_venue_owner.sql src/types/database.ts
git commit -m "feat: add venue owner schema (owner_id, fee, availability, confirmation status)"
```

---

### Task 2: Revenue calculation helper (pure, tested)

**Files:**
- Create: `src/lib/venue-revenue.ts`
- Test: `src/lib/venue-revenue.test.ts`

**Interfaces:**
- Produces: `calculateVenueRevenue(confirmedMatchCount: number, feePerMatch: number): number`
- Consumes: nothing (pure function)

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, expect, it } from 'vitest';
import { calculateVenueRevenue } from './venue-revenue';

describe('calculateVenueRevenue', () => {
  it('multiplies confirmed match count by the per-match fee', () => {
    expect(calculateVenueRevenue(5, 100)).toBe(500);
  });

  it('returns 0 for zero confirmed matches', () => {
    expect(calculateVenueRevenue(0, 100)).toBe(0);
  });

  it('returns 0 for a zero fee', () => {
    expect(calculateVenueRevenue(10, 0)).toBe(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/venue-revenue.test.ts`
Expected: FAIL — `Cannot find module './venue-revenue'`

- [ ] **Step 3: Write minimal implementation**

```typescript
/**
 * Revenue counts the moment a booking is confirmed, not once the match is
 * played — a running total for the owner, not settled accounting.
 */
export function calculateVenueRevenue(confirmedMatchCount: number, feePerMatch: number): number {
  return confirmedMatchCount * feePerMatch;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/venue-revenue.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/venue-revenue.ts src/lib/venue-revenue.test.ts
git commit -m "feat: add venue revenue calculation helper"
```

---

### Task 3: Admin actions — createVenue, createVenueOwner

**Files:**
- Modify: `src/app/actions/admin.ts`

**Interfaces:**
- Consumes: `requireAdmin()` (existing, `src/app/actions/admin.ts:9`), `createAdminClient()` (`src/lib/supabase/admin.ts`), `normalizePhone`/`phoneToAuthEmail` (`src/lib/phone.ts`).
- Produces: `createVenue(formData: FormData): Promise<void>` (redirects to `/admin/venues`), `createVenueOwner(venueId: string, formData: FormData): Promise<void>`.

- [ ] **Step 1: Add `createVenue`**

Append to `src/app/actions/admin.ts`:

```typescript
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
```

- [ ] **Step 2: Add `createVenueOwner`**

Append to `src/app/actions/admin.ts`:

```typescript
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
```

- [ ] **Step 3: Add the two imports this needs**

At the top of `src/app/actions/admin.ts`, add:

```typescript
import { createAdminClient } from '@/lib/supabase/admin';
import { normalizePhone, phoneToAuthEmail } from '@/lib/phone';
```

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/app/actions/admin.ts
git commit -m "feat: add createVenue and createVenueOwner admin actions"
```

---

### Task 4: Admin UI — venue list, create, owner assignment

**Files:**
- Create: `src/app/admin/venues/page.tsx`
- Create: `src/app/admin/venues/[id]/page.tsx`
- Modify: `src/app/admin/layout.tsx:26` (nav link)
- Modify: `src/messages/ar.json` (new `admin.venues` namespace)

**Interfaces:**
- Consumes: `createVenue`, `createVenueOwner` (Task 3), `buttonClasses` (`src/components/ui/button.tsx`).

- [ ] **Step 1: Add `admin.venues` translations**

In `src/messages/ar.json`, inside the `"admin"` object (alongside `"members"`), add:

```json
"venues": {
  "title": "الملاعب",
  "newVenue": "ملعب جديد",
  "empty": "ما في ملاعب لسا.",
  "nameLabel": "اسم الملعب",
  "namePlaceholder": "ملعب جنين الرياضي",
  "cityLabel": "المدينة",
  "feeLabel": "أجرة المباراة (شيكل)",
  "submit": "إضافة الملعب",
  "noOwner": "بلا صاحب ملعب",
  "assignOwnerTitle": "ربط صاحب الملعب",
  "phoneLabel": "رقم الهاتف",
  "phonePlaceholder": "0599123456",
  "passwordLabel": "كلمة السر",
  "fullNameLabel": "الاسم",
  "assignSubmit": "إنشاء الحساب وربطه بالملعب",
  "ownerAssigned": "صاحب الملعب مربوط"
}
```

- [ ] **Step 2: Write `src/app/admin/venues/page.tsx`**

```tsx
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { createVenue } from '@/app/actions/admin';
import { buttonClasses } from '@/components/ui/button';

export default async function VenuesPage() {
  const t = await getTranslations('admin.venues');
  const supabase = await createClient();

  const [{ data: venues }, { data: cities }] = await Promise.all([
    supabase.from('venues').select('id, name, fee_per_match, owner_id').order('name'),
    supabase.from('cities').select('id, name').order('name'),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="display text-2xl">{t('title')}</h1>

      <form action={createVenue} className="flex flex-col gap-2 rounded-app border border-border bg-surface p-3">
        <input
          name="name"
          placeholder={t('namePlaceholder')}
          className="min-h-[var(--tap)] rounded-app border border-border bg-canvas px-3 text-sm"
        />
        <select
          name="city_id"
          className="min-h-[var(--tap)] rounded-app border border-border bg-canvas px-3 text-sm"
        >
          {cities?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <input
          type="number"
          name="fee_per_match"
          min="0"
          step="0.01"
          placeholder={t('feeLabel')}
          className="tabular min-h-[var(--tap)] rounded-app border border-border bg-canvas px-3 text-sm"
        />
        <button type="submit" className={buttonClasses('accent')}>
          {t('submit')}
        </button>
      </form>

      {!venues || venues.length === 0 ? (
        <p className="text-sm text-text-dim">{t('empty')}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {venues.map((v) => (
            <li key={v.id} className="rounded-app border border-border bg-surface p-3">
              <Link href={`/admin/venues/${v.id}`} className="flex items-center justify-between">
                <span className="text-sm font-medium">{v.name}</span>
                <span className="tabular text-xs text-text-dim">
                  {v.owner_id ? '' : t('noOwner')}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Write `src/app/admin/venues/[id]/page.tsx`**

```tsx
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { createVenueOwner } from '@/app/actions/admin';
import { buttonClasses } from '@/components/ui/button';

export default async function VenueDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const t = await getTranslations('admin.venues');
  const supabase = await createClient();

  const { data: venue } = await supabase
    .from('venues')
    .select('id, name, fee_per_match, owner_id, owner:profiles(full_name, phone)')
    .eq('id', id)
    .single();
  if (!venue) notFound();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="display text-2xl">{venue.name}</h1>
      <p className="tabular text-sm text-text-dim">{t('feeLabel')}: {venue.fee_per_match}</p>

      {venue.owner_id ? (
        <p className="text-sm text-accent">
          {t('ownerAssigned')} — {venue.owner?.full_name} ({venue.owner?.phone})
        </p>
      ) : (
        <form
          action={createVenueOwner.bind(null, venue.id)}
          className="flex flex-col gap-2 rounded-app border border-border bg-surface p-3"
        >
          <h2 className="text-sm font-semibold">{t('assignOwnerTitle')}</h2>
          <input
            name="full_name"
            placeholder={t('fullNameLabel')}
            className="min-h-[var(--tap)] rounded-app border border-border bg-canvas px-3 text-sm"
          />
          <input
            name="phone"
            placeholder={t('phonePlaceholder')}
            className="tabular min-h-[var(--tap)] rounded-app border border-border bg-canvas px-3 text-sm"
          />
          <input
            type="password"
            name="password"
            placeholder={t('passwordLabel')}
            className="min-h-[var(--tap)] rounded-app border border-border bg-canvas px-3 text-sm"
          />
          <button type="submit" className={buttonClasses('accent')}>
            {t('assignSubmit')}
          </button>
        </form>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Add the nav link**

In `src/app/admin/layout.tsx`, in the `<nav>` block (around line 26), add before the members link:

```tsx
<Link href="/admin/venues" className="hover:text-text">
  {t('venues.title')}
</Link>
```

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Manual check**

Run: `npm run dev`, sign in as admin, visit `/admin/venues`, create a venue, open it, create an owner account, confirm `venues.owner_id` is set (via Supabase dashboard or `npx supabase db diff` is not needed — just check the row).

- [ ] **Step 7: Commit**

```bash
git add src/app/admin/venues src/app/admin/layout.tsx src/messages/ar.json
git commit -m "feat: admin venue management — create venue, assign owner account"
```

---

### Task 5: Wire schedule assignment to set confirmation status

**Files:**
- Modify: `src/app/actions/admin.ts:177-193` (`setMatchSchedule`)

**Interfaces:**
- Consumes: existing `setMatchSchedule(matchId, formData)`.
- Produces: same signature; now also writes `venue_confirmation_status`.

- [ ] **Step 1: Update `setMatchSchedule`**

Replace the body of `setMatchSchedule` in `src/app/actions/admin.ts` (currently lines 177-193):

```typescript
export async function setMatchSchedule(matchId: string, formData: FormData) {
  const supabase = await requireAdmin();

  const venueId = String(formData.get('venue_id') ?? '') || null;
  const date = String(formData.get('date') ?? '');
  const time = String(formData.get('time') ?? '');
  const kickoffAt = date && time ? new Date(`${date}T${time}:00`).toISOString() : null;

  const { data: match } = await supabase
    .from('matches')
    .update({
      venue_id: venueId,
      kickoff_at: kickoffAt,
      // Assigning a venue reopens confirmation; clearing it clears the flag too.
      venue_confirmation_status: venueId ? 'pending' : null,
    })
    .eq('id', matchId)
    .select('league_id')
    .single();

  if (match) revalidatePath(`/admin/leagues/${match.league_id}/schedule`);
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Manual check**

In `/admin/leagues/[id]/schedule`, assign a venue to a match, then check the `matches` row shows `venue_confirmation_status = 'pending'`.

- [ ] **Step 4: Commit**

```bash
git add src/app/actions/admin.ts
git commit -m "feat: set venue_confirmation_status when admin assigns a venue"
```

---

### Task 6: Venue owner Server Actions

**Files:**
- Create: `src/app/actions/venue.ts`

**Interfaces:**
- Consumes: `createClient()` (`src/lib/supabase/server.ts`), `createAdminClient()` (`src/lib/supabase/admin.ts`).
- Produces: `requireVenueOwner(): Promise<{ supabase, venueId: string }>`, `confirmBooking(matchId: string): Promise<void>`, `rejectBooking(matchId: string): Promise<void>`, `addAvailabilitySlot(formData: FormData): Promise<void>`, `removeAvailabilitySlot(slotId: string): Promise<void>`, `updateVenueName(formData: FormData): Promise<void>`.

- [ ] **Step 1: Write `src/app/actions/venue.ts`**

```typescript
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

  const admin = createAdminClient();
  await admin
    .from('matches')
    .update({
      venue_confirmation_status: status,
      venue_id: status === 'rejected' ? null : match.venue_id,
    })
    .eq('id', matchId);

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
  const { supabase } = await requireVenueOwner();
  await supabase.from('venue_availability').delete().eq('id', slotId);
  revalidatePath('/venue/availability');
}

export async function updateVenueName(formData: FormData) {
  const { supabase, venueId } = await requireVenueOwner();
  const name = String(formData.get('name') ?? '').trim();
  if (!name) return;
  await supabase.from('venues').update({ name }).eq('id', venueId);
  revalidatePath('/venue/info');
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/actions/venue.ts
git commit -m "feat: add venue owner server actions (confirm/reject booking, availability, info)"
```

---

### Task 7: Venue owner layout + dashboard

**Files:**
- Create: `src/app/venue/layout.tsx`
- Create: `src/app/venue/page.tsx`
- Modify: `src/messages/ar.json` (new top-level `"venue"` namespace)

**Interfaces:**
- Consumes: `calculateVenueRevenue` (Task 2), `requireVenueOwner`-equivalent guard logic (mirrors `src/app/admin/layout.tsx`).

- [ ] **Step 1: Add the `venue` translation namespace**

In `src/messages/ar.json`, add a new top-level key (sibling of `"admin"`):

```json
"venue": {
  "dashboard": "لوحة الملعب",
  "publicSite": "الموقع العام",
  "nav": {
    "bookings": "الحجوزات",
    "availability": "الأوقات المتاحة",
    "info": "معلومات الملعب"
  },
  "home": {
    "pendingCount": "حجوزات بانتظار الموافقة: {count}",
    "upcomingCount": "مباريات مؤكدة قادمة: {count}",
    "revenue": "الإيراد الحالي: {amount} شيكل"
  },
  "bookings": {
    "title": "الحجوزات",
    "empty": "ما في حجوزات لسا.",
    "pending": "بانتظار الموافقة",
    "confirmed": "مؤكد",
    "rejected": "مرفوض",
    "confirm": "موافقة",
    "reject": "رفض"
  },
  "availability": {
    "title": "الأوقات المتاحة",
    "dateLabel": "التاريخ",
    "startLabel": "من",
    "endLabel": "إلى",
    "submit": "إضافة وقت",
    "remove": "حذف",
    "empty": "ما في أوقات مضافة."
  },
  "info": {
    "title": "معلومات الملعب",
    "nameLabel": "اسم الملعب",
    "submit": "حفظ"
  }
}
```

- [ ] **Step 2: Write `src/app/venue/layout.tsx`**

```tsx
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';

export default async function VenueLayout({ children }: { children: React.ReactNode }) {
  const t = await getTranslations('venue');
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', data.user.id)
    .single();
  if (profile?.role !== 'venue_owner') redirect('/');

  return (
    <div className="mx-auto min-h-dvh w-full max-w-2xl px-4 pb-10">
      <header className="flex items-center justify-between border-b border-border py-4">
        <Link href="/venue" className="display text-xl text-accent">
          {t('dashboard')}
        </Link>
        <nav className="flex items-center gap-4 text-sm text-text-dim">
          <Link href="/venue/bookings" className="hover:text-text">
            {t('nav.bookings')}
          </Link>
          <Link href="/venue/availability" className="hover:text-text">
            {t('nav.availability')}
          </Link>
          <Link href="/venue/info" className="hover:text-text">
            {t('nav.info')}
          </Link>
          <Link href="/" className="hover:text-text">
            {t('publicSite')}
          </Link>
        </nav>
      </header>
      <div className="pt-5">{children}</div>
    </div>
  );
}
```

- [ ] **Step 3: Write `src/app/venue/page.tsx`**

```tsx
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { calculateVenueRevenue } from '@/lib/venue-revenue';

export default async function VenueDashboardPage() {
  const t = await getTranslations('venue.home');
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect('/login');

  const { data: venue } = await supabase
    .from('venues')
    .select('id, fee_per_match')
    .eq('owner_id', auth.user.id)
    .single();
  if (!venue) redirect('/');

  const { data: matches } = await supabase
    .from('matches')
    .select('id, venue_confirmation_status, kickoff_at')
    .eq('venue_id', venue.id);

  const pendingCount = (matches ?? []).filter((m) => m.venue_confirmation_status === 'pending').length;
  const confirmedMatches = (matches ?? []).filter((m) => m.venue_confirmation_status === 'confirmed');
  const upcomingCount = confirmedMatches.filter(
    (m) => !m.kickoff_at || new Date(m.kickoff_at) >= new Date(),
  ).length;
  const revenue = calculateVenueRevenue(confirmedMatches.length, Number(venue.fee_per_match));

  return (
    <div className="flex flex-col gap-3">
      <p className="rounded-app border border-border bg-surface p-3 text-sm">
        {t('pendingCount', { count: pendingCount })}
      </p>
      <p className="rounded-app border border-border bg-surface p-3 text-sm">
        {t('upcomingCount', { count: upcomingCount })}
      </p>
      <p className="tabular rounded-app border border-border bg-surface p-3 text-sm font-semibold text-accent">
        {t('revenue', { amount: revenue })}
      </p>
    </div>
  );
}
```

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/app/venue/layout.tsx src/app/venue/page.tsx src/messages/ar.json
git commit -m "feat: venue owner layout + dashboard (pending count, upcoming, revenue)"
```

---

### Task 8: Venue owner bookings page

**Files:**
- Create: `src/app/venue/bookings/page.tsx`

**Interfaces:**
- Consumes: `confirmBooking`, `rejectBooking` (Task 6).

- [ ] **Step 1: Write `src/app/venue/bookings/page.tsx`**

```tsx
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { confirmBooking, rejectBooking } from '@/app/actions/venue';
import { buttonClasses } from '@/components/ui/button';

export default async function VenueBookingsPage() {
  const t = await getTranslations('venue.bookings');
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect('/login');

  const { data: venue } = await supabase.from('venues').select('id').eq('owner_id', auth.user.id).single();
  if (!venue) redirect('/');

  const { data: matches } = await supabase
    .from('matches')
    .select(
      'id, kickoff_at, venue_confirmation_status, ' +
        'home_team:teams!matches_home_team_id_fkey(name), ' +
        'away_team:teams!matches_away_team_id_fkey(name)',
    )
    .eq('venue_id', venue.id)
    .order('kickoff_at');

  if (!matches || matches.length === 0) {
    return <p className="text-sm text-text-dim">{t('empty')}</p>;
  }

  const statusLabel: Record<string, string> = {
    pending: t('pending'),
    confirmed: t('confirmed'),
    rejected: t('rejected'),
  };

  return (
    <div className="flex flex-col gap-4">
      <h1 className="display text-2xl">{t('title')}</h1>
      <ul className="flex flex-col gap-2">
        {matches.map((m) => (
          <li key={m.id} className="flex flex-col gap-2 rounded-app border border-border bg-surface p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {m.home_team?.name} × {m.away_team?.name}
              </span>
              <span className="tabular text-xs text-text-dim">
                {m.kickoff_at ? new Date(m.kickoff_at).toLocaleString('ar') : ''}
              </span>
            </div>
            <span className="text-xs text-text-dim">
              {statusLabel[m.venue_confirmation_status ?? 'pending']}
            </span>
            {m.venue_confirmation_status === 'pending' && (
              <div className="flex gap-2">
                <form action={confirmBooking.bind(null, m.id)}>
                  <button type="submit" className={buttonClasses('accent', 'px-3 text-xs')}>
                    {t('confirm')}
                  </button>
                </form>
                <form action={rejectBooking.bind(null, m.id)}>
                  <button type="submit" className={buttonClasses('outline', 'px-3 text-xs')}>
                    {t('reject')}
                  </button>
                </form>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Manual check**

As admin, assign this owner's venue to a match (Task 5's flow). As the venue owner, visit `/venue/bookings`, confirm it, then check the `matches` row shows `venue_confirmation_status = 'confirmed'`. Reject a different one and check `venue_id` is cleared.

- [ ] **Step 4: Commit**

```bash
git add src/app/venue/bookings/page.tsx
git commit -m "feat: venue owner bookings page — confirm/reject"
```

---

### Task 9: Venue owner availability page

**Files:**
- Create: `src/app/venue/availability/page.tsx`

**Interfaces:**
- Consumes: `addAvailabilitySlot`, `removeAvailabilitySlot` (Task 6).

- [ ] **Step 1: Write `src/app/venue/availability/page.tsx`**

```tsx
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { addAvailabilitySlot, removeAvailabilitySlot } from '@/app/actions/venue';
import { buttonClasses } from '@/components/ui/button';

export default async function VenueAvailabilityPage() {
  const t = await getTranslations('venue.availability');
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect('/login');

  const { data: venue } = await supabase.from('venues').select('id').eq('owner_id', auth.user.id).single();
  if (!venue) redirect('/');

  const { data: slots } = await supabase
    .from('venue_availability')
    .select('id, date, start_time, end_time')
    .eq('venue_id', venue.id)
    .order('date');

  return (
    <div className="flex flex-col gap-4">
      <h1 className="display text-2xl">{t('title')}</h1>

      <form action={addAvailabilitySlot} className="flex flex-wrap gap-2 rounded-app border border-border bg-surface p-3">
        <input
          type="date"
          name="date"
          className="tabular min-h-[var(--tap)] rounded-app border border-border bg-canvas px-2 text-sm"
        />
        <input
          type="time"
          name="start_time"
          className="tabular min-h-[var(--tap)] rounded-app border border-border bg-canvas px-2 text-sm"
        />
        <input
          type="time"
          name="end_time"
          className="tabular min-h-[var(--tap)] rounded-app border border-border bg-canvas px-2 text-sm"
        />
        <button type="submit" className={buttonClasses('accent', 'px-3 text-xs')}>
          {t('submit')}
        </button>
      </form>

      {!slots || slots.length === 0 ? (
        <p className="text-sm text-text-dim">{t('empty')}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {slots.map((s) => (
            <li key={s.id} className="flex items-center justify-between rounded-app border border-border bg-surface p-3">
              <span className="tabular text-sm">
                {s.date} — {s.start_time.slice(0, 5)} → {s.end_time.slice(0, 5)}
              </span>
              <form action={removeAvailabilitySlot.bind(null, s.id)}>
                <button type="submit" className={buttonClasses('ghost', 'px-2 text-xs')}>
                  {t('remove')}
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Manual check**

As the venue owner, add a slot on `/venue/availability`, confirm it lists, remove it, confirm it's gone.

- [ ] **Step 4: Commit**

```bash
git add src/app/venue/availability/page.tsx
git commit -m "feat: venue owner availability page — add/remove ad-hoc slots"
```

---

### Task 10: Venue owner info page

**Files:**
- Create: `src/app/venue/info/page.tsx`

**Interfaces:**
- Consumes: `updateVenueName` (Task 6).

- [ ] **Step 1: Write `src/app/venue/info/page.tsx`**

```tsx
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { updateVenueName } from '@/app/actions/venue';
import { buttonClasses } from '@/components/ui/button';

export default async function VenueInfoPage() {
  const t = await getTranslations('venue.info');
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect('/login');

  const { data: venue } = await supabase
    .from('venues')
    .select('id, name')
    .eq('owner_id', auth.user.id)
    .single();
  if (!venue) redirect('/');

  return (
    <div className="flex flex-col gap-4">
      <h1 className="display text-2xl">{t('title')}</h1>
      <form action={updateVenueName} className="flex flex-col gap-2 rounded-app border border-border bg-surface p-3">
        <input
          name="name"
          defaultValue={venue.name}
          placeholder={t('nameLabel')}
          className="min-h-[var(--tap)] rounded-app border border-border bg-canvas px-3 text-sm"
        />
        <button type="submit" className={buttonClasses('accent')}>
          {t('submit')}
        </button>
      </form>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/venue/info/page.tsx
git commit -m "feat: venue owner info page — edit venue name"
```

---

### Task 11: Full verification pass

**Files:** none (verification only)

- [ ] **Step 1: Run the full test suite**

Run: `npm run test`
Expected: all tests pass, including the new `venue-revenue.test.ts`.

- [ ] **Step 2: Full typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Manual end-to-end walk**

As admin: create a venue with a fee → create its owner account. As that owner: log in, land on `/venue`, add an availability slot, see it listed. Back as admin: assign that venue to a match in a league schedule. As owner: see it pending on `/venue/bookings`, confirm it, see the dashboard's pending count drop and revenue reflect the fee. Reject a second assigned match and confirm the match reappears without a venue on the admin schedule page.

- [ ] **Step 4: Commit (if anything was fixed during verification)**

```bash
git add -A
git commit -m "fix: verification pass fixes for venue owner feature"
```
