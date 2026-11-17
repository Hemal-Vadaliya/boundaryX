import type { MatchDocument } from '@/domain/match/types'
import { resolveBattingTeamId } from '@/domain/match/types'
import type { RulesProfile } from '@/engine/rules/types'
import { computeInningsTotals } from '@/engine/calculations/inningsTotals'
import { isFollowOnEligible } from '@/engine/innings/followOn'

export interface NextInningsPlan {
  inningsNumber: number
  battingTeamId: string
  bowlingTeamId: string
  /** Set only for the final innings of the match — the runs the batting team needs to win. */
  target?: number
  /** True when this would be the last innings of the match. */
  isLastInnings: boolean
  /** True when the team that bowled first innings is eligible to enforce the follow-on and a decision is required before this innings can be set up. */
  followOnDecisionNeeded: boolean
  /** The team that would bat again if the follow-on is enforced (only meaningful when followOnDecisionNeeded is true). */
  followOnBattingTeamId?: string
}

/**
 * Determines who bats next and whether the match is already over. Handles
 * the two realistic shapes the plan covers: a single innings per team
 * (T10/T20/ODI/Custom) and two innings per team with follow-on (Test).
 * Returns undefined once every innings the format calls for has been
 * completed — callers should treat that as "no further innings to start".
 */
export function determineNextInnings(
  match: Pick<MatchDocument, 'teams' | 'innings' | 'toss'>,
  rulesProfile: RulesProfile,
  enforceFollowOn?: boolean
): NextInningsPlan | undefined {
  const [teamA, teamB] = match.teams
  const completed = match.innings.filter((i) => i.state === 'completed')
  const totalInnings = rulesProfile.inningsPerTeam * 2

  if (completed.length >= totalInnings) return undefined

  const inningsNumber = completed.length + 1
  const isLastInnings = completed.length === totalInnings - 1

  function teamTotal(teamId: string): number {
    return completed
      .filter((i) => i.battingTeamId === teamId)
      .reduce((sum, i) => sum + computeInningsTotals(i.deliveries).runs, 0)
  }

  function buildPlan(
    battingTeamId: string,
    followOnFields: Pick<
      NextInningsPlan,
      'followOnDecisionNeeded' | 'followOnBattingTeamId'
    >
  ): NextInningsPlan {
    const bowlingTeamId = battingTeamId === teamA.team.id ? teamB.team.id : teamA.team.id
    const target = isLastInnings
      ? teamTotal(bowlingTeamId) - teamTotal(battingTeamId) + 1
      : undefined
    return {
      inningsNumber,
      battingTeamId,
      bowlingTeamId,
      target,
      isLastInnings,
      ...followOnFields,
    }
  }

  if (completed.length === 0) {
    const battingTeamId = resolveBattingTeamId(match)
    if (!battingTeamId) return undefined
    return buildPlan(battingTeamId, { followOnDecisionNeeded: false })
  }

  if (completed.length === 1) {
    const battingTeamId = completed[0]!.bowlingTeamId
    return buildPlan(battingTeamId, { followOnDecisionNeeded: false })
  }

  if (rulesProfile.inningsPerTeam === 2 && completed.length === 2) {
    const teamFirstBatted = completed[0]!.battingTeamId
    const teamSecondBatted = completed[1]!.battingTeamId
    const eligible = isFollowOnEligible(
      {
        firstBattingTeamFirstInningsRuns: teamTotal(teamFirstBatted),
        secondBattingTeamFirstInningsRuns: teamTotal(teamSecondBatted),
      },
      rulesProfile
    )

    if (eligible && enforceFollowOn === undefined) {
      return buildPlan(teamFirstBatted, {
        followOnDecisionNeeded: true,
        followOnBattingTeamId: teamSecondBatted,
      })
    }

    const battingTeamId = eligible && enforceFollowOn ? teamSecondBatted : teamFirstBatted
    return buildPlan(battingTeamId, { followOnDecisionNeeded: false })
  }

  // Whichever team has batted fewer times bats next — deterministic once
  // past the follow-on decision point above.
  const battingTeamId =
    completed.filter((i) => i.battingTeamId === teamA.team.id).length <
    completed.filter((i) => i.battingTeamId === teamB.team.id).length
      ? teamA.team.id
      : teamB.team.id
  return buildPlan(battingTeamId, { followOnDecisionNeeded: false })
}
