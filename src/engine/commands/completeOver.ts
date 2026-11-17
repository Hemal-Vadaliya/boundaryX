import type { Innings } from '@/domain/innings/types'
import type { RulesProfile } from '@/engine/rules/types'
import type { EngineResult } from '@/engine/engineResult'
import { ok, err } from '@/engine/engineResult'
import { validateBowlerEligibility } from '@/engine/scoring/overCalculator'

/**
 * Assigns the bowler for the next over. Must be called after an over
 * completes (currentBowlerId is cleared by recordDelivery once the final
 * legal ball of an over is bowled) and before the next delivery is
 * recorded. Validates the no-consecutive-overs rule and the per-bowler
 * overs cap up front, so a UI can surface the error before the bowler is
 * locked in rather than after the first ball of the new over.
 */
export function completeOver(
  innings: Innings,
  rulesProfile: RulesProfile,
  nextBowlerId: string
): EngineResult<Innings> {
  if (innings.currentBowlerId) {
    return err('OVER_NOT_COMPLETE', 'The current over has not finished yet.')
  }

  const bowlerFigures = innings.bowlerFigures[nextBowlerId]
  const eligibility = validateBowlerEligibility({
    bowlerId: nextBowlerId,
    lastOverBowlerId: innings.lastOverBowlerId,
    legalBallsBowledByBowler: bowlerFigures?.legalBallsBowled ?? 0,
    rulesProfile,
    isStartOfNewOver: true,
  })
  if (!eligibility.eligible) {
    return err(
      'BOWLER_NOT_ELIGIBLE',
      eligibility.reason ?? 'This bowler is not eligible to bowl the next over.'
    )
  }

  return ok({ ...innings, currentBowlerId: nextBowlerId })
}
