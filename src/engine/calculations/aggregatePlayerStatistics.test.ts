import { describe, expect, it } from 'vitest'
import { aggregatePlayerStatistics } from '@/engine/calculations/aggregatePlayerStatistics'
import { createMatchDocument } from '@/services/matchService'
import { createTeam } from '@/domain/team/types'
import { createPlayer } from '@/domain/player/types'
import { bowlBall, t20Profile } from '@/engine/test/engineTestHelpers'
import { createInnings } from '@/engine/innings/createInnings'

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

describe('aggregatePlayerStatistics', () => {
  it('sums batting and bowling figures for a player across multiple matches', () => {
    const teamA = buildTeam('A')
    const teamB = buildTeam('B')
    const rulesProfile = t20Profile()

    function makeMatchWithInnings(runs: number) {
      const match = createMatchDocument({
        name: 'M',
        matchDate: '2026-11-15',
        format: 'T20',
        teamA,
        teamB,
        playingXiA: teamA.squad.map((p) => p.id),
        playingXiB: teamB.squad.map((p) => p.id),
      })
      let innings = createInnings({
        id: 'i1',
        matchId: match.id,
        battingTeamId: teamA.id,
        bowlingTeamId: teamB.id,
        inningsNumber: 1,
        openingStriker: 'A0',
        openingNonStriker: 'A1',
      })
      innings = bowlBall(innings, rulesProfile, { bowlerForNewOver: 'B0', runs })
      match.innings = [innings]
      return match
    }

    const matchOne = makeMatchWithInnings(4)
    const matchTwo = makeMatchWithInnings(6)

    const stats = aggregatePlayerStatistics([matchOne, matchTwo])
    const strikerStats = stats.find((s) => s.playerId === 'A0')
    expect(strikerStats?.runs).toBe(10)
    expect(strikerStats?.matches).toBe(2)

    const bowlerStats = stats.find((s) => s.playerId === 'B0')
    expect(bowlerStats?.runsConceded).toBe(10)
  })

  it('keeps players with the same display name but different ids separate', () => {
    const teamA = createTeam({
      id: 'teamA',
      name: 'A',
      squad: [
        createPlayer({ id: 'x1', name: 'Sam' }),
        createPlayer({ id: 'x2', name: 'Sam' }),
      ],
    })
    const teamB = buildTeam('B')
    const match = createMatchDocument({
      name: 'M',
      matchDate: '2026-11-15',
      format: 'T20',
      teamA,
      teamB,
      playingXiA: ['x1', 'x2'],
      playingXiB: teamB.squad.map((p) => p.id),
    })
    let innings = createInnings({
      id: 'i1',
      matchId: match.id,
      battingTeamId: teamA.id,
      bowlingTeamId: teamB.id,
      inningsNumber: 1,
      openingStriker: 'x1',
      openingNonStriker: 'x2',
    })
    innings = bowlBall(innings, t20Profile(), { bowlerForNewOver: 'B0', runs: 4 })
    match.innings = [innings]

    const stats = aggregatePlayerStatistics([match])
    const samEntries = stats.filter((s) => s.playerName === 'Sam')
    expect(samEntries).toHaveLength(2)
    expect(samEntries.map((s) => s.playerId).sort()).toEqual(['x1', 'x2'])
  })

  it('returns an empty list for no matches', () => {
    expect(aggregatePlayerStatistics([])).toEqual([])
  })
})
