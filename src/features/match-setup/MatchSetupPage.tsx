import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageContainer } from '@/components/layout/PageContainer'
import { Button } from '@/components/ui/button'
import { PrimaryButton } from '@/components/common/PrimaryButton'
import { Badge } from '@/components/ui/badge'
import { ConfirmationDialog } from '@/components/common/ConfirmationDialog'
import { MatchDetailsStep } from '@/features/match-setup/steps/MatchDetailsStep'
import { RulesConfigStep } from '@/features/match-setup/steps/RulesConfigStep'
import { TeamNameStep } from '@/features/match-setup/steps/TeamNameStep'
import { PlayerPoolStep } from '@/features/match-setup/steps/PlayerPoolStep'
import { TeamPlayerSelectionStep } from '@/features/match-setup/steps/TeamPlayerSelectionStep'
import { PlayerArrangementStep } from '@/features/match-setup/steps/PlayerArrangementStep'
import { PlayingXiStep } from '@/features/match-setup/steps/PlayingXiStep'
import { TossStep } from '@/features/match-setup/steps/TossStep'
import { emptyTeamSetupState } from '@/features/match-setup/wizardState'
import type { MatchSetupState } from '@/features/match-setup/wizardState'
import { defaultFormatConfig } from '@/domain/match/formatConfig'
import { validatePlayingXi } from '@/domain/match/validatePlayingXi'
import { createMatchDocument } from '@/services/matchService'
import { useSessionStore } from '@/store/sessionStore'
import { usePlayerPoolStore } from '@/store/playerPoolStore'
import { useAssignedPlayers } from '@/store/playerPoolSelectors'
import type { Team } from '@/domain/team/types'
import { createId } from '@/utils/id'
import { ChevronLeft, ChevronRight, Check } from 'lucide-react'

const STEPS = [
  'Match details',
  'Rules',
  'Team A name',
  'Team B name',
  'Player pool',
  'Team A — player selection',
  'Team B — player selection',
  'Player Arrangement',
  'Team A — Playing XI',
  'Team B — Playing XI',
  'Toss',
] as const

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10)
}

function withSquad(team: Team | null, squad: Team['squad']): Team | null {
  return team ? { ...team, squad } : null
}

export function MatchSetupPage() {
  const navigate = useNavigate()
  const addMatch = useSessionStore((s) => s.addMatch)
  const setActiveMatch = useSessionStore((s) => s.setActiveMatch)
  const poolPlayers = usePlayerPoolStore((s) => s.players)
  const resetAssignments = usePlayerPoolStore((s) => s.resetAssignments)
  const saveTeamConfig = usePlayerPoolStore((s) => s.saveTeamConfig)
  const resetTeamConfig = usePlayerPoolStore((s) => s.resetTeamConfig)
  const restoreAssignments = usePlayerPoolStore((s) => s.restoreAssignments)
  const teamAPlayers = useAssignedPlayers('A')
  const teamBPlayers = useAssignedPlayers('B')

  // Captured once, at mount, so the "restore previous setup?" dialog is
  // offered exactly when a saved configuration already existed when this
  // wizard run started — later saves (from this very run) must not keep
  // re-triggering it.
  const [hadSavedConfig] = useState(() => usePlayerPoolStore.getState().teamConfigSaved)
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(hadSavedConfig)
  const [restoreDecided, setRestoreDecided] = useState(!hadSavedConfig)
  // ConfirmationDialog calls onOpenChange(false) after onConfirm fires, not
  // just on Cancel/Escape/overlay-dismiss — this ref lets the dialog's
  // onOpenChange tell those two cases apart instead of treating every
  // close as a decline.
  const restoreAcceptedRef = useRef(false)

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

  function acceptRestoredConfig() {
    restoreAcceptedRef.current = true
    const snapshot = usePlayerPoolStore.getState()
    restoreAssignments()
    setState((prev) => ({
      ...prev,
      teamA: {
        ...prev.teamA,
        team: {
          id: createId('team'),
          name: snapshot.teamAName,
          squad: [],
          captainId: snapshot.teamACaptainId,
          wicketkeeperId: snapshot.teamAWicketkeeperId,
        },
        playingXiSize: snapshot.teamAPlayingXiSize,
        playingXiIds: snapshot.teamAPlayingXiIds,
        captainId: snapshot.teamACaptainId,
        wicketkeeperId: snapshot.teamAWicketkeeperId,
      },
      teamB: {
        ...prev.teamB,
        team: {
          id: createId('team'),
          name: snapshot.teamBName,
          squad: [],
          captainId: snapshot.teamBCaptainId,
          wicketkeeperId: snapshot.teamBWicketkeeperId,
        },
        playingXiSize: snapshot.teamBPlayingXiSize,
        playingXiIds: snapshot.teamBPlayingXiIds,
        captainId: snapshot.teamBCaptainId,
        wicketkeeperId: snapshot.teamBWicketkeeperId,
      },
    }))
    setStepIndex(STEPS.indexOf('Team A — Playing XI'))
    setRestoreDialogOpen(false)
    setRestoreDecided(true)
  }

  function declineRestoredConfig() {
    resetTeamConfig()
    setRestoreDialogOpen(false)
    setRestoreDecided(true)
  }

  // Keeps the saved team configuration (names, Playing XI, captain,
  // wicketkeeper) up to date with every edit, so the *next* New Match run
  // always has the latest version to offer restoring — but only once the
  // restore prompt above has been resolved, so an accepted/declined
  // restore isn't immediately clobbered by this same effect firing on the
  // freshly-applied (or freshly-cleared) state. Also skips saving while
  // both team names are still blank, so mounting the wizard (or declining
  // the restore prompt) never flags an empty config as "saved" — which
  // would otherwise make the next wizard run immediately re-offer restoring
  // nothing.
  useEffect(() => {
    if (!restoreDecided) return
    const teamAName = state.teamA.team?.name.trim() ?? ''
    const teamBName = state.teamB.team?.name.trim() ?? ''
    if (!teamAName && !teamBName) return
    saveTeamConfig({
      teamAName,
      teamBName,
      teamAPlayingXiSize: state.teamA.playingXiSize,
      teamAPlayingXiIds: state.teamA.playingXiIds,
      teamACaptainId: state.teamA.captainId,
      teamAWicketkeeperId: state.teamA.wicketkeeperId,
      teamBPlayingXiSize: state.teamB.playingXiSize,
      teamBPlayingXiIds: state.teamB.playingXiIds,
      teamBCaptainId: state.teamB.captainId,
      teamBWicketkeeperId: state.teamB.wicketkeeperId,
    })
  }, [restoreDecided, state.teamA, state.teamB, saveTeamConfig])


  // A swap moves a player from one team's roster to the other's — any
  // Playing XI selection, captain, or wicketkeeper pointing at either
  // swapped player no longer makes sense for the side that just lost
  // them, so drop those stale references rather than leave a player "on
  // the XI" for a team they're no longer part of.
  function dropFromXiIfPresent(team: MatchSetupState['teamA'], playerId: string) {
    if (!team.playingXiIds.includes(playerId) && team.captainId !== playerId && team.wicketkeeperId !== playerId) {
      return team
    }
    return {
      ...team,
      playingXiIds: team.playingXiIds.filter((id) => id !== playerId),
      captainId: team.captainId === playerId ? undefined : team.captainId,
      wicketkeeperId: team.wicketkeeperId === playerId ? undefined : team.wicketkeeperId,
    }
  }

  function handlePlayersSwapped(playerIdA: string, playerIdB: string) {
    setState((prev) => ({
      ...prev,
      teamA: dropFromXiIfPresent(
        dropFromXiIfPresent(prev.teamA, playerIdA),
        playerIdB
      ),
      teamB: dropFromXiIfPresent(
        dropFromXiIfPresent(prev.teamB, playerIdA),
        playerIdB
      ),
    }))
  }

  // The wizard's team state only carries the name — each side's actual
  // squad comes from the player pool's current assignment, so it always
  // reflects the latest result of adding/removing/swapping players.
  const effectiveTeamA = withSquad(state.teamA.team, teamAPlayers)
  const effectiveTeamB = withSquad(state.teamB.team, teamBPlayers)

  const teamAValidation = useMemo(() => {
    if (!effectiveTeamA) return { valid: false, errors: ['Select Team A'] }
    return validatePlayingXi(
      effectiveTeamA,
      state.teamA.playingXiIds,
      Math.min(state.teamA.playingXiSize, effectiveTeamA.squad.length),
      state.teamA.captainId,
      state.teamA.wicketkeeperId
    )
  }, [effectiveTeamA, state.teamA])

  const teamBValidation = useMemo(() => {
    if (!effectiveTeamB) return { valid: false, errors: ['Select Team B'] }
    return validatePlayingXi(
      effectiveTeamB,
      state.teamB.playingXiIds,
      Math.min(state.teamB.playingXiSize, effectiveTeamB.squad.length),
      state.teamB.captainId,
      state.teamB.wicketkeeperId
    )
  }, [effectiveTeamB, state.teamB])

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
      case 'Player pool':
        return poolPlayers.length >= 2
      case 'Team A — player selection':
        return teamAPlayers.length >= 1
      case 'Team B — player selection':
        return teamBPlayers.length >= 1
      case 'Player Arrangement':
        return teamAPlayers.length >= 1 && teamBPlayers.length >= 1
      case 'Team A — Playing XI':
        return teamAValidation.valid
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
    if (!effectiveTeamA || !effectiveTeamB) return
    if (!teamAValidation.valid || !teamBValidation.valid) return

    const document = createMatchDocument({
      name: state.name.trim(),
      venue: state.venue.trim() || undefined,
      matchDate: state.matchDate,
      format: state.format,
      formatConfigOverrides: state.formatConfig,
      teamA: effectiveTeamA,
      teamB: effectiveTeamB,
      playingXiA: state.teamA.playingXiIds,
      playingXiB: state.teamB.playingXiIds,
      captainIdA: state.teamA.captainId,
      wicketkeeperIdA: state.teamA.wicketkeeperId,
      captainIdB: state.teamB.captainId,
      wicketkeeperIdB: state.teamB.wicketkeeperId,
    })

    const wonTeamId =
      state.tossWinnerTeamSide === 'A' ? effectiveTeamA.id : effectiveTeamB.id
    document.toss = state.tossDecision
      ? { wonByTeamId: wonTeamId, decision: state.tossDecision }
      : undefined
    document.status = 'ongoing'

    addMatch(document)
    setActiveMatch(document.id)
    // The player pool itself (names) and the saved team-configuration
    // snapshot (including the last player-to-team assignment) stay for the
    // next match this session, in case the user chooses to restore them —
    // only the *live* assignment resets, so starting fresh always begins
    // unassigned.
    resetAssignments()
    navigate(`/matches/${document.id}`)
  }

  return (
    <PageContainer>
      <ConfirmationDialog
        open={restoreDialogOpen}
        onOpenChange={(open) => {
          if (open) return
          if (restoreAcceptedRef.current) {
            setRestoreDialogOpen(false)
            return
          }
          declineRestoredConfig()
        }}
        title="Use previous team setup?"
        description="We found a saved team configuration (names, Playing XI, captain and wicketkeeper) from earlier this session. Reuse it, or start fresh?"
        confirmLabel="Use previous setup"
        cancelLabel="Start fresh"
        onConfirm={acceptRestoredConfig}
      />

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

        {STEPS[stepIndex] === 'Player pool' && <PlayerPoolStep />}

        {STEPS[stepIndex] === 'Team A — player selection' && (
          <TeamPlayerSelectionStep side="A" teamName={state.teamA.team?.name ?? ''} />
        )}

        {STEPS[stepIndex] === 'Team B — player selection' && (
          <TeamPlayerSelectionStep side="B" teamName={state.teamB.team?.name ?? ''} />
        )}

        {STEPS[stepIndex] === 'Player Arrangement' && (
          <PlayerArrangementStep
            teamAName={state.teamA.team?.name ?? ''}
            teamBName={state.teamB.team?.name ?? ''}
            onPlayersSwapped={handlePlayersSwapped}
          />
        )}

        {STEPS[stepIndex] === 'Team A — Playing XI' && effectiveTeamA && (
          <PlayingXiStep
            team={effectiveTeamA}
            playingXiSize={state.teamA.playingXiSize}
            playingXiIds={state.teamA.playingXiIds}
            captainId={state.teamA.captainId}
            wicketkeeperId={state.teamA.wicketkeeperId}
            onChange={(fields) => patch({ teamA: { ...state.teamA, ...fields } })}
          />
        )}

        {STEPS[stepIndex] === 'Team B — Playing XI' && effectiveTeamB && (
          <PlayingXiStep
            team={effectiveTeamB}
            playingXiSize={state.teamB.playingXiSize}
            playingXiIds={state.teamB.playingXiIds}
            captainId={state.teamB.captainId}
            wicketkeeperId={state.teamB.wicketkeeperId}
            onChange={(fields) => patch({ teamB: { ...state.teamB, ...fields } })}
          />
        )}

        {STEPS[stepIndex] === 'Toss' && effectiveTeamA && effectiveTeamB && (
          <TossStep
            teamA={effectiveTeamA}
            teamB={effectiveTeamB}
            tossCallerTeamSide={state.tossCallerTeamSide}
            tossCallSide={state.tossCallSide}
            coinResult={state.coinResult}
            tossWinnerTeamSide={state.tossWinnerTeamSide}
            tossDecision={state.tossDecision}
            onChange={patch}
          />
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
          <PrimaryButton disabled={!canAdvance} onClick={handleCreateMatch}>
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
