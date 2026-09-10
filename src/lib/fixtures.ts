export type Fixture = {
  round: number;
  home: string;
  away: string;
};

const BYE = '__bye__';

/**
 * Round-robin scheduling by the circle method.
 *
 * One team is held fixed while the rest rotate around it, so each rotation
 * yields a complete round in which every team plays exactly once. An odd
 * number of teams gets a bye placeholder, and the matches against it are
 * dropped — that team simply rests that round.
 *
 * Home and away alternate between rounds so no team is drawn at home in
 * every fixture.
 */
export function generateFixtures(
  teamIds: string[],
  rounds: 1 | 2 = 1,
): Fixture[] {
  if (teamIds.length < 2) {
    throw new Error('generateFixtures needs at least 2 teams');
  }
  if (new Set(teamIds).size !== teamIds.length) {
    throw new Error('generateFixtures received duplicate team ids');
  }

  const teams = [...teamIds];
  const hasBye = teams.length % 2 === 1;
  if (hasBye) teams.push(BYE);

  const size = teams.length;
  const half = size / 2;
  const roundCount = size - 1;

  const [fixed, ...rotating] = teams;
  const firstLeg: Fixture[] = [];

  for (let r = 0; r < roundCount; r++) {
    const lineup = [fixed, ...rotating];

    for (let i = 0; i < half; i++) {
      const a = lineup[i];
      const b = lineup[size - 1 - i];
      if (a === BYE || b === BYE) continue;

      firstLeg.push(
        r % 2 === 0
          ? { round: r + 1, home: a, away: b }
          : { round: r + 1, home: b, away: a },
      );
    }

    rotating.unshift(rotating.pop()!);
  }

  if (rounds === 1) return firstLeg;

  const secondLeg = firstLeg.map((f) => ({
    round: f.round + roundCount,
    home: f.away,
    away: f.home,
  }));

  return [...firstLeg, ...secondLeg];
}
