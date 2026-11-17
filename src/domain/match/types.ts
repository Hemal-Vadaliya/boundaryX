import type { MatchFormat, MatchStatus } from '@/types/common'
import type { Team } from '@/domain/team/types'
import type { MatchFormatConfig } from '@/domain/match/formatConfig'
import type { RulesProfile } from '@/engine/rules/types'
import type { Innings } from '@/domain/innings/types'
import type { MatchResult } from '@/engine/results/limitedOversResult'

/**
 * A team's snapshot as it participated in one match: a frozen copy of the
 * team/squad at match-creation time plus the playing XI chosen for this
 * match. Snapshots preserve match history even if the team template is
 * edited or removed later in the session.
 */
export interface TeamInMatch {
  team: Team
  playingXiIds: string[]
  captainId?: string
  wicketkeeperId?: string
}

export interface TossInfo {
  wonByTeamId: string
  decision: 'bat' | 'bowl'
}

/**
 * Full in-memory match document. Teams/squads are frozen snapshots;
 * rulesProfile and innings are the authoritative cricket record once
 * scoring begins — derived scorecards/statistics (Phase 5) are always
 * recomputed from innings[].deliveries, never stored independently.
 */
export interface MatchDocument {
  id: string
  name: string
  venue?: string
  matchDate: string
  formatConfig: MatchFormatConfig
  rulesProfile: RulesProfile
  teams: [TeamInMatch, TeamInMatch]
  toss?: TossInfo
  innings: Innings[]
  /** Set once determineMatchResult has a definitive outcome; undefined while the match is still in progress or undecided. */
  result?: MatchResult
  status: MatchStatus
  createdAt: string
  updatedAt: string
  /** Set when this document was imported as a copy of an already-loaded match (duplicate-id resolution); points at the original document's id. */
  sourceMatchId?: string
}

/**
 * The team batting first, derived from the toss rather than stored
 * separately — undefined until the toss decision has been recorded.
 */
export function resolveBattingTeamId(
  match: Pick<MatchDocument, 'teams' | 'toss'>
): string | undefined {
  if (!match.toss) return undefined
  const [teamA, teamB] = match.teams
  if (match.toss.decision === 'bat') return match.toss.wonByTeamId
  return match.toss.wonByTeamId === teamA.team.id ? teamB.team.id : teamA.team.id
}

/**
 * Lightweight projection of a match document for cards/lists. Always
 * derived from the authoritative MatchDocument — never stored separately.
 */
export interface MatchSummary {
  id: string
  name: string
  venue?: string
  format: MatchFormat
  status: MatchStatus
  teamAName: string
  teamBName: string
  matchDate: string
  createdAt: string
  updatedAt: string
}

export function toMatchSummary(match: MatchDocument): MatchSummary {
  return {
    id: match.id,
    name: match.name,
    venue: match.venue,
    format: match.formatConfig.format,
    status: match.status,
    teamAName: match.teams[0].team.name,
    teamBName: match.teams[1].team.name,
    matchDate: match.matchDate,
    createdAt: match.createdAt,
    updatedAt: match.updatedAt,
  }
}
