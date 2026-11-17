import { describe, expect, it } from 'vitest'
import { createMatchDocument } from '@/services/matchService'
import { createTeam } from '@/domain/team/types'
import { createPlayer } from '@/domain/player/types'
import { createInnings } from '@/engine/innings/createInnings'
import { determineNextInnings } from '@/engine/innings/nextInnings'
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

describe('determineNextInnings', () => {
  it('starts innings 1 with the toss-winning team batting first', () => {
    const match = buildMatch('T20')
    const plan = determineNextInnings(match, match.rulesProfile)
    expect(plan?.inningsNumber).toBe(1)
    expect(plan?.battingTeamId).toBe(match.teams[0].team.id)
    expect(plan?.isLastInnings).toBe(false)
  })

  it('sets the chase target and marks the second innings as last for a limited-overs match', () => {
    const match = buildMatch('T20')
    match.innings = [
      completedInnings(match.teams[0].team.id, match.teams[1].team.id, 150),
    ]
    const plan = determineNextInnings(match, match.rulesProfile)
    expect(plan?.inningsNumber).toBe(2)
    expect(plan?.battingTeamId).toBe(match.teams[1].team.id)
    expect(plan?.isLastInnings).toBe(true)
    expect(plan?.target).toBe(151)
  })

  it('returns undefined once both limited-overs innings are complete', () => {
    const match = buildMatch('T20')
    match.innings = [
      completedInnings(match.teams[0].team.id, match.teams[1].team.id, 150),
      completedInnings(match.teams[1].team.id, match.teams[0].team.id, 140),
    ]
    expect(determineNextInnings(match, match.rulesProfile)).toBeUndefined()
  })

  it('flags a follow-on decision when the deficit meets the Test margin', () => {
    const match = buildMatch('Test')
    match.innings = [
      completedInnings(match.teams[0].team.id, match.teams[1].team.id, 450),
      completedInnings(match.teams[1].team.id, match.teams[0].team.id, 200),
    ]
    const plan = determineNextInnings(match, match.rulesProfile)
    expect(plan?.followOnDecisionNeeded).toBe(true)
    expect(plan?.followOnBattingTeamId).toBe(match.teams[1].team.id)
  })

  it('enforces the follow-on when the caller opts in', () => {
    const match = buildMatch('Test')
    match.innings = [
      completedInnings(match.teams[0].team.id, match.teams[1].team.id, 450),
      completedInnings(match.teams[1].team.id, match.teams[0].team.id, 200),
    ]
    const plan = determineNextInnings(match, match.rulesProfile, true)
    expect(plan?.battingTeamId).toBe(match.teams[1].team.id)
    expect(plan?.followOnDecisionNeeded).toBe(false)
  })

  it('does not enforce the follow-on when the caller declines', () => {
    const match = buildMatch('Test')
    match.innings = [
      completedInnings(match.teams[0].team.id, match.teams[1].team.id, 450),
      completedInnings(match.teams[1].team.id, match.teams[0].team.id, 200),
    ]
    const plan = determineNextInnings(match, match.rulesProfile, false)
    expect(plan?.battingTeamId).toBe(match.teams[0].team.id)
  })

  it('does not require a follow-on decision when the deficit is below the margin', () => {
    const match = buildMatch('Test')
    match.innings = [
      completedInnings(match.teams[0].team.id, match.teams[1].team.id, 350),
      completedInnings(match.teams[1].team.id, match.teams[0].team.id, 200),
    ]
    const plan = determineNextInnings(match, match.rulesProfile)
    expect(plan?.followOnDecisionNeeded).toBe(false)
    expect(plan?.battingTeamId).toBe(match.teams[0].team.id)
  })
})
