import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageContainer } from '@/components/layout/PageContainer'
import { Button } from '@/components/ui/button'
import { PrimaryButton } from '@/components/common/PrimaryButton'
import { Badge } from '@/components/ui/badge'
import { MatchDetailsStep } from '@/features/match-setup/steps/MatchDetailsStep'
import { RulesConfigStep } from '@/features/match-setup/steps/RulesConfigStep'
import { TeamNameStep } from '@/features/match-setup/steps/TeamNameStep'
import { PlayingXiStep } from '@/features/match-setup/steps/PlayingXiStep'
import { TossStep } from '@/features/match-setup/steps/TossStep'
import { SquadBuilder } from '@/features/teams/SquadBuilder'
import { emptyTeamSetupState } from '@/features/match-setup/wizardState'
import type { MatchSetupState } from '@/features/match-setup/wizardState'
import { defaultFormatConfig } from '@/domain/match/formatConfig'
import { validatePlayingXi } from '@/domain/match/validatePlayingXi'
import { createMatchDocument } from '@/services/matchService'
import { useSessionStore } from '@/store/sessionStore'
import { ChevronLeft, ChevronRight, Check } from 'lucide-react'

const STEPS = [
  'Match details',
  'Rules',
  'Team A name',
  'Team B name',
  'Team A — players',
  'Team A — Playing XI',
  'Team B — players',
  'Team B — Playing XI',
  'Toss',
  'Confirm',
] as const

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10)
}

export function MatchSetupPage() {
  const navigate = useNavigate()
  const addMatch = useSessionStore((s) => s.addMatch)
  const setActiveMatch = useSessionStore((s) => s.setActiveMatch)

  const [stepIndex, setStepIndex] = useState(0)
  const [state, setState] = useState<MatchSetupState>(() => ({
    name: '',
    venue: '',
    matchDate: todayIsoDate(),
    format: 'T20',
    formatConfig: defaultFormatConfig('T20'),
    teamA: emptyTeamSetupState(),
    teamB: emptyTeamSetupState(),
  }))

  function patch(fields: Partial<MatchSetupState>) {
    setState((prev) => ({ ...prev, ...fields }))
  }

  function patchFormat(fields: Partial<MatchSetupState['formatConfig']>) {
    setState((prev) => ({ ...prev, formatConfig: { ...prev.formatConfig, ...fields } }))
  }

  const teamAValidation = useMemo(() => {
    if (!state.teamA.team) return { valid: false, errors: ['Select Team A'] }
    return validatePlayingXi(
      state.teamA.team,
      state.teamA.playingXiIds,
      Math.min(state.teamA.playingXiSize, state.teamA.team.squad.length),
      state.teamA.captainId,
      state.teamA.wicketkeeperId
    )
  }, [state.teamA])

  const teamBValidation = useMemo(() => {
    if (!state.teamB.team) return { valid: false, errors: ['Select Team B'] }
    return validatePlayingXi(
      state.teamB.team,
      state.teamB.playingXiIds,
      Math.min(state.teamB.playingXiSize, state.teamB.team.squad.length),
      state.teamB.captainId,
      state.teamB.wicketkeeperId
    )
  }, [state.teamB])

  function canAdvanceFrom(index: number): boolean {
    switch (STEPS[index]) {
      case 'Match details':
        return state.name.trim().length > 0 && state.matchDate.length > 0
      case 'Rules':
        return true
      case 'Team A name':
        return !!state.teamA.team?.name.trim()
      case 'Team B name':
        return (
          !!state.teamB.team?.name.trim() &&
          state.teamB.team?.name.trim() !== state.teamA.team?.name.trim()
        )
      case 'Team A — players':
        return state.teamA.team!.squad.length >= 1
      case 'Team A — Playing XI':
        return teamAValidation.valid
      case 'Team B — players':
        return state.teamB.team!.squad.length >= 1
      case 'Team B — Playing XI':
        return teamBValidation.valid
      case 'Toss':
        return !!state.tossWinnerTeamSide && !!state.tossDecision
      default:
        return true
    }
  }

  const canAdvance = canAdvanceFrom(stepIndex)
  const isLastStep = stepIndex === STEPS.length - 1

  function handleCreateMatch() {
    if (!state.teamA.team || !state.teamB.team) return

    const document = createMatchDocument({
      name: state.name.trim(),
      venue: state.venue.trim() || undefined,
      matchDate: state.matchDate,
      format: state.format,
      formatConfigOverrides: state.formatConfig,
      teamA: state.teamA.team,
      teamB: state.teamB.team,
      playingXiA: state.teamA.playingXiIds,
      playingXiB: state.teamB.playingXiIds,
      captainIdA: state.teamA.captainId,
      wicketkeeperIdA: state.teamA.wicketkeeperId,
      captainIdB: state.teamB.captainId,
      wicketkeeperIdB: state.teamB.wicketkeeperId,
    })

    const wonTeamId =
      state.tossWinnerTeamSide === 'A' ? state.teamA.team.id : state.teamB.team.id
    document.toss = state.tossDecision
      ? { wonByTeamId: wonTeamId, decision: state.tossDecision }
      : undefined
    document.status = 'ongoing'

    addMatch(document)
    setActiveMatch(document.id)
    navigate(`/matches/${document.id}`)
  }

  return (
    <PageContainer>
      <div className="mb-6 space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">New Match</h1>
        <p className="text-muted-foreground text-sm">
          Configure teams, rules and the playing XI before the toss.
        </p>
      </div>

      <div className="mb-4 flex flex-wrap gap-1.5">
        {STEPS.map((step, index) => (
          <Badge
            key={step}
            variant={index === stepIndex ? 'default' : 'outline'}
            className="text-[10px]"
          >
            {index + 1}. {step}
          </Badge>
        ))}
      </div>

      <div className="border-border rounded-lg border p-4 sm:p-6">
        {STEPS[stepIndex] === 'Match details' && (
          <MatchDetailsStep
            name={state.name}
            venue={state.venue}
            matchDate={state.matchDate}
            format={state.format}
            onChange={(fields) => {
              patch(fields)
              if (fields.format) {
                setState((prev) => ({
                  ...prev,
                  format: fields.format!,
                  formatConfig: defaultFormatConfig(fields.format!),
                }))
              }
            }}
          />
        )}

        {STEPS[stepIndex] === 'Rules' && (
          <RulesConfigStep formatConfig={state.formatConfig} onChange={patchFormat} />
        )}

        {STEPS[stepIndex] === 'Team A name' && (
          <TeamNameStep
            label="Team A name"
            team={state.teamA.team}
            onChange={(team) => patch({ teamA: { ...state.teamA, team } })}
          />
        )}

        {STEPS[stepIndex] === 'Team B name' && (
          <TeamNameStep
            label="Team B name"
            team={state.teamB.team}
            onChange={(team) => patch({ teamB: { ...state.teamB, team } })}
          />
        )}

        {STEPS[stepIndex] === 'Team A — players' && state.teamA.team && (
          <SquadBuilder
            team={state.teamA.team}
            onChange={(team) => patch({ teamA: { ...state.teamA, team } })}
          />
        )}

        {STEPS[stepIndex] === 'Team A — Playing XI' && state.teamA.team && (
          <PlayingXiStep
            team={state.teamA.team}
            playingXiSize={state.teamA.playingXiSize}
            playingXiIds={state.teamA.playingXiIds}
            captainId={state.teamA.captainId}
            wicketkeeperId={state.teamA.wicketkeeperId}
            onChange={(fields) => patch({ teamA: { ...state.teamA, ...fields } })}
          />
        )}

        {STEPS[stepIndex] === 'Team B — players' && state.teamB.team && (
          <SquadBuilder
            team={state.teamB.team}
            onChange={(team) => patch({ teamB: { ...state.teamB, team } })}
          />
        )}

        {STEPS[stepIndex] === 'Team B — Playing XI' && state.teamB.team && (
          <PlayingXiStep
            team={state.teamB.team}
            playingXiSize={state.teamB.playingXiSize}
            playingXiIds={state.teamB.playingXiIds}
            captainId={state.teamB.captainId}
            wicketkeeperId={state.teamB.wicketkeeperId}
            onChange={(fields) => patch({ teamB: { ...state.teamB, ...fields } })}
          />
        )}

        {STEPS[stepIndex] === 'Toss' && state.teamA.team && state.teamB.team && (
          <TossStep
            teamA={state.teamA.team}
            teamB={state.teamB.team}
            tossCallerTeamSide={state.tossCallerTeamSide}
            tossCallSide={state.tossCallSide}
            coinResult={state.coinResult}
            tossWinnerTeamSide={state.tossWinnerTeamSide}
            tossDecision={state.tossDecision}
            onChange={patch}
          />
        )}

        {STEPS[stepIndex] === 'Confirm' && state.teamA.team && state.teamB.team && (
          <div className="space-y-2 text-sm">
            <p>
              <span className="font-medium">{state.name}</span> — {state.format} at{' '}
              {state.venue || 'venue TBD'} on {state.matchDate}
            </p>
            <p>
              {state.teamA.team.name} vs {state.teamB.team.name}
            </p>
            <p className="text-muted-foreground">
              {state.tossWinnerTeamSide === 'A'
                ? state.teamA.team.name
                : state.teamB.team.name}{' '}
              won the toss and chose to {state.tossDecision}.
            </p>
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <Button
          variant="outline"
          disabled={stepIndex === 0}
          onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
        >
          <ChevronLeft className="size-4" />
          Back
        </Button>

        {isLastStep ? (
          <PrimaryButton onClick={handleCreateMatch}>
            <Check className="size-4" />
            Start Match
          </PrimaryButton>
        ) : (
          <PrimaryButton
            disabled={!canAdvance}
            onClick={() => setStepIndex((i) => Math.min(STEPS.length - 1, i + 1))}
          >
            Next
            <ChevronRight className="size-4" />
          </PrimaryButton>
        )}
      </div>
    </PageContainer>
  )
}
