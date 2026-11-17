import type { MatchDocument } from '@/domain/match/types'
import { CURRENT_SCHEMA_VERSION, ENGINE_VERSION, APP_NAME } from '@/schemas/version'
import type { MatchFile, MatchBundleFile } from '@/schemas/import.schema'

/**
 * Collapses whitespace/punctuation runs into single dashes so the exported
 * filename stays readable and filesystem-safe across platforms.
 */
function slugify(value: string): string {
  return (
    value
      .trim()
      .replace(/[^a-zA-Z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'match'
  )
}

export function buildMatchFilename(match: MatchDocument): string {
  const [teamA, teamB] = match.teams
  const slug = slugify(`${teamA.team.name}-vs-${teamB.team.name}`)
  return `${APP_NAME}_${slug}_${match.matchDate}.json`
}

export function buildBundleFilename(matchCount: number): string {
  const date = new Date().toISOString().slice(0, 10)
  return `${APP_NAME}_session-export_${matchCount}-matches_${date}.json`
}

/**
 * Builds the on-disk envelope for a single match. The match document is
 * serialized as-is: every total/figure it carries is already derived from
 * innings[].deliveries at read time (see Phase 5's calculations layer), so
 * there is nothing separate here to "recompute" before export — the
 * authoritative record and the exported record are the same object.
 */
export function buildMatchFile(match: MatchDocument): MatchFile {
  return {
    app: 'BoundaryX',
    schemaVersion: CURRENT_SCHEMA_VERSION,
    match,
    metadata: {
      exportedAt: new Date().toISOString(),
      engineVersion: ENGINE_VERSION,
    },
  }
}

export function buildBundleFile(matches: MatchDocument[]): MatchBundleFile {
  return {
    app: 'BoundaryX',
    schemaVersion: CURRENT_SCHEMA_VERSION,
    matches,
    metadata: {
      exportedAt: new Date().toISOString(),
      engineVersion: ENGINE_VERSION,
      matchCount: matches.length,
    },
  }
}

export function serializeMatchFile(match: MatchDocument): string {
  return JSON.stringify(buildMatchFile(match), null, 2)
}

export function serializeBundleFile(matches: MatchDocument[]): string {
  return JSON.stringify(buildBundleFile(matches), null, 2)
}
