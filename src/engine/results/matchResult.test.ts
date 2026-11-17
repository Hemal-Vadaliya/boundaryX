import { describe, expect, it } from 'vitest'
import { createMatchDocument } from '@/services/matchService'
import { createTeam } from '@/domain/team/types'
import { createPlayer } from '@/domain/player/types'
import { createInnings } from '@/engine/innings/createInnings'
import { determineMatchResult } from '@/engine/results/matchResult'
import { standardFormatProfile } from '@/engine/rules/formats/standardProfiles'
import { bowlBall } from '@/engine/test/engineTestHelpers'
import { endInnings } from '@/engine/commands/endInnings'
import type { MatchDocument } from '@/domain/match/types'

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

function buildMatch(format: 'T20' | 'Test'): MatchDocument {
  const teamA = buildTeam('A')
  const teamB = buildTeam('B')
  const match = createMatchDocument({
    name: 'Test Match',
    matchDate: '2026-11-15',
    format,
    teamA,
    teamB,
    playingXiA: teamA.squad.map((p) => p.id),
    playingXiB: teamB.squad.map((p) => p.id),
  })
  match.toss = { wonByTeamId: teamA.id, decision: 'bat' }
  return match
}

function completedInnings(battingTeamId: string, bowlingTeamId: string, runs: number) {
  const profile = standardFormatProfile('T20')
  let innings = createInnings({
    id: `innings-${battingTeamId}-${Math.random()}`,
    matchId: 'm1',
    battingTeamId,
    bowlingTeamId,
    inningsNumber: 1,
    openingStriker: 'p1',
    openingNonStriker: 'p2',
  })
  innings = bowlBall(innings, profile, { bowlerForNewOver: 'b1', runs })
  const ended = endInnings(innings)
  if (!ended.ok) throw new Error(ended.error.message)
  return ended.value
}

describe('determineMatchResult', () => {
  it('returns undefined before both limited-overs innings are complete', () => {
    const match = buildMatch('T20')
    match.innings = [
      completedInnings(match.teams[0].team.id, match.teams[1].team.id, 150),
    ]
    expect(determineMatchResult(match, match.rulesProfile)).toBeUndefined()
  })

  it('reports a win for the chasing team once both limited-overs innings complete', () => {
    const match = buildMatch('T20')
    match.innings = [
      completedInnings(match.teams[0].team.id, match.teams[1].team.id, 140),
      completedInnings(match.teams[1].team.id, match.teams[0].team.id, 150),
    ]
    const result = determineMatchResult(match, match.rulesProfile)
    expect(result?.outcome).toBe('win')
    expect(result?.winningTeamId).toBe(match.teams[1].team.id)
  })

  it('reports a win for the team batting first when the chase falls short', () => {
    const match = buildMatch('T20')
    match.innings = [
      completedInnings(match.teams[0].team.id, match.teams[1].team.id, 180),
      completedInnings(match.teams[1].team.id, match.teams[0].team.id, 120),
    ]
    const result = determineMatchResult(match, match.rulesProfile)
    expect(result?.outcome).toBe('win')
    expect(result?.winningTeamId).toBe(match.teams[0].team.id)
  })

  it('returns undefined for a Test match with no innings yet', () => {
    const match = buildMatch('Test')
    expect(determineMatchResult(match, match.rulesProfile)).toBeUndefined()
  })

  it('determines a Test result once all four innings are complete', () => {
    const match = buildMatch('Test')
    match.innings = [
      completedInnings(match.teams[0].team.id, match.teams[1].team.id, 300),
      completedInnings(match.teams[1].team.id, match.teams[0].team.id, 250),
      completedInnings(match.teams[0].team.id, match.teams[1].team.id, 200),
      completedInnings(match.teams[1].team.id, match.teams[0].team.id, 100),
    ]
    const result = determineMatchResult(match, match.rulesProfile)
    expect(result?.outcome).toBe('win')
    expect(result?.winningTeamId).toBe(match.teams[0].team.id)
  })
})
