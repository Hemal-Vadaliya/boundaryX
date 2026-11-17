import type { Player } from '@/domain/player/types'

export interface Team {
  id: string
  name: string
  squad: Player[]
  captainId?: string
  wicketkeeperId?: string
}

export function createTeam(
  overrides: Partial<Team> & { id: string; name: string }
): Team {
  return {
    squad: [],
    ...overrides,
  }
}
