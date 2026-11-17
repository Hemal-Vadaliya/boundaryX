import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { Innings } from '@/domain/innings/types'
import type { Player } from '@/domain/player/types'
import {
  describeDismissal,
  findDismissingDelivery,
} from '@/engine/calculations/dismissalDescription'
import { computeInningsTotals } from '@/engine/calculations/inningsTotals'
import { totalExtras, emptyExtras } from '@/domain/delivery/types'

interface BattingScorecardTableProps {
  innings: Innings
  battingOrder: string[]
  findPlayer: (id: string) => Player | undefined
}

function strikeRate(runs: number, ballsFaced: number): string {
  if (ballsFaced === 0) return '0.0'
  return ((runs / ballsFaced) * 100).toFixed(1)
}

export function BattingScorecardTable({
  innings,
  battingOrder,
  findPlayer,
}: BattingScorecardTableProps) {
  const totals = computeInningsTotals(innings.deliveries)
  const extrasBreakdown = innings.deliveries.reduce(
    (sum, d) => ({
      wides: sum.wides + d.extras.wides,
      noBallRuns: sum.noBallRuns + d.extras.noBallRuns,
      byes: sum.byes + d.extras.byes,
      legByes: sum.legByes + d.extras.legByes,
      penaltyRuns: sum.penaltyRuns + d.extras.penaltyRuns,
    }),
    emptyExtras()
  )
  const extrasTotal = totalExtras(extrasBreakdown)
  const extrasParts = [
    extrasBreakdown.wides > 0 && `${extrasBreakdown.wides}w`,
    extrasBreakdown.noBallRuns > 0 && `${extrasBreakdown.noBallRuns}nb`,
    extrasBreakdown.byes > 0 && `${extrasBreakdown.byes}b`,
    extrasBreakdown.legByes > 0 && `${extrasBreakdown.legByes}lb`,
    extrasBreakdown.penaltyRuns > 0 && `${extrasBreakdown.penaltyRuns}p`,
  ].filter(Boolean)

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Batter</TableHead>
          <TableHead></TableHead>
          <TableHead className="text-right">R</TableHead>
          <TableHead className="text-right">B</TableHead>
          <TableHead className="text-right">4s</TableHead>
          <TableHead className="text-right">6s</TableHead>
          <TableHead className="text-right">SR</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {battingOrder.map((playerId) => {
          const entry = innings.batterInnings[playerId]
          if (!entry || entry.state === 'did-not-bat') return null
          const dismissingDelivery = findDismissingDelivery(innings.deliveries, playerId)
          return (
            <TableRow key={playerId}>
              <TableCell className="font-medium">
                {findPlayer(playerId)?.name ?? playerId}
              </TableCell>
              <TableCell className="text-muted-foreground text-xs">
                {describeDismissal(entry, dismissingDelivery, findPlayer)}
              </TableCell>
              <TableCell className="text-right font-semibold tabular-nums">
                {entry.runs}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {entry.ballsFaced}
              </TableCell>
              <TableCell className="text-right tabular-nums">{entry.fours}</TableCell>
              <TableCell className="text-right tabular-nums">{entry.sixes}</TableCell>
              <TableCell className="text-right tabular-nums">
                {strikeRate(entry.runs, entry.ballsFaced)}
              </TableCell>
            </TableRow>
          )
        })}
        <TableRow>
          <TableCell className="text-sm font-medium" colSpan={2}>
            Extras {extrasParts.length > 0 && `(${extrasParts.join(', ')})`}
          </TableCell>
          <TableCell className="text-right tabular-nums" colSpan={5}>
            {extrasTotal}
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell className="text-sm font-semibold" colSpan={2}>
            Total
          </TableCell>
          <TableCell
            className="text-right text-sm font-semibold tabular-nums"
            colSpan={5}
          >
            {totals.runs}/{totals.wickets}
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  )
}
