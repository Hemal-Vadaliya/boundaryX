import { z } from 'zod'
import { matchDocumentSchema } from '@/schemas/match.schema'

/**
 * On-disk envelope for a single exported match. The plan requires every
 * JSON file to declare app identity, schema version and engine/rules
 * version so imports can be validated and migrated deterministically
 * (section 10.5) rather than silently reinterpreted.
 */
export const matchFileSchema = z.object({
  app: z.literal('BoundaryX'),
  schemaVersion: z.number().int().positive(),
  match: matchDocumentSchema,
  metadata: z.object({
    exportedAt: z.string().min(1),
    engineVersion: z.string().min(1),
  }),
})

export type MatchFile = z.infer<typeof matchFileSchema>

/** On-disk envelope for an "export all" session bundle (one file, many matches). */
export const matchBundleFileSchema = z.object({
  app: z.literal('BoundaryX'),
  schemaVersion: z.number().int().positive(),
  matches: z.array(matchDocumentSchema),
  metadata: z.object({
    exportedAt: z.string().min(1),
    engineVersion: z.string().min(1),
    matchCount: z.number().int().nonnegative(),
  }),
})

export type MatchBundleFile = z.infer<typeof matchBundleFileSchema>

/**
 * Loosest possible pre-check: confirms the parsed JSON at least looks like
 * a BoundaryX file and carries a schemaVersion, before full validation.
 * Used to produce a clear "not a BoundaryX file" error distinct from a
 * detailed field-level validation failure.
 */
export const fileIdentitySchema = z.object({
  app: z.string(),
  schemaVersion: z.number(),
})
