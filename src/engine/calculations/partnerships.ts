import type { Delivery } from '@/domain/delivery/types'
import { totalRunsOffDelivery } from '@/domain/delivery/types'
import type { Partnership } from '@/domain/innings/types'

/**
 * Computes partnerships from the delivery list. A partnership covers every
 * delivery bowled while the same two batters were at the crease (runs
 * added to the team total, not just batter runs — byes/extras count too)
 * and ends when either of them is dismissed.
 */
export function computePartnerships(deliveries: Delivery[]): Partnership[] {
  const partnerships: Partnership[] = []
  let current: Partnership | null = null
  let wicketCount = 0

  function pairKeyFor(batterAId: string, batterBId?: string): string {
    return [batterAId, batterBId].filter((id): id is string => !!id).sort().join(':')
  }

  for (const delivery of deliveries) {
    const pairKey = pairKeyFor(delivery.strikerIdBefore, delivery.nonStrikerIdBefore)

    if (!current || pairKeyFor(current.batterAId, current.batterBId) !== pairKey) {
      current = {
        batterAId: delivery.strikerIdBefore,
        batterBId: delivery.nonStrikerIdBefore,
        runs: 0,
        ballsFaced: 0,
      }
      partnerships.push(current)
    }

    current.runs += totalRunsOffDelivery(delivery)
    if (delivery.outcome !== 'wide') current.ballsFaced += 1

    if (delivery.dismissal) {
      wicketCount += 1
      current.endedAtWicket = wicketCount
    }
  }

  return partnerships
}
