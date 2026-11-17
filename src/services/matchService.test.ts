import { describe, expect, it } from 'vitest'
import { createMatchDocument } from '@/services/matchService'
import { createTeam } from '@/domain/team/types'
import { createPlayer } from '@/domain/player/types'

function buildTeam(prefix: string) {
  const squad = Array.from({ length: 11 }, (_, i) =>
    createPlayer({ id: `${prefix}${i}`, name: `${prefix} Player ${i}` })
  )
  return createTeam({
    id: `team-${prefix}`,
    name: `Team ${prefix}`,
    squad,
  })
}

describe('createMatchDocument', () => {
  const teamA = buildTeam('A')
  const teamB = buildTeam('B')

  it('resolves a standard, non-custom rules profile for an untouched format pick', () => {
    const match = createMatchDocument({
      name: 'Test Match',
      matchDate: '2026-11-15',
      format: 'T20',
      teamA,
      teamB,
      playingXiA: teamA.squad.map((p) => p.id),
      playingXiB: teamB.squad.map((p) => p.id),
    })
    expect(match.rulesProfile.id).toBe('standard-t20')
    expect(match.rulesProfile.label).not.toContain('custom')
  })

  it('reflects an explicit oversPerInnings override in the resolved rules profile', () => {
    const match = createMatchDocument({
      name: 'Shortened Match',
      matchDate: '2026-11-15',
      format: 'T20',
      formatConfigOverrides: { oversPerInnings: 16 },
      teamA,
      teamB,
      playingXiA: teamA.squad.map((p) => p.id),
      playingXiB: teamB.squad.map((p) => p.id),
    })
    expect(match.rulesProfile.oversPerInnings).toBe(16)
    expect(match.rulesProfile.isOfficial).toBe(false)
    expect(match.rulesProfile.label).toContain('custom')
  })

  it('always marks a Custom format as non-official regardless of overrides', () => {
    const match = createMatchDocument({
      name: 'Backyard Match',
      matchDate: '2026-11-15',
      format: 'Custom',
      teamA,
      teamB,
      playingXiA: teamA.squad.map((p) => p.id),
      playingXiB: teamB.squad.map((p) => p.id),
    })
    expect(match.rulesProfile.isOfficial).toBe(false)
  })

  it('starts with an empty innings array', () => {
    const match = createMatchDocument({
      name: 'Test Match',
      matchDate: '2026-11-15',
      format: 'T20',
      teamA,
      teamB,
      playingXiA: teamA.squad.map((p) => p.id),
      playingXiB: teamB.squad.map((p) => p.id),
    })
    expect(match.innings).toEqual([])
  })
})
