export type DismissalType =
  | 'bowled'
  | 'caught'
  | 'caught-and-bowled'
  | 'lbw'
  | 'run-out'
  | 'stumped'
  | 'hit-wicket'
  | 'hit-ball-twice'
  | 'obstructing-the-field'
  | 'timed-out'
  | 'retired-out'

export type BatterEnd = 'striker' | 'non-striker'

export interface DismissalRecord {
  type: DismissalType
  dismissedPlayerId: string
  /** The end the dismissed batter was occupying at the time of dismissal. */
  dismissedEnd: BatterEnd
  fielderId?: string
  assistingFielderId?: string
  /** Whether this dismissal credits the bowler (false for run-out, obstructing the field, etc). */
  creditsBowler: boolean
}

/**
 * Dismissal types that can legally occur off a no-ball under standard laws.
 * Run out, obstructing the field, hit the ball twice, retired out and timed
 * out remain possible on any delivery including a no-ball.
 */
const DISMISSALS_VALID_ON_NO_BALL: ReadonlySet<DismissalType> = new Set([
  'run-out',
  'obstructing-the-field',
  'hit-ball-twice',
  'retired-out',
  'timed-out',
])

/**
 * Dismissal types that can legally occur off a wide. Stumped and run out
 * remain possible; the rest require a legal/no-ball delivery to the bat.
 */
const DISMISSALS_VALID_ON_WIDE: ReadonlySet<DismissalType> = new Set([
  'run-out',
  'stumped',
  'obstructing-the-field',
  'retired-out',
  'timed-out',
])

export function isDismissalValidForOutcome(
  type: DismissalType,
  outcome: 'legal' | 'wide' | 'no-ball'
): boolean {
  if (outcome === 'legal') return true
  if (outcome === 'no-ball') return DISMISSALS_VALID_ON_NO_BALL.has(type)
  return DISMISSALS_VALID_ON_WIDE.has(type)
}

export function dismissalCreditsBowler(type: DismissalType): boolean {
  return (
    type === 'bowled' ||
    type === 'caught' ||
    type === 'caught-and-bowled' ||
    type === 'lbw' ||
    type === 'stumped' ||
    type === 'hit-wicket'
  )
}
