import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', data.user.id)
    .single();
  if (profile?.role !== 'admin') redirect('/');

  return (
    <div className="mx-auto min-h-dvh w-full max-w-2xl px-4 pb-10">
      <header className="flex items-center justify-between border-b border-border py-4">
        <Link href="/admin" className="font-bold text-accent">
          لوحة التحكم
        </Link>
        <Link href="/" className="text-sm text-text-dim">
          الموقع العام
        </Link>
      </header>
      <div className="pt-5">{children}</div>
    </div>
  );
}
