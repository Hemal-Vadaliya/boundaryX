import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { PageContainer } from '@/components/layout/PageContainer'
import { EmptyState } from '@/components/common/EmptyState'
import { MatchResultBanner } from '@/components/common/MatchResultBanner'
import { StatusBadge } from '@/components/common/StatusBadge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { FileQuestion, Table } from 'lucide-react'
import { useMatch } from '@/store/matchSelectors'
import { InningsScorecard } from '@/features/scorecard/components/InningsScorecard'
import type { Player } from '@/domain/player/types'

export function ScorecardPage() {
  const { matchId } = useParams<{ matchId: string }>()
  const loaded = useMatch(matchId)
  const [activeTab, setActiveTab] = useState<string | undefined>(undefined)

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
          icon={Table}
          title="No innings have started yet"
          description="Scorecards appear once scoring begins."
        />
      </PageContainer>
    )
  }

  const tabValue = activeTab ?? String(match.innings.length - 1)

  return (
    <PageContainer className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">{match.name}</h1>
          <p className="text-muted-foreground text-sm">
            {match.formatConfig.format} · {match.venue ?? 'Venue TBD'}
          </p>
        </div>
        <StatusBadge status={match.status} />
      </div>

      <MatchResultBanner match={match} />

      <Tabs value={tabValue} onValueChange={setActiveTab}>
        <TabsList>
          {match.innings.map((innings, index) => {
            const team = match.teams.find((t) => t.team.id === innings.battingTeamId)
            return (
              <TabsTrigger key={innings.id} value={String(index)}>
                {team?.team.name ?? `Innings ${innings.inningsNumber}`}
              </TabsTrigger>
            )
          })}
        </TabsList>
        {match.innings.map((innings, index) => {
          const battingTeam = match.teams.find(
            (t) => t.team.id === innings.battingTeamId
          )!
          const bowlingTeam = match.teams.find(
            (t) => t.team.id === innings.bowlingTeamId
          )!
          return (
            <TabsContent key={innings.id} value={String(index)}>
              <InningsScorecard
                innings={innings}
                battingTeam={battingTeam}
                bowlingTeam={bowlingTeam}
                rulesProfile={match.rulesProfile}
                findPlayer={findPlayer}
              />
            </TabsContent>
          )
        })}
      </Tabs>
    </PageContainer>
  )
}
