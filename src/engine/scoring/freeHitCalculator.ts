import type { RulesProfile } from '@/engine/rules/types'

/**
 * Computes whether the next delivery is a free hit. A free hit is only
 * ever possible when the profile enables it, and is triggered by a no-ball
 * — it persists across any intervening illegal (wide) deliveries until the
 * next legal delivery is bowled.
 */
export function calculateFreeHitAfterDelivery(
  rulesProfile: RulesProfile,
  outcome: 'legal' | 'wide' | 'no-ball',
  wasFreeHit: boolean
): boolean {
  if (!rulesProfile.freeHitEnabled) return false
  if (outcome === 'no-ball') return true
  if (outcome === 'wide') return wasFreeHit
  return false
}

/**
 * Dismissal types permitted to end a free-hit delivery. Under the
 * free-hit convention, only run out (and the always-available
 * batter-conduct dismissals) can dismiss a batter — bowled, caught, lbw,
 * stumped and hit-wicket are suspended because they all stem from the
 * delivery itself, which was already nullified by the preceding no-ball.
 */
const DISMISSALS_VALID_ON_FREE_HIT: ReadonlySet<string> = new Set([
  'run-out',
  'obstructing-the-field',
  'hit-ball-twice',
  'retired-out',
  'timed-out',
])

export function isDismissalValidOnFreeHit(dismissalType: string): boolean {
  return DISMISSALS_VALID_ON_FREE_HIT.has(dismissalType)
}
