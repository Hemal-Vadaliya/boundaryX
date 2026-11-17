export function calculateRunRate(
  runs: number,
  legalBallsBowled: number,
  ballsPerOver: number
): number {
  if (legalBallsBowled === 0) return 0
  const overs = legalBallsBowled / ballsPerOver
  return runs / overs
}

export function calculateRequiredRunRate(
  runsStillNeeded: number,
  legalBallsRemaining: number,
  ballsPerOver: number
): number | undefined {
  if (legalBallsRemaining <= 0) return undefined
  const oversRemaining = legalBallsRemaining / ballsPerOver
  return runsStillNeeded / oversRemaining
}
