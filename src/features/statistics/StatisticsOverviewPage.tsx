import { useMemo } from 'react'
import { PageContainer } from '@/components/layout/PageContainer'
import { EmptyState } from '@/components/common/EmptyState'
import { DashboardStatCard } from '@/components/common/DashboardStatCard'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { BarChart3, Users } from 'lucide-react'
import { useLoadedMatchDocuments } from '@/store/matchSelectors'
import { aggregatePlayerStatistics } from '@/engine/calculations/aggregatePlayerStatistics'
import { formatOvers } from '@/engine/scoring/overCalculator'

function strikeRate(runs: number, ballsFaced: number): string {
  if (ballsFaced === 0) return '0.0'
  return ((runs / ballsFaced) * 100).toFixed(1)
}

function economy(runsConceded: number, legalBallsBowled: number): string {
  if (legalBallsBowled === 0) return '0.00'
  return (runsConceded / (legalBallsBowled / 6)).toFixed(2)
}

export function StatisticsOverviewPage() {
  const matches = useLoadedMatchDocuments()
  const playerStats = useMemo(() => aggregatePlayerStatistics(matches), [matches])

  const topRunScorers = useMemo(
    () => [...playerStats].sort((a, b) => b.runs - a.runs).slice(0, 10),
    [playerStats]
  )
  const topWicketTakers = useMemo(
    () => [...playerStats].sort((a, b) => b.wickets - a.wickets).slice(0, 10),
    [playerStats]
  )

  return (
    <PageContainer className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Statistics</h1>
        <p className="text-muted-foreground text-sm">
          Aggregated statistics across every match loaded in this session. Player identity
          is matched by their stable ID, never by display name.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <DashboardStatCard
          label="Matches loaded"
          value={matches.length}
          icon={BarChart3}
        />
        <DashboardStatCard
          label="Players tracked"
          value={playerStats.length}
          icon={Users}
        />
      </div>

      {playerStats.length === 0 ? (
        <EmptyState
          icon={BarChart3}
          title="No statistics yet"
          description="Player and match statistics aggregated from loaded matches will render here once scoring begins."
        />
      ) : (
        <Tabs defaultValue="batting">
          <TabsList>
            <TabsTrigger value="batting">Top Run Scorers</TabsTrigger>
            <TabsTrigger value="bowling">Top Wicket Takers</TabsTrigger>
          </TabsList>

          <TabsContent value="batting">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Player</TableHead>
                  <TableHead className="text-right">M</TableHead>
                  <TableHead className="text-right">Runs</TableHead>
                  <TableHead className="text-right">Balls</TableHead>
                  <TableHead className="text-right">4s</TableHead>
                  <TableHead className="text-right">6s</TableHead>
                  <TableHead className="text-right">SR</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topRunScorers.map((player) => (
                  <TableRow key={player.playerId}>
                    <TableCell className="font-medium">{player.playerName}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {player.matches}
                    </TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">
                      {player.runs}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {player.ballsFaced}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {player.fours}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {player.sixes}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {strikeRate(player.runs, player.ballsFaced)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>

          <TabsContent value="bowling">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Player</TableHead>
                  <TableHead className="text-right">M</TableHead>
                  <TableHead className="text-right">Overs</TableHead>
                  <TableHead className="text-right">Wkts</TableHead>
                  <TableHead className="text-right">Runs</TableHead>
                  <TableHead className="text-right">Econ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topWicketTakers.map((player) => (
                  <TableRow key={player.playerId}>
                    <TableCell className="font-medium">{player.playerName}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {player.matches}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatOvers(player.legalBallsBowled, 6)}
                    </TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">
                      {player.wickets}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {player.runsConceded}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {economy(player.runsConceded, player.legalBallsBowled)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>
        </Tabs>
      )}
    </PageContainer>
  )
}
