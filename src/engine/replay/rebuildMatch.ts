import type { Innings } from '@/domain/innings/types'
import type { Delivery } from '@/domain/delivery/types'
import type { RulesProfile } from '@/engine/rules/types'
import type { EngineResult } from '@/engine/engineResult'
import { ok, err } from '@/engine/engineResult'
import { recordDelivery } from '@/engine/commands/recordDelivery'
import { completeOver } from '@/engine/commands/completeOver'
import { createInnings } from '@/engine/innings/createInnings'
import type { RecordDeliveryInput } from '@/engine/commands/recordDeliveryInput'

export interface ReplayStep {
  delivery: RecordDeliveryInput
  /** Supplied only on the first delivery of an over after the first, to reselect the bowler. */
  bowlerForNewOver?: string
}

/**
 * Rebuilds an innings from a known initial state by replaying every
 * delivery through the same validated recordDelivery pipeline used for
 * live scoring. This is the correctness reference the plan requires
 * (section 15): a corrected event history is only ever accepted if replay
 * from the start succeeds and produces internally consistent state.
 */
export function rebuildInnings(
  initial: Pick<
    Innings,
    'id' | 'matchId' | 'battingTeamId' | 'bowlingTeamId' | 'inningsNumber' | 'target'
  > & {
    openingStriker: string
    openingNonStriker: string
  },
  steps: ReplayStep[],
  rulesProfile: RulesProfile,
  createDeliveryId: (index: number) => string,
  nowIso: string
): EngineResult<Innings> {
  let innings = createInnings({
    id: initial.id,
    matchId: initial.matchId,
    battingTeamId: initial.battingTeamId,
    bowlingTeamId: initial.bowlingTeamId,
    inningsNumber: initial.inningsNumber,
    openingStriker: initial.openingStriker,
    openingNonStriker: initial.openingNonStriker,
    target: initial.target,
  })

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i]!

    if (step.bowlerForNewOver) {
      const overResult = completeOver(innings, rulesProfile, step.bowlerForNewOver)
      if (!overResult.ok) return overResult
      innings = overResult.value
    } else if (!innings.currentBowlerId && i === 0) {
      const overResult = completeOver(innings, rulesProfile, step.delivery.bowlerId)
      if (!overResult.ok) return overResult
      innings = overResult.value
    }

    const result = recordDelivery(
      {
        innings,
        rulesProfile,
        nowIso,
        createDeliveryId: () => createDeliveryId(i),
      },
      step.delivery
    )
    if (!result.ok) {
      return err(
        'REPLAY_FAILED',
        `Replay failed at step ${i} (${result.error.code}): ${result.error.message}`
      )
    }
    innings = result.value
  }

  return ok(innings)
}

export function extractReplaySteps(deliveries: Delivery[]): ReplayStep[] {
  let lastBowlerId: string | undefined
  return deliveries.map((delivery) => {
    const bowlerForNewOver =
      delivery.legalBallNumber === 1 && delivery.bowlerId !== lastBowlerId
        ? delivery.bowlerId
        : undefined
    lastBowlerId = delivery.bowlerId
    return {
      bowlerForNewOver,
      delivery: {
        bowlerId: delivery.bowlerId,
        batterRuns: delivery.batterRuns,
        extras: delivery.extras,
        outcome: delivery.outcome,
        dismissal: delivery.dismissal
          ? {
              type: delivery.dismissal.type,
              dismissedPlayerId: delivery.dismissal.dismissedPlayerId,
              dismissedEnd: delivery.dismissal.dismissedEnd,
              fielderId: delivery.dismissal.fielderId,
              assistingFielderId: delivery.dismissal.assistingFielderId,
            }
          : undefined,
        incomingBatterId: delivery.incomingBatterId,
        timestamp: delivery.timestamp,
      },
    }
  })
}
