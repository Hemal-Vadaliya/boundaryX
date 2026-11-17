import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { RunCountPickerSheet } from '@/features/scoring/components/RunCountPickerSheet'
import type { RecordDeliveryInput } from '@/engine/commands/recordDeliveryInput'

interface ExtrasControlsProps {
  bowlerId: string
  onRecord: (input: RecordDeliveryInput) => void
  disabled?: boolean
}

type ActivePicker = 'wide' | 'bye' | 'leg-bye' | 'penalty' | null

export function ExtrasControls({ bowlerId, onRecord, disabled }: ExtrasControlsProps) {
  const [activePicker, setActivePicker] = useState<ActivePicker>(null)

  function recordWide(runs: number) {
    onRecord({
      bowlerId,
      batterRuns: 0,
      extras: { wides: runs },
      outcome: 'wide',
    })
  }

  function recordNoBall() {
    onRecord({
      bowlerId,
      batterRuns: 0,
      extras: { noBallRuns: 1 },
      outcome: 'no-ball',
    })
  }

  function recordBye(runs: number) {
    onRecord({ bowlerId, batterRuns: 0, extras: { byes: runs }, outcome: 'legal' })
  }

  function recordLegBye(runs: number) {
    onRecord({ bowlerId, batterRuns: 0, extras: { legByes: runs }, outcome: 'legal' })
  }

  function recordPenalty(runs: number) {
    onRecord({ bowlerId, batterRuns: 0, extras: { penaltyRuns: runs }, outcome: 'legal' })
  }

  return (
    <div className="grid grid-cols-5 gap-2">
      <Button
        variant="outline"
        disabled={disabled}
        onClick={() => setActivePicker('wide')}
      >
        Wide
      </Button>
      <Button variant="outline" disabled={disabled} onClick={recordNoBall}>
        No ball
      </Button>
      <Button
        variant="outline"
        disabled={disabled}
        onClick={() => setActivePicker('bye')}
      >
        Bye
      </Button>
      <Button
        variant="outline"
        disabled={disabled}
        onClick={() => setActivePicker('leg-bye')}
      >
        Leg bye
      </Button>
      <Button
        variant="outline"
        disabled={disabled}
        onClick={() => setActivePicker('penalty')}
      >
        Penalty
      </Button>

      <RunCountPickerSheet
        open={activePicker === 'wide'}
        onOpenChange={(open) => !open && setActivePicker(null)}
        title="Wide"
        description="How many runs on this wide?"
        maxRuns={6}
        onConfirm={recordWide}
      />
      <RunCountPickerSheet
        open={activePicker === 'bye'}
        onOpenChange={(open) => !open && setActivePicker(null)}
        title="Byes"
        maxRuns={4}
        onConfirm={recordBye}
      />
      <RunCountPickerSheet
        open={activePicker === 'leg-bye'}
        onOpenChange={(open) => !open && setActivePicker(null)}
        title="Leg byes"
        maxRuns={4}
        onConfirm={recordLegBye}
      />
      <RunCountPickerSheet
        open={activePicker === 'penalty'}
        onOpenChange={(open) => !open && setActivePicker(null)}
        title="Penalty runs"
        maxRuns={5}
        onConfirm={recordPenalty}
      />
    </div>
  )
}
