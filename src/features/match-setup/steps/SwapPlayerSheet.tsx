import { BottomSheet } from '@/components/common/BottomSheet'
import { PlayerAvatar } from '@/components/common/PlayerAvatar'
import type { Player } from '@/domain/player/types'

interface SwapPlayerSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** The player initiating the swap, so the sheet can describe the trade. */
  swappingPlayer: Player | undefined
  /** The other team's assigned players — the only valid swap partners. */
  candidates: Player[]
  onConfirm: (otherPlayerId: string) => void
}

/** Lets a player already assigned to one team trade places with a player on the other team. */
export function SwapPlayerSheet({
  open,
  onOpenChange,
  swappingPlayer,
  candidates,
  onConfirm,
}: SwapPlayerSheetProps) {
  return (
    <BottomSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Swap Player"
      description={
        swappingPlayer
          ? `Choose who ${swappingPlayer.name} trades places with.`
          : 'Choose a player to trade places with.'
      }
    >
      {candidates.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          The other team has no players to swap with yet.
        </p>
      ) : (
        <div role="radiogroup" aria-label="Select a player to swap with" className="space-y-2">
          {candidates.map((player) => (
            <button
              key={player.id}
              type="button"
              role="radio"
              aria-checked={false}
              onClick={() => {
                onConfirm(player.id)
                onOpenChange(false)
              }}
              className="border-border flex w-full items-center gap-2 rounded-md border px-3 py-2 text-left transition-colors hover:bg-primary/5"
            >
              <PlayerAvatar name={player.name} size="sm" />
              <span className="text-sm font-medium">{player.name}</span>
            </button>
          ))}
        </div>
      )}
    </BottomSheet>
  )
}
