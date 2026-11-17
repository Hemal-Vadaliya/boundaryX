import type { RulesProfile } from '@/engine/rules/types'
import { MCC_LAWS } from '@/engine/rules/laws/mccLaws'
import type { MatchFormat } from '@/types/common'

const BASE_DEFAULTS = {
  ballsPerOver: MCC_LAWS.standardBallsPerOver,
  noConsecutiveOvers: MCC_LAWS.noConsecutiveOvers,
  byesCountAsLegalDelivery: MCC_LAWS.byesCountAsLegalDelivery,
  governingBody: undefined,
  effectiveFrom: undefined,
} as const

/**
 * Standard format profiles. These are starting points, not a claim of
 * official ICC compliance for any specific series or edition — isOfficial
 * stays false until a profile's source document and clauses have been
 * reviewed and mapped per the plan's governance rule (section 24).
 */
export function standardFormatProfile(format: MatchFormat): RulesProfile {
  switch (format) {
    case 'T10':
      return {
        ...BASE_DEFAULTS,
        id: 'standard-t10',
        label: 'Standard T10',
        isOfficial: false,
        oversPerInnings: 10,
        inningsPerTeam: 1,
        maxOversPerBowler: 2,
        freeHitEnabled: true,
        followOnEnabled: false,
        superOverEnabled: true,
        powerplays: [
          { name: 'Powerplay', startOver: 0, endOver: 3, maxFieldersOutsideCircle: 2 },
        ],
      }
    case 'T20':
      return {
        ...BASE_DEFAULTS,
        id: 'standard-t20',
        label: 'Standard T20',
        isOfficial: false,
        oversPerInnings: 20,
        inningsPerTeam: 1,
        maxOversPerBowler: 4,
        freeHitEnabled: true,
        followOnEnabled: false,
        superOverEnabled: true,
        powerplays: [
          { name: 'Powerplay', startOver: 0, endOver: 5, maxFieldersOutsideCircle: 2 },
        ],
      }
    case 'ODI':
      return {
        ...BASE_DEFAULTS,
        id: 'standard-odi',
        label: 'Standard ODI',
        isOfficial: false,
        oversPerInnings: 50,
        inningsPerTeam: 1,
        maxOversPerBowler: 10,
        freeHitEnabled: true,
        followOnEnabled: false,
        superOverEnabled: true,
        powerplays: [
          { name: 'Powerplay 1', startOver: 0, endOver: 9, maxFieldersOutsideCircle: 2 },
          {
            name: 'Powerplay 2',
            startOver: 10,
            endOver: 39,
            maxFieldersOutsideCircle: 4,
          },
          {
            name: 'Powerplay 3',
            startOver: 40,
            endOver: 49,
            maxFieldersOutsideCircle: 4,
          },
        ],
      }
    case 'Test':
      return {
        ...BASE_DEFAULTS,
        id: 'standard-test',
        label: 'Standard Test',
        isOfficial: false,
        oversPerInnings: undefined,
        inningsPerTeam: 2,
        maxOversPerBowler: undefined,
        freeHitEnabled: false,
        followOnEnabled: true,
        followOnMarginRuns: 200,
        superOverEnabled: false,
        powerplays: [],
      }
    case 'Custom':
      return {
        ...BASE_DEFAULTS,
        id: 'custom',
        label: 'Custom',
        isOfficial: false,
        oversPerInnings: 20,
        inningsPerTeam: 1,
        maxOversPerBowler: undefined,
        freeHitEnabled: false,
        followOnEnabled: false,
        superOverEnabled: false,
        powerplays: [],
      }
  }
}
