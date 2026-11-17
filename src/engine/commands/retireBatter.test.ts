import { describe, expect, it } from 'vitest'
import { retireBatterHurt } from '@/engine/commands/retireBatter'
import { bowlBall, freshInnings, t20Profile } from '@/engine/test/engineTestHelpers'
import { checkInningsInvariants } from '@/engine/calculations/checkInvariants'

describe('retireBatterHurt', () => {
  const rulesProfile = t20Profile()

  it('replaces the retiring batter at their end with the incoming batter', () => {
    let innings = freshInnings()
    innings = bowlBall(innings, rulesProfile, { bowlerForNewOver: 'bowler1', runs: 0 })

    const result = retireBatterHurt(
      innings,
      rulesProfile,
      'p1',
      'p3',
      '2026-11-15T00:00:00.000Z'
    )
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.currentBatters).toEqual({ striker: 'p3', nonStriker: 'p2' })
    expect(result.value.batterInnings['p1']?.state).toBe('retired-hurt')
    expect(checkInningsInvariants(result.value, rulesProfile)).toEqual([])
  })

  it('replaces the non-striker correctly when they retire', () => {
    let innings = freshInnings()
    innings = bowlBall(innings, rulesProfile, { bowlerForNewOver: 'bowler1', runs: 0 })

    const result = retireBatterHurt(
      innings,
      rulesProfile,
      'p2',
      'p3',
      '2026-11-15T00:00:00.000Z'
    )
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.currentBatters).toEqual({ striker: 'p1', nonStriker: 'p3' })
  })

  it('rejects retiring a player who is not currently at the crease', () => {
    let innings = freshInnings()
    innings = bowlBall(innings, rulesProfile, { bowlerForNewOver: 'bowler1', runs: 0 })

    const result = retireBatterHurt(
      innings,
      rulesProfile,
      'not-batting',
      'p3',
      '2026-11-15T00:00:00.000Z'
    )
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error.code).toBe('INVALID_RETIRING_PLAYER')
  })

  it('rejects an incoming batter who is already at the crease', () => {
    let innings = freshInnings()
    innings = bowlBall(innings, rulesProfile, { bowlerForNewOver: 'bowler1', runs: 0 })

    const result = retireBatterHurt(
      innings,
      rulesProfile,
      'p1',
      'p2',
      '2026-11-15T00:00:00.000Z'
    )
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error.code).toBe('INVALID_INCOMING_PLAYER')
  })

  it('records a return when the incoming batter already has an open retirement', () => {
    let innings = freshInnings()
    innings = bowlBall(innings, rulesProfile, { bowlerForNewOver: 'bowler1', runs: 0 })

    const retireResult = retireBatterHurt(
      innings,
      rulesProfile,
      'p1',
      'p3',
      '2026-11-15T00:00:00.000Z'
    )
    expect(retireResult.ok).toBe(true)
    if (!retireResult.ok) return
    innings = retireResult.value

    // p2 retires too, bringing on a fresh batter p4.
    const secondRetireResult = retireBatterHurt(
      innings,
      rulesProfile,
      'p2',
      'p4',
      '2026-11-15T00:00:00.000Z'
    )
    expect(secondRetireResult.ok).toBe(true)
    if (!secondRetireResult.ok) return
    innings = secondRetireResult.value

    // p1 (retired hurt earlier) now returns in place of p4.
    const returnResult = retireBatterHurt(
      innings,
      rulesProfile,
      'p4',
      'p1',
      '2026-11-15T00:00:00.000Z'
    )
    expect(returnResult.ok).toBe(true)
    if (!returnResult.ok) return

    expect(returnResult.value.currentBatters).toEqual({ striker: 'p3', nonStriker: 'p1' })
    expect(returnResult.value.batterInnings['p1']?.state).toBe('batting')
    const retirementTypes = returnResult.value.retirements
      .filter((r) => r.playerId === 'p1')
      .map((r) => r.type)
    expect(retirementTypes).toEqual(['retired-hurt', 'return'])
    expect(checkInningsInvariants(returnResult.value, rulesProfile)).toEqual([])
  })

  it('rejects retiring when the innings is not in progress', () => {
    const innings = { ...freshInnings(), state: 'completed' as const }
    const result = retireBatterHurt(
      innings,
      rulesProfile,
      'p1',
      'p3',
      '2026-11-15T00:00:00.000Z'
    )
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error.code).toBe('INNINGS_NOT_IN_PROGRESS')
  })

  it('does not mutate the original innings on success', () => {
    let innings = freshInnings()
    innings = bowlBall(innings, rulesProfile, { bowlerForNewOver: 'bowler1', runs: 0 })
    const before = innings.currentBatters
    retireBatterHurt(innings, rulesProfile, 'p1', 'p3', '2026-11-15T00:00:00.000Z')
    expect(innings.currentBatters).toEqual(before)
  })
})
