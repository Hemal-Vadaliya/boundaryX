import type { Innings } from '@/domain/innings/types'
import type { EngineResult } from '@/engine/engineResult'
import { ok, err } from '@/engine/engineResult'

export function endInnings(innings: Innings): EngineResult<Innings> {
  if (innings.state === 'completed') {
    return err('INNINGS_ALREADY_COMPLETED', 'This innings has already ended.')
  }
  return ok({
    ...innings,
    state: 'completed',
    currentBatters: undefined,
    currentBowlerId: undefined,
  })
}
