import { useState } from 'react'
import { PageContainer } from '@/components/layout/PageContainer'
import { PrimaryButton } from '@/components/common/PrimaryButton'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { EmptyState } from '@/components/common/EmptyState'
import { Gauge } from 'lucide-react'
import type { MatchDocument } from '@/domain/match/types'
import { resolveBattingTeamId } from '@/domain/match/types'
import { createId } from '@/utils/id'
import { createInnings } from '@/engine/innings/createInnings'
import { completeOver } from '@/engine/commands/completeOver'
import { useSessionStore } from '@/store/sessionStore'

interface StartInningsFormProps {
  match: MatchDocument
}

/**
 * Captures the opening striker, non-striker and bowler before the first
 * delivery of an innings can be recorded. The match-setup wizard doesn't
 * collect this — it's only needed once scoring actually begins — so it
 * lives here rather than as an extra wizard step.
 */
export function StartInningsForm({ match }: StartInningsFormProps) {
  const updateMatch = useSessionStore((s) => s.updateMatch)

  const battingTeamId = resolveBattingTeamId(match)
  const battingTeam = match.teams.find((t) => t.team.id === battingTeamId)
  const bowlingTeam = match.teams.find((t) => t.team.id !== battingTeamId)

  const [striker, setStriker] = useState('')
  const [nonStriker, setNonStriker] = useState('')
  const [bowler, setBowler] = useState('')
  const [error, setError] = useState<string | undefined>(undefined)

  if (!match.toss || !battingTeam || !bowlingTeam) {
    return (
      <PageContainer>
        <EmptyState
          icon={Gauge}
          title="Toss has not been recorded"
          description="A toss decision is required before an innings can start."
        />
      </PageContainer>
    )
  }

  const battingPlayers = battingTeam.playingXiIds
    .map((id) => battingTeam.team.squad.find((p) => p.id === id))
    .filter((p): p is NonNullable<typeof p> => !!p)
  const bowlingPlayers = bowlingTeam.playingXiIds
    .map((id) => bowlingTeam.team.squad.find((p) => p.id === id))
    .filter((p): p is NonNullable<typeof p> => !!p)

  const canStart = !!striker && !!nonStriker && striker !== nonStriker && !!bowler

  function handleStart() {
    if (!canStart) return
    setError(undefined)
    const innings = createInnings({
      id: createId('innings'),
      matchId: match.id,
      battingTeamId: battingTeam!.team.id,
      bowlingTeamId: bowlingTeam!.team.id,
      inningsNumber: match.innings.length + 1,
      openingStriker: striker,
      openingNonStriker: nonStriker,
    })
    const result = completeOver(innings, match.rulesProfile, bowler)
    if (!result.ok) {
      setError(result.error.message)
      return
    }
    const readyInnings = result.value
    updateMatch(match.id, (doc) => ({ ...doc, innings: [...doc.innings, readyInnings] }))
  }

  return (
    <PageContainer>
      <div className="mb-6 space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Start Innings</h1>
        <p className="text-muted-foreground text-sm">
          {battingTeam.team.name} is batting first against {bowlingTeam.team.name}. Select
          the opening batters and bowler to begin scoring.
        </p>
      </div>

      <div className="max-w-sm space-y-4">
        <div className="space-y-1.5">
          <Label>Striker</Label>
          <Select value={striker} onValueChange={setStriker}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select opening striker" />
            </SelectTrigger>
            <SelectContent>
              {battingPlayers.map((player) => (
                <SelectItem
                  key={player.id}
                  value={player.id}
                  disabled={player.id === nonStriker}
                >
                  {player.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>Non-striker</Label>
          <Select value={nonStriker} onValueChange={setNonStriker}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select opening non-striker" />
            </SelectTrigger>
            <SelectContent>
              {battingPlayers.map((player) => (
                <SelectItem
                  key={player.id}
                  value={player.id}
                  disabled={player.id === striker}
                >
                  {player.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>Opening bowler</Label>
          <Select value={bowler} onValueChange={setBowler}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select opening bowler" />
            </SelectTrigger>
            <SelectContent>
              {bowlingPlayers.map((player) => (
                <SelectItem key={player.id} value={player.id}>
                  {player.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <PrimaryButton className="w-full" disabled={!canStart} onClick={handleStart}>
          Start Innings
        </PrimaryButton>
        {error && <p className="text-destructive text-sm">{error}</p>}
      </div>
    </PageContainer>
  )
}
