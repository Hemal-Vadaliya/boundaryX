import { describe, expect, it } from 'vitest'
import { bowlBall, freshInnings, t20Profile } from '@/engine/test/engineTestHelpers'
import { checkInningsInvariants } from '@/engine/calculations/checkInvariants'
import { standardFormatProfile } from '@/engine/rules/formats/standardProfiles'
import { isFollowOnEligible } from '@/engine/innings/followOn'
import { declareInnings } from '@/engine/innings/declaration'
import { determineTestResult } from '@/engine/results/testResult'
import { determineSuperOverResult } from '@/engine/results/superOver'
import { createInnings } from '@/engine/innings/createInnings'
import { amendDelivery } from '@/engine/corrections/amendDelivery'
import { undoLastDelivery } from '@/engine/corrections/undo'
import { calculateTarget } from '@/engine/innings/targetCalculator'
import { completeOver } from '@/engine/commands/completeOver'
import { endInnings } from '@/engine/commands/endInnings'

describe('Scenario: Super Over', () => {
  it('determines a winner from the two Super Over innings independent of the main match', () => {
    const rulesProfile = standardFormatProfile('T20')
    let firstInnings = createInnings({
      id: 'so-1',
      matchId: 'match-1',
      battingTeamId: 'teamA',
      bowlingTeamId: 'teamB',
      inningsNumber: 1,
      openingStriker: 'p1',
      openingNonStriker: 'p2',
    })
    firstInnings = bowlBall(firstInnings, rulesProfile, {
      bowlerForNewOver: 'bowler1',
      runs: 6,
    })
    firstInnings = bowlBall(firstInnings, rulesProfile, { runs: 4 })

    let secondInnings = createInnings({
      id: 'so-2',
      matchId: 'match-1',
      battingTeamId: 'teamB',
      bowlingTeamId: 'teamA',
      inningsNumber: 2,
      openingStriker: 'q1',
      openingNonStriker: 'q2',
    })
    secondInnings = bowlBall(secondInnings, rulesProfile, {
      bowlerForNewOver: 'bowler2',
      runs: 6,
    })
    secondInnings = bowlBall(secondInnings, rulesProfile, { runs: 6 })
    const endedSecondInnings = endInnings(secondInnings)
    expect(endedSecondInnings.ok).toBe(true)
    if (endedSecondInnings.ok) secondInnings = endedSecondInnings.value

    const result = determineSuperOverResult(
      { sequenceNumber: 1, firstInnings, secondInnings },
      'teamA',
      'teamB'
    )
    expect(result.outcome).toBe('win')
    expect(result.winningTeamId).toBe('teamB')

    // Main match statistics remain distinguishable: the Super Over innings carry their own ids/matchId pairing separate from any main-match innings.
    expect(firstInnings.id).not.toBe('match-1')
    expect(checkInningsInvariants(firstInnings, rulesProfile)).toEqual([])
    expect(checkInningsInvariants(secondInnings, rulesProfile)).toEqual([])
  })
})

describe('Scenario: Test follow-on', () => {
  it('is eligible once the deficit meets the format margin', () => {
    const rulesProfile = standardFormatProfile('Test')
    const eligible = isFollowOnEligible(
      { firstBattingTeamFirstInningsRuns: 450, secondBattingTeamFirstInningsRuns: 200 },
      rulesProfile
    )
    expect(eligible).toBe(true)
  })

  it('is not eligible when the deficit is below the margin', () => {
    const rulesProfile = standardFormatProfile('Test')
    const eligible = isFollowOnEligible(
      { firstBattingTeamFirstInningsRuns: 350, secondBattingTeamFirstInningsRuns: 200 },
      rulesProfile
    )
    expect(eligible).toBe(false)
  })

  it('is never eligible for a format without follow-on enabled', () => {
    const rulesProfile = standardFormatProfile('T20')
    const eligible = isFollowOnEligible(
      { firstBattingTeamFirstInningsRuns: 450, secondBattingTeamFirstInningsRuns: 10 },
      rulesProfile
    )
    expect(eligible).toBe(false)
  })
})

describe('Scenario: Test declaration', () => {
  it('allows declaring an in-progress Test innings after play has started', () => {
    const rulesProfile = standardFormatProfile('Test')
    let innings = freshInnings()
    innings = bowlBall(innings, rulesProfile, { bowlerForNewOver: 'bowler1', runs: 4 })

    const result = declareInnings(innings, rulesProfile)
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.value.declared).toBe(true)
  })

  it('rejects declaration for a format without declaration in its playing conditions', () => {
    const rulesProfile = standardFormatProfile('T20')
    let innings = freshInnings()
    innings = bowlBall(innings, rulesProfile, { bowlerForNewOver: 'bowler1', runs: 4 })
    const result = declareInnings(innings, rulesProfile)
    expect(result.ok).toBe(false)
  })

  it('rejects declaring before any ball has been bowled', () => {
    const rulesProfile = standardFormatProfile('Test')
    const innings = freshInnings()
    const result = declareInnings(innings, rulesProfile)
    expect(result.ok).toBe(false)
  })
})

describe('Scenario: Test draw', () => {
  it('reports a draw when time expires with innings unresolved', () => {
    const result = determineTestResult({
      teamAId: 'teamA',
      teamBId: 'teamB',
      innings: [
        { teamId: 'teamA', runs: 400, wicketsLost: 10, closed: true },
        { teamId: 'teamB', runs: 350, wicketsLost: 10, closed: true },
        { teamId: 'teamA', runs: 200, wicketsLost: 5, closed: true },
        { teamId: 'teamB', runs: 100, wicketsLost: 6, closed: false },
      ],
      timeExpired: true,
    })
    expect(result.outcome).toBe('draw')
  })

  it('reports a win by innings when one side never gets through a second innings turn', () => {
    const result = determineTestResult({
      teamAId: 'teamA',
      teamBId: 'teamB',
      innings: [
        { teamId: 'teamA', runs: 500, wicketsLost: 10, closed: true },
        { teamId: 'teamB', runs: 200, wicketsLost: 10, closed: true },
        { teamId: 'teamB', runs: 250, wicketsLost: 10, closed: true },
      ],
      timeExpired: false,
    })
    expect(result.outcome).toBe('win')
    expect(result.winningTeamId).toBe('teamA')
    expect(result.summary).toMatch(/innings/)
  })
})

describe('Scenario: rain-reduced match with manually supplied revised target', () => {
  it('uses the manually entered target rather than a computed one', () => {
    const target = calculateTarget({ firstInningsRuns: 180, manualRevisedTarget: 142 })
    expect(target).toBe(142)
  })

  it('falls back to first-innings-runs + 1 when no manual target is supplied', () => {
    const target = calculateTarget({ firstInningsRuns: 180 })
    expect(target).toBe(181)
  })
})

describe('Scenario: corrected earlier delivery', () => {
  it('amending a delivery recomputes every dependent figure via full replay', () => {
    const rulesProfile = t20Profile()
    let innings = freshInnings()
    innings = bowlBall(innings, rulesProfile, { bowlerForNewOver: 'bowler1', runs: 1 })
    innings = bowlBall(innings, rulesProfile, { runs: 4 })
    innings = bowlBall(innings, rulesProfile, { runs: 2 })

    const result = amendDelivery(
      innings,
      rulesProfile,
      1, // the second delivery (sequenceNumber 1), originally 4 runs
      { bowlerId: 'bowler1', batterRuns: 6, extras: {}, outcome: 'legal' },
      'p1',
      'p2',
      (i) => `corrected-${i}`,
      '2026-11-15T00:00:00.000Z'
    )

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.deliveries[1]?.batterRuns).toBe(6)
      expect(checkInningsInvariants(result.value, rulesProfile)).toEqual([])
    }
  })
})

describe('Scenario: undo the last delivery', () => {
  it('removes only the most recent delivery and leaves everything else reconciled', () => {
    const rulesProfile = t20Profile()
    let innings = freshInnings()
    innings = bowlBall(innings, rulesProfile, { bowlerForNewOver: 'bowler1', runs: 1 })
    innings = bowlBall(innings, rulesProfile, { runs: 4 })

    const result = undoLastDelivery(
      innings,
      rulesProfile,
      'p1',
      'p2',
      (i) => `undo-${i}`,
      '2026-11-15T00:00:00.000Z'
    )

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.deliveries).toHaveLength(1)
      expect(checkInningsInvariants(result.value, rulesProfile)).toEqual([])
    }
  })

  it('rejects undo when there is nothing recorded yet', () => {
    const rulesProfile = t20Profile()
    const innings = freshInnings()
    const result = undoLastDelivery(
      innings,
      rulesProfile,
      'p1',
      'p2',
      (i) => `u${i}`,
      '2026-11-15T00:00:00.000Z'
    )
    expect(result.ok).toBe(false)
  })
})

describe('Scenario: interrupted/incomplete over handling', () => {
  it('leaves currentBowlerId set mid-over and allows completeOver only once the over is actually finished', () => {
    const rulesProfile = t20Profile()
    let innings = freshInnings()
    innings = bowlBall(innings, rulesProfile, { bowlerForNewOver: 'bowler1', runs: 1 })
    expect(innings.currentBowlerId).toBe('bowler1')

    const result = completeOver(innings, rulesProfile, 'bowler2')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error.code).toBe('OVER_NOT_COMPLETE')
  })
})
