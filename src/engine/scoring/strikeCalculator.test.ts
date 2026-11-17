import { describe, expect, it } from 'vitest'
import {
  calculateEndsAfterDelivery,
  swapEndsForNewOver,
} from '@/engine/scoring/strikeCalculator'
import { emptyExtras } from '@/domain/delivery/types'
import type { DismissalRecord } from '@/domain/dismissal/types'

const positions = { striker: 'A', nonStriker: 'B' }

describe('calculateEndsAfterDelivery', () => {
  it('keeps the same striker on an even number of runs run', () => {
    const result = calculateEndsAfterDelivery({
      positionsBefore: positions,
      batterRuns: 2,
      extras: emptyExtras(),
      battersCrossedOverride: undefined,
    })
    expect(result).toEqual({ striker: 'A', nonStriker: 'B' })
  })

  it('swaps ends on an odd number of runs run', () => {
    const result = calculateEndsAfterDelivery({
      positionsBefore: positions,
      batterRuns: 1,
      extras: emptyExtras(),
    })
    expect(result).toEqual({ striker: 'B', nonStriker: 'A' })
  })

  it('does not swap ends on a boundary four', () => {
    const result = calculateEndsAfterDelivery({
      positionsBefore: positions,
      batterRuns: 4,
      extras: emptyExtras(),
    })
    expect(result).toEqual({ striker: 'A', nonStriker: 'B' })
  })

  it('swaps ends on a single leg-bye', () => {
    const result = calculateEndsAfterDelivery({
      positionsBefore: positions,
      batterRuns: 0,
      extras: { ...emptyExtras(), legByes: 1 },
    })
    expect(result).toEqual({ striker: 'B', nonStriker: 'A' })
  })

  it('respects an explicit crossed override regardless of run parity', () => {
    const result = calculateEndsAfterDelivery({
      positionsBefore: positions,
      batterRuns: 2,
      extras: emptyExtras(),
      battersCrossedOverride: true,
    })
    expect(result).toEqual({ striker: 'B', nonStriker: 'A' })
  })

  it('places the surviving batter at the end opposite the dismissal and the new batter at the dismissed end', () => {
    const dismissal: DismissalRecord = {
      type: 'run-out',
      dismissedPlayerId: 'A',
      dismissedEnd: 'striker',
      creditsBowler: false,
    }
    const result = calculateEndsAfterDelivery({
      positionsBefore: positions,
      batterRuns: 1,
      extras: emptyExtras(),
      dismissal,
      incomingBatterId: 'C',
    })
    expect(result).toEqual({ striker: 'C', nonStriker: 'B' })
  })

  it('handles a non-striker run out, leaving the striker in place', () => {
    const dismissal: DismissalRecord = {
      type: 'run-out',
      dismissedPlayerId: 'B',
      dismissedEnd: 'non-striker',
      creditsBowler: false,
    }
    const result = calculateEndsAfterDelivery({
      positionsBefore: positions,
      batterRuns: 0,
      extras: emptyExtras(),
      dismissal,
      incomingBatterId: 'C',
    })
    expect(result).toEqual({ striker: 'A', nonStriker: 'C' })
  })
})

describe('swapEndsForNewOver', () => {
  it('swaps striker and non-striker', () => {
    expect(swapEndsForNewOver(positions)).toEqual({ striker: 'B', nonStriker: 'A' })
  })
})
