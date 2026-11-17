import { describe, expect, it } from 'vitest'
import { recordDelivery } from '@/engine/commands/recordDelivery'
import { completeOver } from '@/engine/commands/completeOver'
import {
  freshInnings,
  t20Profile,
  bowlBall,
  nextTestId,
} from '@/engine/test/engineTestHelpers'
import { checkInningsInvariants } from '@/engine/calculations/checkInvariants'

describe('recordDelivery', () => {
  const rulesProfile = t20Profile()

  it('rejects a delivery when the innings is not in progress', () => {
    const innings = { ...freshInnings(), state: 'completed' as const }
    const result = recordDelivery(
      {
        innings,
        rulesProfile,
        nowIso: '2026-11-15T00:00:00.000Z',
        createDeliveryId: () => 'd1',
      },
      { bowlerId: 'bowler1', batterRuns: 1, extras: {}, outcome: 'legal' }
    )
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error.code).toBe('INNINGS_NOT_IN_PROGRESS')
  })

  it('does not mutate the original innings document on a rejected delivery', () => {
    const innings = freshInnings()
    const result = recordDelivery(
      {
        innings,
        rulesProfile,
        nowIso: '2026-11-15T00:00:00.000Z',
        createDeliveryId: () => 'd1',
      },
      { bowlerId: 'bowler1', batterRuns: 1, extras: { wides: 1 }, outcome: 'wide' }
    )
    expect(result.ok).toBe(false)
    expect(innings.deliveries).toHaveLength(0)
  })

  it('records a simple dot ball and advances the over state', () => {
    let innings = freshInnings()
    const overResult = completeOver(innings, rulesProfile, 'bowler1')
    expect(overResult.ok).toBe(true)
    if (!overResult.ok) return
    innings = overResult.value

    const result = recordDelivery(
      {
        innings,
        rulesProfile,
        nowIso: '2026-11-15T00:00:00.000Z',
        createDeliveryId: () => nextTestId('d'),
      },
      { bowlerId: 'bowler1', batterRuns: 0, extras: {}, outcome: 'legal' }
    )
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.legalBallsBowled).toBe(1)
    expect(result.value.deliveries).toHaveLength(1)
    expect(checkInningsInvariants(result.value, rulesProfile)).toEqual([])
  })

  it('rejects a bowler mismatch mid-over', () => {
    let innings = bowlBall(freshInnings(), rulesProfile, {
      bowlerForNewOver: 'bowler1',
      runs: 1,
    })
    const result = recordDelivery(
      {
        innings,
        rulesProfile,
        nowIso: '2026-11-15T00:00:00.000Z',
        createDeliveryId: () => 'd',
      },
      { bowlerId: 'bowler2', batterRuns: 0, extras: {}, outcome: 'legal' }
    )
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error.code).toBe('BOWLER_MISMATCH')
  })

  it('rejects a dismissal of a player not currently batting', () => {
    const innings = bowlBall(freshInnings(), rulesProfile, {
      bowlerForNewOver: 'bowler1',
    })
    const result = recordDelivery(
      {
        innings,
        rulesProfile,
        nowIso: '2026-11-15T00:00:00.000Z',
        createDeliveryId: () => 'd',
      },
      {
        bowlerId: 'bowler1',
        batterRuns: 0,
        extras: {},
        outcome: 'legal',
        dismissal: {
          type: 'bowled',
          dismissedPlayerId: 'not-batting',
          dismissedEnd: 'striker',
        },
      }
    )
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error.code).toBe('INVALID_DISMISSED_PLAYER')
  })

  it('clears currentBowlerId after the 6th legal ball, requiring completeOver before the next delivery', () => {
    let innings = freshInnings()
    innings = bowlBall(innings, rulesProfile, { bowlerForNewOver: 'bowler1', runs: 0 })
    for (let i = 0; i < 5; i++) {
      innings = bowlBall(innings, rulesProfile, { runs: 0 })
    }
    expect(innings.currentBowlerId).toBeUndefined()
    expect(innings.legalBallsBowled).toBe(6)
  })

  it('leaves currentBatters undefined (awaiting selection) when a wicket falls, a partner survives, and no incoming batter is given', () => {
    let innings = freshInnings()
    innings = bowlBall(innings, rulesProfile, { bowlerForNewOver: 'bowler1', runs: 0 })

    innings = bowlBall(innings, rulesProfile, {
      dismissal: {
        type: 'bowled',
        dismissedPlayerId: innings.currentBatters!.striker,
        dismissedEnd: 'striker',
      },
      // No incomingBatterId and no noFurtherBattersAvailable — the normal
      // case where a partner survives but the UI should prompt for who
      // comes in next, not silently continue with a broken batter state.
    })

    expect(innings.wicketsLost).toBe(1)
    expect(innings.currentBatters).toBeUndefined()
  })
})
