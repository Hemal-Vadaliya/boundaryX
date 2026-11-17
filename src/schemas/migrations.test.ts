import { describe, expect, it } from 'vitest'
import { migrateToCurrentSchema, MIGRATIONS } from '@/schemas/migrations'
import { CURRENT_SCHEMA_VERSION } from '@/schemas/version'

describe('migrateToCurrentSchema', () => {
  it('returns the input unchanged when already at the current version', () => {
    const raw = { app: 'BoundaryX', schemaVersion: CURRENT_SCHEMA_VERSION }
    const result = migrateToCurrentSchema(raw, CURRENT_SCHEMA_VERSION)
    expect(result.migrated).toEqual(raw)
    expect(result.appliedVersions).toEqual([])
  })

  it('throws a clear error for an old version with no registered migration', () => {
    expect(() => migrateToCurrentSchema({ schemaVersion: 0 }, 0)).toThrow(
      /No migration available/
    )
  })

  it('applies a registered migration deterministically when moving up from an older version', () => {
    const fakeOldVersion = CURRENT_SCHEMA_VERSION - 1
    const originalMigration = MIGRATIONS[fakeOldVersion]
    MIGRATIONS[fakeOldVersion] = (raw) => ({
      ...(raw as Record<string, unknown>),
      migratedField: true,
    })

    try {
      const result = migrateToCurrentSchema(
        { app: 'BoundaryX', schemaVersion: fakeOldVersion },
        fakeOldVersion
      )
      expect(result.appliedVersions).toEqual([fakeOldVersion])
      expect(result.migrated).toEqual({
        app: 'BoundaryX',
        schemaVersion: fakeOldVersion,
        migratedField: true,
      })

      // Running it twice on the same input produces the same output —
      // migrations must be deterministic, not time- or state-dependent.
      const resultAgain = migrateToCurrentSchema(
        { app: 'BoundaryX', schemaVersion: fakeOldVersion },
        fakeOldVersion
      )
      expect(resultAgain).toEqual(result)
    } finally {
      if (originalMigration) {
        MIGRATIONS[fakeOldVersion] = originalMigration
      } else {
        delete MIGRATIONS[fakeOldVersion]
      }
    }
  })
})
