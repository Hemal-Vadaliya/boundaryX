import type { Innings } from '@/domain/innings/types'
import type { EngineResult } from '@/engine/engineResult'
import { ok, err } from '@/engine/engineResult'

/**
 * Ends an innings immediately due to an interruption (e.g. rain that
 * doesn't clear) rather than a natural conclusion (all out, overs
 * completed, target reached, declared). Tagging the completion with an
 * interruption entry lets determineMatchResult route to the DLS method
 * instead of a plain totals comparison.
 */
export function stopInningsForInterruption(
  innings: Innings,
  reason: string,
  nowIso: string
): EngineResult<Innings> {
  if (innings.state !== 'in-progress') {
    return err(
      'INNINGS_NOT_IN_PROGRESS',
      'Only an in-progress innings can be stopped for an interruption.'
    )
  }
  if (innings.wicketsLost === 0 && innings.legalBallsBowled === 0) {
    return err(
      'CANNOT_STOP_BEFORE_BATTING',
      'An innings cannot be stopped before any balls have been bowled.'
    )
  }

  return ok({
    ...innings,
    state: 'completed',
    currentBatters: undefined,
    currentBowlerId: undefined,
    interruptions: [...(innings.interruptions ?? []), { reason, timestamp: nowIso }],
  })
}
