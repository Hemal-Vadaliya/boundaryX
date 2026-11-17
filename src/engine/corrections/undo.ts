import type { Innings } from '@/domain/innings/types'
import type { RulesProfile } from '@/engine/rules/types'
import type { EngineResult } from '@/engine/engineResult'
import { ok, err } from '@/engine/engineResult'
import { extractReplaySteps, rebuildInnings } from '@/engine/replay/rebuildMatch'

/**
 * Immediate undo of the most recent delivery. Implemented as a full
 * replay of every delivery except the last, through the same validated
 * pipeline — never a hand-rolled reverse-calculation — so the result is
 * guaranteed consistent with recordDelivery's own invariants.
 */
export function undoLastDelivery(
  innings: Innings,
  rulesProfile: RulesProfile,
  openingStriker: string,
  openingNonStriker: string,
  createDeliveryId: (index: number) => string,
  nowIso: string
): EngineResult<Innings> {
  if (innings.deliveries.length === 0) {
    return err('NOTHING_TO_UNDO', 'There are no deliveries recorded in this innings yet.')
  }

  const remainingDeliveries = innings.deliveries.slice(0, -1)
  const steps = extractReplaySteps(remainingDeliveries)

  const result = rebuildInnings(
    {
      id: innings.id,
      matchId: innings.matchId,
      battingTeamId: innings.battingTeamId,
      bowlingTeamId: innings.bowlingTeamId,
      inningsNumber: innings.inningsNumber,
      target: innings.target,
      openingStriker,
      openingNonStriker,
    },
    steps,
    rulesProfile,
    createDeliveryId,
    nowIso
  )

  if (!result.ok) return result
  return ok({ ...result.value, state: innings.state })
}
