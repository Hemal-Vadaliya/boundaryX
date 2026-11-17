import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { Player } from '@/domain/player/types'
import { computeOverSummaries } from '@/engine/calculations/overSummaries'
import type { Delivery } from '@/domain/delivery/types'

interface OverByOverTableProps {
  deliveries: Delivery[]
  findPlayer: (id: string) => Player | undefined
}

export function OverByOverTable({ deliveries, findPlayer }: OverByOverTableProps) {
  const summaries = computeOverSummaries(deliveries)

  if (summaries.length === 0) {
    return <p className="text-muted-foreground text-sm">No overs bowled yet.</p>
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Over</TableHead>
          <TableHead>Bowler</TableHead>
          <TableHead className="text-right">Runs</TableHead>
          <TableHead className="text-right">Wkts</TableHead>
          <TableHead className="text-right">Total</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {summaries.map((over) => (
          <TableRow key={over.overNumber}>
            <TableCell className="tabular-nums">{over.overNumber + 1}</TableCell>
            <TableCell>{findPlayer(over.bowlerId)?.name ?? over.bowlerId}</TableCell>
            <TableCell className="text-right tabular-nums">{over.runs}</TableCell>
            <TableCell className="text-right tabular-nums">{over.wickets}</TableCell>
            <TableCell className="text-right font-medium tabular-nums">
              {over.teamTotalAfter}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
