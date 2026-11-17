import type { Innings } from '@/domain/innings/types'
import type { RulesProfile } from '@/engine/rules/types'
import type { EngineResult } from '@/engine/engineResult'
import { ok, err } from '@/engine/engineResult'

/**
 * Reduces an innings' overs allocation mid-match (e.g. a rain delay that
 * shortens, but doesn't end, the innings). The innings continues — its
 * target (if this is the chasing side) is recalculated by the caller via
 * the DLS engine and passed in separately; this command only records the
 * revised allocation and the interruption audit entry.
 */
export function reduceInningsOvers(
  innings: Innings,
  rulesProfile: RulesProfile,
  newOversAllocated: number,
  reason: string,
  nowIso: string
): EngineResult<Innings> {
  if (innings.state !== 'in-progress') {
    return err(
      'INNINGS_NOT_IN_PROGRESS',
      'Overs can only be reduced while the innings is in progress.'
    )
  }
  if (!Number.isInteger(newOversAllocated) || newOversAllocated <= 0) {
    return err('INVALID_OVERS_ALLOCATION', 'The revised overs allocation must be a positive whole number.')
  }

  const currentAllocation = innings.oversAllocated ?? rulesProfile.oversPerInnings
  if (currentAllocation !== undefined && newOversAllocated >= currentAllocation) {
    return err(
      'OVERS_NOT_REDUCED',
      'The revised overs allocation must be fewer than the innings currently has.'
    )
  }

  const legalBallsAlreadyBowled = innings.legalBallsBowled
  if (newOversAllocated * rulesProfile.ballsPerOver < legalBallsAlreadyBowled) {
    return err(
      'OVERS_BELOW_BALLS_BOWLED',
      'The revised overs allocation cannot be fewer than the overs already bowled in this innings.'
    )
  }

  return ok({
    ...innings,
    oversAllocated: newOversAllocated,
    interruptions: [
      ...(innings.interruptions ?? []),
      { reason, revisedOversAllocated: newOversAllocated, timestamp: nowIso },
    ],
  })
}
