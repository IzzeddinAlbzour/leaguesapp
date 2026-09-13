import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { buttonClasses } from '@/components/ui/button';

export default async function AdminHome() {
  const supabase = await createClient();
  const { data: leagues } = await supabase
    .from('leagues')
    .select('id, name, season, status')
    .order('created_at', { ascending: false });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">الدوريات</h1>
        <Link href="/admin/leagues/new" className={buttonClasses('accent')}>
          دوري جديد
        </Link>
      </div>

      {!leagues || leagues.length === 0 ? (
        <p className="text-sm text-text-dim">ما في دوريات لسا. ابدأ بإنشاء أول دوري.</p>
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
                <StatusBadge status={l.status} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const labels: Record<string, string> = {
    draft: 'مسودة',
    open: 'التسجيل مفتوح',
    active: 'جارٍ',
    finished: 'انتهى',
    cancelled: 'ملغى',
  };
  const tone = status === 'active' ? 'text-accent' : status === 'finished' ? 'text-text-dim' : 'text-amber';
  return <span className={`text-xs font-medium ${tone}`}>{labels[status] ?? status}</span>;
}
