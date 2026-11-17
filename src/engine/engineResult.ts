/**
 * Structured error returned when a scoring command fails validation. The
 * original match/innings document must remain completely unchanged when
 * this is returned — callers check `ok` before touching `value`.
 */
export interface EngineError {
  code: string
  message: string
}

export type EngineResult<T> = { ok: true; value: T } | { ok: false; error: EngineError }

export function ok<T>(value: T): EngineResult<T> {
  return { ok: true, value }
}

export function err<T>(code: string, message: string): EngineResult<T> {
  return { ok: false, error: { code, message } }
}
