import { useCallback, useState } from 'react'
import type { MatchDocument } from '@/domain/match/types'
import type { Innings } from '@/domain/innings/types'
import type { RecordDeliveryInput } from '@/engine/commands/recordDeliveryInput'
import { recordDelivery } from '@/engine/commands/recordDelivery'
import { completeOver } from '@/engine/commands/completeOver'
import { selectIncomingBatter } from '@/engine/commands/selectIncomingBatter'
import { retireBatterHurt } from '@/engine/commands/retireBatter'
import { editLastDelivery } from '@/engine/commands/editLastDelivery'
import { undoLastDelivery } from '@/engine/corrections/undo'
import { endInnings } from '@/engine/commands/endInnings'
import { declareInnings } from '@/engine/innings/declaration'
import { reduceInningsOvers } from '@/engine/commands/reduceOvers'
import { stopInningsForInterruption } from '@/engine/commands/stopInningsForInterruption'
import { determineMatchResult } from '@/engine/results/matchResult'
import { useSessionStore } from '@/store/sessionStore'
import { createId } from '@/utils/id'
import { getOpeningBatters } from '@/features/scoring/inningsOpeners'
import type { EngineResult } from '@/engine/engineResult'

/**
 * The only place in the scoring feature that calls engine commands. Every
 * method here resolves to an EngineResult against the match's current
 * innings (the most recently started one — the plan's multi-innings
 * progression always appends a new innings rather than reopening an old
 * one); on success the result is written back via sessionStore.updateMatch,
 * on failure nothing is written and the error message is surfaced for the
 * UI to display. The scoring screens never compute totals themselves —
 * they only read derived state and call these actions.
 */
export function useScoringActions(match: MatchDocument) {
  const updateMatch = useSessionStore((s) => s.updateMatch)
  const [error, setError] = useState<string | undefined>(undefined)

  const inningsIndex = match.innings.length - 1
  const innings = match.innings[inningsIndex]

  const apply = useCallback(
    (result: EngineResult<Innings>) => {
      if (!result.ok) {
        setError(result.error.message)
        return false
      }
      setError(undefined)
      const updated = result.value
      updateMatch(match.id, (doc) => ({
        ...doc,
        innings: doc.innings.map((i, index) => (index === inningsIndex ? updated : i)),
      }))
      return true
    },
    [match.id, inningsIndex, updateMatch]
  )

  const score = useCallback(
    (input: RecordDeliveryInput) => {
      if (!innings) return false
      return apply(
        recordDelivery(
          {
            innings,
            rulesProfile: match.rulesProfile,
            nowIso: new Date().toISOString(),
            createDeliveryId: () => createId('delivery'),
          },
          input
        )
      )
    },
    [innings, match.rulesProfile, apply]
  )

  const startNewOver = useCallback(
    (nextBowlerId: string) => {
      if (!innings) return false
      return apply(completeOver(innings, match.rulesProfile, nextBowlerId))
    },
    [innings, match.rulesProfile, apply]
  )

  const chooseIncomingBatter = useCallback(
    (newBatterId: string) => {
      if (!innings) return false
      return apply(selectIncomingBatter(innings, newBatterId))
    },
    [innings, apply]
  )

  const retireHurt = useCallback(
    (retiringPlayerId: string, incomingBatterId: string) => {
      if (!innings) return false
      return apply(
        retireBatterHurt(
          innings,
          match.rulesProfile,
          retiringPlayerId,
          incomingBatterId,
          new Date().toISOString()
        )
      )
    },
    [innings, match.rulesProfile, apply]
  )

  const editLastBall = useCallback(
    (correctedInput: RecordDeliveryInput, reason?: string) => {
      if (!innings) return false
      const openers = getOpeningBatters(innings)
      return apply(
        editLastDelivery(
          innings,
          match.rulesProfile,
          correctedInput,
          openers.striker,
          openers.nonStriker,
          (index) => createId(`delivery-${index}`),
          new Date().toISOString(),
          reason
        )
      )
    },
    [innings, match.rulesProfile, apply]
  )

  const undoLastBall = useCallback(() => {
    if (!innings) return false
    const openers = getOpeningBatters(innings)
    return apply(
      undoLastDelivery(
        innings,
        match.rulesProfile,
        openers.striker,
        openers.nonStriker,
        (index) => createId(`delivery-${index}`),
        new Date().toISOString()
      )
    )
  }, [innings, match.rulesProfile, apply])

  const declare = useCallback(() => {
    if (!innings) return false
    return apply(declareInnings(innings, match.rulesProfile))
  }, [innings, match.rulesProfile, apply])

  const reduceOvers = useCallback(
    (newOversAllocated: number, reason: string) => {
      if (!innings) return false
      return apply(
        reduceInningsOvers(
          innings,
          match.rulesProfile,
          newOversAllocated,
          reason,
          new Date().toISOString()
        )
      )
    },
    [innings, match.rulesProfile, apply]
  )

  /** Shared by finishInnings (natural end) and stopForInterruption (abandoned mid-innings) — both end the innings and immediately recompute the match result from the updated innings array. */
  const completeInningsAndResolveMatch = useCallback(
    (result: EngineResult<Innings>) => {
      if (!result.ok) {
        setError(result.error.message)
        return false
      }
      setError(undefined)
      const updatedInnings = result.value
      updateMatch(match.id, (doc) => {
        const innings_ = doc.innings.map((i, index) =>
          index === inningsIndex ? updatedInnings : i
        )
        const matchResult = determineMatchResult(
          { ...doc, innings: innings_ },
          doc.rulesProfile
        )
        return {
          ...doc,
          innings: innings_,
          result: matchResult ?? doc.result,
          status: matchResult ? 'completed' : doc.status,
        }
      })
      return true
    },
    [inningsIndex, match.id, updateMatch]
  )

  const finishInnings = useCallback(() => {
    if (!innings) return false
    return completeInningsAndResolveMatch(endInnings(innings))
  }, [innings, completeInningsAndResolveMatch])

  const stopForInterruption = useCallback(
    (reason: string) => {
      if (!innings) return false
      return completeInningsAndResolveMatch(
        stopInningsForInterruption(innings, reason, new Date().toISOString())
      )
    },
    [innings, completeInningsAndResolveMatch]
  )

  return {
    innings,
    error,
    clearError: () => setError(undefined),
    score,
    startNewOver,
    chooseIncomingBatter,
    retireHurt,
    editLastBall,
    undoLastBall,
    declare,
    reduceOvers,
    finishInnings,
    stopForInterruption,
  }
}
