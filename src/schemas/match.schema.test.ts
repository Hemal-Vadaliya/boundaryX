import { describe, expect, it } from 'vitest'
import { matchDocumentSchema } from '@/schemas/match.schema'
import { matchFileSchema } from '@/schemas/import.schema'
import { CURRENT_SCHEMA_VERSION, ENGINE_VERSION } from '@/schemas/version'
import { createMatchDocument } from '@/services/matchService'
import { createTeam } from '@/domain/team/types'
import { createPlayer } from '@/domain/player/types'
import { createInnings } from '@/engine/innings/createInnings'
import { completeOver } from '@/engine/commands/completeOver'
import { recordDelivery } from '@/engine/commands/recordDelivery'
import { retireBatterHurt } from '@/engine/commands/retireBatter'
import { editLastDelivery } from '@/engine/commands/editLastDelivery'
import { createId } from '@/utils/id'

function buildTeam(prefix: string) {
  const squad = Array.from({ length: 11 }, (_, i) =>
    createPlayer({ id: `${prefix}${i}`, name: `${prefix} Player ${i}` })
  )
  return createTeam({
    id: `team-${prefix}`,
    name: `Team ${prefix}`,
    squad,
  })
}

function expectOk<T>(result: { ok: boolean; value?: T; error?: { message: string } }): T {
  if (!result.ok) throw new Error(result.error?.message)
  return result.value!
}

function buildScoredMatch() {
  const teamA = buildTeam('A')
  const teamB = buildTeam('B')
  const match = createMatchDocument({
    name: 'Schema Round Trip Match',
    venue: 'Test Ground',
    matchDate: '2026-11-15',
    format: 'T20',
    teamA,
    teamB,
    playingXiA: teamA.squad.map((p) => p.id),
    playingXiB: teamB.squad.map((p) => p.id),
    captainIdA: 'A0',
    wicketkeeperIdB: 'B0',
  })
  match.toss = { wonByTeamId: teamA.id, decision: 'bat' }
  match.status = 'ongoing'

  let innings = createInnings({
    id: createId('innings'),
    matchId: match.id,
    battingTeamId: teamA.id,
    bowlingTeamId: teamB.id,
    inningsNumber: 1,
    openingStriker: 'A0',
    openingNonStriker: 'A1',
  })
  innings = expectOk(completeOver(innings, match.rulesProfile, 'B0'))

  const nowIso = '2026-11-15T00:00:00.000Z'
  innings = expectOk(
    recordDelivery(
      {
        innings,
        rulesProfile: match.rulesProfile,
        nowIso,
        createDeliveryId: () => createId('delivery'),
      },
      { bowlerId: 'B0', batterRuns: 4, extras: {}, outcome: 'legal' }
    )
  )
  innings = expectOk(
    recordDelivery(
      {
        innings,
        rulesProfile: match.rulesProfile,
        nowIso,
        createDeliveryId: () => createId('delivery'),
      },
      {
        bowlerId: 'B0',
        batterRuns: 0,
        extras: {},
        outcome: 'legal',
        dismissal: { type: 'bowled', dismissedPlayerId: 'A0', dismissedEnd: 'striker' },
        incomingBatterId: 'A2',
      }
    )
  )
  innings = expectOk(retireBatterHurt(innings, match.rulesProfile, 'A1', 'A3', nowIso))
  innings = expectOk(
    editLastDelivery(
      innings,
      match.rulesProfile,
      { bowlerId: 'B0', batterRuns: 1, extras: {}, outcome: 'legal' },
      'A0',
      'A1',
      (i) => createId(`edit-${i}`),
      nowIso,
      'Scorer correction'
    )
  )

  match.innings = [innings]
  return match
}

describe('matchDocumentSchema', () => {
  it('validates a freshly created match document with no innings', () => {
    const teamA = buildTeam('A')
    const teamB = buildTeam('B')
    const match = createMatchDocument({
      name: 'Empty Match',
      matchDate: '2026-11-15',
      format: 'T20',
      teamA,
      teamB,
      playingXiA: teamA.squad.map((p) => p.id),
      playingXiB: teamB.squad.map((p) => p.id),
    })
    const result = matchDocumentSchema.safeParse(match)
    expect(result.success).toBe(true)
  })

  it('validates a match with a scored innings including a wicket, a retirement and a correction', () => {
    const match = buildScoredMatch()
    const result = matchDocumentSchema.safeParse(match)
    expect(result.success).toBe(true)
    if (!result.success) {
      // Surface the first issue path to make a future failure easy to diagnose.
      expect(result.error.issues[0]).toBeUndefined()
    }
  })

  it('round-trips through JSON.stringify/parse without losing schema validity', () => {
    const match = buildScoredMatch()
    const roundTripped = JSON.parse(JSON.stringify(match))
    const result = matchDocumentSchema.safeParse(roundTripped)
    expect(result.success).toBe(true)
  })

  it('rejects a document missing a required field', () => {
    const match = buildScoredMatch()
    const broken = { ...match, rulesProfile: undefined }
    const result = matchDocumentSchema.safeParse(broken)
    expect(result.success).toBe(false)
  })
})

describe('matchFileSchema', () => {
  it('validates a full export envelope around a scored match', () => {
    const match = buildScoredMatch()
    const file = {
      app: 'BoundaryX' as const,
      schemaVersion: CURRENT_SCHEMA_VERSION,
      match,
      metadata: {
        exportedAt: '2026-11-15T00:00:00.000Z',
        engineVersion: ENGINE_VERSION,
      },
    }
    const result = matchFileSchema.safeParse(file)
    expect(result.success).toBe(true)
  })

  it('rejects a file with the wrong app identity', () => {
    const match = buildScoredMatch()
    const file = {
      app: 'SomeOtherApp',
      schemaVersion: CURRENT_SCHEMA_VERSION,
      match,
      metadata: { exportedAt: '2026-11-15T00:00:00.000Z', engineVersion: ENGINE_VERSION },
    }
    const result = matchFileSchema.safeParse(file)
    expect(result.success).toBe(false)
  })
})
