import { useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { PageContainer } from '@/components/layout/PageContainer'
import { EmptyState } from '@/components/common/EmptyState'
import { DashboardStatCard } from '@/components/common/DashboardStatCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileQuestion, BarChart3, CircleDot, Target, Hand } from 'lucide-react'
import { useMatch } from '@/store/matchSelectors'
import { computeMatchStatistics } from '@/engine/calculations/matchStatistics'
import { RunProgressionChart } from '@/features/statistics/components/RunProgressionChart'
import type { Player } from '@/domain/player/types'

export function MatchStatisticsPage() {
  const { matchId } = useParams<{ matchId: string }>()
  const loaded = useMatch(matchId)
  const match = loaded?.document

  const allPlayers = useMemo(
    () => (match ? [...match.teams[0].team.squad, ...match.teams[1].team.squad] : []),
    [match]
  )
  const findPlayer = (id: string): Player | undefined =>
    allPlayers.find((p) => p.id === id)

  if (!match) {
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

  if (match.innings.length === 0) {
    return (
      <PageContainer>
        <EmptyState
          icon={BarChart3}
          title="No statistics yet"
          description="Statistics appear once scoring begins."
        />
      </PageContainer>
    )
  }

  const stats = computeMatchStatistics(match.innings, match.rulesProfile.ballsPerOver)

  return (
    <PageContainer className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          {match.name} — Statistics
        </h1>
        <p className="text-muted-foreground text-sm">
          Aggregated across {match.innings.length} innings played so far.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <DashboardStatCard label="Total runs" value={stats.totalRuns} icon={BarChart3} />
        <DashboardStatCard
          label="Total wickets"
          value={stats.totalWickets}
          icon={CircleDot}
        />
        <DashboardStatCard
          label="Boundaries"
          value={`${stats.totalBoundaries.fours}×4 / ${stats.totalBoundaries.sixes}×6`}
          icon={Target}
        />
        <DashboardStatCard label="Extras" value={stats.totalExtras} icon={Hand} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Run Progression</CardTitle>
        </CardHeader>
        <CardContent>
          <RunProgressionChart innings={match.innings} teams={match.teams} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Top Scorer</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.topScorer ? (
              <p className="text-sm">
                {findPlayer(stats.topScorer.playerId)?.name ?? stats.topScorer.playerId} —{' '}
                <span className="font-semibold tabular-nums">{stats.topScorer.runs}</span>{' '}
                runs
              </p>
            ) : (
              <p className="text-muted-foreground text-sm">No runs scored yet.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Best Bowling</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.bestBowling ? (
              <p className="text-sm">
                {findPlayer(stats.bestBowling.playerId)?.name ??
                  stats.bestBowling.playerId}{' '}
                —{' '}
                <span className="font-semibold tabular-nums">
                  {stats.bestBowling.wickets}/{stats.bestBowling.runsConceded}
                </span>
              </p>
            ) : (
              <p className="text-muted-foreground text-sm">No wickets taken yet.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Highest Partnership</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.highestPartnership ? (
              <p className="text-sm">
                {findPlayer(stats.highestPartnership.batterAId)?.name ??
                  stats.highestPartnership.batterAId}{' '}
                &amp;{' '}
                {findPlayer(stats.highestPartnership.batterBId)?.name ??
                  stats.highestPartnership.batterBId}{' '}
                —{' '}
                <span className="font-semibold tabular-nums">
                  {stats.highestPartnership.runs}
                </span>{' '}
                runs
              </p>
            ) : (
              <p className="text-muted-foreground text-sm">
                No partnerships recorded yet.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  )
}
