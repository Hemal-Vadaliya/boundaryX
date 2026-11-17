import type { Innings } from '@/domain/innings/types'
import type { RulesProfile } from '@/engine/rules/types'
import { totalRunsOffDelivery } from '@/domain/delivery/types'

export type InningsEndReason =
  'all-out' | 'overs-completed' | 'target-achieved' | 'declared' | 'forfeited'

export interface InningsCompletionCheck {
  shouldEnd: boolean
  reason?: InningsEndReason
}

/**
 * Determines whether an innings has reached a natural conclusion, checked
 * after every delivery. Does not itself mutate anything — callers combine
 * this with endInnings to transition state.
 */
export function checkInningsCompletion(
  innings: Innings,
  rulesProfile: RulesProfile,
  maxWicketsBeforeAllOut: number
): InningsCompletionCheck {
  if (innings.declared) {
    return { shouldEnd: true, reason: 'declared' }
  }

  if (innings.wicketsLost >= maxWicketsBeforeAllOut) {
    return { shouldEnd: true, reason: 'all-out' }
  }

  const effectiveOversAllocated = innings.oversAllocated ?? rulesProfile.oversPerInnings
  if (
    effectiveOversAllocated !== undefined &&
    innings.legalBallsBowled >= effectiveOversAllocated * rulesProfile.ballsPerOver
  ) {
    return { shouldEnd: true, reason: 'overs-completed' }
  }

  if (innings.target !== undefined) {
    const totalRuns = innings.deliveries.reduce(
      (sum, d) => sum + totalRunsOffDelivery(d),
      0
    )
    if (totalRuns >= innings.target) {
      return { shouldEnd: true, reason: 'target-achieved' }
    }
  }

  return { shouldEnd: false }
}
