import { describe, expect, it } from 'vitest'
import { stopInningsForInterruption } from '@/engine/commands/stopInningsForInterruption'
import { bowlBall, freshInnings, t20Profile } from '@/engine/test/engineTestHelpers'

describe('stopInningsForInterruption', () => {
  const rulesProfile = t20Profile()

  it('completes the innings and records the interruption', () => {
    let innings = freshInnings()
    innings = bowlBall(innings, rulesProfile, { bowlerForNewOver: 'bowler1', runs: 4 })

    const result = stopInningsForInterruption(innings, 'Rain', '2026-11-15T00:00:00.000Z')
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.state).toBe('completed')
    expect(result.value.currentBatters).toBeUndefined()
    expect(result.value.currentBowlerId).toBeUndefined()
    expect(result.value.interruptions).toHaveLength(1)
    expect(result.value.interruptions?.[0]?.reason).toBe('Rain')
  })

  it('rejects stopping an innings that has not started batting', () => {
    const innings = freshInnings()
    const result = stopInningsForInterruption(innings, 'Rain', '2026-11-15T00:00:00.000Z')
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error.code).toBe('CANNOT_STOP_BEFORE_BATTING')
  })

  it('rejects stopping an innings that is not in progress', () => {
    const innings = { ...freshInnings(), state: 'completed' as const }
    const result = stopInningsForInterruption(innings, 'Rain', '2026-11-15T00:00:00.000Z')
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error.code).toBe('INNINGS_NOT_IN_PROGRESS')
  })
})
