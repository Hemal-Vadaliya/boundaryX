import type { ComponentType } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface DashboardStatCardProps {
  label: string
  value: string | number
  icon?: ComponentType<{ className?: string }>
  className?: string
}

export function DashboardStatCard({
  label,
  value,
  icon: Icon,
  className,
}: DashboardStatCardProps) {
  return (
    <Card className={cn('gap-0', className)}>
      <CardContent className="flex items-center justify-between gap-3 p-4">
        <div>
          <p className="text-muted-foreground text-xs font-medium">{label}</p>
          <p className="text-2xl font-semibold tabular-nums">{value}</p>
        </div>
        {Icon && (
          <div className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-md">
            <Icon className="size-4" />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
