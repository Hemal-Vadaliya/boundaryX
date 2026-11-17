import type { Innings } from '@/domain/innings/types'
import type { RulesProfile } from '@/engine/rules/types'
import type { EngineResult } from '@/engine/engineResult'
import { ok, err } from '@/engine/engineResult'
import { computeBatterInnings } from '@/engine/calculations/battingFigures'

/**
 * Determines whether a player currently has an open ("retired hurt but not
 * yet returned") retirement, purely from the retirements log — a player is
 * retired-hurt whenever they have strictly more retired-hurt events than
 * return events recorded.
 */
function isCurrentlyRetiredHurt(innings: Innings, playerId: string): boolean {
  let retiredCount = 0
  let returnedCount = 0
  for (const event of innings.retirements) {
    if (event.playerId !== playerId) continue
    if (event.type === 'retired-hurt') retiredCount += 1
    else returnedCount += 1
  }
  return retiredCount > returnedCount
}

/**
 * Retires a batter hurt, replacing them at the crease with another
 * available batter. If the incoming batter already has an open
 * retired-hurt entry, this call is treated as their return — one command
 * naturally covers both halves of the retire/return cycle, matching the
 * plan's requirement (section 12.5) that retired hurt and return are
 * batter-state events distinct from ordinary dismissals.
 */
export function retireBatterHurt(
  innings: Innings,
  _rulesProfile: RulesProfile,
  retiringPlayerId: string,
  incomingBatterId: string,
  nowIso: string
): EngineResult<Innings> {
  if (innings.state !== 'in-progress') {
    return err(
      'INNINGS_NOT_IN_PROGRESS',
      'A batter can only be retired while the innings is in progress.'
    )
  }
  if (!innings.currentBatters) {
    return err('NO_BATTERS_AT_CREASE', 'No batters are currently set at the crease.')
  }
  if (
    retiringPlayerId !== innings.currentBatters.striker &&
    retiringPlayerId !== innings.currentBatters.nonStriker
  ) {
    return err(
      'INVALID_RETIRING_PLAYER',
      'The retiring player must be one of the two batters at the crease.'
    )
  }
  if (
    incomingBatterId === innings.currentBatters.striker ||
    incomingBatterId === innings.currentBatters.nonStriker
  ) {
    return err('INVALID_INCOMING_PLAYER', 'The incoming batter is already at the crease.')
  }

  const retiredEnd: 'striker' | 'nonStriker' =
    retiringPlayerId === innings.currentBatters.striker ? 'striker' : 'nonStriker'

  const currentBatters = {
    ...innings.currentBatters,
    [retiredEnd]: incomingBatterId,
  }

  const wasReturning = isCurrentlyRetiredHurt(innings, incomingBatterId)
  const retirements = [
    ...innings.retirements,
    {
      playerId: retiringPlayerId,
      type: 'retired-hurt' as const,
      timestamp: nowIso,
    },
    ...(wasReturning
      ? [{ playerId: incomingBatterId, type: 'return' as const, timestamp: nowIso }]
      : []),
  ]

  const batterInnings = computeBatterInnings(innings.deliveries)
  if (batterInnings[retiringPlayerId]) {
    batterInnings[retiringPlayerId] = {
      ...batterInnings[retiringPlayerId]!,
      state: 'retired-hurt',
    }
  }
  if (batterInnings[incomingBatterId]) {
    batterInnings[incomingBatterId] = {
      ...batterInnings[incomingBatterId]!,
      state: 'batting',
    }
  }

  return ok({
    ...innings,
    currentBatters,
    retirements,
    batterInnings,
  })
}
