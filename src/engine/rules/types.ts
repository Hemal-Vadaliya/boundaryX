/**
 * The rules profile attached to every match. Two layers per the plan:
 * MCC Laws of Cricket as the base, with competition playing-condition
 * overrides on top. Never claim "official" compliance for an
 * unidentified/incomplete profile — see isOfficial below.
 */
export interface RulesProfile {
  /** Stable identifier for this exact profile, e.g. "icc-t20i-2026-10" or "custom". */
  id: string
  /** Human-readable label shown in the UI. */
  label: string
  /** True only when this profile's source document, clauses and tests have been reviewed and mapped. Custom/unreviewed profiles must never claim this. */
  isOfficial: boolean
  ballsPerOver: number
  /** Overs per innings; undefined means unlimited (Test cricket). */
  oversPerInnings?: number
  inningsPerTeam: number
  /** Maximum overs a single bowler may bowl in an innings, undefined means no limit. */
  maxOversPerBowler?: number
  /** Whether a bowler may not bowl consecutive overs (true under standard laws for limited-overs cricket). */
  noConsecutiveOvers: boolean
  freeHitEnabled: boolean
  /** Whether byes/leg-byes count as valid (legal) deliveries — true under standard laws. */
  byesCountAsLegalDelivery: boolean
  powerplays: PowerplayPhase[]
  followOnEnabled: boolean
  /** Runs the trailing team's first-innings total must fall short by to be eligible for follow-on enforcement (Test only). */
  followOnMarginRuns?: number
  superOverEnabled: boolean
  /**
   * Reference average total for a full uninterrupted innings of this
   * format (DLS's "G50" parameter, scaled for non-50-over formats),
   * used only to compute a DLS par score when the chasing team ends up
   * with MORE resources than the side batting first (e.g. the first
   * innings was itself interrupted). Undefined falls back to the ICC's
   * commonly cited ODI reference of 245, scaled by oversPerInnings/50.
   */
  dlsG50?: number
  /** Effective date or edition identifier of the source document this profile was derived from. */
  effectiveFrom?: string
  governingBody?: string
}

export interface PowerplayPhase {
  name: string
  /** Over range this phase applies to, inclusive, 0-indexed. */
  startOver: number
  endOver: number
  maxFieldersOutsideCircle: number
}
