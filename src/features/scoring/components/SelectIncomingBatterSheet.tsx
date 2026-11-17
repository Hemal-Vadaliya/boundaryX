import { useState } from 'react'
import { BottomSheet } from '@/components/common/BottomSheet'
import { Button } from '@/components/ui/button'
import { PlayerAvatar } from '@/components/common/PlayerAvatar'
import type { Player } from '@/domain/player/types'

interface SelectIncomingBatterSheetProps {
  open: boolean
  availablePlayers: Player[]
  onConfirm: (playerId: string) => void
  error?: string
}

/** Shown whenever a wicket has fallen and no incoming batter was supplied at the time — the innings cannot continue until one is chosen, so this sheet has no dismiss/cancel action. */
export function SelectIncomingBatterSheet({
  open,
  availablePlayers,
  onConfirm,
  error,
}: SelectIncomingBatterSheetProps) {
  const [selected, setSelected] = useState('')

  return (
    <BottomSheet
      open={open}
      onOpenChange={() => {}}
      title="Next Batter"
      description="A wicket has fallen — select the incoming batter to continue."
    >
      <div className="space-y-2">
        <div
          role="radiogroup"
          aria-label="Select the incoming batter"
          className="space-y-2"
        >
          {availablePlayers.map((player) => (
            <button
              key={player.id}
              type="button"
              role="radio"
              aria-checked={selected === player.id}
              onClick={() => setSelected(player.id)}
              className={`flex w-full items-center gap-2 rounded-md border px-3 py-2 text-left transition-colors ${
                selected === player.id ? 'border-primary bg-primary/5' : 'border-border'
              }`}
            >
              <PlayerAvatar name={player.name} size="sm" />
              <span className="text-sm font-medium">{player.name}</span>
            </button>
          ))}
        </div>
        {error && <p className="text-destructive text-sm">{error}</p>}
        <Button
          className="w-full"
          disabled={!selected}
          onClick={() => onConfirm(selected)}
        >
          Confirm
        </Button>
      </div>
    </BottomSheet>
  )
}
