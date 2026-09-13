/**
 * One big tabular number with a label under it. No icon, no card border —
 * the player-card and admin-dashboard building block. Numbers are the
 * point on a sports product; this is the device that lets them be it.
 */
export function StatBlock({
  value,
  label,
  tone = 'text',
}: {
  value: string | number;
  label: string;
  tone?: 'text' | 'accent' | 'gold';
}) {
  const valueColor = tone === 'accent' ? 'text-accent' : tone === 'gold' ? 'text-gold' : 'text-text';
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className={`display tabular text-3xl ${valueColor}`}>{value}</span>
      <span className="text-xs text-text-dim">{label}</span>
    </div>
  );
}
