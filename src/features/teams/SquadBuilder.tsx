import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { PlayerAvatar } from '@/components/common/PlayerAvatar'
import { EmptyState } from '@/components/common/EmptyState'
import type { Team } from '@/domain/team/types'
import { UserRound, X, Star, ShieldCheck, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createId } from '@/utils/id'

interface SquadBuilderProps {
  team: Team
  onChange: (team: Team) => void
}

export function SquadBuilder({ team, onChange }: SquadBuilderProps) {
  const [newPlayerName, setNewPlayerName] = useState('')

  function addPlayer() {
    const name = newPlayerName.trim()
    if (!name) return
    onChange({
      ...team,
      squad: [...team.squad, { id: createId('player'), name }],
    })
    setNewPlayerName('')
  }

  function removePlayer(playerId: string) {
    onChange({
      ...team,
      squad: team.squad.filter((p) => p.id !== playerId),
      captainId: team.captainId === playerId ? undefined : team.captainId,
      wicketkeeperId: team.wicketkeeperId === playerId ? undefined : team.wicketkeeperId,
    })
  }

  function setCaptain(playerId: string) {
    onChange({ ...team, captainId: team.captainId === playerId ? undefined : playerId })
  }

  function setWicketkeeper(playerId: string) {
    onChange({
      ...team,
      wicketkeeperId: team.wicketkeeperId === playerId ? undefined : playerId,
    })
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input
          value={newPlayerName}
          onChange={(e) => setNewPlayerName(e.target.value)}
          placeholder="Player name"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              addPlayer()
            }
          }}
        />
        <Button onClick={addPlayer} disabled={!newPlayerName.trim()}>
          <Plus className="size-4" />
          Add
        </Button>
      </div>

      {team.squad.length === 0 ? (
        <EmptyState icon={UserRound} title="No players added yet" />
      ) : (
        <div className="space-y-1.5">
          {team.squad.map((player) => (
            <div
              key={player.id}
              className="border-border flex items-center gap-2 rounded-md border px-2.5 py-1.5"
            >
              <PlayerAvatar name={player.name} size="sm" />
              <span className="flex-1 text-sm">{player.name}</span>
              {team.captainId === player.id && (
                <Badge variant="outline" className="text-[10px]">
                  C
                </Badge>
              )}
              {team.wicketkeeperId === player.id && (
                <Badge variant="outline" className="text-[10px]">
                  WK
                </Badge>
              )}
              <Button
                variant="ghost"
                size="icon-xs"
                aria-label={
                  team.captainId === player.id
                    ? `Unset ${player.name} as captain`
                    : `Set ${player.name} as captain`
                }
                className={cn(team.captainId === player.id && 'text-primary')}
                onClick={() => setCaptain(player.id)}
              >
                <Star className="size-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon-xs"
                aria-label={
                  team.wicketkeeperId === player.id
                    ? `Unset ${player.name} as wicketkeeper`
                    : `Set ${player.name} as wicketkeeper`
                }
                className={cn(team.wicketkeeperId === player.id && 'text-primary')}
                onClick={() => setWicketkeeper(player.id)}
              >
                <ShieldCheck className="size-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon-xs"
                aria-label={`Remove ${player.name} from squad`}
                onClick={() => removePlayer(player.id)}
              >
                <X className="size-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
