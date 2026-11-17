import type { Delivery } from '@/domain/delivery/types'
import { totalRunsOffDelivery, isLegalDelivery } from '@/domain/delivery/types'

export interface OverSummary {
  overNumber: number
  bowlerId: string
  runs: number
  wickets: number
  /** Running team total at the end of this over. */
  teamTotalAfter: number
}

/** Groups deliveries into completed overs for an over-by-over breakdown. An in-progress final over is included using whatever has been bowled so far. */
export function computeOverSummaries(deliveries: Delivery[]): OverSummary[] {
  const summaries: OverSummary[] = []
  let runningTotal = 0
  let currentOver: OverSummary | undefined

  for (const delivery of deliveries) {
    runningTotal += totalRunsOffDelivery(delivery)

    if (!currentOver || currentOver.overNumber !== delivery.overNumber) {
      currentOver = {
        overNumber: delivery.overNumber,
        bowlerId: delivery.bowlerId,
        runs: 0,
        wickets: 0,
        teamTotalAfter: runningTotal,
      }
      summaries.push(currentOver)
    }

    currentOver.runs += totalRunsOffDelivery(delivery)
    if (delivery.dismissal) currentOver.wickets += 1
    currentOver.teamTotalAfter = runningTotal
  }

  return summaries
}

export function isOverComplete(
  deliveries: Delivery[],
  overNumber: number,
  ballsPerOver: number
): boolean {
  const legalBallsInOver = deliveries.filter(
    (d) => d.overNumber === overNumber && isLegalDelivery(d)
  ).length
  return legalBallsInOver >= ballsPerOver
}
