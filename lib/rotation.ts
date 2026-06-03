/**
 * Deterministic book rotation for Gartic.
 * Each player works on a different book each step (circular shift).
 *
 * Step 0: playerIds[i] → books[playerIds[i]]   (own book)
 * Step 1: playerIds[i] → books[playerIds[(i-1+n)%n]]
 * Step k: playerIds[i] → books[playerIds[(i-k+n)%n]]
 */
export function getBookAssignments(
  playerIds: string[],
  step: number
): Record<string, string> {
  const n = playerIds.length;
  const assignments: Record<string, string> = {};
  playerIds.forEach((playerId, playerIndex) => {
    const bookIndex = (playerIndex - step + n) % n;
    assignments[playerId] = playerIds[bookIndex];
  });
  return assignments;
}

/** Which book does this player work on for this step? */
export function getMyBookId(
  playerIds: string[],
  step: number,
  playerId: string
): string {
  const assignments = getBookAssignments(playerIds, step);
  return assignments[playerId] ?? playerIds[0];
}
