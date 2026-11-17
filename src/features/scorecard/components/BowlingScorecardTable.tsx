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
import { formatOvers } from '@/engine/scoring/overCalculator'

interface BowlingScorecardTableProps {
  innings: Innings
  bowlingOrder: string[]
  ballsPerOver: number
  findPlayer: (id: string) => Player | undefined
}

function economy(
  runsConceded: number,
  legalBallsBowled: number,
  ballsPerOver: number
): string {
  if (legalBallsBowled === 0) return '0.00'
  const overs = legalBallsBowled / ballsPerOver
  return (runsConceded / overs).toFixed(2)
}

export function BowlingScorecardTable({
  innings,
  bowlingOrder,
  ballsPerOver,
  findPlayer,
}: BowlingScorecardTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Bowler</TableHead>
          <TableHead className="text-right">O</TableHead>
          <TableHead className="text-right">M</TableHead>
          <TableHead className="text-right">R</TableHead>
          <TableHead className="text-right">W</TableHead>
          <TableHead className="text-right">Econ</TableHead>
          <TableHead className="text-right">Wd</TableHead>
          <TableHead className="text-right">Nb</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {bowlingOrder.map((playerId) => {
          const figures = innings.bowlerFigures[playerId]
          if (!figures) return null
          return (
            <TableRow key={playerId}>
              <TableCell className="font-medium">
                {findPlayer(playerId)?.name ?? playerId}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatOvers(figures.legalBallsBowled, ballsPerOver)}
              </TableCell>
              <TableCell className="text-right tabular-nums">{figures.maidens}</TableCell>
              <TableCell className="text-right tabular-nums">
                {figures.runsConceded}
              </TableCell>
              <TableCell className="text-right font-semibold tabular-nums">
                {figures.wickets}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {economy(figures.runsConceded, figures.legalBallsBowled, ballsPerOver)}
              </TableCell>
              <TableCell className="text-right tabular-nums">{figures.wides}</TableCell>
              <TableCell className="text-right tabular-nums">{figures.noBalls}</TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
