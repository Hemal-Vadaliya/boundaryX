import { describe, expect, it } from 'vitest'
import { editLastDelivery } from '@/engine/commands/editLastDelivery'
import { bowlBall, freshInnings, t20Profile } from '@/engine/test/engineTestHelpers'
import { checkInningsInvariants } from '@/engine/calculations/checkInvariants'

describe('editLastDelivery', () => {
  const rulesProfile = t20Profile()

  it('rejects editing when nothing has been recorded yet', () => {
    const innings = freshInnings()
    const result = editLastDelivery(
      innings,
      rulesProfile,
      { bowlerId: 'bowler1', batterRuns: 1, extras: {}, outcome: 'legal' },
      'p1',
      'p2',
      (i) => `edit-${i}`,
      '2026-11-15T00:00:00.000Z'
    )
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error.code).toBe('NOTHING_TO_EDIT')
  })

  it('corrects the runs on the last delivery and recomputes totals', () => {
    let innings = freshInnings()
    innings = bowlBall(innings, rulesProfile, { bowlerForNewOver: 'bowler1', runs: 1 })
    innings = bowlBall(innings, rulesProfile, { runs: 1 })

    const result = editLastDelivery(
      innings,
      rulesProfile,
      { bowlerId: 'bowler1', batterRuns: 4, extras: {}, outcome: 'legal' },
      'p1',
      'p2',
      (i) => `edit-${i}`,
      '2026-11-15T00:00:00.000Z'
    )
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.deliveries[1]?.batterRuns).toBe(4)
    expect(checkInningsInvariants(result.value, rulesProfile)).toEqual([])
  })

  it('appends an audit-trail entry preserving the original delivery', () => {
    let innings = freshInnings()
    innings = bowlBall(innings, rulesProfile, { bowlerForNewOver: 'bowler1', runs: 0 })
    const originalDelivery = innings.deliveries[0]!

    const result = editLastDelivery(
      innings,
      rulesProfile,
      { bowlerId: 'bowler1', batterRuns: 6, extras: {}, outcome: 'legal' },
      'p1',
      'p2',
      (i) => `edit-${i}`,
      '2026-11-15T00:00:00.000Z',
      'Scorer mis-tapped the run value'
    )
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.corrections).toHaveLength(1)
    const correction = result.value.corrections[0]!
    expect(correction.originalDelivery).toEqual(originalDelivery)
    expect(correction.reason).toBe('Scorer mis-tapped the run value')
    expect(correction.correctedDeliveryId).toBe(result.value.deliveries[0]?.id)
  })

  it('can turn a dot ball into a wicket', () => {
    let innings = freshInnings()
    innings = bowlBall(innings, rulesProfile, { bowlerForNewOver: 'bowler1', runs: 0 })

    const result = editLastDelivery(
      innings,
      rulesProfile,
      {
        bowlerId: 'bowler1',
        batterRuns: 0,
        extras: {},
        outcome: 'legal',
        dismissal: { type: 'bowled', dismissedPlayerId: 'p1', dismissedEnd: 'striker' },
        incomingBatterId: 'p3',
      },
      'p1',
      'p2',
      (i) => `edit-${i}`,
      '2026-11-15T00:00:00.000Z'
    )
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.wicketsLost).toBe(1)
    expect(checkInningsInvariants(result.value, rulesProfile)).toEqual([])
  })

  it('does not mutate the original innings document on success', () => {
    let innings = freshInnings()
    innings = bowlBall(innings, rulesProfile, { bowlerForNewOver: 'bowler1', runs: 1 })
    const deliveriesBefore = innings.deliveries

    editLastDelivery(
      innings,
      rulesProfile,
      { bowlerId: 'bowler1', batterRuns: 6, extras: {}, outcome: 'legal' },
      'p1',
      'p2',
      (i) => `edit-${i}`,
      '2026-11-15T00:00:00.000Z'
    )

    expect(innings.deliveries).toBe(deliveriesBefore)
    expect(innings.deliveries[0]?.batterRuns).toBe(1)
    expect(innings.corrections).toHaveLength(0)
  })
})
