import type { Delivery } from '@/domain/delivery/types'
import type { BatterInnings } from '@/domain/innings/types'
import { emptyBatterInnings } from '@/domain/innings/types'

/**
 * Recomputes every batter's figures from the authoritative delivery list.
 * Never incrementally mutated — always derived fresh so a replay of the
 * same deliveries reproduces the exact same figures.
 */
export function computeBatterInnings(
  deliveries: Delivery[]
): Record<string, BatterInnings> {
  const result: Record<string, BatterInnings> = {}
  let nextPosition = 1

  function ensurePlayer(playerId: string): BatterInnings {
    let entry = result[playerId]
    if (!entry) {
      entry = {
        ...emptyBatterInnings(playerId),
        state: 'batting',
        battingPosition: nextPosition,
      }
      nextPosition += 1
      result[playerId] = entry
    }
    return entry
  }

  for (const delivery of deliveries) {
    const striker = ensurePlayer(delivery.strikerIdBefore)
    if (delivery.nonStrikerIdBefore) ensurePlayer(delivery.nonStrikerIdBefore)

    if (delivery.outcome !== 'wide') {
      striker.ballsFaced += 1
      striker.runs += delivery.batterRuns
      if (delivery.batterRuns === 4) striker.fours += 1
      if (delivery.batterRuns === 6) striker.sixes += 1
    }

    if (delivery.dismissal) {
      const dismissedId = delivery.dismissal.dismissedPlayerId
      const dismissedEntry = result[dismissedId] ?? ensurePlayer(dismissedId)
      dismissedEntry.state = 'out'
      if (delivery.incomingBatterId) {
        ensurePlayer(delivery.incomingBatterId)
      }
    }
  }

  return result
}
