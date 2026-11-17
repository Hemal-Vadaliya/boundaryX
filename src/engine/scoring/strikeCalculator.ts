import type { ExtrasBreakdown } from '@/domain/delivery/types'
import type { DismissalRecord, BatterEnd } from '@/domain/dismissal/types'

export interface BatterPositions {
  striker: string
  /** Absent when the team is batting with a lone survivor (last-man-stands). */
  nonStriker?: string
}

export interface StrikeCalculationInput {
  positionsBefore: BatterPositions
  batterRuns: number
  extras: ExtrasBreakdown
  dismissal?: DismissalRecord
  incomingBatterId?: string
  /** Explicit override for whether the batters crossed while running, for edge cases where simple run-count parity does not apply. Only consulted when there is no dismissal. */
  battersCrossedOverride?: boolean
}

function oppositeEnd(end: BatterEnd): BatterEnd {
  return end === 'striker' ? 'non-striker' : 'striker'
}

function positionsKeyForEnd(end: BatterEnd): keyof BatterPositions {
  return end === 'striker' ? 'striker' : 'nonStriker'
}

/** Runs that involve the batters physically running between the wickets, for crossing/parity purposes. Boundaries (4s/6s) and no-ball/penalty runs do not involve running. */
function runsRunThisDelivery(batterRuns: number, extras: ExtrasBreakdown): number {
  return batterRuns + extras.byes + extras.legByes + extras.wides
}

/**
 * Resolves the occupants of each end after a delivery. Does not implement
 * end-of-over strike rotation — that is applied separately once an over
 * completes (see overCalculator), since it is independent of what happened
 * on the last ball of the over.
 */
export function calculateEndsAfterDelivery(
  input: StrikeCalculationInput
): BatterPositions {
  const { positionsBefore, dismissal } = input

  if (!dismissal) {
    if (positionsBefore.nonStriker === undefined) {
      // Last-man-stands: a lone striker has no partner to run with or
      // swap places with — they always retain strike.
      return { striker: positionsBefore.striker, nonStriker: undefined }
    }
    const runsRun = runsRunThisDelivery(input.batterRuns, input.extras)
    const crossed = input.battersCrossedOverride ?? runsRun % 2 === 1
    return crossed
      ? { striker: positionsBefore.nonStriker, nonStriker: positionsBefore.striker }
      : { striker: positionsBefore.striker, nonStriker: positionsBefore.nonStriker }
  }

  // With a dismissal, dismissedEnd and dismissedPlayerId are authoritative —
  // they already encode where the dismissal occurred, so no crossing
  // inference is needed. The surviving original batter is simply the one
  // who isn't out, and always ends up at the end opposite the dismissal.
  const survivingBatterId =
    dismissal.dismissedPlayerId === positionsBefore.striker
      ? positionsBefore.nonStriker
      : positionsBefore.striker
  const survivingEnd = oppositeEnd(dismissal.dismissedEnd)

  const positionsAfter: Partial<BatterPositions> = {}
  if (survivingBatterId) {
    positionsAfter[positionsKeyForEnd(survivingEnd)] = survivingBatterId
  }
  if (input.incomingBatterId) {
    positionsAfter[positionsKeyForEnd(dismissal.dismissedEnd)] = input.incomingBatterId
  }

  return {
    striker: positionsAfter.striker ?? '',
    nonStriker: positionsAfter.nonStriker,
  }
}

/** Swaps ends for the next over — applied once after the final legal ball of an over, regardless of what happened on that ball. */
export function swapEndsForNewOver(positions: BatterPositions): BatterPositions {
  if (positions.nonStriker === undefined) {
    // Last-man-stands: a lone striker keeps strike across the over break too.
    return positions
  }
  return { striker: positions.nonStriker, nonStriker: positions.striker }
}
