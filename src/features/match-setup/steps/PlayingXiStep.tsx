import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PlayerAvatar } from '@/components/common/PlayerAvatar'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/common/EmptyState'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { validatePlayingXi } from '@/domain/match/validatePlayingXi'
import type { Team } from '@/domain/team/types'
import { UserRound, Star, ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PlayingXiStepProps {
  team: Team
  playingXiSize: number
  playingXiIds: string[]
  captainId?: string
  wicketkeeperId?: string
  onChange: (fields: {
    playingXiSize?: number
    playingXiIds?: string[]
    captainId?: string
    wicketkeeperId?: string
  }) => void
}

const SQUAD_SIZE_OPTIONS = Array.from({ length: 11 }, (_, i) => i + 1)

export function PlayingXiStep({
  team,
  playingXiSize,
  playingXiIds,
  captainId,
  wicketkeeperId,
  onChange,
}: PlayingXiStepProps) {
  if (team.squad.length === 0) {
    return (
      <EmptyState
        icon={UserRound}
        title={`${team.name} has no players`}
        description="Go back and add players to this team before selecting the playing XI."
      />
    )
  }

  // The squad caps how many can actually be selected — never offer or
  // default to a count the squad can't fill. "Custom" lifts the 11-player
  // default cap entirely (up to the full squad size) for teams that field
  // more than a standard XI.
  const maxSize = team.squad.length
  const effectiveSize = Math.min(playingXiSize, maxSize)
  const isCustomSize = effectiveSize > 11 || !SQUAD_SIZE_OPTIONS.includes(effectiveSize)
  const sizeOptions = SQUAD_SIZE_OPTIONS.filter((count) => count <= maxSize)

  const validation = validatePlayingXi(
    team,
    playingXiIds,
    effectiveSize,
    captainId,
    wicketkeeperId
  )

  function togglePlayer(playerId: string, checked: boolean) {
    if (checked) {
      onChange({ playingXiIds: [...playingXiIds, playerId] })
    } else {
      onChange({
        playingXiIds: playingXiIds.filter((id) => id !== playerId),
        captainId: captainId === playerId ? undefined : captainId,
        wicketkeeperId: wicketkeeperId === playerId ? undefined : wicketkeeperId,
      })
    }
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="playing-xi-size">Number of players for {team.name}</Label>
        <Select
          value={isCustomSize ? 'custom' : String(effectiveSize)}
          onValueChange={(v) => {
            if (v === 'custom') {
              onChange({ playingXiSize: Math.min(12, maxSize) })
            } else {
              onChange({ playingXiSize: Number(v) })
            }
          }}
        >
          <SelectTrigger id="playing-xi-size" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {sizeOptions.map((count) => (
              <SelectItem key={count} value={String(count)}>
                {count}
              </SelectItem>
            ))}
            <SelectItem value="custom">Custom</SelectItem>
          </SelectContent>
        </Select>

        {isCustomSize && (
          <Input
            type="number"
            min={1}
            max={maxSize}
            value={effectiveSize}
            onChange={(e) => {
              const parsed = Number(e.target.value)
              if (parsed >= 1) onChange({ playingXiSize: parsed })
            }}
            placeholder={`Any number up to ${maxSize}`}
          />
        )}
      </div>

      <p className="text-muted-foreground text-sm">
        Select exactly {effectiveSize} players for {team.name} ({playingXiIds.length}/
        {effectiveSize} selected).
      </p>

      <div className="space-y-1.5">
        {team.squad.map((player) => {
          const checked = playingXiIds.includes(player.id)
          return (
            <div
              key={player.id}
              className="border-border flex items-center gap-2 rounded-md border px-2.5 py-1.5"
            >
              <Checkbox
                id={`xi-${player.id}`}
                checked={checked}
                onCheckedChange={(c) => togglePlayer(player.id, c === true)}
              />
              <PlayerAvatar name={player.name} size="sm" />
              <Label htmlFor={`xi-${player.id}`} className="flex-1 font-normal">
                {player.name}
              </Label>
              {captainId === player.id && (
                <Badge variant="outline" className="text-[10px]">
                  C
                </Badge>
              )}
              {wicketkeeperId === player.id && (
                <Badge variant="outline" className="text-[10px]">
                  WK
                </Badge>
              )}
              <Button
                variant="ghost"
                size="icon-xs"
                disabled={!checked}
                aria-label={`Set ${player.name} as captain`}
                className={cn(captainId === player.id && 'text-primary')}
                onClick={() =>
                  onChange({ captainId: captainId === player.id ? undefined : player.id })
                }
              >
                <Star className="size-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon-xs"
                disabled={!checked}
                aria-label={`Set ${player.name} as wicketkeeper`}
                className={cn(wicketkeeperId === player.id && 'text-primary')}
                onClick={() =>
                  onChange({
                    wicketkeeperId: wicketkeeperId === player.id ? undefined : player.id,
                  })
                }
              >
                <ShieldCheck className="size-3.5" />
              </Button>
            </div>
          )
        })}
      </div>

      {!validation.valid && playingXiIds.length > 0 && (
        <ul className="text-destructive list-inside list-disc space-y-0.5 text-xs">
          {validation.errors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      )}
    </div>
  )
}
