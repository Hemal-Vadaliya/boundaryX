import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ConfirmationDialog } from '@/components/common/ConfirmationDialog'
import { Undo2, Pencil, UserMinus, Flag, Square, CloudRain } from 'lucide-react'

interface ScoringActionBarProps {
  onUndo: () => void
  onEditLastBall: () => void
  onRetireBatter: () => void
  onDeclare?: () => void
  onEndInnings: () => void
  onRainDelay: () => void
  canUndo: boolean
  canEdit: boolean
}

export function ScoringActionBar({
  onUndo,
  onEditLastBall,
  onRetireBatter,
  onDeclare,
  onEndInnings,
  onRainDelay,
  canUndo,
  canEdit,
}: ScoringActionBarProps) {
  const [confirmDeclareOpen, setConfirmDeclareOpen] = useState(false)
  const [confirmEndOpen, setConfirmEndOpen] = useState(false)

  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" size="sm" disabled={!canUndo} onClick={onUndo}>
        <Undo2 className="size-4" />
        Undo
      </Button>
      <Button variant="outline" size="sm" disabled={!canEdit} onClick={onEditLastBall}>
        <Pencil className="size-4" />
        Edit Last Ball
      </Button>
      <Button variant="outline" size="sm" onClick={onRetireBatter}>
        <UserMinus className="size-4" />
        Retire Batter
      </Button>
      <Button variant="outline" size="sm" onClick={onRainDelay}>
        <CloudRain className="size-4" />
        Rain Delay
      </Button>
      {onDeclare && (
        <Button variant="outline" size="sm" onClick={() => setConfirmDeclareOpen(true)}>
          <Flag className="size-4" />
          Declare
        </Button>
      )}
      <Button variant="destructive" size="sm" onClick={() => setConfirmEndOpen(true)}>
        <Square className="size-4" />
        End Innings
      </Button>

      <ConfirmationDialog
        open={confirmDeclareOpen}
        onOpenChange={setConfirmDeclareOpen}
        title="Declare this innings?"
        description="The batting team's innings will end immediately with the current score."
        confirmLabel="Declare"
        onConfirm={() => onDeclare?.()}
      />
      <ConfirmationDialog
        open={confirmEndOpen}
        onOpenChange={setConfirmEndOpen}
        title="End this innings?"
        description="This marks the innings as complete. Make sure the final ball has been recorded correctly."
        confirmLabel="End Innings"
        destructive
        onConfirm={onEndInnings}
      />
    </div>
  )
}
