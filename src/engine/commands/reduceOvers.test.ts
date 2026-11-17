import { describe, expect, it } from 'vitest'
import { reduceInningsOvers } from '@/engine/commands/reduceOvers'
import { bowlBall, freshInnings, t20Profile } from '@/engine/test/engineTestHelpers'

describe('reduceInningsOvers', () => {
  const rulesProfile = t20Profile()

  it('reduces the overs allocation and records the interruption', () => {
    let innings = freshInnings()
    innings = bowlBall(innings, rulesProfile, { bowlerForNewOver: 'bowler1', runs: 1 })

    const result = reduceInningsOvers(
      innings,
      rulesProfile,
      15,
      'Rain delay',
      '2026-11-15T00:00:00.000Z'
    )
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.oversAllocated).toBe(15)
    expect(result.value.interruptions).toHaveLength(1)
    expect(result.value.interruptions?.[0]).toMatchObject({
      reason: 'Rain delay',
      revisedOversAllocated: 15,
    })
  })

  it('rejects a non-positive or non-integer overs value', () => {
    const innings = freshInnings()
    const result = reduceInningsOvers(innings, rulesProfile, 0, 'Rain', '2026-11-15T00:00:00.000Z')
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error.code).toBe('INVALID_OVERS_ALLOCATION')
  })

  it('rejects an allocation that is not actually a reduction', () => {
    const innings = freshInnings()
    const result = reduceInningsOvers(
      innings,
      rulesProfile,
      20,
      'Rain',
      '2026-11-15T00:00:00.000Z'
    )
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error.code).toBe('OVERS_NOT_REDUCED')
  })

  it('rejects a reduction below the overs already bowled', () => {
    let innings = freshInnings()
    for (let i = 0; i < 4; i++) {
      innings = bowlBall(innings, rulesProfile, { bowlerForNewOver: 'bowler1', runs: 0 })
      for (let b = 0; b < 5; b++) {
        innings = bowlBall(innings, rulesProfile, { runs: 0 })
      }
      innings = bowlBall(innings, rulesProfile, { bowlerForNewOver: 'bowler2', runs: 0 })
      for (let b = 0; b < 5; b++) {
        innings = bowlBall(innings, rulesProfile, { runs: 0 })
      }
    }
    // 8 overs bowled; try to reduce below that.
    const result = reduceInningsOvers(
      innings,
      rulesProfile,
      5,
      'Rain',
      '2026-11-15T00:00:00.000Z'
    )
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error.code).toBe('OVERS_BELOW_BALLS_BOWLED')
  })

  it('rejects reducing a completed innings', () => {
    const innings = { ...freshInnings(), state: 'completed' as const }
    const result = reduceInningsOvers(
      innings,
      rulesProfile,
      10,
      'Rain',
      '2026-11-15T00:00:00.000Z'
    )
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error.code).toBe('INNINGS_NOT_IN_PROGRESS')
  })
})
