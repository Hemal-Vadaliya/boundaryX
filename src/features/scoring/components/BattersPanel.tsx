import { PlayerAvatar } from '@/components/common/PlayerAvatar'
import type { Innings } from '@/domain/innings/types'
import type { Player } from '@/domain/player/types'

interface BattersPanelProps {
  innings: Innings
  findPlayer: (playerId: string) => Player | undefined
}

function strikeRate(runs: number, ballsFaced: number): string {
  if (ballsFaced === 0) return '0.0'
  return ((runs / ballsFaced) * 100).toFixed(1)
}

export function BattersPanel({ innings, findPlayer }: BattersPanelProps) {
  if (!innings.currentBatters) return null

  const rows = [
    { playerId: innings.currentBatters.striker, isStriker: true },
    ...(innings.currentBatters.nonStriker
      ? [{ playerId: innings.currentBatters.nonStriker, isStriker: false }]
      : []),
  ]

  return (
    <div className="border-border bg-card space-y-1.5 rounded-lg border p-3">
      {rows.map(({ playerId, isStriker }) => {
        const player = findPlayer(playerId)
        const figures = innings.batterInnings[playerId]
        return (
          <div key={playerId} className="flex items-center gap-2">
            <PlayerAvatar name={player?.name ?? playerId} size="sm" />
            <span className="flex-1 truncate text-sm font-medium">
              {player?.name ?? playerId}
              {isStriker && <span className="text-primary ml-1">*</span>}
            </span>
            <span className="text-sm tabular-nums">
              {figures?.runs ?? 0} ({figures?.ballsFaced ?? 0})
            </span>
            <span className="text-muted-foreground w-12 text-right text-xs tabular-nums">
              {strikeRate(figures?.runs ?? 0, figures?.ballsFaced ?? 0)}
            </span>
          </div>
        )
      })}
    </div>
  )
}
