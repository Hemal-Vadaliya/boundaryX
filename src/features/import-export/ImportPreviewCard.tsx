import { Card, CardContent } from '@/components/ui/card'
import { TeamAvatar } from '@/components/common/TeamAvatar'
import { StatusBadge } from '@/components/common/StatusBadge'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import type { MatchDocument } from '@/domain/match/types'
import type { MatchConsistencyReport } from '@/services/importService'

interface ImportPreviewCardProps {
  match: MatchDocument
  consistency: MatchConsistencyReport
  isDuplicate: boolean
}

export function ImportPreviewCard({
  match,
  consistency,
  isDuplicate,
}: ImportPreviewCardProps) {
  const [teamA, teamB] = match.teams

  return (
    <Card>
      <CardContent className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-semibold">{match.name}</p>
            <p className="text-muted-foreground text-xs">
              {match.formatConfig.format} · {match.venue ?? 'Venue TBD'} ·{' '}
              {match.matchDate}
            </p>
          </div>
          <StatusBadge status={match.status} />
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <TeamAvatar name={teamA.team.name} size="sm" />
            <span className="text-sm font-medium">{teamA.team.name}</span>
          </div>
          <span className="text-muted-foreground text-xs">vs</span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{teamB.team.name}</span>
            <TeamAvatar name={teamB.team.name} size="sm" />
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {isDuplicate && (
            <Badge variant="outline" className="border-warning/40 text-warning">
              Already loaded — duplicate ID
            </Badge>
          )}
          {consistency.violations.length > 0 ? (
            <Badge variant="outline" className="border-destructive/40 text-destructive">
              <AlertTriangle className="size-3" />
              {consistency.violations.length} consistency issue
              {consistency.violations.length === 1 ? '' : 's'}
            </Badge>
          ) : (
            <Badge variant="outline" className="border-success/40 text-success">
              <CheckCircle2 className="size-3" />
              Figures reconcile
            </Badge>
          )}
        </div>

        {consistency.violations.length > 0 && (
          <ul className="text-destructive list-inside list-disc space-y-0.5 text-xs">
            {consistency.violations.slice(0, 3).map((violation, index) => (
              <li key={index}>{violation.message}</li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
