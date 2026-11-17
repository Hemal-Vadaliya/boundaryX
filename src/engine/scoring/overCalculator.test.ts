import { describe, expect, it } from 'vitest'
import {
  calculateOverProgress,
  formatOvers,
  validateBowlerEligibility,
} from '@/engine/scoring/overCalculator'
import { t20Profile } from '@/engine/test/engineTestHelpers'

describe('calculateOverProgress', () => {
  const rulesProfile = t20Profile()

  it('advances the ball-within-over count on a legal delivery', () => {
    const result = calculateOverProgress(
      { legalBallsBowledBefore: 0 },
      true,
      rulesProfile
    )
    expect(result).toEqual({
      overNumber: 0,
      ballWithinOver: 1,
      legalBallsBowledAfter: 1,
      overJustCompleted: false,
    })
  })

  it('does not advance the legal-ball count on a wide or no-ball', () => {
    const result = calculateOverProgress(
      { legalBallsBowledBefore: 3 },
      false,
      rulesProfile
    )
    expect(result.legalBallsBowledAfter).toBe(3)
    expect(result.overJustCompleted).toBe(false)
  })

  it('marks the over complete on the 6th legal ball', () => {
    const result = calculateOverProgress(
      { legalBallsBowledBefore: 5 },
      true,
      rulesProfile
    )
    expect(result.ballWithinOver).toBe(6)
    expect(result.overJustCompleted).toBe(true)
    expect(result.legalBallsBowledAfter).toBe(6)
  })

  it('moves to the next over number after completion', () => {
    const result = calculateOverProgress(
      { legalBallsBowledBefore: 6 },
      true,
      rulesProfile
    )
    expect(result.overNumber).toBe(1)
    expect(result.ballWithinOver).toBe(1)
  })

  it('respects a configurable balls-per-over for a custom profile', () => {
    const customProfile = { ...rulesProfile, ballsPerOver: 8 }
    const result = calculateOverProgress(
      { legalBallsBowledBefore: 7 },
      true,
      customProfile
    )
    expect(result.ballWithinOver).toBe(8)
    expect(result.overJustCompleted).toBe(true)
  })
})

describe('formatOvers', () => {
  it('formats a partial over as overs.balls', () => {
    expect(formatOvers(14, 6)).toBe('2.2')
  })

  it('formats a completed over with zero remainder', () => {
    expect(formatOvers(12, 6)).toBe('2.0')
  })

  it('formats zero balls bowled', () => {
    expect(formatOvers(0, 6)).toBe('0.0')
  })
})

describe('validateBowlerEligibility', () => {
  const rulesProfile = t20Profile()

  it('allows a bowler who did not bowl the previous over', () => {
    const result = validateBowlerEligibility({
      bowlerId: 'bowlerA',
      lastOverBowlerId: 'bowlerB',
      legalBallsBowledByBowler: 0,
      rulesProfile,
      isStartOfNewOver: true,
    })
    expect(result.eligible).toBe(true)
  })

  it('rejects a bowler attempting consecutive overs', () => {
    const result = validateBowlerEligibility({
      bowlerId: 'bowlerA',
      lastOverBowlerId: 'bowlerA',
      legalBallsBowledByBowler: 6,
      rulesProfile,
      isStartOfNewOver: true,
    })
    expect(result.eligible).toBe(false)
  })

  it('does not apply the consecutive-overs check mid-over', () => {
    const result = validateBowlerEligibility({
      bowlerId: 'bowlerA',
      lastOverBowlerId: 'bowlerA',
      legalBallsBowledByBowler: 6,
      rulesProfile,
      isStartOfNewOver: false,
    })
    expect(result.eligible).toBe(true)
  })

  it('rejects a bowler who has already bowled their maximum overs', () => {
    const result = validateBowlerEligibility({
      bowlerId: 'bowlerA',
      lastOverBowlerId: 'bowlerB',
      legalBallsBowledByBowler: 4 * rulesProfile.ballsPerOver,
      rulesProfile,
      isStartOfNewOver: true,
    })
    expect(result.eligible).toBe(false)
  })

  it('allows unlimited overs when the profile has no maxOversPerBowler', () => {
    const unlimitedProfile = { ...rulesProfile, maxOversPerBowler: undefined }
    const result = validateBowlerEligibility({
      bowlerId: 'bowlerA',
      lastOverBowlerId: 'bowlerB',
      legalBallsBowledByBowler: 100,
      rulesProfile: unlimitedProfile,
      isStartOfNewOver: true,
    })
    expect(result.eligible).toBe(true)
  })
})
