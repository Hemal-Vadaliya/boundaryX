import type { Innings } from '@/domain/innings/types'
import type { RulesProfile } from '@/engine/rules/types'
import type { RecordDeliveryInput } from '@/engine/commands/recordDeliveryInput'
import type { EngineResult } from '@/engine/engineResult'
import { err, ok } from '@/engine/engineResult'
import { amendDelivery } from '@/engine/corrections/amendDelivery'

/**
 * Edits the most recently recorded delivery in place, preserving the
 * original record alongside the correction (plan section 15.1: "preserve a
 * correction audit trail... avoid silently deleting historical
 * information"). Delegates the actual recompute to amendDelivery/replay —
 * this only adds the audit-trail bookkeeping on top.
 */
export function editLastDelivery(
  innings: Innings,
  rulesProfile: RulesProfile,
  correctedInput: RecordDeliveryInput,
  openingStriker: string,
  openingNonStriker: string,
  createDeliveryId: (index: number) => string,
  nowIso: string,
  reason?: string
): EngineResult<Innings> {
  if (innings.deliveries.length === 0) {
    return err('NOTHING_TO_EDIT', 'There are no deliveries recorded in this innings yet.')
  }

  const originalDelivery = innings.deliveries[innings.deliveries.length - 1]!

  const result = amendDelivery(
    innings,
    rulesProfile,
    originalDelivery.sequenceNumber,
    correctedInput,
    openingStriker,
    openingNonStriker,
    createDeliveryId,
    nowIso
  )
  if (!result.ok) return result

  const correctedDelivery = result.value.deliveries[originalDelivery.sequenceNumber]
  if (!correctedDelivery) {
    return err(
      'CORRECTION_FAILED',
      'The corrected delivery could not be located after replay.'
    )
  }

  return ok({
    ...result.value,
    corrections: [
      ...innings.corrections,
      {
        id: createDeliveryId(innings.deliveries.length),
        originalDelivery,
        correctedDeliveryId: correctedDelivery.id,
        reason,
        timestamp: nowIso,
      },
    ],
  })
}
