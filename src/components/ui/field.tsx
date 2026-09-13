import { type ComponentProps } from 'react';

// Label + input as one unit. `dir` defaults to the document (RTL); pass dir="ltr"
// for phone numbers and other left-to-right values.
export function Field({
  label,
  hint,
  className = '',
  ...props
}: ComponentProps<'input'> & { label: string; hint?: string }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm text-text-dim">{label}</span>
      <input
        className={
          'min-h-[var(--tap)] rounded-app border border-border bg-surface px-3 text-text ' +
          'transition-[border-color,box-shadow] placeholder:text-text-dim hover:border-border-strong ' +
          `focus:border-accent focus:shadow-[0_0_0_3px_color-mix(in_oklab,var(--pitch)_18%,transparent)] ${className}`
        }
        {...props}
      />
      {hint && <span className="text-xs text-text-dim">{hint}</span>}
    </label>
  );
}
