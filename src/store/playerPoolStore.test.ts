import { describe, expect, it, beforeEach } from 'vitest'
import { usePlayerPoolStore } from '@/store/playerPoolStore'

function resetStore() {
  usePlayerPoolStore.setState({ players: [], teamAAssignedIds: [], teamBAssignedIds: [] })
  sessionStorage.clear()
}

describe('playerPoolStore', () => {
  beforeEach(() => {
    resetStore()
  })

  it('adds a player to the pool', () => {
    usePlayerPoolStore.getState().addPlayer('Alice')
    const { players } = usePlayerPoolStore.getState()
    expect(players).toHaveLength(1)
    expect(players[0]?.name).toBe('Alice')
  })

  it('removes a player and clears their team assignment', () => {
    usePlayerPoolStore.getState().addPlayer('Alice')
    const playerId = usePlayerPoolStore.getState().players[0]!.id
    usePlayerPoolStore.getState().assignToTeam(playerId, 'A')
    usePlayerPoolStore.getState().removePlayer(playerId)

    const state = usePlayerPoolStore.getState()
    expect(state.players).toHaveLength(0)
    expect(state.teamAAssignedIds).not.toContain(playerId)
  })

  it('assigns a player to a team, removing them from the other team if reassigned', () => {
    usePlayerPoolStore.getState().addPlayer('Alice')
    const playerId = usePlayerPoolStore.getState().players[0]!.id

    usePlayerPoolStore.getState().assignToTeam(playerId, 'A')
    expect(usePlayerPoolStore.getState().teamAAssignedIds).toContain(playerId)

    usePlayerPoolStore.getState().assignToTeam(playerId, 'B')
    const state = usePlayerPoolStore.getState()
    expect(state.teamAAssignedIds).not.toContain(playerId)
    expect(state.teamBAssignedIds).toContain(playerId)
  })

  it('unassigns a player from whichever team they were on', () => {
    usePlayerPoolStore.getState().addPlayer('Alice')
    const playerId = usePlayerPoolStore.getState().players[0]!.id
    usePlayerPoolStore.getState().assignToTeam(playerId, 'A')
    usePlayerPoolStore.getState().unassign(playerId)

    const state = usePlayerPoolStore.getState()
    expect(state.teamAAssignedIds).not.toContain(playerId)
    expect(state.teamBAssignedIds).not.toContain(playerId)
  })

  it('swaps two players assigned to opposite teams', () => {
    usePlayerPoolStore.getState().addPlayer('Alice')
    usePlayerPoolStore.getState().addPlayer('Bob')
    const [alice, bob] = usePlayerPoolStore.getState().players
    usePlayerPoolStore.getState().assignToTeam(alice!.id, 'A')
    usePlayerPoolStore.getState().assignToTeam(bob!.id, 'B')

    usePlayerPoolStore.getState().swapPlayers(alice!.id, bob!.id)

    const state = usePlayerPoolStore.getState()
    expect(state.teamAAssignedIds).toContain(bob!.id)
    expect(state.teamAAssignedIds).not.toContain(alice!.id)
    expect(state.teamBAssignedIds).toContain(alice!.id)
    expect(state.teamBAssignedIds).not.toContain(bob!.id)
  })

  it('does nothing when swapping two players on the same team', () => {
    usePlayerPoolStore.getState().addPlayer('Alice')
    usePlayerPoolStore.getState().addPlayer('Bob')
    const [alice, bob] = usePlayerPoolStore.getState().players
    usePlayerPoolStore.getState().assignToTeam(alice!.id, 'A')
    usePlayerPoolStore.getState().assignToTeam(bob!.id, 'A')

    usePlayerPoolStore.getState().swapPlayers(alice!.id, bob!.id)

    const state = usePlayerPoolStore.getState()
    expect(state.teamAAssignedIds).toContain(alice!.id)
    expect(state.teamAAssignedIds).toContain(bob!.id)
  })

  it('resetAssignments clears team assignments but keeps the pool', () => {
    usePlayerPoolStore.getState().addPlayer('Alice')
    const playerId = usePlayerPoolStore.getState().players[0]!.id
    usePlayerPoolStore.getState().assignToTeam(playerId, 'A')

    usePlayerPoolStore.getState().resetAssignments()

    const state = usePlayerPoolStore.getState()
    expect(state.players).toHaveLength(1)
    expect(state.teamAAssignedIds).toHaveLength(0)
    expect(state.teamBAssignedIds).toHaveLength(0)
  })
})
