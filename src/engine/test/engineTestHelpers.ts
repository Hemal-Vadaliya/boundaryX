import type { RulesProfile } from '@/engine/rules/types'
import type { Innings } from '@/domain/innings/types'
import { createInnings } from '@/engine/innings/createInnings'
import { recordDelivery } from '@/engine/commands/recordDelivery'
import { completeOver } from '@/engine/commands/completeOver'
import type { RecordDeliveryInput } from '@/engine/commands/recordDeliveryInput'
import { standardFormatProfile } from '@/engine/rules/formats/standardProfiles'
import { emptyExtras } from '@/domain/delivery/types'
import type { ExtrasBreakdown } from '@/domain/delivery/types'
import type { DismissalRecord } from '@/domain/dismissal/types'

let idCounter = 0
export function nextTestId(prefix: string): string {
  idCounter += 1
  return `${prefix}-${idCounter}`
}

export function freshInnings(
  overrides?: Partial<Parameters<typeof createInnings>[0]>
): Innings {
  return createInnings({
    id: nextTestId('innings'),
    matchId: 'match-1',
    battingTeamId: 'teamA',
    bowlingTeamId: 'teamB',
    inningsNumber: 1,
    openingStriker: 'p1',
    openingNonStriker: 'p2',
    ...overrides,
  })
}

export function t20Profile(): RulesProfile {
  return standardFormatProfile('T20')
}

interface BallSpec {
  bowlerId?: string
  runs?: number
  extras?: Partial<ExtrasBreakdown>
  outcome?: 'legal' | 'wide' | 'no-ball'
  dismissal?: Omit<DismissalRecord, 'creditsBowler'>
  incomingBatterId?: string
  noFurtherBattersAvailable?: boolean
  battersCrossed?: boolean
  bowlerForNewOver?: string
}

/**
 * Test helper that bowls a single ball through the real engine pipeline,
 * handling the completeOver call automatically when a new over's bowler is
 * specified. Throws if the engine rejects the ball, so tests fail loudly
 * with the engine's own error message rather than silently continuing.
 */
export function bowlBall(
  innings: Innings,
  rulesProfile: RulesProfile,
  spec: BallSpec
): Innings {
  let current = innings

  if (spec.bowlerForNewOver) {
    const overResult = completeOver(current, rulesProfile, spec.bowlerForNewOver)
    if (!overResult.ok) {
      throw new Error(
        `completeOver failed: ${overResult.error.code} ${overResult.error.message}`
      )
    }
    current = overResult.value
  }

  const bowlerId = spec.bowlerForNewOver ?? spec.bowlerId ?? current.currentBowlerId
  if (!bowlerId) throw new Error('bowlBall: no bowler resolved for this delivery')

  const input: RecordDeliveryInput = {
    bowlerId,
    batterRuns: spec.runs ?? 0,
    extras: spec.extras ?? {},
    outcome: spec.outcome ?? 'legal',
    dismissal: spec.dismissal,
    incomingBatterId: spec.incomingBatterId,
    noFurtherBattersAvailable: spec.noFurtherBattersAvailable,
    battersCrossed: spec.battersCrossed,
  }

  const result = recordDelivery(
    {
      innings: current,
      rulesProfile,
      nowIso: '2026-11-15T00:00:00.000Z',
      createDeliveryId: () => nextTestId('delivery'),
    },
    input
  )
  if (!result.ok) {
    throw new Error(`recordDelivery failed: ${result.error.code} ${result.error.message}`)
  }
  return result.value
}

export { emptyExtras }
