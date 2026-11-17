import type { ExtrasBreakdown } from '@/domain/delivery/types'
import { emptyExtras, totalExtras } from '@/domain/delivery/types'
import type { RulesProfile } from '@/engine/rules/types'
import type { EngineResult } from '@/engine/engineResult'
import { ok, err } from '@/engine/engineResult'

export interface ExtrasValidationInput {
  outcome: 'legal' | 'wide' | 'no-ball'
  batterRuns: number
  extras: Partial<ExtrasBreakdown>
  rulesProfile: RulesProfile
}

/**
 * Validates extras combinations and fills in a complete ExtrasBreakdown.
 * Not every combination is legal: a wide cannot carry batter runs or
 * byes/leg-byes in the same delivery (those are mutually exclusive outcome
 * categories), and a no-ball's fixed penalty run is separate from any runs
 * actually scored off the bat or as byes.
 */
export function validateAndBuildExtras(
  input: ExtrasValidationInput
): EngineResult<ExtrasBreakdown> {
  const extras: ExtrasBreakdown = { ...emptyExtras(), ...input.extras }

  if (
    extras.wides < 0 ||
    extras.noBallRuns < 0 ||
    extras.byes < 0 ||
    extras.legByes < 0 ||
    extras.penaltyRuns < 0
  ) {
    return err('NEGATIVE_EXTRAS', 'Extras cannot be negative.')
  }
  if (input.batterRuns < 0) {
    return err('NEGATIVE_RUNS', 'Batter runs cannot be negative.')
  }

  if (input.outcome === 'wide') {
    if (input.batterRuns > 0) {
      return err('INVALID_WIDE', 'A wide cannot also credit runs to the batter.')
    }
    if (extras.byes > 0 || extras.legByes > 0) {
      return err('INVALID_WIDE', 'A wide cannot be combined with byes or leg-byes.')
    }
    if (extras.noBallRuns > 0) {
      return err('INVALID_WIDE', 'A wide cannot also be a no-ball.')
    }
    if (extras.wides < 1) {
      return err('INVALID_WIDE', 'A wide delivery must record at least one wide run.')
    }
  } else if (input.outcome === 'no-ball') {
    if (extras.wides > 0) {
      return err('INVALID_NO_BALL', 'A no-ball cannot also be a wide.')
    }
    if (input.batterRuns > 0 && (extras.byes > 0 || extras.legByes > 0)) {
      return err(
        'INVALID_NO_BALL',
        'A no-ball cannot credit both batter runs and byes/leg-byes on the same delivery.'
      )
    }
    if (extras.noBallRuns < 1) {
      return err('INVALID_NO_BALL', 'A no-ball must record at least the one penalty run.')
    }
  } else {
    if (extras.wides > 0 || extras.noBallRuns > 0) {
      return err(
        'INVALID_LEGAL_DELIVERY',
        'A legal delivery cannot carry wide or no-ball extras.'
      )
    }
    if (input.batterRuns > 0 && (extras.byes > 0 || extras.legByes > 0)) {
      return err(
        'INVALID_LEGAL_DELIVERY',
        'A delivery cannot credit both batter runs and byes/leg-byes.'
      )
    }
    if (extras.byes > 0 && extras.legByes > 0) {
      return err(
        'INVALID_LEGAL_DELIVERY',
        'A delivery cannot be both a bye and a leg-bye.'
      )
    }
  }

  return ok(extras)
}

export { totalExtras }
