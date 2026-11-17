import { Link, useParams } from 'react-router-dom'
import { PageContainer } from '@/components/layout/PageContainer'
import { EmptyState } from '@/components/common/EmptyState'
import { useMatch } from '@/store/matchSelectors'
import { FileQuestion, Gauge, Table, BarChart3 } from 'lucide-react'
import { StatusBadge } from '@/components/common/StatusBadge'
import { TeamAvatar } from '@/components/common/TeamAvatar'
import { PlayerAvatar } from '@/components/common/PlayerAvatar'
import { PrimaryButton } from '@/components/common/PrimaryButton'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { ExportMatchButton } from '@/features/import-export/ExportMatchButton'

export function MatchOverviewPage() {
  const { matchId } = useParams<{ matchId: string }>()
  const loaded = useMatch(matchId)

  if (!loaded) {
    return (
      <PageContainer>
        <EmptyState
          icon={FileQuestion}
          title="Match not found in this session"
          description="This match ID isn't loaded. Import its JSON file or pick another match from the dashboard."
        />
      </PageContainer>
    )
  }

  const { document: match } = loaded
  const [teamA, teamB] = match.teams

  return (
    <PageContainer>
      <div className="mb-6 flex items-start justify-between gap-2">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">{match.name}</h1>
          <p className="text-muted-foreground text-sm">
            {match.formatConfig.format} · {match.venue ?? 'Venue TBD'} · {match.matchDate}
          </p>
        </div>
        <StatusBadge status={match.status} />
      </div>

      <div className="border-border mb-6 flex items-center justify-center gap-6 rounded-lg border p-6">
        <div className="flex flex-col items-center gap-2">
          <TeamAvatar name={teamA.team.name} size="lg" />
          <span className="text-sm font-medium">{teamA.team.name}</span>
          <span className="text-muted-foreground text-xs">
            {teamA.playingXiIds.length} selected
          </span>
        </div>
        <span className="text-muted-foreground text-sm">vs</span>
        <div className="flex flex-col items-center gap-2">
          <TeamAvatar name={teamB.team.name} size="lg" />
          <span className="text-sm font-medium">{teamB.team.name}</span>
          <span className="text-muted-foreground text-xs">
            {teamB.playingXiIds.length} selected
          </span>
        </div>
      </div>

      {match.toss && (
        <p className="text-muted-foreground mb-6 text-center text-sm">
          {match.teams.find((t) => t.team.id === match.toss?.wonByTeamId)?.team.name} won
          the toss and chose to {match.toss.decision}
        </p>
      )}

      <div className="mb-6 flex flex-wrap gap-2">
        <Link to={`/matches/${match.id}/score`}>
          <PrimaryButton>
            <Gauge className="size-4" />
            Live Scoring
          </PrimaryButton>
        </Link>
        <Link to={`/matches/${match.id}/scorecard`}>
          <Button variant="outline">
            <Table className="size-4" />
            Scorecard
          </Button>
        </Link>
        <Link to={`/matches/${match.id}/statistics`}>
          <Button variant="outline">
            <BarChart3 className="size-4" />
            Statistics
          </Button>
        </Link>
        <ExportMatchButton match={match} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {match.teams.map((teamInMatch) => (
          <Card key={teamInMatch.team.id}>
            <CardContent className="space-y-3">
              <p className="text-sm font-semibold">
                {teamInMatch.team.name} — Playing XI
              </p>
              <div className="space-y-2">
                {teamInMatch.playingXiIds.map((playerId) => {
                  const player = teamInMatch.team.squad.find((p) => p.id === playerId)
                  if (!player) return null
                  return (
                    <div key={playerId} className="flex items-center gap-2">
                      <PlayerAvatar name={player.name} size="sm" />
                      <span className="text-sm">{player.name}</span>
                      {teamInMatch.captainId === playerId && (
                        <Badge variant="outline" className="text-[10px]">
                          C
                        </Badge>
                      )}
                      {teamInMatch.wicketkeeperId === playerId && (
                        <Badge variant="outline" className="text-[10px]">
                          WK
                        </Badge>
                      )}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </PageContainer>
  )
}
