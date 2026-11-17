import { describe, expect, it } from 'vitest'
import {
  parseImportedFile,
  isImportFailure,
  checkMatchConsistency,
  importAsCopy,
} from '@/services/importService'
import {
  serializeMatchFile,
  serializeBundleFile,
  buildMatchFilename,
} from '@/services/exportService'
import { createMatchDocument } from '@/services/matchService'
import { createTeam } from '@/domain/team/types'
import { createPlayer } from '@/domain/player/types'
import { CURRENT_SCHEMA_VERSION } from '@/schemas/version'

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

function buildMatch() {
  const teamA = buildTeam('A')
  const teamB = buildTeam('B')
  return createMatchDocument({
    name: 'Import Test Match',
    matchDate: '2026-11-15',
    format: 'T20',
    teamA,
    teamB,
    playingXiA: teamA.squad.map((p) => p.id),
    playingXiB: teamB.squad.map((p) => p.id),
  })
}

describe('parseImportedFile', () => {
  it('rejects invalid JSON', () => {
    const result = parseImportedFile('bad.json', '{not json')
    expect(isImportFailure(result)).toBe(true)
    if (isImportFailure(result)) expect(result.reason).toBe('invalid-json')
  })

  it('rejects a file that is valid JSON but not a BoundaryX export', () => {
    const result = parseImportedFile('other.json', JSON.stringify({ hello: 'world' }))
    expect(isImportFailure(result)).toBe(true)
    if (isImportFailure(result)) expect(result.reason).toBe('not-boundaryx-file')
  })

  it('rejects a file with a newer schema version than this app supports', () => {
    const match = buildMatch()
    const text = JSON.stringify({
      app: 'BoundaryX',
      schemaVersion: CURRENT_SCHEMA_VERSION + 1,
      match,
      metadata: { exportedAt: '2026-11-15T00:00:00.000Z', engineVersion: '1.0.0' },
    })
    const result = parseImportedFile('future.json', text)
    expect(isImportFailure(result)).toBe(true)
    if (isImportFailure(result)) expect(result.reason).toBe('unsupported-schema-version')
  })

  it('rejects a BoundaryX-shaped file whose match document fails validation', () => {
    const match = buildMatch() as unknown as Record<string, unknown>
    delete match.rulesProfile
    const text = JSON.stringify({
      app: 'BoundaryX',
      schemaVersion: CURRENT_SCHEMA_VERSION,
      match,
      metadata: { exportedAt: '2026-11-15T00:00:00.000Z', engineVersion: '1.0.0' },
    })
    const result = parseImportedFile('broken.json', text)
    expect(isImportFailure(result)).toBe(true)
    if (isImportFailure(result)) expect(result.reason).toBe('invalid-match-document')
  })

  it('successfully parses a valid single-match export produced by serializeMatchFile', () => {
    const match = buildMatch()
    const text = serializeMatchFile(match)
    const result = parseImportedFile('match.json', text)
    expect(isImportFailure(result)).toBe(false)
    if (!isImportFailure(result)) {
      expect(result.matches).toHaveLength(1)
      expect(result.matches[0]?.id).toBe(match.id)
    }
  })

  it('successfully parses a valid bundle export produced by serializeBundleFile', () => {
    const matchA = buildMatch()
    const matchB = buildMatch()
    const text = serializeBundleFile([matchA, matchB])
    const result = parseImportedFile('bundle.json', text)
    expect(isImportFailure(result)).toBe(false)
    if (!isImportFailure(result)) {
      expect(result.matches).toHaveLength(2)
    }
  })
})

describe('checkMatchConsistency', () => {
  it('reports no violations for a freshly created match with no innings', () => {
    const match = buildMatch()
    const report = checkMatchConsistency(match)
    expect(report.violations).toEqual([])
  })
})

describe('importAsCopy', () => {
  it('assigns a new document id and records the original as sourceMatchId', () => {
    const match = buildMatch()
    const copy = importAsCopy(match)
    expect(copy.id).not.toBe(match.id)
    expect(copy.sourceMatchId).toBe(match.id)
    expect(copy.name).toBe(match.name)
  })

  it('preserves the original lineage when copying an already-copied match', () => {
    const match = buildMatch()
    const firstCopy = importAsCopy(match)
    const secondCopy = importAsCopy(firstCopy)
    expect(secondCopy.sourceMatchId).toBe(match.id)
  })
})

describe('buildMatchFilename', () => {
  it('builds a safe, descriptive filename from the team names and date', () => {
    const match = buildMatch()
    const filename = buildMatchFilename(match)
    expect(filename).toBe('BoundaryX_Team-A-vs-Team-B_2026-11-15.json')
  })
})
