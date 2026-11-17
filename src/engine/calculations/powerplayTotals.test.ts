import { describe, expect, it } from 'vitest'
import { computePowerplayTotals } from '@/engine/calculations/powerplayTotals'
import { bowlBall, freshInnings, t20Profile } from '@/engine/test/engineTestHelpers'

describe('computePowerplayTotals', () => {
  it('sums runs and wickets within each powerplay phase', () => {
    const rulesProfile = t20Profile()
    let innings = freshInnings()
    innings = bowlBall(innings, rulesProfile, { bowlerForNewOver: 'bowler1', runs: 4 })
    for (let i = 0; i < 5; i++) {
      innings = bowlBall(innings, rulesProfile, { runs: 1 })
    }

    const totals = computePowerplayTotals(innings.deliveries, rulesProfile.powerplays)
    expect(totals[0]?.runs).toBe(9)
    expect(totals[0]?.wickets).toBe(0)
  })
})
