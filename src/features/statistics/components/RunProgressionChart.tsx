import { useMemo } from 'react'
import {
  Line,
  LineChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import type { Innings } from '@/domain/innings/types'
import type { TeamInMatch } from '@/domain/match/types'
import { computeOverSummaries } from '@/engine/calculations/overSummaries'

interface RunProgressionChartProps {
  innings: Innings[]
  teams: [TeamInMatch, TeamInMatch]
}

const SERIES_COLORS = ['var(--color-chart-1)', 'var(--color-chart-2)']

/**
 * Cumulative-runs-by-over "worm" chart comparing each innings. Uses the
 * theme's existing chart-1/chart-2 tokens, which pass the dataviz
 * colorblind-separation check at a WARN (6-8 dE band) — legal only with a
 * secondary identity channel, so every series also carries a legend entry
 * and a labeled line (never color-only identity).
 */
export function RunProgressionChart({ innings, teams }: RunProgressionChartProps) {
  const data = useMemo(() => {
    const maxOvers = Math.max(
      0,
      ...innings.map((i) => computeOverSummaries(i.deliveries).length)
    )
    const rows: Record<string, number | string>[] = []
    for (let over = 0; over < maxOvers; over++) {
      const row: Record<string, number | string> = { over: over + 1 }
      innings.forEach((oneInnings, index) => {
        const summaries = computeOverSummaries(oneInnings.deliveries)
        const summary = summaries[over]
        const team = teams.find((t) => t.team.id === oneInnings.battingTeamId)
        const key = team?.team.name ?? `Innings ${index + 1}`
        if (summary) row[key] = summary.teamTotalAfter
      })
      rows.push(row)
    }
    return rows
  }, [innings, teams])

  const seriesKeys = innings.map((oneInnings, index) => {
    const team = teams.find((t) => t.team.id === oneInnings.battingTeamId)
    return team?.team.name ?? `Innings ${index + 1}`
  })

  if (data.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        Not enough overs bowled yet to chart.
      </p>
    )
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
          <CartesianGrid
            strokeDasharray="0"
            stroke="var(--color-border)"
            vertical={false}
          />
          <XAxis
            dataKey="over"
            tick={{ fontSize: 12 }}
            stroke="var(--color-muted-foreground)"
            label={{ value: 'Over', position: 'insideBottom', offset: -4, fontSize: 12 }}
          />
          <YAxis
            tick={{ fontSize: 12 }}
            stroke="var(--color-muted-foreground)"
            width={40}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--color-popover)',
              border: '1px solid var(--color-border)',
              borderRadius: 8,
              fontSize: 12,
            }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          {seriesKeys.map((key, index) => (
            <Line
              key={key}
              type="monotone"
              dataKey={key}
              stroke={SERIES_COLORS[index % SERIES_COLORS.length]}
              strokeWidth={2}
              dot={{ r: 2 }}
              activeDot={{ r: 4, strokeWidth: 2, stroke: 'var(--color-card)' }}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
