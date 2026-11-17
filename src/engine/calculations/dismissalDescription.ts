import type { Delivery } from '@/domain/delivery/types'
import type { BatterInnings } from '@/domain/innings/types'
import type { Player } from '@/domain/player/types'

function playerName(findPlayer: (id: string) => Player | undefined, id: string): string {
  return findPlayer(id)?.name ?? id
}

/**
 * Builds the standard scorecard dismissal string (e.g. "c Smith b Jones",
 * "lbw b Jones", "run out (Smith)", "not out") for one batter from the
 * delivery that dismissed them, falling back to their batting state when
 * there was no delivery (retired hurt, did not bat, etc).
 */
export function describeDismissal(
  batterInnings: BatterInnings | undefined,
  dismissingDelivery: Delivery | undefined,
  findPlayer: (id: string) => Player | undefined
): string {
  if (!batterInnings || batterInnings.state === 'did-not-bat') return 'did not bat'
  if (batterInnings.state === 'retired-hurt') return 'retired hurt'
  if (batterInnings.state === 'batting' || batterInnings.state === 'not-out')
    return 'not out'

  const dismissal = dismissingDelivery?.dismissal
  if (!dismissal) return 'out'

  const bowlerName = playerName(findPlayer, dismissingDelivery.bowlerId)
  const fielderName = dismissal.fielderId
    ? playerName(findPlayer, dismissal.fielderId)
    : undefined

  switch (dismissal.type) {
    case 'bowled':
      return `b ${bowlerName}`
    case 'caught':
      return fielderName ? `c ${fielderName} b ${bowlerName}` : `c & b ${bowlerName}`
    case 'caught-and-bowled':
      return `c & b ${bowlerName}`
    case 'lbw':
      return `lbw b ${bowlerName}`
    case 'stumped':
      return fielderName ? `st ${fielderName} b ${bowlerName}` : `st b ${bowlerName}`
    case 'hit-wicket':
      return `hit wicket b ${bowlerName}`
    case 'run-out':
      return fielderName ? `run out (${fielderName})` : 'run out'
    case 'obstructing-the-field':
      return 'obstructing the field'
    case 'hit-ball-twice':
      return 'hit the ball twice'
    case 'timed-out':
      return 'timed out'
    case 'retired-out':
      return 'retired out'
  }
}

/** Finds the delivery that dismissed a given player, if any, within one innings. */
export function findDismissingDelivery(
  deliveries: Delivery[],
  playerId: string
): Delivery | undefined {
  return deliveries.find((d) => d.dismissal?.dismissedPlayerId === playerId)
}
