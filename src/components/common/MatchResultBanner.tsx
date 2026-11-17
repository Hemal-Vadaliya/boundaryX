import { Trophy } from 'lucide-react'
import type { MatchDocument } from '@/domain/match/types'

interface MatchResultBannerProps {
  match: MatchDocument
}

/** Shows the final result once a match's engine-computed result is set. Never computes anything itself — MatchDocument.result is written by the scoring flow after every innings ends via determineMatchResult. */
export function MatchResultBanner({ match }: MatchResultBannerProps) {
  if (!match.result) return null

  const winningTeam = match.teams.find((t) => t.team.id === match.result?.winningTeamId)

  return (
    <div className="border-primary/30 bg-primary/5 flex items-center gap-3 rounded-lg border p-4">
      <Trophy className="text-primary size-6 shrink-0" />
      <div>
        <p className="text-sm font-semibold">
          {winningTeam ? `${winningTeam.team.name} won` : 'Match result'}
        </p>
        <p className="text-muted-foreground text-sm">{match.result.summary}</p>
      </div>
    </div>
  )
}
