import type { RulesProfile } from '@/engine/rules/types'

export interface OverProgress {
  /** Total legal balls bowled in the innings so far (before this delivery). */
  legalBallsBowledBefore: number
}

export interface OverCalculationResult {
  overNumber: number
  ballWithinOver: number
  legalBallsBowledAfter: number
  overJustCompleted: boolean
}

export function calculateOverProgress(
  progress: OverProgress,
  deliveryIsLegal: boolean,
  rulesProfile: RulesProfile
): OverCalculationResult {
  const ballsPerOver = rulesProfile.ballsPerOver
  const overNumber = Math.floor(progress.legalBallsBowledBefore / ballsPerOver)
  const ballWithinOverBefore = progress.legalBallsBowledBefore % ballsPerOver

  if (!deliveryIsLegal) {
    return {
      overNumber,
      ballWithinOver: ballWithinOverBefore,
      legalBallsBowledAfter: progress.legalBallsBowledBefore,
      overJustCompleted: false,
    }
  }

  const legalBallsBowledAfter = progress.legalBallsBowledBefore + 1
  const ballWithinOver = ballWithinOverBefore + 1
  const overJustCompleted = ballWithinOver === ballsPerOver

  return { overNumber, ballWithinOver, legalBallsBowledAfter, overJustCompleted }
}

export function formatOvers(legalBallsBowled: number, ballsPerOver: number): string {
  const completedOvers = Math.floor(legalBallsBowled / ballsPerOver)
  const remainder = legalBallsBowled % ballsPerOver
  return `${completedOvers}.${remainder}`
}

export interface BowlerEligibilityInput {
  bowlerId: string
  lastOverBowlerId?: string
  legalBallsBowledByBowler: number
  rulesProfile: RulesProfile
  /** True when this delivery would start a new over (i.e. the previous over has just completed). */
  isStartOfNewOver: boolean
}

export interface BowlerEligibilityResult {
  eligible: boolean
  reason?: string
}

/** Validates a bowler against the no-consecutive-overs rule and the format's per-bowler overs cap. */
export function validateBowlerEligibility(
  input: BowlerEligibilityInput
): BowlerEligibilityResult {
  const { rulesProfile } = input

  if (
    input.isStartOfNewOver &&
    rulesProfile.noConsecutiveOvers &&
    input.lastOverBowlerId &&
    input.lastOverBowlerId === input.bowlerId
  ) {
    return { eligible: false, reason: 'A bowler may not bowl consecutive overs.' }
  }

  if (rulesProfile.maxOversPerBowler !== undefined) {
    const oversAlreadyBowled = input.legalBallsBowledByBowler / rulesProfile.ballsPerOver
    if (input.isStartOfNewOver && oversAlreadyBowled >= rulesProfile.maxOversPerBowler) {
      return {
        eligible: false,
        reason: `This bowler has already bowled the maximum of ${rulesProfile.maxOversPerBowler} overs allowed.`,
      }
    }
  }

  return { eligible: true }
}
