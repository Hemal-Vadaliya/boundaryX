import { useState } from 'react'
import { PageContainer } from '@/components/layout/PageContainer'
import { PrimaryButton } from '@/components/common/PrimaryButton'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { MatchDocument } from '@/domain/match/types'
import { createId } from '@/utils/id'
import { createInnings } from '@/engine/innings/createInnings'
import { completeOver } from '@/engine/commands/completeOver'
import type { NextInningsPlan } from '@/engine/innings/nextInnings'
import { calculateDlsPar } from '@/engine/results/dls/dlsResult'
import { computeInningsTotals } from '@/engine/calculations/inningsTotals'
import { useSessionStore } from '@/store/sessionStore'

interface StartNextInningsFormProps {
  match: MatchDocument
  plan: NextInningsPlan
  onFollowOnDecision: (enforce: boolean) => void
}

/**
 * Starts innings 2 and beyond. Mirrors StartInningsForm's opener-selection
 * flow but derives batting/bowling teams and (for the final innings) the
 * chase target from the already-completed innings via determineNextInnings,
 * rather than from the toss. When the final innings' overs are reduced
 * before it even starts (e.g. a rain delay before the chase begins), the
 * target is recalculated using the DLS method instead of the plain
 * "first innings total + 1" target.
 */
export function StartNextInningsForm({
  match,
  plan,
  onFollowOnDecision,
}: StartNextInningsFormProps) {
  const updateMatch = useSessionStore((s) => s.updateMatch)

  const battingTeam = match.teams.find((t) => t.team.id === plan.battingTeamId)!
  const bowlingTeam = match.teams.find((t) => t.team.id === plan.bowlingTeamId)!

  const [striker, setStriker] = useState('')
  const [nonStriker, setNonStriker] = useState('')
  const [bowler, setBowler] = useState('')
  const [error, setError] = useState<string | undefined>(undefined)
  const [oversReduced, setOversReduced] = useState(false)
  const [reducedOvers, setReducedOvers] = useState(
    String(match.rulesProfile.oversPerInnings ?? '')
  )

  if (plan.followOnDecisionNeeded) {
    const followOnTeam = match.teams.find(
      (t) => t.team.id === plan.followOnBattingTeamId
    )!
    return (
      <PageContainer>
        <div className="mb-6 space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            Enforce the Follow-On?
          </h1>
          <p className="text-muted-foreground text-sm">
            {battingTeam.team.name} leads by enough to enforce the follow-on. Should{' '}
            {followOnTeam.team.name} bat again immediately?
          </p>
        </div>
        <div className="flex gap-2">
          <PrimaryButton onClick={() => onFollowOnDecision(true)}>
            Enforce follow-on
          </PrimaryButton>
          <Button variant="outline" onClick={() => onFollowOnDecision(false)}>
            Bat again instead
          </Button>
        </div>
      </PageContainer>
    )
  }

  const battingPlayers = battingTeam.playingXiIds
    .map((id) => battingTeam.team.squad.find((p) => p.id === id))
    .filter((p): p is NonNullable<typeof p> => !!p)
  const bowlingPlayers = bowlingTeam.playingXiIds
    .map((id) => bowlingTeam.team.squad.find((p) => p.id === id))
    .filter((p): p is NonNullable<typeof p> => !!p)

  // DLS-revised target is only meaningful for the chase innings (the one
  // the plan already attaches a target to) in a limited-overs match.
  const canReduceOvers = plan.target !== undefined && match.rulesProfile.inningsPerTeam === 1
  const firstCompletedInnings = match.innings.find((i) => i.state === 'completed')

  let effectiveTarget = plan.target
  let effectiveOversAllocated: number | undefined
  if (oversReduced && canReduceOvers && firstCompletedInnings) {
    const parsedOvers = Number(reducedOvers)
    if (Number.isInteger(parsedOvers) && parsedOvers > 0) {
      effectiveOversAllocated = parsedOvers
      const firstTotals = computeInningsTotals(firstCompletedInnings.deliveries)
      const firstBattingTeam = match.teams.find(
        (t) => t.team.id === firstCompletedInnings.battingTeamId
      )!
      const firstAllocatedOvers =
        firstCompletedInnings.oversAllocated ?? match.rulesProfile.oversPerInnings ?? 50
      const firstOversBowled =
        firstTotals.legalBallsBowled / match.rulesProfile.ballsPerOver
      const { parScore } = calculateDlsPar({
        firstInnings: {
          teamId: firstBattingTeam.team.id,
          runsScored: firstTotals.runs,
          oversAllocated: firstAllocatedOvers,
          oversRemainingAtEnd: Math.max(0, firstAllocatedOvers - firstOversBowled),
          wicketsLostAtEnd: firstTotals.wickets,
          maxWickets: firstBattingTeam.playingXiIds.length,
        },
        secondInnings: {
          teamId: battingTeam.team.id,
          runsScored: 0,
          oversAllocated: parsedOvers,
          oversRemainingAtEnd: 0,
          wicketsLostAtEnd: 0,
          maxWickets: battingTeam.playingXiIds.length,
        },
        g50: match.rulesProfile.dlsG50,
        fullFormatOvers: match.rulesProfile.oversPerInnings ?? 50,
      })
      effectiveTarget = Math.floor(parScore) + 1
    }
  }

  const canStart = !!striker && !!nonStriker && striker !== nonStriker && !!bowler

  function handleStart() {
    if (!canStart) return
    setError(undefined)
    const innings = createInnings({
      id: createId('innings'),
      matchId: match.id,
      battingTeamId: battingTeam.team.id,
      bowlingTeamId: bowlingTeam.team.id,
      inningsNumber: plan.inningsNumber,
      openingStriker: striker,
      openingNonStriker: nonStriker,
      target: effectiveTarget,
      oversAllocated: effectiveOversAllocated,
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
        <h1 className="text-2xl font-semibold tracking-tight">
          Start Innings {plan.inningsNumber}
        </h1>
        <p className="text-muted-foreground text-sm">
          {battingTeam.team.name} is batting against {bowlingTeam.team.name}.
          {effectiveTarget !== undefined && ` Target: ${effectiveTarget} runs.`}
          {effectiveOversAllocated !== undefined &&
            ` (${effectiveOversAllocated} overs, DLS-revised)`}
        </p>
      </div>

      <div className="max-w-sm space-y-4">
        {canReduceOvers && (
          <div className="border-border space-y-2 rounded-md border p-3">
            <div className="flex items-center gap-2">
              <Checkbox
                id="overs-reduced"
                checked={oversReduced}
                onCheckedChange={(c) => setOversReduced(c === true)}
              />
              <Label htmlFor="overs-reduced" className="font-normal">
                Overs reduced before this innings starts (rain delay)
              </Label>
            </div>
            {oversReduced && (
              <div className="space-y-1.5">
                <Label htmlFor="reduced-overs-input">
                  Overs available to {battingTeam.team.name}
                </Label>
                <Input
                  id="reduced-overs-input"
                  type="number"
                  min={1}
                  value={reducedOvers}
                  onChange={(e) => setReducedOvers(e.target.value)}
                />
                <p className="text-muted-foreground text-xs">
                  The target above is recalculated using the DLS method.
                </p>
              </div>
            )}
          </div>
        )}

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
