/**
 * Schema and engine versioning. Bump CURRENT_SCHEMA_VERSION whenever the
 * on-disk MatchDocument shape changes in a way that requires a migration
 * (see migrations.ts) — imports with a newer, unsupported schema version
 * must be rejected with a clear message rather than silently reinterpreted.
 */
export const CURRENT_SCHEMA_VERSION = 1
export const ENGINE_VERSION = '1.0.0'
export const APP_NAME = 'BoundaryX'
