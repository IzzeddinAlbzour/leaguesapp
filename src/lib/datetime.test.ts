import { describe, expect, it } from 'vitest';
import { formatDay, formatTime } from './datetime';

describe('formatDay', () => {
  it('renders Western digits, never Arabic-Indic', () => {
    expect(formatDay('2026-09-13')).toMatch(/13/);
  });

  it('reads a bare YYYY-MM-DD as local time, not UTC midnight', () => {
    // Regression: `new Date('2026-09-13')` is UTC midnight, which renders as
    // the 12th anywhere west of Greenwich.
    expect(formatDay('2026-09-13')).toBe(formatDay(new Date(2026, 8, 13, 12, 0)));
  });
});

describe('formatTime', () => {
  it('renders Western digits', () => {
    expect(formatTime(new Date(2026, 8, 13, 19, 30))).toMatch(/7:30|19:30/);
  });
});
