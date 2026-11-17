import { AnimatePresence, motion } from 'motion/react'
import { cn } from '@/lib/utils'
import type { Delivery } from '@/domain/delivery/types'

interface OverTimelineProps {
  deliveries: Delivery[]
  currentOverNumber: number
}

function labelForDelivery(delivery: Delivery): string {
  if (delivery.dismissal) return 'W'
  if (delivery.outcome === 'wide')
    return `wd${delivery.extras.wides > 1 ? delivery.extras.wides : ''}`
  if (delivery.outcome === 'no-ball')
    return `nb${delivery.batterRuns > 0 ? `+${delivery.batterRuns}` : ''}`
  if (delivery.extras.byes > 0) return `${delivery.extras.byes}b`
  if (delivery.extras.legByes > 0) return `${delivery.extras.legByes}lb`
  return String(delivery.batterRuns)
}

function classForDelivery(delivery: Delivery): string {
  if (delivery.dismissal) return 'bg-destructive text-destructive-foreground'
  if (delivery.outcome !== 'legal') return 'bg-warning text-warning-foreground'
  if (delivery.batterRuns === 4 || delivery.batterRuns === 6)
    return 'bg-success text-success-foreground'
  return 'bg-muted text-foreground'
}

/** Shows every delivery bowled in the current over, including illegal ones, distinct from the legal-ball count. */
export function OverTimeline({ deliveries, currentOverNumber }: OverTimelineProps) {
  const thisOverDeliveries = deliveries.filter((d) => d.overNumber === currentOverNumber)

  if (thisOverDeliveries.length === 0) {
    return <p className="text-muted-foreground text-xs">No deliveries yet this over.</p>
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      <AnimatePresence initial={false}>
        {thisOverDeliveries.map((delivery) => (
          <motion.span
            key={delivery.id}
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.25, ease: 'backOut' }}
            className={cn(
              'flex size-7 items-center justify-center rounded-full text-xs font-semibold tabular-nums',
              classForDelivery(delivery)
            )}
          >
            {labelForDelivery(delivery)}
          </motion.span>
        ))}
      </AnimatePresence>
    </div>
  )
}
