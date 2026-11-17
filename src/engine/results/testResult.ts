import type { MatchResult } from '@/engine/results/limitedOversResult'

export interface TestInningsSummary {
  teamId: string
  runs: number
  wicketsLost: number
  /** True once this innings has reached its natural conclusion (all out, declared, or forfeited) and will not resume. */
  closed: boolean
}

export interface TestResultInput {
  teamAId: string
  teamBId: string
  /** Innings in chronological order; a team may appear once or twice depending on follow-on/how the match played out. */
  innings: TestInningsSummary[]
  /** True when no more playing time remains in the match. */
  timeExpired: boolean
}

function teamTotalRuns(innings: TestInningsSummary[], teamId: string): number {
  return innings.filter((i) => i.teamId === teamId).reduce((sum, i) => sum + i.runs, 0)
}

function teamInningsCount(innings: TestInningsSummary[], teamId: string): number {
  return innings.filter((i) => i.teamId === teamId).length
}

function allInningsClosed(innings: TestInningsSummary[]): boolean {
  return innings.every((i) => i.closed)
}

/**
 * Determines a Test match result from the full innings history. A draw is
 * reported whenever time expires before both sides have completed every
 * innings they were due to bat (the chasing side has not been bowled out
 * and has not overtaken the target) — standard Test cricket outcome.
 */
export function determineTestResult(input: TestResultInput): MatchResult {
  const teamARuns = teamTotalRuns(input.innings, input.teamAId)
  const teamBRuns = teamTotalRuns(input.innings, input.teamBId)

  if (input.timeExpired && !allInningsClosed(input.innings)) {
    return { outcome: 'draw', summary: 'Match drawn.' }
  }

  if (teamARuns === teamBRuns) {
    return { outcome: 'tie', summary: 'The match ended in a tie.' }
  }

  const teamAWon = teamARuns > teamBRuns
  const winningTeamId = teamAWon ? input.teamAId : input.teamBId
  const losingTeamId = teamAWon ? input.teamBId : input.teamAId
  const winningRuns = teamAWon ? teamARuns : teamBRuns
  const losingRuns = teamAWon ? teamBRuns : teamARuns
  const runMargin = winningRuns - losingRuns

  const winningInnings = teamInningsCount(input.innings, winningTeamId)
  const losingInnings = teamInningsCount(input.innings, losingTeamId)

  if (winningInnings < losingInnings) {
    return {
      outcome: 'win',
      winningTeamId,
      winMargin: { by: 'runs', amount: runMargin },
      summary: `Won by an innings and ${runMargin} run${runMargin === 1 ? '' : 's'}.`,
    }
  }

  return {
    outcome: 'win',
    winningTeamId,
    winMargin: { by: 'runs', amount: runMargin },
    summary: `Won by ${runMargin} run${runMargin === 1 ? '' : 's'}.`,
  }
}
