import { useState } from 'react'
import { BottomSheet } from '@/components/common/BottomSheet'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Delivery } from '@/domain/delivery/types'
import type { RecordDeliveryInput } from '@/engine/commands/recordDeliveryInput'

interface EditLastBallSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  lastDelivery: Delivery | undefined
  onConfirm: (input: RecordDeliveryInput, reason?: string) => void
  error?: string
}

/** Pre-fills the last delivery's recorded values so the scorer corrects them rather than re-entering a fresh ball; the original is preserved in the innings' correction audit trail by the engine. */
export function EditLastBallSheet({
  open,
  onOpenChange,
  lastDelivery,
  onConfirm,
  error,
}: EditLastBallSheetProps) {
  const [outcome, setOutcome] = useState<'legal' | 'wide' | 'no-ball'>(
    lastDelivery?.outcome ?? 'legal'
  )
  const [batterRuns, setBatterRuns] = useState(String(lastDelivery?.batterRuns ?? 0))
  const [reason, setReason] = useState('')

  if (!lastDelivery) return null

  function handleConfirm() {
    onConfirm(
      {
        bowlerId: lastDelivery!.bowlerId,
        batterRuns: outcome === 'wide' ? 0 : Number(batterRuns) || 0,
        extras:
          outcome === 'wide'
            ? { wides: Math.max(1, Number(batterRuns) || 1) }
            : outcome === 'no-ball'
              ? { noBallRuns: 1 }
              : {},
        outcome,
      },
      reason || undefined
    )
  }

  return (
    <BottomSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Edit Last Ball"
      description="Correct the most recently recorded delivery. The original is kept in the innings history."
    >
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label>Outcome</Label>
          <Select value={outcome} onValueChange={(v) => setOutcome(v as typeof outcome)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="legal">Legal delivery</SelectItem>
              <SelectItem value="wide">Wide</SelectItem>
              <SelectItem value="no-ball">No ball</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="edit-ball-runs">
            {outcome === 'wide' ? 'Wide runs' : 'Batter runs'}
          </Label>
          <Input
            id="edit-ball-runs"
            type="number"
            min={0}
            value={batterRuns}
            onChange={(e) => setBatterRuns(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="edit-ball-reason">Reason (optional)</Label>
          <Textarea
            id="edit-ball-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Why this ball is being corrected"
          />
        </div>

        {error && <p className="text-destructive text-sm">{error}</p>}

        <Button className="w-full" onClick={handleConfirm}>
          Save Correction
        </Button>
      </div>
    </BottomSheet>
  )
}
