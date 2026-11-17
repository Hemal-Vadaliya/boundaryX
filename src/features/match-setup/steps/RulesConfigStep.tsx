import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import type { MatchFormatConfig } from '@/domain/match/formatConfig'

interface RulesConfigStepProps {
  formatConfig: MatchFormatConfig
  onChange: (fields: Partial<MatchFormatConfig>) => void
}

export function RulesConfigStep({ formatConfig, onChange }: RulesConfigStepProps) {
  return (
    <div className="space-y-4">
      <div>
        <Badge variant={formatConfig.isCustom ? 'outline' : 'secondary'}>
          {formatConfig.isCustom
            ? 'Custom rules profile'
            : `${formatConfig.format} standard profile`}
        </Badge>
        {!formatConfig.isCustom && (
          <p className="text-muted-foreground mt-1 text-xs">
            Values below default to the {formatConfig.format} profile. Adjust them if your
            competition&apos;s playing conditions differ.
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="overs-per-innings">Overs per innings</Label>
        <Input
          id="overs-per-innings"
          type="number"
          min={1}
          value={formatConfig.oversPerInnings ?? ''}
          placeholder="Unlimited"
          onChange={(e) =>
            onChange({
              oversPerInnings: e.target.value ? Number(e.target.value) : undefined,
            })
          }
        />
      </div>
    </div>
  )
}
