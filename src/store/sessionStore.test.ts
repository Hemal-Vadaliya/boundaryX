import { describe, expect, it, beforeEach } from 'vitest'
import { useSessionStore } from '@/store/sessionStore'
import { createMatchDocument } from '@/services/matchService'
import { createTeam } from '@/domain/team/types'
import { createPlayer } from '@/domain/player/types'

function buildSquad(prefix: string, size: number) {
  return Array.from({ length: size }, (_, i) =>
    createPlayer({ id: `${prefix}${i}`, name: `${prefix} Player ${i}` })
  )
}

function makeDocument(id: string, name = `Match ${id}`) {
  const teamA = createTeam({
    id: 'teamA',
    name: 'Team A',
    squad: buildSquad('a', 11),
  })
  const teamB = createTeam({
    id: 'teamB',
    name: 'Team B',
    squad: buildSquad('b', 11),
  })
  const document = createMatchDocument({
    name,
    matchDate: '2026-11-15',
    format: 'T20',
    teamA,
    teamB,
    playingXiA: teamA.squad.map((p) => p.id),
    playingXiB: teamB.squad.map((p) => p.id),
  })
  return { ...document, id }
}

describe('sessionStore', () => {
  beforeEach(() => {
    useSessionStore.setState({ matches: {}, matchOrder: [], activeMatchId: null })
  })

  it('adds a match as dirty by default', () => {
    useSessionStore.getState().addMatch(makeDocument('m1'))
    const state = useSessionStore.getState()
    expect(state.matchOrder).toEqual(['m1'])
    expect(state.matches.m1?.dirty).toBe(true)
  })

  it('does not overwrite an existing match with the same id', () => {
    const { addMatch } = useSessionStore.getState()
    addMatch(makeDocument('m1'))
    addMatch(makeDocument('m1', 'Different name'))
    expect(useSessionStore.getState().matchOrder).toEqual(['m1'])
    expect(useSessionStore.getState().matches.m1?.document.name).toBe('Match m1')
  })

  it('adding a second match does not remove the first (multi-match session)', () => {
    const { addMatch } = useSessionStore.getState()
    addMatch(makeDocument('m1'))
    addMatch(makeDocument('m2'))
    expect(useSessionStore.getState().matchOrder).toEqual(['m1', 'm2'])
  })

  it('marks a match clean after export and dirty again after an edit', () => {
    const { addMatch, markClean, markDirty } = useSessionStore.getState()
    addMatch(makeDocument('m1'))
    markClean('m1')
    expect(useSessionStore.getState().matches.m1?.dirty).toBe(false)
    markDirty('m1')
    expect(useSessionStore.getState().matches.m1?.dirty).toBe(true)
  })

  it('removing a match clears it from the order and as active match', () => {
    const { addMatch, setActiveMatch, removeMatch } = useSessionStore.getState()
    addMatch(makeDocument('m1'))
    setActiveMatch('m1')
    removeMatch('m1')
    const state = useSessionStore.getState()
    expect(state.matchOrder).toEqual([])
    expect(state.activeMatchId).toBeNull()
  })

  it('updateMatch applies the updater and marks the match dirty', () => {
    const { addMatch, markClean, updateMatch } = useSessionStore.getState()
    addMatch(makeDocument('m1'))
    markClean('m1')
    updateMatch('m1', (doc) => ({ ...doc, venue: 'New Venue' }))
    const state = useSessionStore.getState()
    expect(state.matches.m1?.document.venue).toBe('New Venue')
    expect(state.matches.m1?.dirty).toBe(true)
  })
})
