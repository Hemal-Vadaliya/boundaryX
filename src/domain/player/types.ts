export interface Player {
  id: string
  name: string
}

export function createPlayer(overrides: { id: string; name: string }): Player {
  return { ...overrides }
}
