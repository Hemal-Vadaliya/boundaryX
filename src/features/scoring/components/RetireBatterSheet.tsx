import { useState } from 'react'
import { BottomSheet } from '@/components/common/BottomSheet'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Player } from '@/domain/player/types'

interface RetireBatterSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  strikerId: string
  nonStrikerId?: string
  findPlayer: (playerId: string) => Player | undefined
  availableIncomingBatters: Player[]
  onConfirm: (retiringPlayerId: string, incomingBatterId: string) => void
}

export function RetireBatterSheet({
  open,
  onOpenChange,
  strikerId,
  nonStrikerId,
  findPlayer,
  availableIncomingBatters,
  onConfirm,
}: RetireBatterSheetProps) {
  const [retiring, setRetiring] = useState(strikerId)
  const [incoming, setIncoming] = useState('')

  return (
    <BottomSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Retire Batter"
      description="Retire a batter hurt and bring on a replacement, or return a previously retired batter."
    >
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label>Retiring batter</Label>
          <Select value={retiring} onValueChange={setRetiring}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={strikerId}>
                {findPlayer(strikerId)?.name ?? strikerId}
              </SelectItem>
              {nonStrikerId && (
                <SelectItem value={nonStrikerId}>
                  {findPlayer(nonStrikerId)?.name ?? nonStrikerId}
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>Incoming / returning batter</Label>
          <Select value={incoming} onValueChange={setIncoming}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select batter" />
            </SelectTrigger>
            <SelectContent>
              {availableIncomingBatters.map((player) => (
                <SelectItem key={player.id} value={player.id}>
                  {player.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          className="w-full"
          disabled={!incoming}
          onClick={() => {
            onConfirm(retiring, incoming)
            setIncoming('')
          }}
        >
          Confirm
        </Button>
      </div>
    </BottomSheet>
  )
}
