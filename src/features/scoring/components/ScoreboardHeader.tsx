import { motion } from 'motion/react'
import { ScoreDisplay } from '@/components/common/ScoreDisplay'
import { Badge } from '@/components/ui/badge'
import type { Innings } from '@/domain/innings/types'
import type { RulesProfile } from '@/engine/rules/types'
import { computeInningsTotals } from '@/engine/calculations/inningsTotals'
import { calculateRunRate, calculateRequiredRunRate } from '@/engine/calculations/runRates'
import { formatOvers } from '@/engine/scoring/overCalculator'

interface ScoreboardHeaderProps {
  innings: Innings
  rulesProfile: RulesProfile
  battingTeamName: string
}

export function ScoreboardHeader({
  innings,
  rulesProfile,
  battingTeamName,
}: ScoreboardHeaderProps) {
  const totals = computeInningsTotals(innings.deliveries)
  const runRate = calculateRunRate(
    totals.runs,
    totals.legalBallsBowled,
    rulesProfile.ballsPerOver
  )
  const effectiveOversAllocated = innings.oversAllocated ?? rulesProfile.oversPerInnings
  const oversLabel =
    effectiveOversAllocated !== undefined ? `/ ${effectiveOversAllocated} overs` : 'overs'

  const activePowerplay = rulesProfile.powerplays.find(
    (p) =>
      innings.deliveries.length > 0 &&
      innings.deliveries[innings.deliveries.length - 1]!.overNumber >= p.startOver &&
      innings.deliveries[innings.deliveries.length - 1]!.overNumber <= p.endOver
  )

  const runsNeeded =
    innings.target !== undefined ? Math.max(0, innings.target - totals.runs) : undefined
  const totalLegalBalls =
    effectiveOversAllocated !== undefined
      ? effectiveOversAllocated * rulesProfile.ballsPerOver
      : undefined
  const ballsRemaining =
    totalLegalBalls !== undefined
      ? Math.max(0, totalLegalBalls - totals.legalBallsBowled)
      : undefined
  const requiredRunRate =
    runsNeeded !== undefined && ballsRemaining !== undefined
      ? calculateRequiredRunRate(runsNeeded, ballsRemaining, rulesProfile.ballsPerOver)
      : undefined

  return (
    <div className="border-border bg-card space-y-2 rounded-lg border p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold">{battingTeamName}</span>
        <div className="flex items-center gap-1.5">
          {innings.freeHitActive && (
            <Badge className="bg-warning text-warning-foreground">Free Hit</Badge>
          )}
          {activePowerplay && <Badge variant="secondary">{activePowerplay.name}</Badge>}
        </div>
      </div>

      <motion.div
        key={`${totals.runs}-${totals.wickets}`}
        initial={{ scale: 0.97, opacity: 0.6 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        <ScoreDisplay
          runs={totals.runs}
          wickets={totals.wickets}
          overs={formatOvers(totals.legalBallsBowled, rulesProfile.ballsPerOver)}
          oversLabel={oversLabel}
        />
      </motion.div>

      <p className="text-muted-foreground text-xs tabular-nums">
        CRR {runRate.toFixed(2)}
        {innings.target !== undefined && (
          <>
            {' · '}Target {innings.target}
            {runsNeeded !== undefined && ballsRemaining !== undefined && (
              <>
                {' · Need '}
                {runsNeeded} off {ballsRemaining}
              </>
            )}
            {requiredRunRate !== undefined && <>{' · RRR '}{requiredRunRate.toFixed(2)}</>}
          </>
        )}
      </p>
    </div>
  )
}
