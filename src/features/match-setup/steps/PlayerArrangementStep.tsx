import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PlayerAvatar } from '@/components/common/PlayerAvatar'
import { EmptyState } from '@/components/common/EmptyState'
import { SwapPlayerSheet } from '@/features/match-setup/steps/SwapPlayerSheet'
import { usePlayerPoolStore } from '@/store/playerPoolStore'
import { useAssignedPlayers } from '@/store/playerPoolSelectors'
import type { Player } from '@/domain/player/types'
import { ArrowLeftRight, UserRound } from 'lucide-react'

interface PlayerArrangementStepProps {
  teamAName: string
  teamBName: string
  /** Called with both swapped player ids right after a swap, so the wizard can drop any now-stale Playing XI/captain/wicketkeeper references. */
  onPlayersSwapped?: (playerIdA: string, playerIdB: string) => void
}

/**
 * Final chance to rearrange both rosters before locking in the Playing
 * XI: both teams are shown side by side and any player can be swapped
 * for one on the other team.
 */
export function PlayerArrangementStep({
  teamAName,
  teamBName,
  onPlayersSwapped,
}: PlayerArrangementStepProps) {
  const swapPlayers = usePlayerPoolStore((s) => s.swapPlayers)
  const teamAPlayers = useAssignedPlayers('A')
  const teamBPlayers = useAssignedPlayers('B')

  const [swappingPlayer, setSwappingPlayer] = useState<Player | null>(null)

  const swapCandidates = swappingPlayer
    ? teamAPlayers.some((p) => p.id === swappingPlayer.id)
      ? teamBPlayers
      : teamAPlayers
    : []

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TeamColumn title={teamAName || 'Team A'} players={teamAPlayers} onSwap={setSwappingPlayer} />
        <TeamColumn title={teamBName || 'Team B'} players={teamBPlayers} onSwap={setSwappingPlayer} />
      </div>

      <SwapPlayerSheet
        open={!!swappingPlayer}
        onOpenChange={(open) => !open && setSwappingPlayer(null)}
        swappingPlayer={swappingPlayer ?? undefined}
        candidates={swapCandidates}
        onConfirm={(otherPlayerId) => {
          if (!swappingPlayer) return
          swapPlayers(swappingPlayer.id, otherPlayerId)
          onPlayersSwapped?.(swappingPlayer.id, otherPlayerId)
          setSwappingPlayer(null)
        }}
      />
    </div>
  )
}

interface TeamColumnProps {
  title: string
  players: Player[]
  onSwap: (player: Player) => void
}

function TeamColumn({ title, players, onSwap }: TeamColumnProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <p className="text-sm font-medium">{title}</p>
        <Badge variant="outline" className="text-[10px]">
          {players.length}
        </Badge>
      </div>
      {players.length === 0 ? (
        <EmptyState icon={UserRound} title="No players assigned yet" className="py-6" />
      ) : (
        <div className="space-y-1.5">
          {players.map((player) => (
            <div
              key={player.id}
              className="border-border flex items-center gap-2 rounded-md border px-2.5 py-1.5"
            >
              <PlayerAvatar name={player.name} size="sm" />
              <span className="flex-1 truncate text-sm">{player.name}</span>
              <Button
                variant="ghost"
                size="icon-xs"
                aria-label={`Swap ${player.name} with a player from the other team`}
                onClick={() => onSwap(player)}
              >
                <ArrowLeftRight className="size-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
