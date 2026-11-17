import type { Innings } from '@/domain/innings/types'
import { totalRunsOffDelivery } from '@/domain/delivery/types'
import type { MatchResult } from '@/engine/results/limitedOversResult'
import { determineLimitedOversResult } from '@/engine/results/limitedOversResult'

export interface SuperOverState {
  /** Sequential Super Over number, in case of repeated ties (1, 2, 3, ...). */
  sequenceNumber: number
  firstInnings: Innings
  secondInnings: Innings
}

export interface SuperOverRules {
  oversPerSuperOver: number
  wicketsAllowed: number
}

/**
 * A Super Over is modelled as its own pair of innings, entirely separate
 * from the main match's innings — main-match batting/bowling figures must
 * never be mixed with Super Over figures.
 */
export function createSuperOverRules(): SuperOverRules {
  return { oversPerSuperOver: 1, wicketsAllowed: 2 }
}

export function determineSuperOverResult(
  state: SuperOverState,
  teamAId: string,
  teamBId: string
): MatchResult {
  const firstInningsRuns = sumRuns(state.firstInnings)
  const secondInningsRuns = sumRuns(state.secondInnings)

  return determineLimitedOversResult({
    teamAId,
    teamBId,
    firstBattingTeamId: state.firstInnings.battingTeamId,
    firstInningsRuns,
    secondInningsRuns,
    secondInningsWicketsLost: state.secondInnings.wicketsLost,
    secondBattingPlayersPerSide: 11,
    secondInningsCompletedLegally: state.secondInnings.state === 'completed',
  })
}

function sumRuns(innings: Innings): number {
  return innings.deliveries.reduce((sum, d) => sum + totalRunsOffDelivery(d), 0)
}
