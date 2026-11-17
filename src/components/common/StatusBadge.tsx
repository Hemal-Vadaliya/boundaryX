import { Badge } from '@/components/ui/badge'
import type { MatchStatus } from '@/types/common'
import { cn } from '@/lib/utils'

const statusLabel: Record<MatchStatus, string> = {
  upcoming: 'Upcoming',
  ongoing: 'Live',
  completed: 'Completed',
  abandoned: 'Abandoned',
}

const statusClassName: Record<MatchStatus, string> = {
  upcoming: 'bg-muted text-muted-foreground',
  ongoing: 'bg-success/15 text-success',
  completed: 'bg-secondary text-secondary-foreground',
  abandoned: 'bg-destructive/15 text-destructive',
}

interface StatusBadgeProps {
  status: MatchStatus
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn('border-transparent font-medium', statusClassName[status], className)}
    >
      {status === 'ongoing' && (
        <span className="bg-success mr-1 inline-block size-1.5 rounded-full" />
      )}
      {statusLabel[status]}
    </Badge>
  )
}
