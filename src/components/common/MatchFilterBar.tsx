import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { MatchFormat, MatchStatus } from '@/types/common'
import { Search } from 'lucide-react'

export interface MatchFilters {
  query: string
  status: MatchStatus | 'all'
  format: MatchFormat | 'all'
}

interface MatchFilterBarProps {
  filters: MatchFilters
  onChange: (filters: MatchFilters) => void
}

const STATUS_OPTIONS: { value: MatchStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All statuses' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'ongoing', label: 'Live' },
  { value: 'completed', label: 'Completed' },
  { value: 'abandoned', label: 'Abandoned' },
]

const FORMAT_OPTIONS: { value: MatchFormat | 'all'; label: string }[] = [
  { value: 'all', label: 'All formats' },
  { value: 'T10', label: 'T10' },
  { value: 'T20', label: 'T20' },
  { value: 'ODI', label: 'ODI' },
  { value: 'Test', label: 'Test' },
  { value: 'Custom', label: 'Custom' },
]

export function MatchFilterBar({ filters, onChange }: MatchFilterBarProps) {
  return (
    <div className="mb-4 flex flex-col gap-2 sm:flex-row">
      <div className="relative flex-1">
        <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
        <Input
          value={filters.query}
          onChange={(e) => onChange({ ...filters, query: e.target.value })}
          placeholder="Search by match or team name"
          className="pl-8"
        />
      </div>
      <Select
        value={filters.status}
        onValueChange={(v) => onChange({ ...filters, status: v as MatchStatus | 'all' })}
      >
        <SelectTrigger className="w-full sm:w-44">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {STATUS_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={filters.format}
        onValueChange={(v) => onChange({ ...filters, format: v as MatchFormat | 'all' })}
      >
        <SelectTrigger className="w-full sm:w-36">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {FORMAT_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
