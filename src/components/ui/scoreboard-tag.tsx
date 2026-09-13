import { type ReactNode } from 'react';

type Tone = 'pitch' | 'gold' | 'amber' | 'rose' | 'dim';

const tones: Record<Tone, string> = {
  pitch: 'bg-accent text-accent-ink',
  gold: 'bg-gold text-gold-ink',
  amber: 'bg-amber/20 text-amber',
  rose: 'bg-rose/20 text-rose',
  dim: 'bg-surface-2 text-text-dim',
};

/**
 * The jersey-stripe device applied to a chip: a clipped-corner tag for a
 * status, round number, or points value that should read as scoreboard,
 * not as a generic badge-library pill.
 */
export function ScoreboardTag({
  children,
  tone = 'dim',
  className = '',
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={`clip-tag tabular inline-flex items-center px-2.5 py-1 text-xs font-bold ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
