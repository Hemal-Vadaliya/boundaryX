import { AnimatePresence, motion } from 'motion/react'
import { PartyPopper, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

export type DeliveryFeedbackKind = 'four' | 'six' | 'wicket' | 'over-complete'

export interface DeliveryFeedbackTrigger {
  kind: DeliveryFeedbackKind
  /** Unique per occurrence so re-triggering the same kind still replays the animation. */
  key: string
}

interface DeliveryFeedbackProps {
  trigger: DeliveryFeedbackTrigger | null
}

const CONTENT: Record<DeliveryFeedbackKind, { label: string; className: string }> = {
  four: { label: 'FOUR!', className: 'bg-success text-success-foreground' },
  six: { label: 'SIX!', className: 'bg-success text-success-foreground' },
  wicket: { label: 'WICKET!', className: 'bg-destructive text-destructive-foreground' },
  'over-complete': { label: 'Over complete', className: 'bg-secondary text-secondary-foreground' },
}

/**
 * Brief full-width celebratory/alert banner over the scoring screen,
 * triggered by the outcome of the most recent delivery. Purely visual —
 * never blocks input, auto-dismisses, and respects reduced-motion via the
 * app-wide MotionConfig.
 */
export function DeliveryFeedback({ trigger }: DeliveryFeedbackProps) {
  return (
    <div className="pointer-events-none fixed inset-x-0 top-16 z-[60] flex justify-center px-4">
      <AnimatePresence mode="wait">
        {trigger && (
          <motion.div
            key={trigger.key}
            initial={{ opacity: 0, y: -16, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className={cn(
              'flex items-center gap-2 rounded-full px-5 py-2 text-sm font-bold shadow-lg',
              CONTENT[trigger.kind].className
            )}
          >
            {trigger.kind === 'wicket' ? (
              <Zap className="size-4" />
            ) : (
              <PartyPopper className="size-4" />
            )}
            {CONTENT[trigger.kind].label}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
