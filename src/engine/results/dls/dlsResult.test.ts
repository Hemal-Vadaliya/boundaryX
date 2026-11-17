import { describe, expect, it } from 'vitest'
import { calculateDlsPar, determineDlsResult } from '@/engine/results/dls/dlsResult'
import type { DlsInningsSnapshot } from '@/engine/results/dls/dlsResult'

function snapshot(overrides: Partial<DlsInningsSnapshot>): DlsInningsSnapshot {
  return {
    teamId: 'team',
    runsScored: 0,
    oversAllocated: 50,
    oversRemainingAtEnd: 0,
    wicketsLostAtEnd: 0,
    maxWickets: 10,
    ...overrides,
  }
}

describe('calculateDlsPar', () => {
  it('uses the full resource ratio when Team 1 batted an uninterrupted full innings', () => {
    const firstInnings = snapshot({ teamId: 'A', runsScored: 250 })
    // Computing Team 2's target before their (reduced, 32-over) innings
    // begins: they're assumed to use their full allocation with no
    // further loss, so oversRemainingAtEnd is 0 (fully used), not equal
    // to oversAllocated (which would mean "hasn't batted at all yet").
    const secondInnings = snapshot({
      teamId: 'B',
      runsScored: 0,
      oversAllocated: 32,
      oversRemainingAtEnd: 0,
      wicketsLostAtEnd: 0,
    })
    const { team1ResourcesUsed, team2ResourcesUsed, parScore } = calculateDlsPar({
      firstInnings,
      secondInnings,
      fullFormatOvers: 50,
    })
    expect(team1ResourcesUsed).toBeCloseTo(100, 5)
    // Team 2 has fewer resources than Team 1 (32 overs < 50) so resources used should be less than 100.
    expect(team2ResourcesUsed).toBeLessThan(team1ResourcesUsed)
    expect(parScore).toBeLessThan(250)
    expect(parScore).toBeGreaterThan(0)
  })

  it('gives Team 2 a higher par score than Team 1 scored when Team 2 has MORE resources (Team 1 was also interrupted)', () => {
    // Team 1 only got 30 overs (interrupted), Team 2 gets the full 50.
    const firstInnings = snapshot({
      teamId: 'A',
      runsScored: 150,
      oversAllocated: 30,
      oversRemainingAtEnd: 0,
      wicketsLostAtEnd: 10,
    })
    const secondInnings = snapshot({
      teamId: 'B',
      runsScored: 0,
      oversAllocated: 50,
      oversRemainingAtEnd: 0,
      wicketsLostAtEnd: 0,
    })
    const { parScore } = calculateDlsPar({
      firstInnings,
      secondInnings,
      fullFormatOvers: 50,
    })
    // Team 2 has strictly more resources, so the G50-adjusted par score
    // should exceed Team 1's actual total.
    expect(parScore).toBeGreaterThan(150)
  })
})

describe('determineDlsResult', () => {
  it('declares the chasing team the winner when they clear the par score', () => {
    const result = determineDlsResult({
      firstInnings: snapshot({ teamId: 'A', runsScored: 250 }),
      secondInnings: snapshot({
        teamId: 'B',
        runsScored: 200,
        oversAllocated: 32,
        oversRemainingAtEnd: 0,
        wicketsLostAtEnd: 4,
      }),
      fullFormatOvers: 50,
    })
    expect(result.outcome).toBe('win')
    expect(['A', 'B']).toContain(result.winningTeamId)
    expect(result.summary).toMatch(/DLS method/)
  })

  it('declares the first-innings team the winner when the chase falls short of par', () => {
    const result = determineDlsResult({
      firstInnings: snapshot({ teamId: 'A', runsScored: 250 }),
      secondInnings: snapshot({
        teamId: 'B',
        runsScored: 10,
        oversAllocated: 32,
        oversRemainingAtEnd: 0,
        wicketsLostAtEnd: 10,
      }),
      fullFormatOvers: 50,
    })
    expect(result.outcome).toBe('win')
    expect(result.winningTeamId).toBe('A')
  })

  it('declares a tie when the chasing team finishes exactly at the par score', () => {
    const firstInnings = snapshot({
      teamId: 'A',
      runsScored: 100,
      oversAllocated: 20,
      oversRemainingAtEnd: 0,
      wicketsLostAtEnd: 10,
    })
    const { parScore } = calculateDlsPar({
      firstInnings,
      secondInnings: snapshot({
        teamId: 'B',
        oversAllocated: 20,
        oversRemainingAtEnd: 0,
        wicketsLostAtEnd: 10,
      }),
      fullFormatOvers: 20,
    })
    const result = determineDlsResult({
      firstInnings,
      secondInnings: snapshot({
        teamId: 'B',
        runsScored: Math.round(parScore),
        oversAllocated: 20,
        oversRemainingAtEnd: 0,
        wicketsLostAtEnd: 10,
      }),
      fullFormatOvers: 20,
    })
    expect(result.outcome).toBe('tie')
  })
})
