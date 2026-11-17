import { BottomSheet } from '@/components/common/BottomSheet'
import { Button } from '@/components/ui/button'

interface RunCountPickerSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  maxRuns: number
  onConfirm: (runs: number) => void
}

/** Reusable small picker for a single run count (wide/bye/leg-bye/penalty runs), shown as a bottom sheet so the action can be confirmed rather than fired on a single ambiguous tap. */
export function RunCountPickerSheet({
  open,
  onOpenChange,
  title,
  description,
  maxRuns,
  onConfirm,
}: RunCountPickerSheetProps) {
  const options = Array.from({ length: maxRuns }, (_, i) => i + 1)

  return (
    <BottomSheet
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
    >
      <div className="grid grid-cols-4 gap-2">
        {options.map((runs) => (
          <Button
            key={runs}
            variant="outline"
            className="h-12 text-base font-semibold"
            onClick={() => {
              onConfirm(runs)
              onOpenChange(false)
            }}
          >
            {runs}
          </Button>
        ))}
      </div>
    </BottomSheet>
  )
}
