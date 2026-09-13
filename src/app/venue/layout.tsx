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
