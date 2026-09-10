import { type ComponentProps } from 'react';

type Variant = 'accent' | 'outline' | 'ghost';

const base =
  'inline-flex min-h-[var(--tap)] items-center justify-center gap-2 rounded-app px-4 text-sm font-semibold ' +
  'transition-[background-color,border-color,opacity,transform] duration-150 active:scale-[0.98] ' +
  'disabled:pointer-events-none disabled:opacity-50';

const variants: Record<Variant, string> = {
  accent: 'bg-accent text-accent-ink hover:brightness-110',
  outline: 'border border-border-strong text-text hover:border-accent hover:text-accent',
  ghost: 'text-text-dim hover:bg-surface-2 hover:text-text',
};

/** Class string for styling a link or other element as a button. */
export function buttonClasses(variant: Variant = 'accent', className = '') {
  return `${base} ${variants[variant]} ${className}`;
}

export function Button({
  variant = 'accent',
  className = '',
  ...props
}: ComponentProps<'button'> & { variant?: Variant }) {
  return <button className={buttonClasses(variant, className)} {...props} />;
}
