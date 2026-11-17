import { describe, expect, it } from 'vitest'
import { getResourcePercentage } from '@/engine/results/dls/resourceTable'

describe('getResourcePercentage', () => {
  it('returns the exact published value at every official anchor point', () => {
    expect(getResourcePercentage(50, 0)).toBeCloseTo(100.0, 5)
    expect(getResourcePercentage(50, 2)).toBeCloseTo(85.1, 5)
    expect(getResourcePercentage(50, 4)).toBeCloseTo(62.7, 5)
    expect(getResourcePercentage(50, 6)).toBeCloseTo(34.9, 5)
    expect(getResourcePercentage(50, 8)).toBeCloseTo(11.9, 5)

    expect(getResourcePercentage(40, 0)).toBeCloseTo(89.3, 5)
    expect(getResourcePercentage(20, 0)).toBeCloseTo(56.6, 5)
    expect(getResourcePercentage(10, 0)).toBeCloseTo(32.1, 5)
    expect(getResourcePercentage(5, 0)).toBeCloseTo(17.2, 5)
    expect(getResourcePercentage(5, 8)).toBeCloseTo(9.4, 5)

    expect(getResourcePercentage(31, 0)).toBeCloseTo(76.7, 5)
    expect(getResourcePercentage(30, 0)).toBeCloseTo(75.1, 5)
    expect(getResourcePercentage(29, 0)).toBeCloseTo(73.5, 5)
    expect(getResourcePercentage(28, 0)).toBeCloseTo(71.8, 5)
    expect(getResourcePercentage(27, 0)).toBeCloseTo(70.1, 5)
  })

  it('returns 0 resources with no overs remaining, regardless of wickets lost', () => {
    expect(getResourcePercentage(0, 0)).toBe(0)
    expect(getResourcePercentage(0, 5)).toBe(0)
    expect(getResourcePercentage(0, 10)).toBe(0)
  })

  it('is monotonically non-decreasing as overs remaining increases (fixed wickets)', () => {
    const oversToCheck = [0, 1, 4, 5, 6, 9, 10, 11, 19, 20, 21, 26, 27, 28, 29, 30, 31, 35, 40, 45, 50]
    for (let i = 1; i < oversToCheck.length; i++) {
      const prev = getResourcePercentage(oversToCheck[i - 1]!, 3)
      const next = getResourcePercentage(oversToCheck[i]!, 3)
      expect(next).toBeGreaterThanOrEqual(prev)
    }
  })

  it('is monotonically non-increasing as wickets lost increases (fixed overs)', () => {
    for (let w = 1; w <= 10; w++) {
      const prev = getResourcePercentage(30, w - 1)
      const next = getResourcePercentage(30, w)
      expect(next).toBeLessThanOrEqual(prev + 1e-9)
    }
  })

  it('clamps to [0, 100] for out-of-range inputs', () => {
    expect(getResourcePercentage(999, 0)).toBeLessThanOrEqual(100)
    expect(getResourcePercentage(-5, 0)).toBe(0)
    expect(getResourcePercentage(50, 10)).toBeGreaterThanOrEqual(0)
  })

  it('rescales wickets lost proportionally for a non-10-wicket squad', () => {
    // A 7-wicket squad (8-a-side XI minus the "did not bat" slot analog)
    // losing all 7 should map to the same resource as a 10-wicket squad
    // losing all 10 at the same overs mark.
    const sevenWicketAllOut = getResourcePercentage(20, 7, 7)
    const tenWicketAllOut = getResourcePercentage(20, 10, 10)
    expect(sevenWicketAllOut).toBeCloseTo(tenWicketAllOut, 5)
  })
})
