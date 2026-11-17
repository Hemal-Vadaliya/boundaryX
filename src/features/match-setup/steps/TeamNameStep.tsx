import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Team } from '@/domain/team/types'
import { createId } from '@/utils/id'

interface TeamNameStepProps {
  label: string
  team: Team | null
  onChange: (team: Team) => void
}

export function TeamNameStep({ label, team, onChange }: TeamNameStepProps) {
  function handleNameChange(name: string) {
    onChange({
      id: team?.id ?? createId('team'),
      name,
      squad: team?.squad ?? [],
      captainId: team?.captainId,
      wicketkeeperId: team?.wicketkeeperId,
    })
  }

  return (
    <div className="space-y-1.5">
      <Label htmlFor="team-name-input">{label}</Label>
      <Input
        id="team-name-input"
        value={team?.name ?? ''}
        onChange={(e) => handleNameChange(e.target.value)}
        placeholder="e.g. Mumbai Strikers"
        autoFocus
      />
    </div>
  )
}
