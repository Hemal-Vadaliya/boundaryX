import type { Delivery } from '@/domain/delivery/types'
import { totalRunsOffDelivery } from '@/domain/delivery/types'
import type { PowerplayPhase } from '@/engine/rules/types'

export interface PowerplayTotal {
  phase: PowerplayPhase
  runs: number
  wickets: number
}

export function computePowerplayTotals(
  deliveries: Delivery[],
  powerplays: PowerplayPhase[]
): PowerplayTotal[] {
  return powerplays.map((phase) => {
    const phaseDeliveries = deliveries.filter(
      (d) => d.overNumber >= phase.startOver && d.overNumber <= phase.endOver
    )
    return {
      phase,
      runs: phaseDeliveries.reduce((sum, d) => sum + totalRunsOffDelivery(d), 0),
      wickets: phaseDeliveries.filter((d) => d.dismissal).length,
    }
  })
}
