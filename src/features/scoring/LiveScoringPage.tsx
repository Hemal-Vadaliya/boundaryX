import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { motion } from 'motion/react'
import { PageContainer } from '@/components/layout/PageContainer'
import { EmptyState } from '@/components/common/EmptyState'
import { MatchResultBanner } from '@/components/common/MatchResultBanner'
import { PrimaryButton } from '@/components/common/PrimaryButton'
import { FileQuestion, Table } from 'lucide-react'
import { useMatch } from '@/store/matchSelectors'
import { StartInningsForm } from '@/features/scoring/StartInningsForm'
import { StartNextInningsForm } from '@/features/scoring/StartNextInningsForm'
import { useScoringActions } from '@/features/scoring/useScoringActions'
import { ScoreboardHeader } from '@/features/scoring/components/ScoreboardHeader'
import { BattersPanel } from '@/features/scoring/components/BattersPanel'
import { BowlerPanel } from '@/features/scoring/components/BowlerPanel'
import { OverTimeline } from '@/features/scoring/components/OverTimeline'
import { RunButtons } from '@/features/scoring/components/RunButtons'
import { ExtrasControls } from '@/features/scoring/components/ExtrasControls'
import { WicketSheet } from '@/features/scoring/components/WicketSheet'
import type { WicketConfirmation } from '@/features/scoring/components/WicketSheet'
import { NewBowlerSheet } from '@/features/scoring/components/NewBowlerSheet'
import { RetireBatterSheet } from '@/features/scoring/components/RetireBatterSheet'
import { EditLastBallSheet } from '@/features/scoring/components/EditLastBallSheet'
import { SelectIncomingBatterSheet } from '@/features/scoring/components/SelectIncomingBatterSheet'
import { ScoringActionBar } from '@/features/scoring/components/ScoringActionBar'
import { RainDelaySheet } from '@/features/scoring/components/RainDelaySheet'
import {
  DeliveryFeedback,
  type DeliveryFeedbackTrigger,
} from '@/features/scoring/components/DeliveryFeedback'
import { Button } from '@/components/ui/button'
import { checkInningsCompletion } from '@/engine/innings/inningsLifecycle'
import { determineNextInnings } from '@/engine/innings/nextInnings'
import type { Player } from '@/domain/player/types'

export function LiveScoringPage() {
  const { matchId } = useParams<{ matchId: string }>()
  const loaded = useMatch(matchId)

  const [wicketOutcome, setWicketOutcome] = useState<'legal' | 'wide' | 'no-ball' | null>(
    null
  )
  const [newBowlerSheetOpen, setNewBowlerSheetOpen] = useState(false)
  const [retireSheetOpen, setRetireSheetOpen] = useState(false)
  const [editSheetOpen, setEditSheetOpen] = useState(false)
  const [rainDelaySheetOpen, setRainDelaySheetOpen] = useState(false)
  const [followOnOverride, setFollowOnOverride] = useState<boolean | undefined>(undefined)

  if (!loaded) {
    return (
      <PageContainer>
        <EmptyState
          icon={FileQuestion}
          title="Match not found in this session"
          description="This match ID isn't loaded. Import its JSON file or pick another match from the dashboard."
        />
      </PageContainer>
    )
  }

  const { document: match } = loaded

  if (match.result) {
    return (
      <PageContainer className="max-w-2xl space-y-4">
        <MatchResultBanner match={match} />
        <Link to={`/matches/${match.id}/scorecard`}>
          <PrimaryButton>
            <Table className="size-4" />
            View Scorecard
          </PrimaryButton>
        </Link>
      </PageContainer>
    )
  }

  const currentInnings = match.innings[match.innings.length - 1]
  const inningsNeedsToStart = !currentInnings || currentInnings.state === 'completed'

  if (inningsNeedsToStart) {
    if (match.innings.length === 0) {
      return <StartInningsForm match={match} />
    }
    const plan = determineNextInnings(match, match.rulesProfile, followOnOverride)
    if (!plan) {
      // All innings the format calls for are complete but no result was
      // computed yet (e.g. a Test match ending in a draw) — finishInnings
      // already attaches the result in that case, so this should be
      // transient; show a neutral loading-style state rather than nothing.
      return (
        <PageContainer>
          <EmptyState
            icon={Table}
            title="Match complete"
            description="View the scorecard for the full result."
          />
        </PageContainer>
      )
    }
    return (
      <StartNextInningsForm
        match={match}
        plan={plan}
        onFollowOnDecision={setFollowOnOverride}
      />
    )
  }

  return (
    <ScoringScreen
      matchId={match.id}
      wicketOutcome={wicketOutcome}
      setWicketOutcome={setWicketOutcome}
      newBowlerSheetOpen={newBowlerSheetOpen}
      setNewBowlerSheetOpen={setNewBowlerSheetOpen}
      retireSheetOpen={retireSheetOpen}
      setRetireSheetOpen={setRetireSheetOpen}
      editSheetOpen={editSheetOpen}
      setEditSheetOpen={setEditSheetOpen}
      rainDelaySheetOpen={rainDelaySheetOpen}
      setRainDelaySheetOpen={setRainDelaySheetOpen}
    />
  )
}

interface ScoringScreenProps {
  matchId: string
  wicketOutcome: 'legal' | 'wide' | 'no-ball' | null
  setWicketOutcome: (v: 'legal' | 'wide' | 'no-ball' | null) => void
  newBowlerSheetOpen: boolean
  setNewBowlerSheetOpen: (v: boolean) => void
  retireSheetOpen: boolean
  setRetireSheetOpen: (v: boolean) => void
  editSheetOpen: boolean
  setEditSheetOpen: (v: boolean) => void
  rainDelaySheetOpen: boolean
  setRainDelaySheetOpen: (v: boolean) => void
}

/**
 * Separated from LiveScoringPage so useMatch/useScoringActions always run
 * against a match document that is guaranteed to already have an innings
 * — keeps the "no innings yet" branch above free of hooks-order concerns.
 */
function ScoringScreen({
  matchId,
  wicketOutcome,
  setWicketOutcome,
  newBowlerSheetOpen,
  setNewBowlerSheetOpen,
  retireSheetOpen,
  setRetireSheetOpen,
  editSheetOpen,
  setEditSheetOpen,
  rainDelaySheetOpen,
  setRainDelaySheetOpen,
}: ScoringScreenProps) {
  const loaded = useMatch(matchId)
  const match = loaded!.document
  const actions = useScoringActions(match)
  const innings = actions.innings!
  const { finishInnings } = actions

  const [teamA, teamB] = match.teams
  const battingTeam = innings.battingTeamId === teamA.team.id ? teamA : teamB
  const bowlingTeam = innings.battingTeamId === teamA.team.id ? teamB : teamA

  const allPlayers = useMemo(
    () => [...teamA.team.squad, ...teamB.team.squad],
    [teamA.team.squad, teamB.team.squad]
  )
  const findPlayer = (playerId: string): Player | undefined =>
    allPlayers.find((p) => p.id === playerId)

  const battersOnCrease = innings.currentBatters
    ? [innings.currentBatters.striker, innings.currentBatters.nonStriker]
    : []
  const availableIncomingBatters = battingTeam.playingXiIds
    .map((id) => battingTeam.team.squad.find((p) => p.id === id))
    .filter((p): p is Player => !!p)
    .filter(
      (p) =>
        !battersOnCrease.includes(p.id) && innings.batterInnings[p.id]?.state !== 'out'
    )
  const availableBowlers = bowlingTeam.playingXiIds
    .map((id) => bowlingTeam.team.squad.find((p) => p.id === id))
    .filter((p): p is Player => !!p)
    .filter(
      (p) =>
        !match.rulesProfile.noConsecutiveOvers || p.id !== innings.lastOverBowlerId
    )
  const fieldingPlayers = bowlingTeam.playingXiIds
    .map((id) => bowlingTeam.team.squad.find((p) => p.id === id))
    .filter((p): p is Player => !!p)

  const lastDelivery = innings.deliveries[innings.deliveries.length - 1]
  const completion = checkInningsCompletion(
    innings,
    match.rulesProfile,
    battingTeam.playingXiIds.length
  )
  const noFurtherBattersAvailable = availableIncomingBatters.length === 0
  const needsIncomingBatter =
    !!lastDelivery?.dismissal &&
    !innings.currentBatters &&
    !completion.shouldEnd &&
    !noFurtherBattersAvailable
  const needsNewBowler =
    !innings.currentBowlerId && !completion.shouldEnd && !needsIncomingBatter
  const scoringDisabled = completion.shouldEnd || needsIncomingBatter || needsNewBowler

  const currentOversAllocated = innings.oversAllocated ?? match.rulesProfile.oversPerInnings
  const oversAlreadyBowled = Math.ceil(
    innings.legalBallsBowled / match.rulesProfile.ballsPerOver
  )

  const [feedback, setFeedback] = useState<DeliveryFeedbackTrigger | null>(null)
  const [lastSeenDeliveryId, setLastSeenDeliveryId] = useState<string | undefined>(
    lastDelivery?.id
  )
  const [wasAwaitingNewBowler, setWasAwaitingNewBowler] = useState(needsNewBowler)

  if (lastDelivery && lastDelivery.id !== lastSeenDeliveryId) {
    setLastSeenDeliveryId(lastDelivery.id)
    if (lastDelivery.dismissal) {
      setFeedback({ kind: 'wicket', key: lastDelivery.id })
    } else if (lastDelivery.outcome === 'legal' && lastDelivery.batterRuns === 6) {
      setFeedback({ kind: 'six', key: lastDelivery.id })
    } else if (lastDelivery.outcome === 'legal' && lastDelivery.batterRuns === 4) {
      setFeedback({ kind: 'four', key: lastDelivery.id })
    }
  }

  if (needsNewBowler !== wasAwaitingNewBowler) {
    setWasAwaitingNewBowler(needsNewBowler)
    if (needsNewBowler && innings.deliveries.length > 0) {
      setFeedback({ kind: 'over-complete', key: `over-${innings.deliveries.length}` })
    }
  }

  useEffect(() => {
    if (!feedback) return
    const timeout = setTimeout(() => setFeedback(null), 1600)
    return () => clearTimeout(timeout)
  }, [feedback])

  useEffect(() => {
    if (completion.shouldEnd && completion.reason === 'target-achieved') {
      finishInnings()
    }
  }, [completion.shouldEnd, completion.reason, finishInnings])

  function recordRuns(runs: number) {
    if (!innings.currentBowlerId) return
    actions.score({
      bowlerId: innings.currentBowlerId,
      batterRuns: runs,
      extras: {},
      outcome: 'legal',
    })
  }

  function handleWicketConfirm(confirmation: WicketConfirmation) {
    if (!innings.currentBowlerId || !wicketOutcome) return
    const outcome = wicketOutcome
    actions.score({
      bowlerId: innings.currentBowlerId,
      batterRuns: outcome === 'wide' ? 0 : confirmation.runsBeforeDismissal,
      extras:
        outcome === 'wide'
          ? { wides: 1 }
          : outcome === 'no-ball'
            ? { noBallRuns: 1 }
            : {},
      outcome,
      dismissal: {
        type: confirmation.type,
        dismissedPlayerId: confirmation.dismissedPlayerId,
        dismissedEnd: confirmation.dismissedEnd,
        fielderId: confirmation.fielderId,
        assistingFielderId: confirmation.assistingFielderId,
      },
      incomingBatterId: confirmation.incomingBatterId,
      battersCrossed: confirmation.battersCrossed,
      noFurtherBattersAvailable:
        !confirmation.incomingBatterId && noFurtherBattersAvailable,
    })
    setWicketOutcome(null)
  }

  return (
    <>
      <DeliveryFeedback trigger={feedback} />

      <PageContainer className="max-w-2xl space-y-4 pb-32">
        <ScoreboardHeader
          innings={innings}
          rulesProfile={match.rulesProfile}
          battingTeamName={battingTeam.team.name}
        />

        {completion.shouldEnd && (
          <div className="border-warning/40 bg-warning/10 rounded-lg border p-3 text-sm">
            This innings has reached its natural conclusion (
            {completion.reason?.replace('-', ' ')}). End the innings to lock in the final
            figures.
          </div>
        )}

        <BattersPanel innings={innings} findPlayer={findPlayer} />
        <BowlerPanel
          innings={innings}
          ballsPerOver={match.rulesProfile.ballsPerOver}
          findPlayer={findPlayer}
        />

        <div className="space-y-1.5">
          <p className="text-muted-foreground text-xs font-medium">This over</p>
          <OverTimeline
            deliveries={innings.deliveries}
            currentOverNumber={Math.floor(
              innings.legalBallsBowled / match.rulesProfile.ballsPerOver
            )}
          />
        </div>

        {actions.error && (
          <p className="bg-destructive/10 text-destructive rounded-md p-2 text-sm">
            {actions.error}
          </p>
        )}

        <RunButtons onSelectRuns={recordRuns} disabled={scoringDisabled} />

        <ExtrasControls
          bowlerId={innings.currentBowlerId ?? ''}
          onRecord={(input) => actions.score(input)}
          disabled={scoringDisabled}
        />

        <motion.div whileTap={{ scale: 0.95 }}>
          <Button
            variant="destructive"
            className="w-full"
            disabled={scoringDisabled}
            onClick={() => setWicketOutcome('legal')}
          >
            Wicket
          </Button>
        </motion.div>

        <ScoringActionBar
          canUndo={innings.deliveries.length > 0}
          canEdit={innings.deliveries.length > 0}
          onUndo={() => actions.undoLastBall()}
          onEditLastBall={() => setEditSheetOpen(true)}
          onRetireBatter={() => setRetireSheetOpen(true)}
          onDeclare={
            match.rulesProfile.followOnEnabled ? () => actions.declare() : undefined
          }
          onEndInnings={() => actions.finishInnings()}
          onRainDelay={() => setRainDelaySheetOpen(true)}
        />
      </PageContainer>

      {innings.currentBatters && wicketOutcome && (
        <WicketSheet
          open={!!wicketOutcome}
          onOpenChange={(open) => !open && setWicketOutcome(null)}
          outcome={wicketOutcome}
          strikerId={innings.currentBatters.striker}
          nonStrikerId={innings.currentBatters.nonStriker}
          findPlayer={findPlayer}
          availableIncomingBatters={availableIncomingBatters}
          fieldingPlayers={fieldingPlayers}
          onConfirm={handleWicketConfirm}
        />
      )}

      <NewBowlerSheet
        open={needsNewBowler || newBowlerSheetOpen}
        onOpenChange={setNewBowlerSheetOpen}
        availableBowlers={availableBowlers}
        error={actions.error}
        onConfirm={(bowlerId) => {
          actions.startNewOver(bowlerId)
          setNewBowlerSheetOpen(false)
        }}
      />

      {innings.currentBatters && (
        <RetireBatterSheet
          open={retireSheetOpen}
          onOpenChange={setRetireSheetOpen}
          strikerId={innings.currentBatters.striker}
          nonStrikerId={innings.currentBatters.nonStriker}
          findPlayer={findPlayer}
          availableIncomingBatters={availableIncomingBatters}
          onConfirm={(retiringId, incomingId) => {
            actions.retireHurt(retiringId, incomingId)
            setRetireSheetOpen(false)
          }}
        />
      )}

      <EditLastBallSheet
        open={editSheetOpen}
        onOpenChange={setEditSheetOpen}
        lastDelivery={lastDelivery}
        error={actions.error}
        onConfirm={(input, reason) => {
          const succeeded = actions.editLastBall(input, reason)
          if (succeeded) setEditSheetOpen(false)
        }}
      />

      <SelectIncomingBatterSheet
        open={needsIncomingBatter}
        availablePlayers={availableIncomingBatters}
        error={actions.error}
        onConfirm={(playerId) => actions.chooseIncomingBatter(playerId)}
      />

      {currentOversAllocated !== undefined && (
        <RainDelaySheet
          open={rainDelaySheetOpen}
          onOpenChange={setRainDelaySheetOpen}
          currentOversAllocated={currentOversAllocated}
          oversAlreadyBowled={oversAlreadyBowled}
          error={actions.error}
          onReduceOvers={(newOvers, reason) => {
            const succeeded = actions.reduceOvers(newOvers, reason)
            if (succeeded) setRainDelaySheetOpen(false)
          }}
          onStopInnings={(reason) => actions.stopForInterruption(reason)}
        />
      )}
    </>
  )
}
