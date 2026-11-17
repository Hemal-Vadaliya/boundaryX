import { describe, expect, it } from 'vitest'
import { validateAndBuildExtras } from '@/engine/scoring/extrasCalculator'
import { t20Profile } from '@/engine/test/engineTestHelpers'

describe('validateAndBuildExtras', () => {
  const rulesProfile = t20Profile()

  it('accepts a plain legal delivery with batter runs', () => {
    const result = validateAndBuildExtras({
      outcome: 'legal',
      batterRuns: 4,
      extras: {},
      rulesProfile,
    })
    expect(result.ok).toBe(true)
  })

  it('rejects a wide that also credits batter runs', () => {
    const result = validateAndBuildExtras({
      outcome: 'wide',
      batterRuns: 1,
      extras: { wides: 1 },
      rulesProfile,
    })
    expect(result.ok).toBe(false)
  })

  it('rejects a wide combined with byes', () => {
    const result = validateAndBuildExtras({
      outcome: 'wide',
      batterRuns: 0,
      extras: { wides: 1, byes: 1 },
      rulesProfile,
    })
    expect(result.ok).toBe(false)
  })

  it('requires at least one wide run on a wide delivery', () => {
    const result = validateAndBuildExtras({
      outcome: 'wide',
      batterRuns: 0,
      extras: {},
      rulesProfile,
    })
    expect(result.ok).toBe(false)
  })

  it('accepts a no-ball with the penalty run and batter runs', () => {
    const result = validateAndBuildExtras({
      outcome: 'no-ball',
      batterRuns: 4,
      extras: { noBallRuns: 1 },
      rulesProfile,
    })
    expect(result.ok).toBe(true)
  })

  it('rejects a no-ball that also carries byes alongside batter runs', () => {
    const result = validateAndBuildExtras({
      outcome: 'no-ball',
      batterRuns: 1,
      extras: { noBallRuns: 1, byes: 2 },
      rulesProfile,
    })
    expect(result.ok).toBe(false)
  })

  it('accepts a no-ball with byes and zero batter runs', () => {
    const result = validateAndBuildExtras({
      outcome: 'no-ball',
      batterRuns: 0,
      extras: { noBallRuns: 1, byes: 2 },
      rulesProfile,
    })
    expect(result.ok).toBe(true)
  })

  it('rejects a legal delivery that carries wide or no-ball extras', () => {
    const result = validateAndBuildExtras({
      outcome: 'legal',
      batterRuns: 0,
      extras: { wides: 1 },
      rulesProfile,
    })
    expect(result.ok).toBe(false)
  })

  it('rejects byes and leg-byes together', () => {
    const result = validateAndBuildExtras({
      outcome: 'legal',
      batterRuns: 0,
      extras: { byes: 1, legByes: 1 },
      rulesProfile,
    })
    expect(result.ok).toBe(false)
  })

  it('rejects negative extras', () => {
    const result = validateAndBuildExtras({
      outcome: 'legal',
      batterRuns: 0,
      extras: { byes: -1 },
      rulesProfile,
    })
    expect(result.ok).toBe(false)
  })

  it('accepts penalty runs independent of outcome', () => {
    const result = validateAndBuildExtras({
      outcome: 'legal',
      batterRuns: 1,
      extras: { penaltyRuns: 5 },
      rulesProfile,
    })
    expect(result.ok).toBe(true)
  })
})
