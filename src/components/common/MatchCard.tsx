import { Link } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/common/StatusBadge'
import { TeamAvatar } from '@/components/common/TeamAvatar'
import type { MatchSummary } from '@/domain/match/types'
import { Trash2 } from 'lucide-react'

interface MatchCardProps {
  match: MatchSummary
  dirty?: boolean
  onRemove?: () => void
}

export function MatchCard({ match, dirty, onRemove }: MatchCardProps) {
  return (
    <Card className="group/match-card hover:ring-primary/40 relative transition-colors">
      <Link
        to={`/matches/${match.id}`}
        className="absolute inset-0"
        aria-label={match.name}
      />
      <CardContent className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-semibold">{match.name}</p>
            <p className="text-muted-foreground text-xs">
              {match.format} · {match.venue ?? 'Venue TBD'}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <StatusBadge status={match.status} />
            {onRemove && (
              <Button
                variant="ghost"
                size="icon-xs"
                aria-label={`Remove ${match.name} from session`}
                className="relative z-10"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  onRemove()
                }}
              >
                <Trash2 className="size-3.5" />
              </Button>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <TeamAvatar name={match.teamAName} size="sm" />
            <span className="text-sm font-medium">{match.teamAName}</span>
          </div>
          <span className="text-muted-foreground text-xs">vs</span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{match.teamBName}</span>
            <TeamAvatar name={match.teamBName} size="sm" />
          </div>
        </div>

        {dirty && <p className="text-warning text-xs font-medium">Unsaved changes</p>}
      </CardContent>
    </Card>
  )
}
