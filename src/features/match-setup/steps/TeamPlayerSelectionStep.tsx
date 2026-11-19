import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PlayerAvatar } from '@/components/common/PlayerAvatar'
import { EmptyState } from '@/components/common/EmptyState'
import { usePlayerPoolStore } from '@/store/playerPoolStore'
import { useAssignedPlayers, useUnassignedPlayers } from '@/store/playerPoolSelectors'
import { UserRound, X } from 'lucide-react'

interface TeamPlayerSelectionStepProps {
  side: 'A' | 'B'
  teamName: string
}

/**
 * Picks this team's players from the pool: Team A selects first, so Team
 * B's step only ever offers whatever's left unassigned — no player can
 * end up on both teams out of this step. Swapping (trading a player
 * already assigned to one team for one on the other) happens later, on
 * the dedicated Player Arrangement step, once both teams have players.
 */
export function TeamPlayerSelectionStep({ side, teamName }: TeamPlayerSelectionStepProps) {
  const assignToTeam = usePlayerPoolStore((s) => s.assignToTeam)
  const unassign = usePlayerPoolStore((s) => s.unassign)
  const unassignedPlayers = useUnassignedPlayers()
  const assignedPlayers = useAssignedPlayers(side)

  return (
    <div className="space-y-4">
      <p className="text-muted-foreground text-sm">
        Select {teamName || `Team ${side}`}&apos;s players from the pool.
      </p>

      <div className="space-y-2">
        <p className="text-sm font-medium">Available players</p>
        {unassignedPlayers.length === 0 ? (
          <p className="text-muted-foreground text-xs">No unassigned players left.</p>
        ) : (
          <div className="space-y-1.5">
            {unassignedPlayers.map((player) => (
              <div
                key={player.id}
                className="border-border flex items-center gap-2 rounded-md border px-2.5 py-1.5"
              >
                <PlayerAvatar name={player.name} size="sm" />
                <span className="flex-1 text-sm">{player.name}</span>
                <Button size="sm" variant="outline" onClick={() => assignToTeam(player.id, side)}>
                  Add
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium">{teamName || `Team ${side}`}</p>
          <Badge variant="outline" className="text-[10px]">
            {assignedPlayers.length}
          </Badge>
        </div>
        {assignedPlayers.length === 0 ? (
          <EmptyState icon={UserRound} title="No players selected yet" className="py-6" />
        ) : (
          <div className="space-y-1.5">
            {assignedPlayers.map((player) => (
              <div
                key={player.id}
                className="border-border flex items-center gap-2 rounded-md border px-2.5 py-1.5"
              >
                <PlayerAvatar name={player.name} size="sm" />
                <span className="flex-1 truncate text-sm">{player.name}</span>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  aria-label={`Remove ${player.name}`}
                  onClick={() => unassign(player.id)}
                >
                  <X className="size-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
