// Western digits everywhere — never Arabic-Indic. Bare toLocaleString('ar')
// picks the numbering system from the runtime's ICU defaults, so every date or
// time the user sees goes through one of these.

const dayFormatter = new Intl.DateTimeFormat('ar', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  numberingSystem: 'latn',
});

const timeFormatter = new Intl.DateTimeFormat('ar', {
  hour: 'numeric',
  minute: '2-digit',
  numberingSystem: 'latn',
});

/**
 * "الأحد، 13 سبتمبر" — accepts a Date or an ISO/`YYYY-MM-DD` string.
 * A bare `YYYY-MM-DD` is parsed as UTC midnight by `new Date`, which renders as
 * the previous day west of Greenwich; read it as local time instead.
 */
export function formatDay(value: string | Date): string {
  const d = typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00` : value;
  return dayFormatter.format(new Date(d));
}

/** "7:30 م" */
export function formatTime(value: string | Date): string {
  return timeFormatter.format(new Date(value));
}
