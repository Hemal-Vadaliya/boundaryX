import type { Innings } from '@/domain/innings/types'
import { totalRunsOffDelivery, isLegalDelivery } from '@/domain/delivery/types'
import { computeInningsTotals } from '@/engine/calculations/inningsTotals'
import { computeBatterInnings } from '@/engine/calculations/battingFigures'
import { computeBowlerFigures } from '@/engine/calculations/bowlingFigures'
import type { RulesProfile } from '@/engine/rules/types'

export interface InvariantViolation {
  code: string
  message: string
}

/**
 * Checks the invariants listed in the plan (section 17.3) against an
 * innings. Returns an empty array when everything reconciles.
 */
export function checkInningsInvariants(
  innings: Innings,
  rulesProfile: RulesProfile
): InvariantViolation[] {
  const violations: InvariantViolation[] = []

  const totals = computeInningsTotals(innings.deliveries)
  if (totals.wickets !== innings.wicketsLost) {
    violations.push({
      code: 'WICKETS_MISMATCH',
      message: `Cached wicketsLost (${innings.wicketsLost}) does not match recomputed wickets (${totals.wickets}).`,
    })
  }
  if (totals.legalBallsBowled !== innings.legalBallsBowled) {
    violations.push({
      code: 'LEGAL_BALLS_MISMATCH',
      message: `Cached legalBallsBowled (${innings.legalBallsBowled}) does not match recomputed count (${totals.legalBallsBowled}).`,
    })
  }

  const recomputedBatterInnings = computeBatterInnings(innings.deliveries)
  for (const [playerId, entry] of Object.entries(recomputedBatterInnings)) {
    const cached = innings.batterInnings[playerId]
    if (!cached || cached.runs !== entry.runs || cached.ballsFaced !== entry.ballsFaced) {
      violations.push({
        code: 'BATTER_FIGURES_MISMATCH',
        message: `Cached batting figures for ${playerId} do not match recomputed figures.`,
      })
    }
  }

  const recomputedBowlerFigures = computeBowlerFigures(innings.deliveries, rulesProfile)
  for (const [playerId, entry] of Object.entries(recomputedBowlerFigures)) {
    const cached = innings.bowlerFigures[playerId]
    if (
      !cached ||
      cached.runsConceded !== entry.runsConceded ||
      cached.wickets !== entry.wickets
    ) {
      violations.push({
        code: 'BOWLER_FIGURES_MISMATCH',
        message: `Cached bowling figures for ${playerId} do not match recomputed figures.`,
      })
    }
  }

  const expectedTeamTotal = innings.deliveries.reduce(
    (sum, d) => sum + totalRunsOffDelivery(d),
    0
  )
  if (expectedTeamTotal !== totals.runs) {
    violations.push({
      code: 'TEAM_TOTAL_MISMATCH',
      message: 'Team total does not reconcile with authoritative run events.',
    })
  }

  if (innings.currentBatters) {
    if (
      innings.currentBatters.nonStriker !== undefined &&
      innings.currentBatters.striker === innings.currentBatters.nonStriker
    ) {
      violations.push({
        code: 'SAME_PLAYER_BOTH_ENDS',
        message: 'A single player cannot occupy both batting ends simultaneously.',
      })
    }
    for (const playerId of [
      innings.currentBatters.striker,
      innings.currentBatters.nonStriker,
    ].filter((id): id is string => !!id)) {
      const entry = innings.batterInnings[playerId]
      if (entry?.state === 'out') {
        violations.push({
          code: 'DISMISSED_BATTER_STILL_ACTIVE',
          message: `${playerId} is recorded as out but is still listed as occupying an end.`,
        })
      }
    }
  }

  let computedLegalBalls = 0
  for (const delivery of innings.deliveries) {
    if (isLegalDelivery(delivery)) computedLegalBalls += 1
  }
  if (computedLegalBalls !== totals.legalBallsBowled) {
    violations.push({
      code: 'LEGAL_BALL_COUNT_INCONSISTENT',
      message: 'Legal-ball count does not equal the count of legal deliveries.',
    })
  }

  return violations
}
