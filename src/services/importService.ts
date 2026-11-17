import {
  matchFileSchema,
  matchBundleFileSchema,
  fileIdentitySchema,
} from '@/schemas/import.schema'
import { CURRENT_SCHEMA_VERSION } from '@/schemas/version'
import { migrateToCurrentSchema } from '@/schemas/migrations'
import type { MatchDocument } from '@/domain/match/types'
import { checkInningsInvariants } from '@/engine/calculations/checkInvariants'
import type { InvariantViolation } from '@/engine/calculations/checkInvariants'
import { createId } from '@/utils/id'

/** Configurable import size cap, per the plan (section 18: "Keep import file-size limits configurable and explain them to users"). */
export const MAX_IMPORT_FILE_SIZE_BYTES = 20 * 1024 * 1024

export function isFileTooLarge(file: File): boolean {
  return file.size > MAX_IMPORT_FILE_SIZE_BYTES
}

export type ImportFailureReason =
  | 'invalid-json'
  | 'not-boundaryx-file'
  | 'unsupported-schema-version'
  | 'invalid-match-document'

export interface ImportFailure {
  fileName: string
  reason: ImportFailureReason
  message: string
}

export interface ImportSuccess {
  fileName: string
  matches: MatchDocument[]
}

export type ImportFileResult = ImportSuccess | ImportFailure

export function isImportFailure(result: ImportFileResult): result is ImportFailure {
  return 'reason' in result
}

/**
 * Parses and validates one uploaded file's text content against the
 * BoundaryX match/bundle schema. Never throws — every failure mode (bad
 * JSON, wrong app, unsupported schema version, a field that fails
 * validation) is returned as a typed ImportFailure so a multi-file import
 * can report successes and failures independently per the plan (section
 * 11.1: "process each file independently").
 */
export function parseImportedFile(fileName: string, text: string): ImportFileResult {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    return {
      fileName,
      reason: 'invalid-json',
      message: 'This file is not valid JSON.',
    }
  }

  const identity = fileIdentitySchema.safeParse(parsed)
  if (!identity.success || identity.data.app !== 'BoundaryX') {
    return {
      fileName,
      reason: 'not-boundaryx-file',
      message: 'This file does not look like a BoundaryX export.',
    }
  }

  if (identity.data.schemaVersion > CURRENT_SCHEMA_VERSION) {
    return {
      fileName,
      reason: 'unsupported-schema-version',
      message: `This file was exported with a newer schema version (${identity.data.schemaVersion}) than this app supports (${CURRENT_SCHEMA_VERSION}). Update BoundaryX to import it.`,
    }
  }

  if (identity.data.schemaVersion < CURRENT_SCHEMA_VERSION) {
    try {
      parsed = migrateToCurrentSchema(parsed, identity.data.schemaVersion).migrated
    } catch (migrationError) {
      return {
        fileName,
        reason: 'unsupported-schema-version',
        message:
          migrationError instanceof Error
            ? migrationError.message
            : 'This file uses an older schema version that could not be migrated.',
      }
    }
  }

  const bundleResult = matchBundleFileSchema.safeParse(parsed)
  if (bundleResult.success) {
    return { fileName, matches: bundleResult.data.matches }
  }

  const singleResult = matchFileSchema.safeParse(parsed)
  if (singleResult.success) {
    return { fileName, matches: [singleResult.data.match] }
  }

  return {
    fileName,
    reason: 'invalid-match-document',
    message: singleResult.error.issues[0]
      ? `${singleResult.error.issues[0].path.join('.')}: ${singleResult.error.issues[0].message}`
      : 'This file does not match the expected BoundaryX match format.',
  }
}

export interface MatchConsistencyReport {
  matchId: string
  matchName: string
  violations: InvariantViolation[]
}

/**
 * Recalculates derived figures for every innings of an imported match and
 * compares them with whatever the file shipped, per the plan's import
 * workflow (section 11.1, steps 8-9: "recalculate derived score data" and
 * "compare recalculated values with any included cached values"). A
 * mismatch is surfaced in the import preview rather than silently trusted
 * or silently corrected — the user decides whether to still import it.
 */
export function checkMatchConsistency(match: MatchDocument): MatchConsistencyReport {
  const violations = match.innings.flatMap((innings) =>
    checkInningsInvariants(innings, match.rulesProfile)
  )
  return { matchId: match.id, matchName: match.name, violations }
}

/**
 * Produces a copy of an imported match under a new document id, preserving
 * sourceMatchId so the copy's lineage stays traceable — the original event
 * history and every other field are kept exactly as imported, only the
 * document identity changes (plan section 11.2).
 */
export function importAsCopy(match: MatchDocument): MatchDocument {
  return {
    ...match,
    id: createId('match'),
    sourceMatchId: match.sourceMatchId ?? match.id,
  }
}
