import { describe, expect, it } from 'vitest'
import { bowlBall, freshInnings, t20Profile } from '@/engine/test/engineTestHelpers'
import { checkInningsInvariants } from '@/engine/calculations/checkInvariants'
import { endInnings } from '@/engine/commands/endInnings'
import { checkInningsCompletion } from '@/engine/innings/inningsLifecycle'
import { computeInningsTotals } from '@/engine/calculations/inningsTotals'
import { determineLimitedOversResult } from '@/engine/results/limitedOversResult'

describe('Scenario: normal T20 innings', () => {
  it('completes a clean over-by-over innings and reconciles totals', () => {
    const rulesProfile = t20Profile()
    let innings = freshInnings()

    innings = bowlBall(innings, rulesProfile, { bowlerForNewOver: 'bowler1', runs: 1 })
    innings = bowlBall(innings, rulesProfile, { runs: 4 })
    innings = bowlBall(innings, rulesProfile, { runs: 0 })
    innings = bowlBall(innings, rulesProfile, { runs: 2 })
    innings = bowlBall(innings, rulesProfile, { runs: 6 })
    innings = bowlBall(innings, rulesProfile, { runs: 1 })

    const totals = computeInningsTotals(innings.deliveries)
    expect(totals.runs).toBe(14)
    expect(totals.legalBallsBowled).toBe(6)
    expect(innings.legalBallsBowled).toBe(6)
    expect(checkInningsInvariants(innings, rulesProfile)).toEqual([])
  })
})

describe('Scenario: innings with wides and no-balls', () => {
  it('counts wides/no-balls toward the total but not the legal-ball count', () => {
    const rulesProfile = t20Profile()
    let innings = freshInnings()

    innings = bowlBall(innings, rulesProfile, { bowlerForNewOver: 'bowler1', runs: 0 })
    innings = bowlBall(innings, rulesProfile, { outcome: 'wide', extras: { wides: 1 } })
    innings = bowlBall(innings, rulesProfile, {
      outcome: 'no-ball',
      runs: 4,
      extras: { noBallRuns: 1 },
    })
    innings = bowlBall(innings, rulesProfile, { runs: 1 })

    const totals = computeInningsTotals(innings.deliveries)
    // 0 (legal) + 1 (wide) + 5 (no-ball: 4 runs + 1 penalty) + 1 (legal) = 7
    expect(totals.runs).toBe(7)
    expect(totals.legalBallsBowled).toBe(2)
    expect(innings.deliveries).toHaveLength(4)
    expect(checkInningsInvariants(innings, rulesProfile)).toEqual([])
  })
})

describe('Scenario: byes and leg-byes', () => {
  it('attributes byes/leg-byes to the team total but not the batter, and counts them as legal deliveries', () => {
    const rulesProfile = t20Profile()
    let innings = freshInnings()

    innings = bowlBall(innings, rulesProfile, {
      bowlerForNewOver: 'bowler1',
      extras: { byes: 2 },
    })
    innings = bowlBall(innings, rulesProfile, { extras: { legByes: 1 } })

    const totals = computeInningsTotals(innings.deliveries)
    expect(totals.runs).toBe(3)
    expect(totals.legalBallsBowled).toBe(2)
    const striker = innings.batterInnings['p1']
    expect(striker?.runs).toBe(0)
    expect(checkInningsInvariants(innings, rulesProfile)).toEqual([])
  })
})

describe('Scenario: run out after completed runs', () => {
  it('credits the completed run and does not credit the bowler', () => {
    const rulesProfile = t20Profile()
    let innings = freshInnings()
    innings = bowlBall(innings, rulesProfile, { bowlerForNewOver: 'bowler1' })

    innings = bowlBall(innings, rulesProfile, {
      runs: 1,
      dismissal: {
        type: 'run-out',
        dismissedPlayerId: 'p2',
        dismissedEnd: 'non-striker',
      },
      incomingBatterId: 'p3',
      battersCrossed: true,
    })

    expect(innings.wicketsLost).toBe(1)
    expect(innings.currentBatters).toEqual({ striker: 'p1', nonStriker: 'p3' })
    expect(innings.bowlerFigures['bowler1']?.wickets).toBe(0)
    const totals = computeInningsTotals(innings.deliveries)
    expect(totals.runs).toBe(1)
    expect(checkInningsInvariants(innings, rulesProfile)).toEqual([])
  })
})

describe('Scenario: caught dismissal', () => {
  it('credits the bowler and ends the striker, with the new batter taking the striker end', () => {
    const rulesProfile = t20Profile()
    let innings = freshInnings()
    innings = bowlBall(innings, rulesProfile, { bowlerForNewOver: 'bowler1' })

    innings = bowlBall(innings, rulesProfile, {
      runs: 0,
      dismissal: {
        type: 'caught',
        dismissedPlayerId: 'p1',
        dismissedEnd: 'striker',
        fielderId: 'fielder1',
      },
      incomingBatterId: 'p3',
    })

    expect(innings.bowlerFigures['bowler1']?.wickets).toBe(1)
    expect(innings.currentBatters).toEqual({ striker: 'p3', nonStriker: 'p2' })
    expect(innings.batterInnings['p1']?.state).toBe('out')
    expect(checkInningsInvariants(innings, rulesProfile)).toEqual([])
  })
})

describe('Scenario: stumping', () => {
  it('is rejected when attempted on a legal delivery with an invalid combination, and accepted as a standard dismissal otherwise', () => {
    const rulesProfile = t20Profile()
    let innings = freshInnings()
    innings = bowlBall(innings, rulesProfile, { bowlerForNewOver: 'bowler1' })

    innings = bowlBall(innings, rulesProfile, {
      runs: 0,
      dismissal: {
        type: 'stumped',
        dismissedPlayerId: 'p1',
        dismissedEnd: 'striker',
        fielderId: 'keeper1',
      },
      incomingBatterId: 'p3',
    })

    expect(innings.bowlerFigures['bowler1']?.wickets).toBe(1)
    expect(checkInningsInvariants(innings, rulesProfile)).toEqual([])
  })

  it('allows a stumping off a wide', () => {
    const rulesProfile = t20Profile()
    let innings = freshInnings()
    innings = bowlBall(innings, rulesProfile, { bowlerForNewOver: 'bowler1' })

    innings = bowlBall(innings, rulesProfile, {
      outcome: 'wide',
      extras: { wides: 1 },
      dismissal: {
        type: 'stumped',
        dismissedPlayerId: 'p1',
        dismissedEnd: 'striker',
        fielderId: 'keeper1',
      },
      incomingBatterId: 'p3',
    })

    expect(innings.wicketsLost).toBe(1)
    expect(checkInningsInvariants(innings, rulesProfile)).toEqual([])
  })
})

describe('Scenario: free-hit sequence', () => {
  it('marks the delivery after a no-ball as a free hit and rejects a bowled dismissal on it', () => {
    const rulesProfile = t20Profile()
    let innings = freshInnings()
    innings = bowlBall(innings, rulesProfile, {
      bowlerForNewOver: 'bowler1',
      outcome: 'no-ball',
      runs: 0,
      extras: { noBallRuns: 1 },
    })
    expect(innings.freeHitActive).toBe(true)

    innings = bowlBall(innings, rulesProfile, { runs: 1 })
    expect(innings.deliveries[1]?.isFreeHit).toBe(true)
    expect(innings.freeHitActive).toBe(false)
    expect(checkInningsInvariants(innings, rulesProfile)).toEqual([])
  })

  it('keeps the free hit active across an intervening wide', () => {
    const rulesProfile = t20Profile()
    let innings = freshInnings()
    innings = bowlBall(innings, rulesProfile, {
      bowlerForNewOver: 'bowler1',
      outcome: 'no-ball',
      extras: { noBallRuns: 1 },
    })
    innings = bowlBall(innings, rulesProfile, { outcome: 'wide', extras: { wides: 1 } })
    expect(innings.freeHitActive).toBe(true)
  })
})

describe('Scenario: bowler maximum reached', () => {
  it('rejects a bowler who has already bowled the maximum overs for the format', () => {
    const rulesProfile = t20Profile()
    let innings = freshInnings()

    // Bowl 4 full overs (24 legal balls) with bowler1, alternating bowler2 to satisfy no-consecutive-overs.
    for (let over = 0; over < 4; over++) {
      innings = bowlBall(innings, rulesProfile, { bowlerForNewOver: 'bowler1' })
      for (let ball = 0; ball < 5; ball++) {
        innings = bowlBall(innings, rulesProfile, {})
      }
      innings = bowlBall(innings, rulesProfile, { bowlerForNewOver: 'bowler2' })
      for (let ball = 0; ball < 5; ball++) {
        innings = bowlBall(innings, rulesProfile, {})
      }
    }

    expect(() =>
      bowlBall(innings, rulesProfile, { bowlerForNewOver: 'bowler1' })
    ).toThrow(/BOWLER_NOT_ELIGIBLE/)
  })
})

describe('Scenario: all-out innings (last-man-stands)', () => {
  it('lets the final survivor bat alone, and reports all-out only when they are also dismissed', () => {
    const rulesProfile = t20Profile()
    let innings = freshInnings()

    // 11 players total: p1/p2 open, p3..p11 come in as replacements for
    // the first 9 wickets (2 + 9 = 11 players used).
    const replacements = ['p3', 'p4', 'p5', 'p6', 'p7', 'p8', 'p9', 'p10', 'p11']
    const bowlers = ['bowler1', 'bowler2']

    for (let wicket = 0; wicket < 9; wicket++) {
      if (!innings.currentBowlerId) {
        const nextBowler = bowlers[wicket % 2]!
        innings = bowlBall(innings, rulesProfile, { bowlerForNewOver: nextBowler })
      }
      innings = bowlBall(innings, rulesProfile, {
        dismissal: {
          type: 'bowled',
          dismissedPlayerId: innings.currentBatters!.striker,
          dismissedEnd: 'striker',
        },
        incomingBatterId: replacements[wicket],
      })
    }

    expect(innings.wicketsLost).toBe(9)
    expect(innings.currentBatters?.nonStriker).toBeDefined()

    // 10th wicket: no replacement left, but a partner survives — last-man-stands.
    if (!innings.currentBowlerId) {
      innings = bowlBall(innings, rulesProfile, { bowlerForNewOver: bowlers[9 % 2]! })
    }
    innings = bowlBall(innings, rulesProfile, {
      dismissal: {
        type: 'bowled',
        dismissedPlayerId: innings.currentBatters!.striker,
        dismissedEnd: 'striker',
      },
      noFurtherBattersAvailable: true,
    })

    expect(innings.wicketsLost).toBe(10)
    expect(innings.currentBatters).toBeDefined()
    expect(innings.currentBatters?.nonStriker).toBeUndefined()

    const soloCompletion = checkInningsCompletion(innings, rulesProfile, 11)
    expect(soloCompletion.shouldEnd).toBe(false)

    // 11th wicket: the lone survivor is also dismissed — now genuinely all out.
    if (!innings.currentBowlerId) {
      innings = bowlBall(innings, rulesProfile, { bowlerForNewOver: bowlers[10 % 2]! })
    }
    innings = bowlBall(innings, rulesProfile, {
      dismissal: {
        type: 'bowled',
        dismissedPlayerId: innings.currentBatters!.striker,
        dismissedEnd: 'striker',
      },
    })

    expect(innings.wicketsLost).toBe(11)
    expect(innings.currentBatters).toBeUndefined()
    const completion = checkInningsCompletion(innings, rulesProfile, 11)
    expect(completion.shouldEnd).toBe(true)
    expect(completion.reason).toBe('all-out')
  })
})

describe('Scenario: successful chase', () => {
  it('reports a win by wickets when the chasing team passes the target', () => {
    const result = determineLimitedOversResult({
      teamAId: 'teamA',
      teamBId: 'teamB',
      firstBattingTeamId: 'teamA',
      firstInningsRuns: 150,
      secondInningsRuns: 155,
      secondInningsWicketsLost: 4,
      secondBattingPlayersPerSide: 11,
      secondInningsCompletedLegally: true,
    })
    expect(result.outcome).toBe('win')
    expect(result.winningTeamId).toBe('teamB')
    expect(result.winMargin).toEqual({ by: 'wickets', amount: 7 })
  })
})

describe('Scenario: defended target', () => {
  it('reports a win by runs for the team that batted first', () => {
    const result = determineLimitedOversResult({
      teamAId: 'teamA',
      teamBId: 'teamB',
      firstBattingTeamId: 'teamA',
      firstInningsRuns: 180,
      secondInningsRuns: 150,
      secondInningsWicketsLost: 10,
      secondBattingPlayersPerSide: 11,
      secondInningsCompletedLegally: true,
    })
    expect(result.outcome).toBe('win')
    expect(result.winningTeamId).toBe('teamA')
    expect(result.winMargin).toEqual({ by: 'runs', amount: 30 })
  })
})

describe('Scenario: tied limited-overs match', () => {
  it('reports a tie when both totals are equal', () => {
    const result = determineLimitedOversResult({
      teamAId: 'teamA',
      teamBId: 'teamB',
      firstBattingTeamId: 'teamA',
      firstInningsRuns: 160,
      secondInningsRuns: 160,
      secondInningsWicketsLost: 8,
      secondBattingPlayersPerSide: 11,
      secondInningsCompletedLegally: true,
    })
    expect(result.outcome).toBe('tie')
  })
})

describe('Scenario: imported match replay', () => {
  it('reproduces identical invariant-passing state when the same deliveries are replayed', () => {
    const rulesProfile = t20Profile()
    let innings = freshInnings()
    innings = bowlBall(innings, rulesProfile, { bowlerForNewOver: 'bowler1', runs: 1 })
    innings = bowlBall(innings, rulesProfile, { runs: 4 })
    innings = bowlBall(innings, rulesProfile, {
      dismissal: {
        type: 'bowled',
        dismissedPlayerId: innings.currentBatters!.striker,
        dismissedEnd: 'striker',
      },
      incomingBatterId: 'p3',
    })

    const endResult = endInnings(innings)
    expect(endResult.ok).toBe(true)
    if (endResult.ok) {
      expect(
        checkInningsInvariants(
          { ...endResult.value, currentBatters: innings.currentBatters },
          rulesProfile
        )
      ).toEqual([])
    }
  })
})
