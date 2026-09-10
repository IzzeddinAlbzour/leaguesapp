import { describe, expect, it } from 'vitest';
import { generateFixtures, type Fixture } from './fixtures';

const teams = (n: number) =>
  Array.from({ length: n }, (_, i) => `t${i + 1}`);

const pairKey = (f: Fixture) => [f.home, f.away].sort().join('|');

describe('generateFixtures', () => {
  it('produces n(n-1)/2 matches for an even number of teams', () => {
    expect(generateFixtures(teams(8))).toHaveLength(28);
  });

  it('produces n(n-1)/2 matches for an odd number of teams', () => {
    expect(generateFixtures(teams(7))).toHaveLength(21);
  });

  it('pairs every team with every other team exactly once', () => {
    const fixtures = generateFixtures(teams(8));
    const keys = fixtures.map(pairKey);
    expect(new Set(keys).size).toBe(28);
  });

  it('never schedules a team twice in the same round', () => {
    const fixtures = generateFixtures(teams(8));
    const byRound = new Map<number, string[]>();
    for (const f of fixtures) {
      const list = byRound.get(f.round) ?? [];
      list.push(f.home, f.away);
      byRound.set(f.round, list);
    }
    for (const [, appearances] of byRound) {
      expect(new Set(appearances).size).toBe(appearances.length);
    }
  });

  it('gives every team the same number of matches when the count is even', () => {
    const fixtures = generateFixtures(teams(8));
    const counts = new Map<string, number>();
    for (const f of fixtures) {
      counts.set(f.home, (counts.get(f.home) ?? 0) + 1);
      counts.set(f.away, (counts.get(f.away) ?? 0) + 1);
    }
    expect([...counts.values()]).toEqual(Array(8).fill(7));
  });

  it('emits no placeholder team when the count is odd', () => {
    const fixtures = generateFixtures(teams(7));
    const names = fixtures.flatMap((f) => [f.home, f.away]);
    expect(names.some((n) => n.startsWith('__'))).toBe(false);
  });

  it('doubles the fixtures and reverses the legs over two rounds', () => {
    const single = generateFixtures(teams(6), 1);
    const double = generateFixtures(teams(6), 2);
    expect(double).toHaveLength(single.length * 2);

    const secondLeg = double.slice(single.length);
    for (let i = 0; i < single.length; i++) {
      expect(secondLeg[i].home).toBe(single[i].away);
      expect(secondLeg[i].away).toBe(single[i].home);
    }
  });

  it('numbers rounds contiguously from 1', () => {
    const fixtures = generateFixtures(teams(8), 2);
    const rounds = [...new Set(fixtures.map((f) => f.round))].sort((a, b) => a - b);
    expect(rounds).toEqual(Array.from({ length: 14 }, (_, i) => i + 1));
  });

  it('rejects fewer than two teams', () => {
    expect(() => generateFixtures(['solo'])).toThrow();
  });

  it('rejects duplicate team ids', () => {
    expect(() => generateFixtures(['a', 'b', 'a'])).toThrow();
  });
});
