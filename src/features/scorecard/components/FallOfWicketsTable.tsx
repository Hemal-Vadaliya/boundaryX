import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { FallOfWicket } from '@/domain/innings/types'
import type { Player } from '@/domain/player/types'

interface FallOfWicketsTableProps {
  fallOfWickets: FallOfWicket[]
  findPlayer: (id: string) => Player | undefined
}

export function FallOfWicketsTable({
  fallOfWickets,
  findPlayer,
}: FallOfWicketsTableProps) {
  if (fallOfWickets.length === 0) {
    return <p className="text-muted-foreground text-sm">No wickets have fallen yet.</p>
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Wicket</TableHead>
          <TableHead>Batter</TableHead>
          <TableHead className="text-right">Score</TableHead>
          <TableHead className="text-right">Overs</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {fallOfWickets.map((fow) => (
          <TableRow key={fow.wicketNumber}>
            <TableCell className="tabular-nums">{fow.wicketNumber}</TableCell>
            <TableCell>{findPlayer(fow.playerId)?.name ?? fow.playerId}</TableCell>
            <TableCell className="text-right tabular-nums">
              {fow.teamScoreAtFall}
            </TableCell>
            <TableCell className="text-right tabular-nums">{fow.oversAtFall}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
