import { cn } from '@/lib/utils'

interface ScoreDisplayProps {
  runs: number
  wickets: number
  overs: string
  oversLabel?: string
  className?: string
}

/** Large tabular-numeral score readout used on scorecards, dashboard cards and the live scoring screen. */
export function ScoreDisplay({
  runs,
  wickets,
  overs,
  oversLabel = 'overs',
  className,
}: ScoreDisplayProps) {
  return (
    <div className={cn('flex items-baseline gap-2', className)}>
      <span className="font-sans text-3xl font-semibold tabular-nums">
        {runs}/{wickets}
      </span>
      <span className="text-muted-foreground text-sm tabular-nums">
        {overs} {oversLabel}
      </span>
    </div>
  )
}
