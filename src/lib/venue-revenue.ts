/**
 * Revenue counts the moment a booking is confirmed, not once the match is
 * played — a running total for the owner, not settled accounting.
 */
export function calculateVenueRevenue(confirmedMatchCount: number, feePerMatch: number): number {
  return confirmedMatchCount * feePerMatch;
}
