export interface LimitedOversResultInput {
  teamAId: string
  teamBId: string
  /** The team that batted first. */
  firstBattingTeamId: string
  firstInningsRuns: number
  secondInningsRuns: number
  secondInningsWicketsLost: number
  secondBattingPlayersPerSide: number
  secondInningsCompletedLegally: boolean
}

export type MatchOutcome = 'win' | 'tie' | 'no-result' | 'draw'

export interface MatchResult {
  outcome: MatchOutcome
  winningTeamId?: string
  winMargin?: { by: 'runs' | 'wickets'; amount: number }
  summary: string
}

/**
 * Determines the result of a completed limited-overs match from the two
 * innings totals. Tie-break procedures beyond a tie (e.g. Super Over) are
 * handled separately — this only reports whether the chase succeeded,
 * fell short, or tied.
 */
export function determineLimitedOversResult(input: LimitedOversResultInput): MatchResult {
  const secondBattingTeamId =
    input.firstBattingTeamId === input.teamAId ? input.teamBId : input.teamAId

  if (!input.secondInningsCompletedLegally) {
    return {
      outcome: 'no-result',
      summary: 'The match could not be completed and no result was achieved.',
    }
  }

  if (input.secondInningsRuns > input.firstInningsRuns) {
    const wicketsInHand = input.secondBattingPlayersPerSide - input.secondInningsWicketsLost
    return {
      outcome: 'win',
      winningTeamId: secondBattingTeamId,
      winMargin: { by: 'wickets', amount: wicketsInHand },
      summary: `Won by ${wicketsInHand} wicket${wicketsInHand === 1 ? '' : 's'}.`,
    }
  }

  if (input.secondInningsRuns < input.firstInningsRuns) {
    const runMargin = input.firstInningsRuns - input.secondInningsRuns
    return {
      outcome: 'win',
      winningTeamId: input.firstBattingTeamId,
      winMargin: { by: 'runs', amount: runMargin },
      summary: `Won by ${runMargin} run${runMargin === 1 ? '' : 's'}.`,
    }
  }

  return { outcome: 'tie', summary: 'The match ended in a tie.' }
}
