import type { MatchFormat } from '@/types/common'
import type { MatchFormatConfig } from '@/domain/match/formatConfig'
import type { Team } from '@/domain/team/types'

export interface TeamSetupState {
  team: Team | null
  /** This team's own playing XI size, chosen independently of the other team's. */
  playingXiSize: number
  playingXiIds: string[]
  captainId?: string
  wicketkeeperId?: string
}

export interface MatchSetupState {
  name: string
  venue: string
  matchDate: string
  format: MatchFormat
  formatConfig: MatchFormatConfig
  teamA: TeamSetupState
  teamB: TeamSetupState
  /** The team making the heads/tails call; the other team's call doesn't apply. */
  tossCallerTeamSide?: 'A' | 'B'
  tossCallSide?: 'heads' | 'tails'
  coinResult?: 'heads' | 'tails'
  tossWinnerTeamSide?: 'A' | 'B'
  tossDecision?: 'bat' | 'bowl'
}

export function emptyTeamSetupState(): TeamSetupState {
  return { team: null, playingXiSize: 11, playingXiIds: [] }
}
