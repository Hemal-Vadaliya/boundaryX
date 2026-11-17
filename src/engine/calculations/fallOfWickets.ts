import type { Delivery } from '@/domain/delivery/types'
import { totalRunsOffDelivery, isLegalDelivery } from '@/domain/delivery/types'
import type { FallOfWicket } from '@/domain/innings/types'
import { formatOvers } from '@/engine/scoring/overCalculator'

export function computeFallOfWickets(
  deliveries: Delivery[],
  ballsPerOver: number
): FallOfWicket[] {
  const fallOfWickets: FallOfWicket[] = []
  let runningTotal = 0
  let legalBallsBowled = 0

  for (const delivery of deliveries) {
    runningTotal += totalRunsOffDelivery(delivery)
    if (isLegalDelivery(delivery)) legalBallsBowled += 1

    if (delivery.dismissal) {
      fallOfWickets.push({
        wicketNumber: fallOfWickets.length + 1,
        playerId: delivery.dismissal.dismissedPlayerId,
        teamScoreAtFall: runningTotal,
        oversAtFall: formatOvers(legalBallsBowled, ballsPerOver),
      })
    }
  }

  return fallOfWickets
}
