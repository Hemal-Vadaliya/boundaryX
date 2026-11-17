import { describe, expect, it } from 'vitest'
import { validatePlayingXi } from '@/domain/match/validatePlayingXi'
import { createTeam } from '@/domain/team/types'
import { createPlayer } from '@/domain/player/types'

function buildTeamWithSquad(size: number) {
  const players = Array.from({ length: size }, (_, i) =>
    createPlayer({ id: `p${i}`, name: `Player ${i}` })
  )
  return createTeam({ id: 'team1', name: 'Team One', squad: players })
}

describe('validatePlayingXi', () => {
  it('passes for exactly the expected count of unique squad members', () => {
    const team = buildTeamWithSquad(15)
    const xi = team.squad.slice(0, 11).map((p) => p.id)
    const result = validatePlayingXi(team, xi, 11)
    expect(result.valid).toBe(true)
    expect(result.errors).toEqual([])
  })

  it('fails when the count does not match the expected count', () => {
    const team = buildTeamWithSquad(15)
    const xi = team.squad.slice(0, 9).map((p) => p.id)
    const result = validatePlayingXi(team, xi, 11)
    expect(result.valid).toBe(false)
    expect(result.errors.join(' ')).toMatch(/exactly 11/)
  })

  it('fails on duplicate players in the XI', () => {
    const team = buildTeamWithSquad(15)
    const xi = [...team.squad.slice(0, 10).map((p) => p.id), team.squad[0].id]
    const result = validatePlayingXi(team, xi, 11)
    expect(result.valid).toBe(false)
    expect(result.errors.join(' ')).toMatch(/duplicate/)
  })

  it('fails when a selected player is not in the squad', () => {
    const team = buildTeamWithSquad(11)
    const xi = [...team.squad.slice(0, 10).map((p) => p.id), 'not-in-squad']
    const result = validatePlayingXi(team, xi, 11)
    expect(result.valid).toBe(false)
    expect(result.errors.join(' ')).toMatch(/not in the squad/)
  })

  it('fails when the captain or wicketkeeper is not part of the XI', () => {
    const team = buildTeamWithSquad(15)
    const xi = team.squad.slice(0, 11).map((p) => p.id)
    const result = validatePlayingXi(team, xi, 11, 'p14', 'p13')
    expect(result.valid).toBe(false)
    expect(result.errors.join(' ')).toMatch(/captain/)
    expect(result.errors.join(' ')).toMatch(/wicketkeeper/)
  })

  it('respects an independently chosen squad size', () => {
    const team = buildTeamWithSquad(10)
    const xi = team.squad.slice(0, 8).map((p) => p.id)
    const result = validatePlayingXi(team, xi, 8)
    expect(result.valid).toBe(true)
  })
})
