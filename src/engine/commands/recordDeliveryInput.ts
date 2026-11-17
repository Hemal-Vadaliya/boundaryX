import type { ExtrasBreakdown } from '@/domain/delivery/types'
import type { DismissalRecord } from '@/domain/dismissal/types'

/**
 * Raw user-facing action for one delivery, before validation. This is what
 * the scoring UI submits; the engine turns it into an authoritative
 * Delivery record (or rejects it) — the UI never computes totals itself.
 */
export interface RecordDeliveryInput {
  bowlerId: string
  /** Runs credited to the batter off the bat. Zero for a dot ball, a wide with no running, etc. */
  batterRuns: number
  extras: Partial<ExtrasBreakdown>
  outcome: 'legal' | 'wide' | 'no-ball'
  dismissal?: Omit<DismissalRecord, 'creditsBowler'>
  /** Required when a wicket falls and the innings continues with another batter available. */
  incomingBatterId?: string
  /**
   * Set when a wicket falls, no incoming batter is supplied, and the
   * squad genuinely has no further batters left — the surviving partner
   * (if any) continues alone as the sole striker (last-man-stands) rather
   * than the innings being treated as all out. Ignored unless a wicket
   * with no incoming batter was recorded.
   */
  noFurtherBattersAvailable?: boolean
  /**
   * Whether the batters crossed while running, independent of the raw run
   * count — needed because strike rotation on the delivery that produces a
   * wicket depends on whether a completed run happened before the dismissal.
   */
  battersCrossed?: boolean
  timestamp?: string
}
