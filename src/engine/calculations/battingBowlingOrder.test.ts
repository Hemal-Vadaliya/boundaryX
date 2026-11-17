import { describe, expect, it } from 'vitest'
import {
  getBattingOrder,
  getBowlingOrder,
} from '@/engine/calculations/battingBowlingOrder'
import { bowlBall, freshInnings, t20Profile } from '@/engine/test/engineTestHelpers'

describe('getBattingOrder', () => {
  it('lists batters in the order they came to the crease', () => {
    const rulesProfile = t20Profile()
    let innings = freshInnings()
    innings = bowlBall(innings, rulesProfile, {
      bowlerForNewOver: 'bowler1',
      dismissal: { type: 'bowled', dismissedPlayerId: 'p1', dismissedEnd: 'striker' },
      incomingBatterId: 'p3',
    })
    expect(getBattingOrder(innings)).toEqual(['p1', 'p2', 'p3'])
  })
})

describe('getBowlingOrder', () => {
  it('lists bowlers in the order they first bowled', () => {
    const rulesProfile = t20Profile()
    let innings = freshInnings()
    innings = bowlBall(innings, rulesProfile, { bowlerForNewOver: 'bowler1', runs: 1 })
    for (let i = 0; i < 5; i++) {
      innings = bowlBall(innings, rulesProfile, { runs: 1 })
    }
    innings = bowlBall(innings, rulesProfile, { bowlerForNewOver: 'bowler2', runs: 1 })
    expect(getBowlingOrder(innings)).toEqual(['bowler1', 'bowler2'])
  })
})
