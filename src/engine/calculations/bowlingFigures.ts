import type { Delivery } from '@/domain/delivery/types'
import { isLegalDelivery, runsConcededByBowler } from '@/domain/delivery/types'
import type { BowlerFigures } from '@/domain/innings/types'
import { emptyBowlerFigures } from '@/domain/innings/types'
import type { RulesProfile } from '@/engine/rules/types'

/**
 * Recomputes every bowler's figures from the authoritative delivery list,
 * including maiden overs (an over in which the bowler conceded zero runs
 * across the ball-per-over count defined by the rules profile — penalty
 * runs awarded independently of a delivery do not count against a maiden
 * since they are not attributable to any specific over).
 */
export function computeBowlerFigures(
  deliveries: Delivery[],
  rulesProfile: RulesProfile
): Record<string, BowlerFigures> {
  const result: Record<string, BowlerFigures> = {}

  function ensureBowler(playerId: string): BowlerFigures {
    let entry = result[playerId]
    if (!entry) {
      entry = emptyBowlerFigures(playerId)
      result[playerId] = entry
    }
    return entry
  }

  const runsConcededByOverAndBowler = new Map<string, number>()

  for (const delivery of deliveries) {
    const bowler = ensureBowler(delivery.bowlerId)
    const conceded = runsConcededByBowler(delivery)
    bowler.runsConceded += conceded

    if (delivery.extras.wides > 0) bowler.wides += delivery.extras.wides
    if (delivery.extras.noBallRuns > 0) bowler.noBalls += 1

    if (isLegalDelivery(delivery)) {
      bowler.legalBallsBowled += 1
    }

    if (delivery.dismissal?.creditsBowler) {
      bowler.wickets += 1
    }

    const overKey = `${delivery.bowlerId}:${delivery.overNumber}`
    runsConcededByOverAndBowler.set(
      overKey,
      (runsConcededByOverAndBowler.get(overKey) ?? 0) + conceded
    )
  }

  const ballsPerOverByBowlerOver = new Map<string, number>()
  for (const delivery of deliveries) {
    if (!isLegalDelivery(delivery)) continue
    const overKey = `${delivery.bowlerId}:${delivery.overNumber}`
    ballsPerOverByBowlerOver.set(
      overKey,
      (ballsPerOverByBowlerOver.get(overKey) ?? 0) + 1
    )
  }

  for (const [overKey, runsConceded] of runsConcededByOverAndBowler) {
    const [bowlerId] = overKey.split(':')
    const legalBallsInOver = ballsPerOverByBowlerOver.get(overKey) ?? 0
    if (runsConceded === 0 && legalBallsInOver === rulesProfile.ballsPerOver) {
      const bowler = ensureBowler(bowlerId!)
      bowler.maidens += 1
    }
  }

  return result
}
