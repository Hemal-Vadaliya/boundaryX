import { useState } from 'react'
import { BottomSheet } from '@/components/common/BottomSheet'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'

interface RainDelaySheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Overs currently allocated to the innings — the new value must be fewer than this. */
  currentOversAllocated: number
  /** Overs already bowled this innings — the revised allocation can't drop below this. */
  oversAlreadyBowled: number
  onReduceOvers: (newOversAllocated: number, reason: string) => void
  onStopInnings: (reason: string) => void
  error?: string
}

/**
 * The scoring screen's single entry point for a mid-innings interruption
 * (rain delay, bad light, etc.): either the innings continues with fewer
 * overs (DLS recalculates the target automatically), or the innings ends
 * right now and the match result is settled by the DLS method.
 */
export function RainDelaySheet({
  open,
  onOpenChange,
  currentOversAllocated,
  oversAlreadyBowled,
  onReduceOvers,
  onStopInnings,
  error,
}: RainDelaySheetProps) {
  const [newOvers, setNewOvers] = useState(String(Math.max(oversAlreadyBowled, currentOversAllocated - 1)))
  const [reason, setReason] = useState('Rain delay')

  function handleReduce() {
    const parsed = Number(newOvers)
    if (!Number.isInteger(parsed) || parsed <= 0) return
    onReduceOvers(parsed, reason || 'Rain delay')
  }

  function handleStop() {
    onStopInnings(reason || 'Rain delay')
    onOpenChange(false)
  }

  return (
    <BottomSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Rain Delay / Interruption"
      description="Reduce the overs available to this innings, or stop it now — the match result will be settled using the DLS method."
    >
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="rain-delay-reason">Reason</Label>
          <Input
            id="rain-delay-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Rain delay"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="rain-delay-overs">New overs allocation for this innings</Label>
          <Input
            id="rain-delay-overs"
            type="number"
            min={oversAlreadyBowled || 1}
            max={currentOversAllocated - 1}
            value={newOvers}
            onChange={(e) => setNewOvers(e.target.value)}
          />
          <p className="text-muted-foreground text-xs">
            Currently allocated {currentOversAllocated} overs ({oversAlreadyBowled} bowled
            so far). Must be fewer than {currentOversAllocated} and at least{' '}
            {oversAlreadyBowled}.
          </p>
        </div>

        {error && <p className="text-destructive text-sm">{error}</p>}

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button className="flex-1" onClick={handleReduce}>
            Reduce overs &amp; continue
          </Button>
          <Button variant="destructive" className="flex-1" onClick={handleStop}>
            Stop innings now (DLS)
          </Button>
        </div>
      </div>
    </BottomSheet>
  )
}
