import type { BatterEnd } from '@/domain/dismissal/types'
import type { Delivery } from '@/domain/delivery/types'

export type BatterInningsState =
  'did-not-bat' | 'batting' | 'out' | 'retired-hurt' | 'retired-out' | 'not-out'

export interface BatterInnings {
  playerId: string
  state: BatterInningsState
  runs: number
  ballsFaced: number
  fours: number
  sixes: number
  /** Order in which this batter came to the crease (1-indexed), undefined if they never batted. */
  battingPosition?: number
}

export interface BowlerFigures {
  playerId: string
  legalBallsBowled: number
  runsConceded: number
  wickets: number
  maidens: number
  wides: number
  noBalls: number
}

export type InningsLifecycleState = 'not-started' | 'in-progress' | 'completed'

/**
 * One team's innings. Deliveries are the authoritative record; batterInnings
 * and bowlerFigures are derived caches recomputed from deliveries by the
 * calculations layer — never hand-edited directly.
 */
export interface Innings {
  id: string
  matchId: string
  battingTeamId: string
  bowlingTeamId: string
  /** 1-indexed innings number within the match (2 for a team's second innings in a Test). */
  inningsNumber: number
  state: InningsLifecycleState
  deliveries: Delivery[]
  batterInnings: Record<string, BatterInnings>
  bowlerFigures: Record<string, BowlerFigures>
  /** Current occupants of each end, undefined once the innings has completed. nonStriker is absent during last-man-stands (a lone surviving batter). */
  currentBatters?: { striker: string; nonStriker?: string }
  currentBowlerId?: string
  /** The bowler who bowled the most recently completed over, used for the no-consecutive-overs check. Undefined before the first over completes. */
  lastOverBowlerId?: string
  /** Whether the next delivery to be bowled is a free hit. */
  freeHitActive: boolean
  /** Legal balls bowled so far in the innings, used to derive the current over/ball display. */
  legalBallsBowled: number
  wicketsLost: number
  declared: boolean
  target?: number
  /** This innings' actual overs allocation when reduced from the format default (e.g. a rain delay) — undefined when unreduced. */
  oversAllocated?: number
  /** Audit trail of rain delays/stoppages that reduced overs or ended the innings early; empty/undefined for an uninterrupted innings. */
  interruptions?: InterruptionEvent[]
  /** Non-delivery batter-state events: retiring hurt and returning to the crease. */
  retirements: RetirementEvent[]
  /** Audit trail of corrected deliveries, preserving the original record alongside the correction. */
  corrections: DeliveryCorrection[]
}

export interface InterruptionEvent {
  reason: string
  /** The overs allocation in effect immediately after this interruption (undefined if the innings was stopped entirely rather than reduced). */
  revisedOversAllocated?: number
  timestamp: string
}

export interface RetirementEvent {
  playerId: string
  type: 'retired-hurt' | 'return'
  timestamp: string
}

export interface DeliveryCorrection {
  id: string
  originalDelivery: Delivery
  correctedDeliveryId: string
  reason?: string
  timestamp: string
}

export function emptyBowlerFigures(playerId: string): BowlerFigures {
  return {
    playerId,
    legalBallsBowled: 0,
    runsConceded: 0,
    wickets: 0,
    maidens: 0,
    wides: 0,
    noBalls: 0,
  }
}

export function emptyBatterInnings(playerId: string): BatterInnings {
  return {
    playerId,
    state: 'did-not-bat',
    runs: 0,
    ballsFaced: 0,
    fours: 0,
    sixes: 0,
  }
}

export interface FallOfWicket {
  wicketNumber: number
  playerId: string
  teamScoreAtFall: number
  oversAtFall: string
}

export interface Partnership {
  batterAId: string
  /** Absent for a last-man-stands stretch where only one batter is at the crease. */
  batterBId?: string
  runs: number
  ballsFaced: number
  /** Which wicket number this partnership ended at (undefined if still active/unbroken). */
  endedAtWicket?: number
}

export type { BatterEnd }
