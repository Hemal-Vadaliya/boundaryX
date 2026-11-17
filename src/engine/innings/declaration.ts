import type { Innings } from '@/domain/innings/types'
import type { RulesProfile } from '@/engine/rules/types'
import type { EngineResult } from '@/engine/engineResult'
import { ok, err } from '@/engine/engineResult'

/**
 * Declares an innings closed before all out or overs completed. Only
 * meaningful for formats where declaration is a permitted part of the
 * playing conditions (Test cricket under standard laws); the rules
 * profile is the source of truth for whether this is allowed.
 */
export function declareInnings(
  innings: Innings,
  rulesProfile: RulesProfile
): EngineResult<Innings> {
  if (!rulesProfile.followOnEnabled) {
    return err(
      'DECLARATION_NOT_PERMITTED',
      'Declaration is not part of the playing conditions for this format.'
    )
  }
  if (innings.state !== 'in-progress') {
    return err('INNINGS_NOT_IN_PROGRESS', 'Only an in-progress innings can be declared.')
  }
  if (innings.wicketsLost === 0 && innings.legalBallsBowled === 0) {
    return err(
      'CANNOT_DECLARE_BEFORE_BATTING',
      'An innings cannot be declared before any balls have been bowled.'
    )
  }

  return ok({ ...innings, declared: true })
}
