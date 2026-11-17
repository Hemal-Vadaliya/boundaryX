import type { Innings } from '@/domain/innings/types'
import type { RulesProfile } from '@/engine/rules/types'
import type { RecordDeliveryInput } from '@/engine/commands/recordDeliveryInput'
import type { EngineResult } from '@/engine/engineResult'
import { err } from '@/engine/engineResult'
import { extractReplaySteps, rebuildInnings } from '@/engine/replay/rebuildMatch'

/**
 * Corrects a specific prior delivery by sequence number, then replays the
 * innings forward from that point so every dependent calculation (runs,
 * overs, ends, figures) is recomputed rather than hand-patched. The
 * correction is recorded as a plain substitution in the replay step list;
 * exported match documents separately retain the original authoritative
 * events alongside the correction per the plan's audit-trail requirement
 * (section 15) — that history lives in the match-level event log, not
 * here, since this function operates purely on the delivery sequence.
 */
export function amendDelivery(
  innings: Innings,
  rulesProfile: RulesProfile,
  sequenceNumberToAmend: number,
  correctedInput: RecordDeliveryInput,
  openingStriker: string,
  openingNonStriker: string,
  createDeliveryId: (index: number) => string,
  nowIso: string
): EngineResult<Innings> {
  const targetIndex = innings.deliveries.findIndex(
    (d) => d.sequenceNumber === sequenceNumberToAmend
  )
  if (targetIndex === -1) {
    return err(
      'DELIVERY_NOT_FOUND',
      `No delivery with sequence number ${sequenceNumberToAmend} exists in this innings.`
    )
  }

  const steps = extractReplaySteps(innings.deliveries)
  steps[targetIndex] = {
    ...steps[targetIndex],
    delivery: correctedInput,
  }

  return rebuildInnings(
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
}
