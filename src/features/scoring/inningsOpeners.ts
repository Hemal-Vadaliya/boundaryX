import type { Innings } from '@/domain/innings/types'

/**
 * The two batters who opened this innings — fixed for its lifetime and
 * needed whenever a correction command replays the innings from scratch.
 * Derived from the first delivery's "before" state when deliveries exist,
 * or from the current batters when none have been bowled yet. An innings
 * always starts with two openers (last-man-stands only arises later, once
 * wickets have fallen), so nonStriker is guaranteed defined here even
 * though the type is optional for later deliveries.
 */
export function getOpeningBatters(innings: Innings): {
  striker: string
  nonStriker: string
} {
  const opening = innings.deliveries[0]
    ? {
        striker: innings.deliveries[0].strikerIdBefore,
        nonStriker: innings.deliveries[0].nonStrikerIdBefore,
      }
    : innings.currentBatters

  if (!opening?.nonStriker) {
    throw new Error(
      'getOpeningBatters: innings has no deliveries and no current batters set'
    )
  }
  return { striker: opening.striker, nonStriker: opening.nonStriker }
}
