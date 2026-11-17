import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { Partnership } from '@/domain/innings/types'
import type { Player } from '@/domain/player/types'

interface PartnershipsTableProps {
  partnerships: Partnership[]
  findPlayer: (id: string) => Player | undefined
}

export function PartnershipsTable({ partnerships, findPlayer }: PartnershipsTableProps) {
  if (partnerships.length === 0) {
    return <p className="text-muted-foreground text-sm">No partnerships recorded yet.</p>
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Partnership</TableHead>
          <TableHead className="text-right">Runs</TableHead>
          <TableHead className="text-right">Balls</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {partnerships.map((partnership, index) => (
          <TableRow key={index}>
            <TableCell>
              {partnership.batterBId
                ? `${findPlayer(partnership.batterAId)?.name ?? partnership.batterAId} & ${findPlayer(partnership.batterBId)?.name ?? partnership.batterBId}`
                : `${findPlayer(partnership.batterAId)?.name ?? partnership.batterAId} (last man standing)`}
            </TableCell>
            <TableCell className="text-right font-medium tabular-nums">
              {partnership.runs}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {partnership.ballsFaced}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
