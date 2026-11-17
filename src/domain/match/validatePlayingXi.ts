import type { Team } from '@/domain/team/types'

export interface PlayingXiValidationResult {
  valid: boolean
  errors: string[]
}

/**
 * Validates a playing XI against the squad and an expected count. Each
 * team chooses its own count independently — there is no format-level
 * requirement that both teams field the same number of players.
 */
export function validatePlayingXi(
  team: Team,
  playingXiIds: string[],
  expectedCount: number,
  captainId?: string,
  wicketkeeperId?: string
): PlayingXiValidationResult {
  const errors: string[] = []
  const squadIds = new Set(team.squad.map((p) => p.id))
  const uniqueXiIds = new Set(playingXiIds)

  if (playingXiIds.length !== expectedCount) {
    errors.push(
      `${team.name} must select exactly ${expectedCount} players (selected ${playingXiIds.length}).`
    )
  }

  if (uniqueXiIds.size !== playingXiIds.length) {
    errors.push(`${team.name}'s playing XI contains duplicate players.`)
  }

  for (const id of playingXiIds) {
    if (!squadIds.has(id)) {
      errors.push(`${team.name}'s playing XI includes a player not in the squad.`)
      break
    }
  }

  if (captainId && !uniqueXiIds.has(captainId)) {
    errors.push(`${team.name}'s captain must be part of the playing XI.`)
  }

  if (wicketkeeperId && !uniqueXiIds.has(wicketkeeperId)) {
    errors.push(`${team.name}'s wicketkeeper must be part of the playing XI.`)
  }

  return { valid: errors.length === 0, errors }
}
