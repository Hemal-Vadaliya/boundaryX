import type { Innings } from '@/domain/innings/types'
import type { Delivery } from '@/domain/delivery/types'
import { isLegalDelivery } from '@/domain/delivery/types'
import type { RulesProfile } from '@/engine/rules/types'
import type { RecordDeliveryInput } from '@/engine/commands/recordDeliveryInput'
import type { EngineResult } from '@/engine/engineResult'
import { ok, err } from '@/engine/engineResult'
import { validateAndBuildExtras } from '@/engine/scoring/extrasCalculator'
import {
  calculateEndsAfterDelivery,
  swapEndsForNewOver,
} from '@/engine/scoring/strikeCalculator'
import type { BatterPositions } from '@/engine/scoring/strikeCalculator'
import {
  calculateOverProgress,
  validateBowlerEligibility,
} from '@/engine/scoring/overCalculator'
import {
  calculateFreeHitAfterDelivery,
  isDismissalValidOnFreeHit,
} from '@/engine/scoring/freeHitCalculator'
import {
  isDismissalValidForOutcome,
  dismissalCreditsBowler,
} from '@/domain/dismissal/types'
import { computeBatterInnings } from '@/engine/calculations/battingFigures'
import { computeBowlerFigures } from '@/engine/calculations/bowlingFigures'
import { computeInningsTotals } from '@/engine/calculations/inningsTotals'

export interface RecordDeliveryContext {
  innings: Innings
  rulesProfile: RulesProfile
  nowIso: string
  createDeliveryId: () => string
}

/**
 * Processes one delivery against the authoritative innings state following
 * the pipeline in the plan (section 12.3): validate state and players,
 * validate the action against the rules profile, validate extras and
 * dismissal, compute runs/ends/over/free-hit, then append the new
 * authoritative event and return a freshly derived innings. On any
 * validation failure the error path is returned and the original innings
 * is left completely untouched — nothing is mutated in place.
 */
export function recordDelivery(
  context: RecordDeliveryContext,
  input: RecordDeliveryInput
): EngineResult<Innings> {
  const { innings, rulesProfile } = context

  if (innings.state !== 'in-progress') {
    return err(
      'INNINGS_NOT_IN_PROGRESS',
      'Deliveries can only be recorded while the innings is in progress.'
    )
  }
  if (!innings.currentBatters) {
    return err('NO_BATTERS_AT_CREASE', 'No batters are currently set at the crease.')
  }
  if (innings.currentBowlerId && innings.currentBowlerId !== input.bowlerId) {
    return err(
      'BOWLER_MISMATCH',
      'The bowler for this delivery does not match the bowler currently set for this over. Call completeOver before changing the bowler.'
    )
  }

  const extrasResult = validateAndBuildExtras({
    outcome: input.outcome,
    batterRuns: input.batterRuns,
    extras: input.extras,
    rulesProfile,
  })
  if (!extrasResult.ok) return extrasResult

  if (input.dismissal) {
    if (!isDismissalValidForOutcome(input.dismissal.type, input.outcome)) {
      return err(
        'INVALID_DISMISSAL_FOR_OUTCOME',
        `${input.dismissal.type} cannot be given on a ${input.outcome} delivery.`
      )
    }
    if (innings.freeHitActive && !isDismissalValidOnFreeHit(input.dismissal.type)) {
      return err(
        'INVALID_DISMISSAL_ON_FREE_HIT',
        `${input.dismissal.type} is not a valid dismissal on a free hit.`
      )
    }
    const dismissedId = input.dismissal.dismissedPlayerId
    if (
      dismissedId !== innings.currentBatters.striker &&
      dismissedId !== innings.currentBatters.nonStriker
    ) {
      return err(
        'INVALID_DISMISSED_PLAYER',
        'The dismissed player must be one of the batters at the crease.'
      )
    }
  }

  const deliveryIsLegal = input.outcome === 'legal'
  const overProgress = calculateOverProgress(
    { legalBallsBowledBefore: innings.legalBallsBowled },
    deliveryIsLegal,
    rulesProfile
  )

  const isFirstBallOfOver = overProgress.ballWithinOver === 1 && deliveryIsLegal
  const bowlerFiguresBefore = innings.bowlerFigures[input.bowlerId]
  const eligibility = validateBowlerEligibility({
    bowlerId: input.bowlerId,
    lastOverBowlerId: innings.lastOverBowlerId,
    legalBallsBowledByBowler: bowlerFiguresBefore?.legalBallsBowled ?? 0,
    rulesProfile,
    isStartOfNewOver: isFirstBallOfOver,
  })
  if (!eligibility.eligible) {
    return err(
      'BOWLER_NOT_ELIGIBLE',
      eligibility.reason ?? 'This bowler is not eligible to bowl this over.'
    )
  }

  const deliveryIsFreeHit = innings.freeHitActive
  const freeHitAfter = calculateFreeHitAfterDelivery(
    rulesProfile,
    input.outcome,
    innings.freeHitActive
  )

  const finalDismissal = input.dismissal
    ? { ...input.dismissal, creditsBowler: dismissalCreditsBowler(input.dismissal.type) }
    : undefined

  const delivery: Delivery = {
    id: context.createDeliveryId(),
    inningsId: innings.id,
    sequenceNumber: innings.deliveries.length,
    overNumber: overProgress.overNumber,
    legalBallNumber: deliveryIsLegal ? overProgress.ballWithinOver : undefined,
    strikerIdBefore: innings.currentBatters.striker,
    nonStrikerIdBefore: innings.currentBatters.nonStriker,
    bowlerId: input.bowlerId,
    batterRuns: input.batterRuns,
    extras: extrasResult.value,
    outcome: input.outcome,
    dismissal: finalDismissal,
    incomingBatterId: input.incomingBatterId,
    isFreeHit: deliveryIsFreeHit,
    timestamp: input.timestamp ?? context.nowIso,
  }

  const deliveries = [...innings.deliveries, delivery]

  // Last-man-stands bookkeeping: a wicket with no incoming batter supplied
  // leaves currentBatters undefined — pending — unless the surviving
  // partner must continue alone (last-man-stands). "Pending" covers both
  // a genuine all-out (no partner survives) and the ordinary case where a
  // partner survives but no replacement has been chosen yet; in both
  // cases the UI/caller decides what to show (the all-out banner, or a
  // prompt to pick the next batter) based on whether further batters are
  // actually available — recordDelivery itself never computes a broken
  // half-filled position for this ball.
  const hadPartnerBeforeThisBall = innings.currentBatters.nonStriker !== undefined
  const wicketWithNoReplacement = finalDismissal !== undefined && !input.incomingBatterId
  const becomesSoloStriker =
    wicketWithNoReplacement && hadPartnerBeforeThisBall && !!input.noFurtherBattersAvailable
  const awaitingIncomingBatter = wicketWithNoReplacement && !becomesSoloStriker

  let endsAfter: BatterPositions | undefined
  if (becomesSoloStriker && finalDismissal) {
    // The survivor always keeps strike as the sole remaining batter,
    // regardless of which end they occupied before this ball.
    const survivorId =
      finalDismissal.dismissedPlayerId === innings.currentBatters.striker
        ? innings.currentBatters.nonStriker!
        : innings.currentBatters.striker
    endsAfter = { striker: survivorId, nonStriker: undefined }
  } else if (awaitingIncomingBatter) {
    endsAfter = undefined
  } else {
    endsAfter = calculateEndsAfterDelivery({
      positionsBefore: innings.currentBatters,
      batterRuns: delivery.batterRuns,
      extras: delivery.extras,
      dismissal: finalDismissal,
      incomingBatterId: input.incomingBatterId,
      battersCrossedOverride: input.battersCrossed,
    })
  }

  if (overProgress.overJustCompleted && endsAfter) {
    endsAfter = swapEndsForNewOver(endsAfter)
  }

  const totals = computeInningsTotals(deliveries)

  const updatedInnings: Innings = {
    ...innings,
    deliveries,
    legalBallsBowled: overProgress.legalBallsBowledAfter,
    wicketsLost: totals.wickets,
    currentBatters: endsAfter,
    currentBowlerId: overProgress.overJustCompleted ? undefined : input.bowlerId,
    lastOverBowlerId: overProgress.overJustCompleted
      ? input.bowlerId
      : innings.lastOverBowlerId,
    freeHitActive: freeHitAfter,
    batterInnings: computeBatterInnings(deliveries),
    bowlerFigures: computeBowlerFigures(deliveries, rulesProfile),
  }

  return ok(updatedInnings)
}

export { isLegalDelivery }
