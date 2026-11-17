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
import { Input } from '@/components/ui/input'
import type { Player } from '@/domain/player/types'
import type { DismissalType, BatterEnd } from '@/domain/dismissal/types'
import { isDismissalValidForOutcome } from '@/domain/dismissal/types'

const DISMISSAL_OPTIONS: { value: DismissalType; label: string }[] = [
  { value: 'bowled', label: 'Bowled' },
  { value: 'caught', label: 'Caught' },
  { value: 'caught-and-bowled', label: 'Caught and bowled' },
  { value: 'lbw', label: 'LBW' },
  { value: 'run-out', label: 'Run out' },
  { value: 'stumped', label: 'Stumped' },
  { value: 'hit-wicket', label: 'Hit wicket' },
  { value: 'hit-ball-twice', label: 'Hit the ball twice' },
  { value: 'obstructing-the-field', label: 'Obstructing the field' },
  { value: 'timed-out', label: 'Timed out' },
  { value: 'retired-out', label: 'Retired out' },
]

const FIELDING_DISMISSALS: ReadonlySet<DismissalType> = new Set([
  'caught',
  'run-out',
  'stumped',
])

export interface WicketConfirmation {
  type: DismissalType
  dismissedPlayerId: string
  dismissedEnd: BatterEnd
  fielderId?: string
  assistingFielderId?: string
  incomingBatterId?: string
  runsBeforeDismissal: number
  battersCrossed: boolean
}

interface WicketSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  outcome: 'legal' | 'wide' | 'no-ball'
  strikerId: string
  nonStrikerId?: string
  findPlayer: (playerId: string) => Player | undefined
  availableIncomingBatters: Player[]
  fieldingPlayers: Player[]
  onConfirm: (confirmation: WicketConfirmation) => void
}

export function WicketSheet({
  open,
  onOpenChange,
  outcome,
  strikerId,
  nonStrikerId,
  findPlayer,
  availableIncomingBatters,
  fieldingPlayers,
  onConfirm,
}: WicketSheetProps) {
  const [dismissedEnd, setDismissedEnd] = useState<BatterEnd>('striker')
  const [type, setType] = useState<DismissalType>('bowled')
  const [fielderId, setFielderId] = useState('')
  const [assistingFielderId, setAssistingFielderId] = useState('')
  const [incomingBatterId, setIncomingBatterId] = useState('')
  const [runsBeforeDismissal, setRunsBeforeDismissal] = useState('0')

  const validTypes = DISMISSAL_OPTIONS.filter((option) =>
    isDismissalValidForOutcome(option.value, outcome)
  )
  const needsFielder = FIELDING_DISMISSALS.has(type)
  const needsAssistingFielder = type === 'run-out'
  const dismissedPlayerId =
    !nonStrikerId || dismissedEnd === 'striker' ? strikerId : nonStrikerId

  function reset() {
    setDismissedEnd('striker')
    setType('bowled')
    setFielderId('')
    setAssistingFielderId('')
    setIncomingBatterId('')
    setRunsBeforeDismissal('0')
  }

  function handleConfirm() {
    const runs = Number(runsBeforeDismissal) || 0
    onConfirm({
      type,
      dismissedPlayerId,
      dismissedEnd,
      fielderId: needsFielder && fielderId ? fielderId : undefined,
      assistingFielderId:
        needsAssistingFielder && assistingFielderId ? assistingFielderId : undefined,
      incomingBatterId: incomingBatterId || undefined,
      runsBeforeDismissal: runs,
      battersCrossed: runs % 2 === 1,
    })
    reset()
    onOpenChange(false)
  }

  return (
    <BottomSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Wicket"
      description="Record the dismissal."
    >
      <div className="space-y-4">
        {nonStrikerId && (
          <div className="space-y-1.5">
            <Label>Batter dismissed</Label>
            <Select
              value={dismissedEnd}
              onValueChange={(v) => setDismissedEnd(v as BatterEnd)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="striker">
                  {findPlayer(strikerId)?.name ?? strikerId} (striker)
                </SelectItem>
                <SelectItem value="non-striker">
                  {findPlayer(nonStrikerId)?.name ?? nonStrikerId} (non-striker)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="space-y-1.5">
          <Label>Dismissal type</Label>
          <Select value={type} onValueChange={(v) => setType(v as DismissalType)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {validTypes.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {type === 'run-out' && (
          <div className="space-y-1.5">
            <Label htmlFor="wicket-runs-before">
              Runs completed before the dismissal
            </Label>
            <Input
              id="wicket-runs-before"
              type="number"
              min={0}
              value={runsBeforeDismissal}
              onChange={(e) => setRunsBeforeDismissal(e.target.value)}
            />
          </div>
        )}

        {needsFielder && (
          <div className="space-y-1.5">
            <Label>Fielder</Label>
            <Select value={fielderId} onValueChange={setFielderId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select fielder" />
              </SelectTrigger>
              <SelectContent>
                {fieldingPlayers.map((player) => (
                  <SelectItem key={player.id} value={player.id}>
                    {player.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {needsAssistingFielder && (
          <div className="space-y-1.5">
            <Label>Assisting fielder (optional)</Label>
            <Select value={assistingFielderId} onValueChange={setAssistingFielderId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select assisting fielder" />
              </SelectTrigger>
              <SelectContent>
                {fieldingPlayers.map((player) => (
                  <SelectItem key={player.id} value={player.id}>
                    {player.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="space-y-1.5">
          <Label>Incoming batter</Label>
          <Select value={incomingBatterId} onValueChange={setIncomingBatterId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select later, if unavailable now" />
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

        <Button className="w-full" onClick={handleConfirm}>
          Confirm Wicket
        </Button>
      </div>
    </BottomSheet>
  )
}
