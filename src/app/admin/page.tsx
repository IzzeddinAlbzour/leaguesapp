import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { buttonClasses } from '@/components/ui/button';

export default async function AdminHome() {
  const t = await getTranslations('admin');
  const supabase = await createClient();
  const { data: leagues } = await supabase
    .from('leagues')
    .select('id, name, season, status')
    .order('created_at', { ascending: false });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">{t('home.title')}</h1>
        <Link href="/admin/leagues/new" className={buttonClasses('accent')}>
          {t('home.newLeague')}
        </Link>
      </div>

      {!leagues || leagues.length === 0 ? (
        <p className="text-sm text-text-dim">{t('home.empty')}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {leagues.map((l) => (
            <li key={l.id}>
              <Link
                href={`/admin/leagues/${l.id}`}
                className="flex items-center justify-between rounded-app border border-border bg-surface px-4 py-3 hover:border-border-strong"
              >
                <div>
                  <p className="font-medium">{l.name}</p>
                  <p className="text-sm text-text-dim">{l.season}</p>
                </div>
                <StatusBadge status={l.status} labels={t.raw('status')} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function StatusBadge({ status, labels }: { status: string; labels: Record<string, string> }) {
  const tone = status === 'active' ? 'text-accent' : status === 'finished' ? 'text-text-dim' : 'text-amber';
  return <span className={`text-xs font-medium ${tone}`}>{labels[status] ?? status}</span>;
}
