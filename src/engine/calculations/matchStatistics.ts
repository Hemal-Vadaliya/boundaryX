import type { Innings } from '@/domain/innings/types'
import { totalRunsOffDelivery } from '@/domain/delivery/types'
import { computeInningsTotals } from '@/engine/calculations/inningsTotals'
import { computePartnerships } from '@/engine/calculations/partnerships'

export interface MatchStatistics {
  totalRuns: number
  totalWickets: number
  totalOversBowled: number
  totalBoundaries: { fours: number; sixes: number }
  totalExtras: number
  highestPartnership?: { batterAId: string; batterBId: string; runs: number }
  topScorer?: { playerId: string; runs: number }
  bestBowling?: { playerId: string; wickets: number; runsConceded: number }
}

/**
 * Aggregates statistics across every innings of a match from the
 * authoritative delivery/figures records — never a separately maintained
 * running total.
 */
export function computeMatchStatistics(
  innings: Innings[],
  ballsPerOver: number
): MatchStatistics {
  let totalRuns = 0
  let totalWickets = 0
  let totalLegalBalls = 0
  let fours = 0
  let sixes = 0
  let totalExtras = 0
  let highestPartnership: MatchStatistics['highestPartnership']
  let topScorer: MatchStatistics['topScorer']
  let bestBowling: MatchStatistics['bestBowling']

  for (const oneInnings of innings) {
    const totals = computeInningsTotals(oneInnings.deliveries)
    totalRuns += totals.runs
    totalWickets += totals.wickets
    totalLegalBalls += totals.legalBallsBowled

    for (const delivery of oneInnings.deliveries) {
      if (delivery.batterRuns === 4) fours += 1
      if (delivery.batterRuns === 6) sixes += 1
      totalExtras += totalRunsOffDelivery(delivery) - delivery.batterRuns
    }

    for (const partnership of computePartnerships(oneInnings.deliveries)) {
      if (
        partnership.batterBId &&
        (!highestPartnership || partnership.runs > highestPartnership.runs)
      ) {
        highestPartnership = {
          batterAId: partnership.batterAId,
          batterBId: partnership.batterBId,
          runs: partnership.runs,
        }
      }
    }

    for (const batter of Object.values(oneInnings.batterInnings)) {
      if (!topScorer || batter.runs > topScorer.runs) {
        topScorer = { playerId: batter.playerId, runs: batter.runs }
      }
    }

    for (const bowler of Object.values(oneInnings.bowlerFigures)) {
      if (
        !bestBowling ||
        bowler.wickets > bestBowling.wickets ||
        (bowler.wickets === bestBowling.wickets &&
          bowler.runsConceded < bestBowling.runsConceded)
      ) {
        bestBowling = {
          playerId: bowler.playerId,
          wickets: bowler.wickets,
          runsConceded: bowler.runsConceded,
        }
      }
    }
  }

  return {
    totalRuns,
    totalWickets,
    totalOversBowled: totalLegalBalls / ballsPerOver,
    totalBoundaries: { fours, sixes },
    totalExtras,
    highestPartnership,
    topScorer,
    bestBowling,
  }
}
