import { describe, expect, it } from 'vitest'
import {
  describeDismissal,
  findDismissingDelivery,
} from '@/engine/calculations/dismissalDescription'
import { bowlBall, freshInnings, t20Profile } from '@/engine/test/engineTestHelpers'
import { createPlayer } from '@/domain/player/types'

const players = [
  createPlayer({ id: 'p1', name: 'Alice' }),
  createPlayer({ id: 'bowler1', name: 'Bob' }),
  createPlayer({ id: 'fielder1', name: 'Carol' }),
]
const findPlayer = (id: string) => players.find((p) => p.id === id)

describe('describeDismissal', () => {
  const rulesProfile = t20Profile()

  it('describes a bowled dismissal', () => {
    let innings = freshInnings()
    innings = bowlBall(innings, rulesProfile, {
      bowlerForNewOver: 'bowler1',
      dismissal: { type: 'bowled', dismissedPlayerId: 'p1', dismissedEnd: 'striker' },
      incomingBatterId: 'p3',
    })
    const delivery = findDismissingDelivery(innings.deliveries, 'p1')
    expect(describeDismissal(innings.batterInnings['p1'], delivery, findPlayer)).toBe(
      'b Bob'
    )
  })

  it('describes a caught dismissal with a fielder', () => {
    let innings = freshInnings()
    innings = bowlBall(innings, rulesProfile, {
      bowlerForNewOver: 'bowler1',
      dismissal: {
        type: 'caught',
        dismissedPlayerId: 'p1',
        dismissedEnd: 'striker',
        fielderId: 'fielder1',
      },
      incomingBatterId: 'p3',
    })
    const delivery = findDismissingDelivery(innings.deliveries, 'p1')
    expect(describeDismissal(innings.batterInnings['p1'], delivery, findPlayer)).toBe(
      'c Carol b Bob'
    )
  })

  it('describes a run-out with a fielder', () => {
    let innings = freshInnings()
    innings = bowlBall(innings, rulesProfile, {
      bowlerForNewOver: 'bowler1',
      dismissal: {
        type: 'run-out',
        dismissedPlayerId: 'p1',
        dismissedEnd: 'striker',
        fielderId: 'fielder1',
      },
      incomingBatterId: 'p3',
    })
    const delivery = findDismissingDelivery(innings.deliveries, 'p1')
    expect(describeDismissal(innings.batterInnings['p1'], delivery, findPlayer)).toBe(
      'run out (Carol)'
    )
  })

  it('reports not out for a batter still at the crease', () => {
    let innings = freshInnings()
    innings = bowlBall(innings, rulesProfile, { bowlerForNewOver: 'bowler1', runs: 1 })
    const delivery = findDismissingDelivery(innings.deliveries, 'p1')
    expect(describeDismissal(innings.batterInnings['p1'], delivery, findPlayer)).toBe(
      'not out'
    )
  })

  it('reports did not bat for a player with no batting entry', () => {
    expect(describeDismissal(undefined, undefined, findPlayer)).toBe('did not bat')
  })
})
