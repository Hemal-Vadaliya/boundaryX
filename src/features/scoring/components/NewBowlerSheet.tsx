import { useState } from 'react'
import { BottomSheet } from '@/components/common/BottomSheet'
import { Button } from '@/components/ui/button'
import { PlayerAvatar } from '@/components/common/PlayerAvatar'
import type { Player } from '@/domain/player/types'

interface NewBowlerSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  availableBowlers: Player[]
  onConfirm: (bowlerId: string) => void
  error?: string
}

export function NewBowlerSheet({
  open,
  onOpenChange,
  availableBowlers,
  onConfirm,
  error,
}: NewBowlerSheetProps) {
  const [selected, setSelected] = useState('')

  return (
    <BottomSheet
      open={open}
      onOpenChange={onOpenChange}
      title="New Over"
      description="Select the bowler for the next over."
    >
      <div className="space-y-2">
        <div role="radiogroup" aria-label="Select the next bowler" className="space-y-2">
          {availableBowlers.map((player) => (
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
          onClick={() => {
            onConfirm(selected)
            setSelected('')
          }}
        >
          Confirm Bowler
        </Button>
      </div>
    </BottomSheet>
  )
}
