import { CURRENT_SCHEMA_VERSION } from '@/schemas/version'

/**
 * Deterministic migration framework for older-but-supported schema
 * versions. Each entry transforms the raw parsed JSON from version N to
 * N+1; parseImportedFile runs every migration needed to reach
 * CURRENT_SCHEMA_VERSION before validating against the current schema.
 * There are no migrations yet (the app has only ever shipped
 * schemaVersion 1) — this file is the place future migrations are added,
 * one function per version bump, never a destructive in-place rewrite of
 * history per the plan's "never silently reinterpret a historical match"
 * rule (section 10.5).
 */
export type SchemaMigration = (raw: unknown) => unknown

export const MIGRATIONS: Record<number, SchemaMigration> = {
  // Example shape for the next migration, once schemaVersion 2 exists:
  // 1: (raw) => ({ ...(raw as Record<string, unknown>), newField: defaultValue }),
}

export interface MigrationResult {
  migrated: unknown
  appliedVersions: number[]
}

/**
 * Applies every migration needed to bring a document from fromVersion up
 * to CURRENT_SCHEMA_VERSION. Throws if a migration for an intermediate
 * version is missing — that indicates a genuinely unsupported old file,
 * which the caller should treat as a validation failure rather than
 * guessing at a transformation.
 */
export function migrateToCurrentSchema(
  raw: unknown,
  fromVersion: number
): MigrationResult {
  let migrated = raw
  const appliedVersions: number[] = []

  for (let version = fromVersion; version < CURRENT_SCHEMA_VERSION; version++) {
    const migration = MIGRATIONS[version]
    if (!migration) {
      throw new Error(
        `No migration available from schema version ${version} to ${version + 1}.`
      )
    }
    migrated = migration(migrated)
    appliedVersions.push(version)
  }

  return { migrated, appliedVersions }
}
