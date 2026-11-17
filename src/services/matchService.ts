import { createId } from '@/utils/id'
import { defaultFormatConfig } from '@/domain/match/formatConfig'
import type { MatchFormatConfig } from '@/domain/match/formatConfig'
import type { MatchDocument, TeamInMatch } from '@/domain/match/types'
import type { Team } from '@/domain/team/types'
import type { MatchFormat } from '@/types/common'
import { resolveRulesProfile } from '@/engine/rules/resolver/resolveRulesProfile'
import type { RulesProfile } from '@/engine/rules/types'

export interface CreateMatchInput {
  name: string
  venue?: string
  matchDate: string
  format: MatchFormat
  formatConfigOverrides?: Partial<MatchFormatConfig>
  teamA: Team
  teamB: Team
  playingXiA: string[]
  playingXiB: string[]
  captainIdA?: string
  wicketkeeperIdA?: string
  captainIdB?: string
  wicketkeeperIdB?: string
}

/**
 * Freezes a snapshot of a team template plus the playing XI chosen for one
 * match. The snapshot — not the reusable template — is what the match
 * document stores, so later edits to a team template never rewrite history.
 */
function snapshotTeamInMatch(
  team: Team,
  playingXiIds: string[],
  captainId?: string,
  wicketkeeperId?: string
): TeamInMatch {
  return {
    team: { ...team, squad: team.squad.map((player) => ({ ...player })) },
    playingXiIds: [...playingXiIds],
    captainId,
    wicketkeeperId,
  }
}

/**
 * Maps the editable fields of MatchFormatConfig onto RulesProfile custom
 * overrides, but only the ones that actually differ from the standard
 * format's own defaults (or when the config was explicitly marked custom).
 * This keeps a pristine standard-format pick labeled as the standard
 * profile rather than spuriously marked "(custom)".
 */
function toRulesProfileOverrides(
  formatConfig: MatchFormatConfig
): Partial<Omit<RulesProfile, 'id' | 'label' | 'isOfficial'>> | undefined {
  const defaults = defaultFormatConfig(formatConfig.format)
  const overrides: Partial<Omit<RulesProfile, 'id' | 'label' | 'isOfficial'>> = {}

  if (formatConfig.ballsPerOver !== defaults.ballsPerOver) {
    overrides.ballsPerOver = formatConfig.ballsPerOver
  }
  if (formatConfig.oversPerInnings !== defaults.oversPerInnings) {
    overrides.oversPerInnings = formatConfig.oversPerInnings
  }
  if (formatConfig.inningsPerTeam !== defaults.inningsPerTeam) {
    overrides.inningsPerTeam = formatConfig.inningsPerTeam
  }

  const hasOverrides = Object.keys(overrides).length > 0
  if (!formatConfig.isCustom && !hasOverrides) return undefined
  return overrides
}

export function createMatchDocument(input: CreateMatchInput): MatchDocument {
  const now = new Date().toISOString()
  const formatConfig: MatchFormatConfig = {
    ...defaultFormatConfig(input.format),
    ...input.formatConfigOverrides,
  }
  const rulesProfile = resolveRulesProfile({
    format: input.format,
    customOverrides: toRulesProfileOverrides(formatConfig),
  })

  return {
    id: createId('match'),
    name: input.name,
    venue: input.venue,
    matchDate: input.matchDate,
    formatConfig,
    rulesProfile,
    teams: [
      snapshotTeamInMatch(
        input.teamA,
        input.playingXiA,
        input.captainIdA,
        input.wicketkeeperIdA
      ),
      snapshotTeamInMatch(
        input.teamB,
        input.playingXiB,
        input.captainIdB,
        input.wicketkeeperIdB
      ),
    ],
    innings: [],
    status: 'upcoming',
    createdAt: now,
    updatedAt: now,
  }
}
