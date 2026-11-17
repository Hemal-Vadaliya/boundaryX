import type { Innings } from '@/domain/innings/types'

export interface CreateInningsInput {
  id: string
  matchId: string
  battingTeamId: string
  bowlingTeamId: string
  inningsNumber: number
  openingStriker: string
  openingNonStriker: string
  target?: number
  /** Set when this innings' overs were reduced before it even started (e.g. a rain delay before the chase began). */
  oversAllocated?: number
}

export function createInnings(input: CreateInningsInput): Innings {
  return {
    id: input.id,
    matchId: input.matchId,
    battingTeamId: input.battingTeamId,
    bowlingTeamId: input.bowlingTeamId,
    inningsNumber: input.inningsNumber,
    state: 'in-progress',
    deliveries: [],
    batterInnings: {},
    bowlerFigures: {},
    currentBatters: {
      striker: input.openingStriker,
      nonStriker: input.openingNonStriker,
    },
    currentBowlerId: undefined,
    lastOverBowlerId: undefined,
    freeHitActive: false,
    legalBallsBowled: 0,
    wicketsLost: 0,
    declared: false,
    target: input.target,
    oversAllocated: input.oversAllocated,
    retirements: [],
    corrections: [],
  }
}
