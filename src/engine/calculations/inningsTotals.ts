import type { Delivery } from '@/domain/delivery/types'
import { isLegalDelivery, totalRunsOffDelivery } from '@/domain/delivery/types'

export interface InningsTotals {
  runs: number
  wickets: number
  legalBallsBowled: number
}

export function computeInningsTotals(deliveries: Delivery[]): InningsTotals {
  let runs = 0
  let wickets = 0
  let legalBallsBowled = 0

  for (const delivery of deliveries) {
    runs += totalRunsOffDelivery(delivery)
    if (delivery.dismissal) wickets += 1
    if (isLegalDelivery(delivery)) legalBallsBowled += 1
  }

  return { runs, wickets, legalBallsBowled }
}
