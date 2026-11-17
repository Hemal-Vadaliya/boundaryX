import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { MatchFormat } from '@/types/common'

interface MatchDetailsStepProps {
  name: string
  venue: string
  matchDate: string
  format: MatchFormat
  onChange: (
    fields: Partial<{
      name: string
      venue: string
      matchDate: string
      format: MatchFormat
    }>
  ) => void
}

const FORMAT_OPTIONS: { value: MatchFormat; label: string }[] = [
  { value: 'T10', label: 'T10' },
  { value: 'T20', label: 'T20' },
  { value: 'ODI', label: 'ODI (50 overs)' },
  { value: 'Test', label: 'Test (multi-innings)' },
  { value: 'Custom', label: 'Custom' },
]

export function MatchDetailsStep({
  name,
  venue,
  matchDate,
  format,
  onChange,
}: MatchDetailsStepProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="match-name">Match name</Label>
        <Input
          id="match-name"
          value={name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="e.g. Mumbai Strikers vs Chennai Falcons"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="match-venue">Venue</Label>
        <Input
          id="match-venue"
          value={venue}
          onChange={(e) => onChange({ venue: e.target.value })}
          placeholder="Optional"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="match-date">Match date</Label>
        <Input
          id="match-date"
          type="date"
          value={matchDate}
          onChange={(e) => onChange({ matchDate: e.target.value })}
        />
      </div>

      <div className="space-y-1.5">
        <Label>Format</Label>
        <Select
          value={format}
          onValueChange={(v) => onChange({ format: v as MatchFormat })}
        >
          <SelectTrigger className="w-full">
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
    </div>
  )
}
