import { describe, expect, it } from 'vitest';
import { calculateVenueRevenue } from './venue-revenue';

describe('calculateVenueRevenue', () => {
  it('multiplies confirmed match count by the per-match fee', () => {
    expect(calculateVenueRevenue(5, 100)).toBe(500);
  });

  it('returns 0 for zero confirmed matches', () => {
    expect(calculateVenueRevenue(0, 100)).toBe(0);
  });

  it('returns 0 for a zero fee', () => {
    expect(calculateVenueRevenue(10, 0)).toBe(0);
  });
});
