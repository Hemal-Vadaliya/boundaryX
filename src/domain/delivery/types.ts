import type { DismissalRecord } from '@/domain/dismissal/types'

/**
 * Every category of extra a delivery can carry. Kept distinct rather than a
 * single generic "extras" number so attribution (batter vs bowler vs team vs
 * over-count) can be computed correctly for each category.
 */
export interface ExtrasBreakdown {
  wides: number
  noBallRuns: number
  byes: number
  legByes: number
  penaltyRuns: number
}

export function emptyExtras(): ExtrasBreakdown {
  return { wides: 0, noBallRuns: 0, byes: 0, legByes: 0, penaltyRuns: 0 }
}

export function totalExtras(extras: ExtrasBreakdown): number {
  return (
    extras.wides + extras.noBallRuns + extras.byes + extras.legByes + extras.penaltyRuns
  )
}

export type LegalDeliveryOutcome = 'legal' | 'wide' | 'no-ball'

export interface Delivery {
  id: string
  inningsId: string
  /** Monotonically increasing sequence number across all events in the innings, including illegal deliveries and corrections. */
  sequenceNumber: number
  /** The over this delivery belongs to (0-indexed). */
  overNumber: number
  /** The legal-ball number within the over (1-indexed), undefined for an illegal delivery. */
  legalBallNumber?: number
  strikerIdBefore: string
  /** Absent for a delivery bowled during last-man-stands (a lone surviving batter, no partner). */
  nonStrikerIdBefore?: string
  bowlerId: string
  batterRuns: number
  extras: ExtrasBreakdown
  outcome: LegalDeliveryOutcome
  dismissal?: DismissalRecord
  /** Required when `dismissal` is present and the innings continues; the player who replaces the dismissed batter at the crease. */
  incomingBatterId?: string
  /** True if the delivery immediately followed a no-ball under a free-hit-enabled profile. */
  isFreeHit: boolean
  /** Runs scored off overthrows, already included in batterRuns/extras as attributed; kept for display. */
  overthrowRuns?: number
  timestamp: string
  /** Set when this delivery is itself a correction of a prior delivery. */
  correctsDeliveryId?: string
}

export function totalRunsOffDelivery(delivery: Delivery): number {
  return delivery.batterRuns + totalExtras(delivery.extras)
}

export function isLegalDelivery(delivery: Delivery): boolean {
  return delivery.outcome === 'legal'
}

/** Runs charged against the bowler's figures: batter runs + wides + no-ball run, excluding byes/leg-byes/penalties. */
export function runsConcededByBowler(delivery: Delivery): number {
  return delivery.batterRuns + delivery.extras.wides + delivery.extras.noBallRuns
}
