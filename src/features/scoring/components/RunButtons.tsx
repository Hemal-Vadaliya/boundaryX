import { useState } from 'react'
import { motion } from 'motion/react'
import { Button } from '@/components/ui/button'
import { RunCountPickerSheet } from '@/features/scoring/components/RunCountPickerSheet'
import { cn } from '@/lib/utils'

interface RunButtonsProps {
  onSelectRuns: (runs: number) => void
  disabled?: boolean
}

const RUN_VALUES = [0, 1, 2, 3, 4, 6]

export function RunButtons({ onSelectRuns, disabled }: RunButtonsProps) {
  const [customPickerOpen, setCustomPickerOpen] = useState(false)

  return (
    <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
      {RUN_VALUES.map((runs) => {
        const isBoundary = runs === 4 || runs === 6
        return (
          <motion.div key={runs} whileTap={{ scale: isBoundary ? 0.85 : 0.92 }}>
            <Button
              variant={isBoundary ? 'default' : 'outline'}
              className={cn(
                'h-12 w-full text-base font-semibold',
                isBoundary && 'bg-success text-success-foreground hover:bg-success/90'
              )}
              disabled={disabled}
              onClick={() => onSelectRuns(runs)}
            >
              {runs}
            </Button>
          </motion.div>
        )
      })}

      <motion.div whileTap={{ scale: 0.92 }}>
        <Button
          variant="outline"
          className="h-12 w-full text-sm font-semibold"
          disabled={disabled}
          onClick={() => setCustomPickerOpen(true)}
        >
          Custom
        </Button>
      </motion.div>

      <RunCountPickerSheet
        open={customPickerOpen}
        onOpenChange={setCustomPickerOpen}
        title="Custom runs"
        description="How many runs off this delivery?"
        maxRuns={6}
        onConfirm={onSelectRuns}
      />
    </div>
  )
}
