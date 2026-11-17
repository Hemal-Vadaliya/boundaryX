import type { Innings } from '@/domain/innings/types'
import type { EngineResult } from '@/engine/engineResult'
import { ok, err } from '@/engine/engineResult'

/**
 * Sets the incoming batter after a wicket when one was not supplied at the
 * moment the dismissal was recorded. The survivor's end is already fixed
 * by the dismissal record — this only ever fills the empty end left by the
 * dismissed batter.
 */
export function selectIncomingBatter(
  innings: Innings,
  newBatterId: string
): EngineResult<Innings> {
  const lastDelivery = innings.deliveries[innings.deliveries.length - 1]
  if (!lastDelivery?.dismissal) {
    return err(
      'NO_PENDING_DISMISSAL',
      'There is no pending dismissal awaiting a new batter.'
    )
  }
  if (innings.currentBatters) {
    return err('BATTERS_ALREADY_SET', 'Both batter ends are already occupied.')
  }

  const dismissedEnd = lastDelivery.dismissal.dismissedEnd
  const survivingBatterId =
    lastDelivery.dismissal.dismissedPlayerId === lastDelivery.strikerIdBefore
      ? lastDelivery.nonStrikerIdBefore
      : lastDelivery.strikerIdBefore

  if (!survivingBatterId) {
    return err(
      'INNINGS_ALREADY_ALL_OUT',
      'The last wicket left no surviving batter — the innings is already all out.'
    )
  }

  const currentBatters =
    dismissedEnd === 'striker'
      ? { striker: newBatterId, nonStriker: survivingBatterId }
      : { striker: survivingBatterId, nonStriker: newBatterId }

  return ok({ ...innings, currentBatters })
}
