import type { MatchDocument } from '@/domain/match/types'
import type { RulesProfile } from '@/engine/rules/types'
import type { Innings } from '@/domain/innings/types'
import { computeInningsTotals } from '@/engine/calculations/inningsTotals'
import { determineLimitedOversResult } from '@/engine/results/limitedOversResult'
import type { MatchResult } from '@/engine/results/limitedOversResult'
import { determineDlsResult } from '@/engine/results/dls/dlsResult'
import type { DlsInningsSnapshot } from '@/engine/results/dls/dlsResult'
import { determineTestResult } from '@/engine/results/testResult'
import type { TestInningsSummary } from '@/engine/results/testResult'

function wasInterrupted(innings: Innings): boolean {
  return !!innings.interruptions?.length
}

function toDlsSnapshot(
  innings: Innings,
  rulesProfile: RulesProfile,
  maxWickets: number
): DlsInningsSnapshot {
  const totals = computeInningsTotals(innings.deliveries)
  const allocatedOvers = innings.oversAllocated ?? rulesProfile.oversPerInnings ?? 50
  const oversBowled = totals.legalBallsBowled / rulesProfile.ballsPerOver
  return {
    teamId: innings.battingTeamId,
    runsScored: totals.runs,
    oversAllocated: allocatedOvers,
    oversRemainingAtEnd: Math.max(0, allocatedOvers - oversBowled),
    wicketsLostAtEnd: totals.wickets,
    maxWickets,
  }
}

/**
 * Picks limited-overs or Test result logic based on the match's rules
 * profile, then builds the exact input each needs from the match's
 * innings. Returns undefined when the match does not yet have enough
 * completed innings to determine a result — callers should treat that as
 * "no result yet", not an error.
 */
export function determineMatchResult(
  match: Pick<MatchDocument, 'teams' | 'innings' | 'toss'>,
  rulesProfile: RulesProfile
): MatchResult | undefined {
  const [teamA, teamB] = match.teams
  const teamAId = teamA.team.id
  const teamBId = teamB.team.id

  if (rulesProfile.inningsPerTeam >= 2) {
    if (match.innings.length === 0) return undefined
    const innings: TestInningsSummary[] = match.innings.map((i) => {
      const totals = computeInningsTotals(i.deliveries)
      return {
        teamId: i.battingTeamId,
        runs: totals.runs,
        wicketsLost: totals.wickets,
        closed: i.state === 'completed',
      }
    })
    const timeExpired = match.innings.every((i) => i.state === 'completed')
    return determineTestResult({ teamAId, teamBId, innings, timeExpired })
  }

  const firstInnings = match.innings[0]
  const secondInnings = match.innings[1]
  if (!firstInnings || !secondInnings) return undefined
  if (firstInnings.state !== 'completed' || secondInnings.state !== 'completed') {
    return undefined
  }

  const firstBattingTeam = match.teams.find(
    (t) => t.team.id === firstInnings.battingTeamId
  )!
  const secondBattingTeam = match.teams.find(
    (t) => t.team.id === secondInnings.battingTeamId
  )!

  const needsDls =
    wasInterrupted(firstInnings) ||
    wasInterrupted(secondInnings) ||
    secondInnings.oversAllocated !== undefined ||
    firstInnings.oversAllocated !== undefined

  if (needsDls) {
    return determineDlsResult({
      firstInnings: toDlsSnapshot(
        firstInnings,
        rulesProfile,
        firstBattingTeam.playingXiIds.length
      ),
      secondInnings: toDlsSnapshot(
        secondInnings,
        rulesProfile,
        secondBattingTeam.playingXiIds.length
      ),
      g50: rulesProfile.dlsG50,
      fullFormatOvers: rulesProfile.oversPerInnings ?? 50,
    })
  }

  const firstTotals = computeInningsTotals(firstInnings.deliveries)
  const secondTotals = computeInningsTotals(secondInnings.deliveries)

  return determineLimitedOversResult({
    teamAId,
    teamBId,
    firstBattingTeamId: firstInnings.battingTeamId,
    firstInningsRuns: firstTotals.runs,
    secondInningsRuns: secondTotals.runs,
    secondInningsWicketsLost: secondTotals.wickets,
    secondBattingPlayersPerSide: secondBattingTeam.playingXiIds.length,
    secondInningsCompletedLegally: true,
  })
}
