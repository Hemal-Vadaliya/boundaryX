import { describe, expect, it } from 'vitest'
import { computeOverSummaries, isOverComplete } from '@/engine/calculations/overSummaries'
import { bowlBall, freshInnings, t20Profile } from '@/engine/test/engineTestHelpers'

describe('computeOverSummaries', () => {
  const rulesProfile = t20Profile()

  it('groups deliveries by over and tracks runs/wickets/running total', () => {
    let innings = freshInnings()
    innings = bowlBall(innings, rulesProfile, { bowlerForNewOver: 'bowler1', runs: 4 })
    innings = bowlBall(innings, rulesProfile, { runs: 1 })
    innings = bowlBall(innings, rulesProfile, { runs: 0 })
    innings = bowlBall(innings, rulesProfile, { runs: 0 })
    innings = bowlBall(innings, rulesProfile, { runs: 0 })
    innings = bowlBall(innings, rulesProfile, { runs: 1 })
    innings = bowlBall(innings, rulesProfile, { bowlerForNewOver: 'bowler2', runs: 6 })

    const summaries = computeOverSummaries(innings.deliveries)
    expect(summaries).toHaveLength(2)
    expect(summaries[0]).toMatchObject({
      overNumber: 0,
      bowlerId: 'bowler1',
      runs: 6,
      wickets: 0,
      teamTotalAfter: 6,
    })
    expect(summaries[1]).toMatchObject({
      overNumber: 1,
      bowlerId: 'bowler2',
      runs: 6,
      teamTotalAfter: 12,
    })
  })

  it('counts a wicket within its over', () => {
    let innings = freshInnings()
    innings = bowlBall(innings, rulesProfile, { bowlerForNewOver: 'bowler1', runs: 0 })
    innings = bowlBall(innings, rulesProfile, {
      dismissal: {
        type: 'bowled',
        dismissedPlayerId: innings.currentBatters!.striker,
        dismissedEnd: 'striker',
      },
      incomingBatterId: 'p3',
    })

    const summaries = computeOverSummaries(innings.deliveries)
    expect(summaries[0]?.wickets).toBe(1)
  })

  it('returns an empty array for no deliveries', () => {
    expect(computeOverSummaries([])).toEqual([])
  })
})

describe('isOverComplete', () => {
  const rulesProfile = t20Profile()

  it('is false before the 6th legal ball', () => {
    let innings = freshInnings()
    innings = bowlBall(innings, rulesProfile, { bowlerForNewOver: 'bowler1', runs: 0 })
    expect(isOverComplete(innings.deliveries, 0, rulesProfile.ballsPerOver)).toBe(false)
  })

  it('is true once 6 legal balls have been bowled in that over', () => {
    let innings = freshInnings()
    innings = bowlBall(innings, rulesProfile, { bowlerForNewOver: 'bowler1', runs: 0 })
    for (let i = 0; i < 5; i++) {
      innings = bowlBall(innings, rulesProfile, { runs: 0 })
    }
    expect(isOverComplete(innings.deliveries, 0, rulesProfile.ballsPerOver)).toBe(true)
  })

  it('does not count wides/no-balls toward completion', () => {
    let innings = freshInnings()
    innings = bowlBall(innings, rulesProfile, { bowlerForNewOver: 'bowler1', runs: 0 })
    for (let i = 0; i < 4; i++) {
      innings = bowlBall(innings, rulesProfile, { runs: 0 })
    }
    innings = bowlBall(innings, rulesProfile, { outcome: 'wide', extras: { wides: 1 } })
    expect(isOverComplete(innings.deliveries, 0, rulesProfile.ballsPerOver)).toBe(false)
  })
})
