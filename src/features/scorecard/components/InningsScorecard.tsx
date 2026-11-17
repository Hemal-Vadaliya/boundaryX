import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScoreDisplay } from '@/components/common/ScoreDisplay'
import { BattingScorecardTable } from '@/features/scorecard/components/BattingScorecardTable'
import { BowlingScorecardTable } from '@/features/scorecard/components/BowlingScorecardTable'
import { FallOfWicketsTable } from '@/features/scorecard/components/FallOfWicketsTable'
import { PartnershipsTable } from '@/features/scorecard/components/PartnershipsTable'
import { OverByOverTable } from '@/features/scorecard/components/OverByOverTable'
import type { Innings } from '@/domain/innings/types'
import type { TeamInMatch } from '@/domain/match/types'
import type { RulesProfile } from '@/engine/rules/types'
import type { Player } from '@/domain/player/types'
import {
  getBattingOrder,
  getBowlingOrder,
} from '@/engine/calculations/battingBowlingOrder'
import { computeFallOfWickets } from '@/engine/calculations/fallOfWickets'
import { computePartnerships } from '@/engine/calculations/partnerships'
import { computeInningsTotals } from '@/engine/calculations/inningsTotals'
import {
  calculateRunRate,
  calculateRequiredRunRate,
} from '@/engine/calculations/runRates'
import { formatOvers } from '@/engine/scoring/overCalculator'
import { computePowerplayTotals } from '@/engine/calculations/powerplayTotals'

interface InningsScorecardProps {
  innings: Innings
  battingTeam: TeamInMatch
  bowlingTeam: TeamInMatch
  rulesProfile: RulesProfile
  findPlayer: (id: string) => Player | undefined
}

export function InningsScorecard({
  innings,
  battingTeam,
  bowlingTeam,
  rulesProfile,
  findPlayer,
}: InningsScorecardProps) {
  const battingOrder = useMemo(() => getBattingOrder(innings), [innings])
  const bowlingOrder = useMemo(() => getBowlingOrder(innings), [innings])
  const fallOfWickets = useMemo(
    () => computeFallOfWickets(innings.deliveries, rulesProfile.ballsPerOver),
    [innings.deliveries, rulesProfile.ballsPerOver]
  )
  const partnerships = useMemo(
    () => computePartnerships(innings.deliveries),
    [innings.deliveries]
  )
  const powerplayTotals = useMemo(
    () => computePowerplayTotals(innings.deliveries, rulesProfile.powerplays),
    [innings.deliveries, rulesProfile.powerplays]
  )
  const totals = computeInningsTotals(innings.deliveries)
  const runRate = calculateRunRate(
    totals.runs,
    totals.legalBallsBowled,
    rulesProfile.ballsPerOver
  )

  const oversPerInnings = innings.oversAllocated ?? rulesProfile.oversPerInnings
  const requiredRunRate =
    innings.target !== undefined && oversPerInnings !== undefined
      ? calculateRequiredRunRate(
          innings.target - totals.runs,
          oversPerInnings * rulesProfile.ballsPerOver - totals.legalBallsBowled,
          rulesProfile.ballsPerOver
        )
      : undefined

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <p className="text-sm font-semibold">{battingTeam.team.name}</p>
          <ScoreDisplay
            runs={totals.runs}
            wickets={totals.wickets}
            overs={formatOvers(totals.legalBallsBowled, rulesProfile.ballsPerOver)}
            oversLabel={
              oversPerInnings !== undefined ? `/ ${oversPerInnings} overs` : 'overs'
            }
          />
        </div>
        <div className="text-muted-foreground text-right text-xs">
          <p>CRR {runRate.toFixed(2)}</p>
          {innings.target !== undefined && (
            <>
              <p>Target {innings.target}</p>
              {requiredRunRate !== undefined && <p>RRR {requiredRunRate.toFixed(2)}</p>}
            </>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Batting — {battingTeam.team.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <BattingScorecardTable
            innings={innings}
            battingOrder={battingOrder}
            findPlayer={findPlayer}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Bowling — {bowlingTeam.team.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <BowlingScorecardTable
            innings={innings}
            bowlingOrder={bowlingOrder}
            ballsPerOver={rulesProfile.ballsPerOver}
            findPlayer={findPlayer}
          />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Fall of Wickets</CardTitle>
          </CardHeader>
          <CardContent>
            <FallOfWicketsTable fallOfWickets={fallOfWickets} findPlayer={findPlayer} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Partnerships</CardTitle>
          </CardHeader>
          <CardContent>
            <PartnershipsTable partnerships={partnerships} findPlayer={findPlayer} />
          </CardContent>
        </Card>
      </div>

      {powerplayTotals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Powerplays</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {powerplayTotals.map((pp) => (
              <div key={pp.phase.name} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{pp.phase.name}</span>
                <span className="tabular-nums">
                  {pp.runs}/{pp.wickets}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Over by Over</CardTitle>
        </CardHeader>
        <CardContent>
          <OverByOverTable deliveries={innings.deliveries} findPlayer={findPlayer} />
        </CardContent>
      </Card>
    </div>
  )
}
