import { PlayerAvatar } from '@/components/common/PlayerAvatar'
import type { Innings } from '@/domain/innings/types'
import type { Player } from '@/domain/player/types'
import { formatOvers } from '@/engine/scoring/overCalculator'

interface BowlerPanelProps {
  innings: Innings
  ballsPerOver: number
  findPlayer: (playerId: string) => Player | undefined
}

function economy(
  runsConceded: number,
  legalBallsBowled: number,
  ballsPerOver: number
): string {
  if (legalBallsBowled === 0) return '0.00'
  const overs = legalBallsBowled / ballsPerOver
  return (runsConceded / overs).toFixed(2)
}

export function BowlerPanel({ innings, ballsPerOver, findPlayer }: BowlerPanelProps) {
  if (!innings.currentBowlerId) return null
  const figures = innings.bowlerFigures[innings.currentBowlerId]
  const player = findPlayer(innings.currentBowlerId)

  return (
    <div className="border-border bg-card flex items-center gap-2 rounded-lg border p-3">
      <PlayerAvatar name={player?.name ?? innings.currentBowlerId} size="sm" />
      <span className="flex-1 truncate text-sm font-medium">
        {player?.name ?? innings.currentBowlerId}
      </span>
      <span className="text-muted-foreground text-sm tabular-nums">
        {formatOvers(figures?.legalBallsBowled ?? 0, ballsPerOver)}-
        {figures?.runsConceded ?? 0}-{figures?.wickets ?? 0}
      </span>
      <span className="text-muted-foreground w-12 text-right text-xs tabular-nums">
        {economy(
          figures?.runsConceded ?? 0,
          figures?.legalBallsBowled ?? 0,
          ballsPerOver
        )}
      </span>
    </div>
  )
}
