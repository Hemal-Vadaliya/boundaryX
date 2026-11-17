import { describe, expect, it } from 'vitest'
import { computeMatchStatistics } from '@/engine/calculations/matchStatistics'
import { bowlBall, freshInnings, t20Profile } from '@/engine/test/engineTestHelpers'

describe('computeMatchStatistics', () => {
  const rulesProfile = t20Profile()

  it('aggregates runs, wickets, boundaries and extras across innings', () => {
    let innings = freshInnings()
    innings = bowlBall(innings, rulesProfile, { bowlerForNewOver: 'bowler1', runs: 4 })
    innings = bowlBall(innings, rulesProfile, { runs: 6 })
    innings = bowlBall(innings, rulesProfile, { extras: { byes: 2 } })

    const stats = computeMatchStatistics([innings], rulesProfile.ballsPerOver)
    expect(stats.totalRuns).toBe(12)
    expect(stats.totalBoundaries).toEqual({ fours: 1, sixes: 1 })
    expect(stats.totalExtras).toBe(2)
  })

  it('finds the highest partnership, top scorer and best bowling figures', () => {
    let innings = freshInnings()
    innings = bowlBall(innings, rulesProfile, { bowlerForNewOver: 'bowler1', runs: 4 })
    innings = bowlBall(innings, rulesProfile, {
      dismissal: {
        type: 'bowled',
        dismissedPlayerId: innings.currentBatters!.striker,
        dismissedEnd: 'striker',
      },
      incomingBatterId: 'p3',
    })
    innings = bowlBall(innings, rulesProfile, { runs: 2 })

    const stats = computeMatchStatistics([innings], rulesProfile.ballsPerOver)
    expect(stats.highestPartnership?.runs).toBe(4)
    expect(stats.topScorer).toEqual({ playerId: 'p1', runs: 4 })
    expect(stats.bestBowling).toEqual({
      playerId: 'bowler1',
      wickets: 1,
      runsConceded: 6,
    })
  })

  it('returns zeroed totals and no highlights for an empty match', () => {
    const stats = computeMatchStatistics([], 6)
    expect(stats.totalRuns).toBe(0)
    expect(stats.topScorer).toBeUndefined()
    expect(stats.bestBowling).toBeUndefined()
  })
})
