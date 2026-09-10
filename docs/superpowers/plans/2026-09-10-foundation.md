# Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A running Next.js app in Arabic RTL where a user registers and logs in with a phone number and password, plus a tested round-robin fixture generator.

**Architecture:** One Next.js 15 App Router application. Supabase hosted (no Docker) provides Postgres, Auth, and Storage; migrations live in the repo and ship with `supabase db push`. Authentication is phone plus password with SMS confirmation disabled, so it costs nothing. The fixture generator is a pure function with no framework or database dependency, built and tested first because slice 4 depends on it and it is the cheapest thing in the product to prove correct.

**Tech Stack:** Next.js 15 (App Router) · TypeScript · Tailwind CSS v4 · next-intl · Supabase (`@supabase/ssr`) · Vitest

**Spec:** `docs/superpowers/specs/2026-09-10-leaguesapp-design.md`

## Global Constraints

- All user-facing copy in Arabic, Palestinian dialect. Never MSA, never translated English.
- `dir="rtl"` on `<html>`. Logical CSS properties only: `ms-` `me-` `ps-` `pe-` `start` `end`. Never `ml-` `mr-` `left` `right`.
- Western digits (1, 2, 3) in all numeric output.
- User-facing strings live in `src/messages/ar.json`, never hardcoded in JSX.
- Server Actions, not API routes.
- No service layer, repository pattern, DTOs, or state-management library.
- `npx tsc --noEmit` must be clean before any task is considered done.
- Every table gets RLS enabled in the same migration that creates it.
- Commit after every task.

---

## File Structure

| File | Responsibility |
|---|---|
| `src/lib/fixtures.ts` | Round-robin generation. Pure, no imports. |
| `src/lib/fixtures.test.ts` | Its tests. |
| `src/lib/supabase/client.ts` | Browser Supabase client. |
| `src/lib/supabase/server.ts` | Server Supabase client (cookies). |
| `src/middleware.ts` | Session refresh on every request. |
| `src/app/layout.tsx` | Root layout: `dir="rtl"`, Arabic font, locale provider. |
| `src/app/page.tsx` | Home. Shows session state. |
| `src/app/(auth)/login/page.tsx` | Login form. |
| `src/app/(auth)/register/page.tsx` | Registration form. |
| `src/app/actions/auth.ts` | `register`, `login`, `logout` Server Actions. |
| `src/messages/ar.json` | All Arabic copy. |
| `src/i18n/request.ts` | next-intl config. |
| `supabase/migrations/0001_foundation.sql` | `sports`, `cities`, `profiles`, signup trigger, RLS. |
| `supabase/seed.sql` | Football + Palestinian cities. |

Auth pages are grouped under `(auth)` so they can share a centred layout later without affecting the URL.

---

## Task 1: Next.js application scaffold

**Files:**
- Create: the Next.js project in place (`package.json`, `tsconfig.json`, `next.config.ts`, `src/app/*`, `postcss.config.mjs`, `src/app/globals.css`)
- Modify: `.gitignore`

**Interfaces:**
- Consumes: nothing.
- Produces: a running dev server at `http://localhost:3000`, the `src/` layout every later task writes into, and `npm test` wired to Vitest.

Scaffolding comes before the fixture generator only because `create-next-app` writes `package.json` and would collide with a hand-made one. The generator is still the first logic in the product, which is what the spec's ordering is actually protecting.

- [ ] **Step 1: Scaffold into the existing repository**

The repo holds `README.md`, `CLAUDE.md`, and `docs/`. Scaffold into the current directory, not a subfolder:

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --no-turbopack
```

Answer `yes` when it asks to proceed in a non-empty directory. It does not touch `docs/` or the markdown files.

- [ ] **Step 2: Verify the dev server runs**

```bash
npm run dev
```

Expected: the Next.js starter renders at `http://localhost:3000`. Stop with Ctrl-C.

- [ ] **Step 3: Add Vitest**

```bash
npm install -D vitest
npm pkg set scripts.test="vitest run"
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js 15 app"
```

---

## Task 2: Round-robin fixture generator

The only real algorithm in the product. Pure TypeScript — no database, no framework, no React. Built now so that discovering it broken costs one session instead of four.

**Files:**
- Create: `src/lib/fixtures.ts`
- Test: `src/lib/fixtures.test.ts`

**Interfaces:**
- Consumes: Vitest from Task 1.
- Produces: `type Fixture = { round: number; home: string; away: string }` and `generateFixtures(teamIds: string[], rounds?: 1 | 2): Fixture[]`. Slice 4 calls this to populate the `matches` table.

- [ ] **Step 1: Write the failing tests**

Create `src/lib/fixtures.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { generateFixtures, type Fixture } from './fixtures';

const teams = (n: number) =>
  Array.from({ length: n }, (_, i) => `t${i + 1}`);

const pairKey = (f: Fixture) => [f.home, f.away].sort().join('|');

describe('generateFixtures', () => {
  it('produces n(n-1)/2 matches for an even number of teams', () => {
    expect(generateFixtures(teams(8))).toHaveLength(28);
  });

  it('produces n(n-1)/2 matches for an odd number of teams', () => {
    expect(generateFixtures(teams(7))).toHaveLength(21);
  });

  it('pairs every team with every other team exactly once', () => {
    const fixtures = generateFixtures(teams(8));
    const keys = fixtures.map(pairKey);
    expect(new Set(keys).size).toBe(28);
  });

  it('never schedules a team twice in the same round', () => {
    const fixtures = generateFixtures(teams(8));
    const byRound = new Map<number, string[]>();
    for (const f of fixtures) {
      const list = byRound.get(f.round) ?? [];
      list.push(f.home, f.away);
      byRound.set(f.round, list);
    }
    for (const [, appearances] of byRound) {
      expect(new Set(appearances).size).toBe(appearances.length);
    }
  });

  it('gives every team the same number of matches when the count is even', () => {
    const fixtures = generateFixtures(teams(8));
    const counts = new Map<string, number>();
    for (const f of fixtures) {
      counts.set(f.home, (counts.get(f.home) ?? 0) + 1);
      counts.set(f.away, (counts.get(f.away) ?? 0) + 1);
    }
    expect([...counts.values()]).toEqual(Array(8).fill(7));
  });

  it('emits no placeholder team when the count is odd', () => {
    const fixtures = generateFixtures(teams(7));
    const names = fixtures.flatMap((f) => [f.home, f.away]);
    expect(names.some((n) => n.startsWith('__'))).toBe(false);
  });

  it('doubles the fixtures and reverses the legs over two rounds', () => {
    const single = generateFixtures(teams(6), 1);
    const double = generateFixtures(teams(6), 2);
    expect(double).toHaveLength(single.length * 2);

    const secondLeg = double.slice(single.length);
    for (let i = 0; i < single.length; i++) {
      expect(secondLeg[i].home).toBe(single[i].away);
      expect(secondLeg[i].away).toBe(single[i].home);
    }
  });

  it('numbers rounds contiguously from 1', () => {
    const fixtures = generateFixtures(teams(8), 2);
    const rounds = [...new Set(fixtures.map((f) => f.round))].sort((a, b) => a - b);
    expect(rounds).toEqual(Array.from({ length: 14 }, (_, i) => i + 1));
  });

  it('rejects fewer than two teams', () => {
    expect(() => generateFixtures(['solo'])).toThrow();
  });

  it('rejects duplicate team ids', () => {
    expect(() => generateFixtures(['a', 'b', 'a'])).toThrow();
  });
});
```

- [ ] **Step 2: Run the tests and confirm they fail**

Run: `npm test`
Expected: FAIL — `Failed to resolve import "./fixtures"`.

- [ ] **Step 3: Implement the generator**

Create `src/lib/fixtures.ts`:

```ts
export type Fixture = {
  round: number;
  home: string;
  away: string;
};

const BYE = '__bye__';

/**
 * Round-robin scheduling by the circle method.
 *
 * One team is held fixed while the rest rotate around it, so each rotation
 * yields a complete round in which every team plays exactly once. An odd
 * number of teams gets a bye placeholder, and the matches against it are
 * dropped — that team simply rests that round.
 *
 * Home and away alternate between rounds so no team is drawn at home in
 * every fixture.
 */
export function generateFixtures(
  teamIds: string[],
  rounds: 1 | 2 = 1,
): Fixture[] {
  if (teamIds.length < 2) {
    throw new Error('generateFixtures needs at least 2 teams');
  }
  if (new Set(teamIds).size !== teamIds.length) {
    throw new Error('generateFixtures received duplicate team ids');
  }

  const teams = [...teamIds];
  const hasBye = teams.length % 2 === 1;
  if (hasBye) teams.push(BYE);

  const size = teams.length;
  const half = size / 2;
  const roundCount = size - 1;

  const [fixed, ...rotating] = teams;
  const firstLeg: Fixture[] = [];

  for (let r = 0; r < roundCount; r++) {
    const lineup = [fixed, ...rotating];

    for (let i = 0; i < half; i++) {
      const a = lineup[i];
      const b = lineup[size - 1 - i];
      if (a === BYE || b === BYE) continue;

      firstLeg.push(
        r % 2 === 0
          ? { round: r + 1, home: a, away: b }
          : { round: r + 1, home: b, away: a },
      );
    }

    rotating.unshift(rotating.pop()!);
  }

  if (rounds === 1) return firstLeg;

  const secondLeg = firstLeg.map((f) => ({
    round: f.round + roundCount,
    home: f.away,
    away: f.home,
  }));

  return [...firstLeg, ...secondLeg];
}
```

- [ ] **Step 4: Run the tests and confirm they pass**

Run: `npm test`
Expected: PASS — 10 tests.

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit`
Expected: no output.

- [ ] **Step 6: Commit**

```bash
git add src/lib/fixtures.ts src/lib/fixtures.test.ts
git commit -m "feat: round-robin fixture generator"
```

---

## Task 3: Arabic RTL shell

**Files:**
- Create: `src/i18n/request.ts`, `src/messages/ar.json`
- Modify: `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`, `next.config.ts`

**Interfaces:**
- Consumes: the scaffold from Task 2.
- Produces: `useTranslations()` available in every component, and a root layout with `dir="rtl"` and an Arabic font. Every later task adds its copy to `src/messages/ar.json`.

- [ ] **Step 1: Install next-intl**

```bash
npm install next-intl
```

- [ ] **Step 2: Add the message catalogue**

Create `src/messages/ar.json`:

```json
{
  "app": {
    "name": "دوريات",
    "tagline": "دوريات الهواة في فلسطين"
  },
  "nav": {
    "home": "الرئيسية",
    "login": "تسجيل الدخول",
    "register": "حساب جديد",
    "logout": "خروج"
  },
  "auth": {
    "phone": "رقم الهاتف",
    "phonePlaceholder": "0599123456",
    "password": "كلمة السر",
    "fullName": "الاسم الكامل",
    "loginTitle": "تسجيل الدخول",
    "loginSubmit": "دخول",
    "registerTitle": "حساب جديد",
    "registerSubmit": "إنشاء الحساب",
    "haveAccount": "عندك حساب؟",
    "noAccount": "لسا ما عندك حساب؟",
    "loggedInAs": "مسجّل دخول كـ",
    "errorInvalidPhone": "رقم الهاتف مش مضبوط",
    "errorShortPassword": "كلمة السر لازم 8 حروف على الأقل",
    "errorBadCredentials": "رقم الهاتف أو كلمة السر غلط",
    "errorPhoneTaken": "هاد الرقم مسجّل من قبل",
    "errorGeneric": "صار خطأ، جرّب كمان مرة"
  }
}
```

- [ ] **Step 3: Configure next-intl**

Create `src/i18n/request.ts`:

```ts
import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async () => ({
  locale: 'ar',
  messages: (await import('../messages/ar.json')).default,
}));
```

Replace `next.config.ts`:

```ts
import createNextIntlPlugin from 'next-intl/plugin';
import type { NextConfig } from 'next';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {};

export default withNextIntl(nextConfig);
```

- [ ] **Step 4: Rewrite the root layout as RTL Arabic**

Replace `src/app/layout.tsx`:

```tsx
import type { Metadata } from 'next';
import { IBM_Plex_Sans_Arabic } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import './globals.css';

const arabic = IBM_Plex_Sans_Arabic({
  subsets: ['arabic'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-arabic',
});

export const metadata: Metadata = {
  title: 'دوريات',
  description: 'دوريات الهواة في فلسطين',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const messages = await getMessages();

  return (
    <html lang="ar" dir="rtl">
      <body className={`${arabic.variable} font-sans antialiased`}>
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
```

The font is a working default, not a design decision. `impeccable` owns typography when UI work begins.

- [ ] **Step 5: Bind the font in Tailwind v4**

Append to `src/app/globals.css`, after the existing `@import "tailwindcss";`:

```css
@theme inline {
  --font-sans: var(--font-arabic), system-ui, sans-serif;
}
```

- [ ] **Step 6: Replace the starter home page**

Replace `src/app/page.tsx`:

```tsx
import Link from 'next/link';
import { useTranslations } from 'next-intl';

export default function Home() {
  const t = useTranslations();

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">{t('app.name')}</h1>
        <p className="text-neutral-600">{t('app.tagline')}</p>
      </div>
      <div className="flex gap-3">
        <Link
          href="/login"
          className="rounded-lg bg-neutral-900 px-4 py-2 text-white"
        >
          {t('nav.login')}
        </Link>
        <Link
          href="/register"
          className="rounded-lg border border-neutral-300 px-4 py-2"
        >
          {t('nav.register')}
        </Link>
      </div>
    </main>
  );
}
```

- [ ] **Step 7: Verify RTL in the browser**

```bash
npm run dev
```

Confirm all three: the heading sits on the **right** edge, the two buttons read login-then-register from **right to left**, and the Arabic renders in IBM Plex Sans Arabic rather than a fallback.

- [ ] **Step 8: Typecheck and commit**

```bash
npx tsc --noEmit
git add -A
git commit -m "feat: Arabic RTL shell with next-intl"
```

---

## Task 4: Supabase project and the foundation migration

**Files:**
- Create: `supabase/migrations/0001_foundation.sql`, `supabase/seed.sql`, `.env.local`, `.env.example`
- Modify: `.gitignore`

**Interfaces:**
- Consumes: nothing.
- Produces: tables `sports`, `cities`, `profiles`; the `handle_new_user` trigger that creates a profile row on signup; the env vars `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` that Task 5 reads.

- [ ] **Step 1: Create the hosted project**

At [supabase.com/dashboard](https://supabase.com/dashboard) create a free project in the `eu-central` region. Copy the project URL and the `anon` public key from Project Settings → API.

Hosted, not local: `supabase start` needs Docker, and this plan avoids that dependency. Migrations still live in the repo and deploy with `supabase db push`.

- [ ] **Step 2: Disable phone confirmation**

In Authentication → Providers → Phone: **enable** the phone provider and **disable** "Confirm phone". No SMS provider is configured, so leaving confirmation on would make every signup fail.

- [ ] **Step 3: Verify phone signup works without SMS before building on it**

This is the one genuinely uncertain piece in the plan. Prove it now, when the fallback is cheap.

In the dashboard SQL editor's sibling tab — Authentication → Users → Add user — create a user with phone `972599000001` and any password. If the user is created without an SMS error, the approach holds.

**If it fails,** switch to synthesized emails: keep the phone number in `profiles.phone` and derive an auth email from it. Change only `src/app/actions/auth.ts` in Task 5:

```ts
const authEmail = `${normalizePhone(phone)}@phone.leaguesapp.local`;
await supabase.auth.signUp({ email: authEmail, password });
```

with "Confirm email" disabled in Authentication → Providers → Email. Everything else in this plan is unaffected.

- [ ] **Step 4: Write the migration**

Create `supabase/migrations/0001_foundation.sql`:

```sql
-- reference data ------------------------------------------------------------

create table sports (
  id                        uuid primary key default gen_random_uuid(),
  key                       text unique not null,
  name_ar                   text not null,
  name_en                   text not null,
  default_players_per_side  int  not null,
  points_win                int  not null default 3,
  points_draw               int  not null default 1,
  points_loss               int  not null default 0,
  allows_draw               boolean not null default true
);

create table cities (
  id            uuid primary key default gen_random_uuid(),
  name_ar       text not null,
  name_en       text not null,
  country_code  text not null default 'PS',
  currency      text not null default 'ILS',
  timezone      text not null default 'Asia/Hebron'
);

-- identity ------------------------------------------------------------------

create type user_role as enum ('player', 'venue_owner', 'admin');

create table profiles (
  id                  uuid primary key references auth.users on delete cascade,
  full_name           text,
  phone               text unique,
  avatar_url          text,
  city_id             uuid references cities,
  birth_date          date,
  preferred_position  text,
  preferred_foot      text,
  self_rating         int check (self_rating between 1 and 5),
  role                user_role not null default 'player',
  wa_contact_opened_at timestamptz,  -- set by the OpenWA webhook in slice 7; null until the user messages the league number
  created_at          timestamptz not null default now()
);

-- every auth user gets a profile row at signup
create function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, phone)
  values (new.id, new.phone);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- row level security --------------------------------------------------------

alter table sports   enable row level security;
alter table cities   enable row level security;
alter table profiles enable row level security;

-- reference data is public: the shareable league page must render logged out
create policy "sports are readable by anyone"
  on sports for select using (true);

create policy "cities are readable by anyone"
  on cities for select using (true);

create policy "profiles are readable by authenticated users"
  on profiles for select to authenticated using (true);

create policy "a profile is writable by its owner"
  on profiles for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);
```

- [ ] **Step 5: Write the seed**

Create `supabase/seed.sql`:

```sql
insert into sports (key, name_ar, name_en, default_players_per_side)
values ('football', 'كرة قدم', 'Football', 7);

insert into cities (name_ar, name_en) values
  ('جنين',     'Jenin'),
  ('نابلس',    'Nablus'),
  ('رام الله', 'Ramallah'),
  ('الخليل',   'Hebron'),
  ('بيت لحم',  'Bethlehem'),
  ('طولكرم',   'Tulkarm'),
  ('قلقيلية',  'Qalqilya'),
  ('سلفيت',    'Salfit'),
  ('أريحا',    'Jericho'),
  ('طوباس',    'Tubas');
```

- [ ] **Step 6: Apply both to the hosted database**

Paste the contents of `0001_foundation.sql` into the dashboard SQL editor and run it, then do the same for `seed.sql`.

Verify: Table Editor shows `sports` with 1 row and `cities` with 10.

- [ ] **Step 7: Wire the environment**

Create `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
```

Create `.env.example` with the same keys and empty values, for the repo.

Confirm `.gitignore` already contains `.env` and `.env.*` — it does, from the initial scaffold commit. Verify nothing leaked:

```bash
git check-ignore -v .env.local
```

Expected: a line naming `.gitignore` as the source. If it prints nothing, stop and add `.env.local` to `.gitignore` before continuing.

- [ ] **Step 8: Commit**

```bash
git add supabase/ .env.example
git commit -m "feat: foundation schema, RLS, and Palestinian city seed"
```

---

## Task 5: Phone and password authentication

**Files:**
- Create: `src/lib/phone.ts`, `src/lib/phone.test.ts`, `src/lib/supabase/client.ts`, `src/lib/supabase/server.ts`, `src/middleware.ts`, `src/app/actions/auth.ts`, `src/app/(auth)/login/page.tsx`, `src/app/(auth)/register/page.tsx`
- Modify: `src/app/page.tsx`

**Interfaces:**
- Consumes: env vars and the `profiles` trigger from Task 4; `src/messages/ar.json` keys from Task 3.
- Produces: `normalizePhone(raw: string): string | null` from `@/lib/phone`; `createClient()` from both `@/lib/supabase/server` and `@/lib/supabase/client`; Server Actions `register(prevState, formData)`, `login(prevState, formData)`, and `logout()` in `@/app/actions/auth`, plus the exported type `AuthState`. Every later slice reads its session through `createClient()` on the server.

- [ ] **Step 1: Install the Supabase SSR package**

```bash
npm install @supabase/supabase-js @supabase/ssr
```

- [ ] **Step 2: Create both Supabase clients**

Create `src/lib/supabase/client.ts`:

```ts
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
```

Create `src/lib/supabase/server.ts`:

```ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (list) => {
          try {
            for (const { name, value, options } of list) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Called from a Server Component, where cookies are read-only.
            // The middleware refreshes the session, so this is safe to skip.
          }
        },
      },
    },
  );
}
```

- [ ] **Step 3: Add session-refreshing middleware**

Create `src/middleware.ts`:

```ts
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (list) => {
          for (const { name, value, options } of list) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // Refreshes an expired token. Must not be removed.
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|webp)$).*)'],
};
```

- [ ] **Step 4: Write the phone normalizer and its tests**

This lives in its own file, not in the actions file. A module marked `'use server'` may export **only async functions**; a synchronous export there is a build error in Next.js.

Create `src/lib/phone.ts`:

```ts
/**
 * Palestinian mobile numbers reach Supabase in E.164 without the plus:
 * 0599123456 and 599123456 both become 972599123456.
 *
 * Returns null for anything that is not a valid 05x/056/059 mobile number,
 * so callers can reject it before touching the network.
 */
export function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, '');
  if (/^0(5[69]\d{7})$/.test(digits)) return `972${digits.slice(1)}`;
  if (/^(5[69]\d{7})$/.test(digits)) return `972${digits}`;
  if (/^972(5[69]\d{7})$/.test(digits)) return digits;
  return null;
}
```

Create `src/lib/phone.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { normalizePhone } from './phone';

describe('normalizePhone', () => {
  it('converts a local 05x number to E.164 digits', () => {
    expect(normalizePhone('0599123456')).toBe('972599123456');
  });

  it('accepts a number without the leading zero', () => {
    expect(normalizePhone('599123456')).toBe('972599123456');
  });

  it('accepts a number already in country form', () => {
    expect(normalizePhone('972569123456')).toBe('972569123456');
  });

  it('ignores spaces and dashes', () => {
    expect(normalizePhone('059-912 3456')).toBe('972599123456');
  });

  it('rejects a number that is too short', () => {
    expect(normalizePhone('05991234')).toBeNull();
  });

  it('rejects a non-mobile prefix', () => {
    expect(normalizePhone('0421234567')).toBeNull();
  });
});
```

Run: `npm test`
Expected: PASS — 16 tests total.

- [ ] **Step 5: Write the auth Server Actions**

Create `src/app/actions/auth.ts`:

```ts
'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { normalizePhone } from '@/lib/phone';

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
  const { data, error } = await supabase.auth.signUp({ phone, password });

  if (error) {
    return {
      error: error.message.includes('already')
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
  const { error } = await supabase.auth.signInWithPassword({ phone, password });

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
```

`redirect()` throws by design in Next.js, so it must sit outside any try/catch.

- [ ] **Step 6: Build the register page**

Create `src/app/(auth)/register/page.tsx`:

```tsx
'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { useTranslations } from 'next-intl';
import { register, type AuthState } from '@/app/actions/auth';

const initial: AuthState = { error: null };

export default function RegisterPage() {
  const t = useTranslations('auth');
  const [state, action, pending] = useActionState(register, initial);

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 p-6">
      <h1 className="text-2xl font-bold">{t('registerTitle')}</h1>

      <form action={action} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-sm">{t('fullName')}</span>
          <input
            name="fullName"
            required
            className="rounded-lg border border-neutral-300 px-3 py-2"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm">{t('phone')}</span>
          <input
            name="phone"
            type="tel"
            inputMode="numeric"
            dir="ltr"
            required
            placeholder={t('phonePlaceholder')}
            className="rounded-lg border border-neutral-300 px-3 py-2 text-start"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm">{t('password')}</span>
          <input
            name="password"
            type="password"
            required
            minLength={8}
            className="rounded-lg border border-neutral-300 px-3 py-2"
          />
        </label>

        {state.error && (
          <p className="text-sm text-red-600">{t(state.error)}</p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-neutral-900 px-4 py-2 text-white disabled:opacity-50"
        >
          {t('registerSubmit')}
        </button>
      </form>

      <p className="text-sm text-neutral-600">
        {t('haveAccount')}{' '}
        <Link href="/login" className="underline">
          {t('loginTitle')}
        </Link>
      </p>
    </main>
  );
}
```

`dir="ltr"` on the phone input is deliberate: a phone number is read left to right even inside an RTL page. `text-start` keeps the caret at the correct edge.

- [ ] **Step 7: Build the login page**

Create `src/app/(auth)/login/page.tsx`:

```tsx
'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { useTranslations } from 'next-intl';
import { login, type AuthState } from '@/app/actions/auth';

const initial: AuthState = { error: null };

export default function LoginPage() {
  const t = useTranslations('auth');
  const [state, action, pending] = useActionState(login, initial);

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 p-6">
      <h1 className="text-2xl font-bold">{t('loginTitle')}</h1>

      <form action={action} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-sm">{t('phone')}</span>
          <input
            name="phone"
            type="tel"
            inputMode="numeric"
            dir="ltr"
            required
            placeholder={t('phonePlaceholder')}
            className="rounded-lg border border-neutral-300 px-3 py-2 text-start"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm">{t('password')}</span>
          <input
            name="password"
            type="password"
            required
            className="rounded-lg border border-neutral-300 px-3 py-2"
          />
        </label>

        {state.error && (
          <p className="text-sm text-red-600">{t(state.error)}</p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-neutral-900 px-4 py-2 text-white disabled:opacity-50"
        >
          {t('loginSubmit')}
        </button>
      </form>

      <p className="text-sm text-neutral-600">
        {t('noAccount')}{' '}
        <Link href="/register" className="underline">
          {t('registerTitle')}
        </Link>
      </p>
    </main>
  );
}
```

- [ ] **Step 8: Show session state on the home page**

Replace `src/app/page.tsx`:

```tsx
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { logout } from '@/app/actions/auth';

export default async function Home() {
  const t = await getTranslations();
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">{t('app.name')}</h1>
        <p className="text-neutral-600">{t('app.tagline')}</p>
      </div>

      {data.user ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-neutral-600">
            {t('auth.loggedInAs')} <span dir="ltr">{data.user.phone}</span>
          </p>
          <form action={logout}>
            <button
              type="submit"
              className="rounded-lg border border-neutral-300 px-4 py-2"
            >
              {t('nav.logout')}
            </button>
          </form>
        </div>
      ) : (
        <div className="flex gap-3">
          <Link
            href="/login"
            className="rounded-lg bg-neutral-900 px-4 py-2 text-white"
          >
            {t('nav.login')}
          </Link>
          <Link
            href="/register"
            className="rounded-lg border border-neutral-300 px-4 py-2"
          >
            {t('nav.register')}
          </Link>
        </div>
      )}
    </main>
  );
}
```

- [ ] **Step 9: Walk the full flow in the browser**

```bash
npm run dev
```

Check every one of these:

1. `/register` with a real Palestinian number and an 8-character password redirects to `/` showing the number.
2. Supabase Table Editor shows a matching row in **both** `auth.users` and `profiles`, with `full_name` filled and `role` = `player`. A missing `profiles` row means the Task 4 trigger did not install.
3. Logout returns the page to the two buttons.
4. Login with the same credentials succeeds.
5. Login with a wrong password shows «رقم الهاتف أو كلمة السر غلط», not a crash.
6. Registering the same number twice shows «هاد الرقم مسجّل من قبل».
7. `/register` with `12345` shows «رقم الهاتف مش مضبوط».
8. After a full page refresh the session persists — this proves the middleware works.

- [ ] **Step 10: Typecheck, test, and commit**

```bash
npx tsc --noEmit
npm test
git add -A
git commit -m "feat: phone and password authentication"
```

---

## Task 6: Deploy

**Files:**
- Modify: `README.md`

**Interfaces:**
- Consumes: everything above.
- Produces: a public URL, so the app is real rather than local-only.

- [ ] **Step 1: Push and import to Vercel**

```bash
git push origin main
```

At [vercel.com/new](https://vercel.com/new) import `IzzeddinAlbzour/leaguesapp`. Add both environment variables from `.env.local` before the first build.

Vercel Hobby is fine while the app is pre-revenue. Its terms forbid commercial use, so this moves to Cloudflare Workers or Vercel Pro before a real league opens — see `docs/STACK.md`.

- [ ] **Step 2: Verify the deployment**

Open the deployment URL on a **phone**, not just the desktop browser. Confirm RTL layout, Arabic font, and that registration and login both work against the hosted database.

- [ ] **Step 3: Record the URL and commit**

Replace `README.md`:

```markdown
# leaguesapp

منصة دوريات الهواة في فلسطين.

- Live: <deployment-url>
- Design: `docs/superpowers/specs/2026-09-10-leaguesapp-design.md`
- Stack: `docs/STACK.md`
- Plans: `docs/superpowers/plans/`

## Development

npm install
npm run dev
npm test

Requires `.env.local` — see `.env.example`.
```

```bash
git add README.md
git commit -m "docs: record deployment URL"
git push origin main
```

---

## Done when

- `npm test` passes 16 tests.
- `npx tsc --noEmit` is clean.
- A stranger can open the deployed URL on an Android phone, register with their real number, log out, and log back in.
- `profiles` holds one row per registered user.
- `generateFixtures(teamIds, 1)` returns a proven schedule, ready for slice 4.

## Next plan

Plan 2 — Identity and teams (slices 1–2): profile completion with avatar upload, team creation, WhatsApp invite links, roster management.
