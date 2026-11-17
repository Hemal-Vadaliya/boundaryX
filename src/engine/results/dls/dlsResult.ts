import { getResourcePercentage } from '@/engine/results/dls/resourceTable'
import type { MatchOutcome, MatchResult } from '@/engine/results/limitedOversResult'

/** One team's innings as DLS needs to see it: what they scored, and how much of their innings they actually got to use. */
export interface DlsInningsSnapshot {
  teamId: string
  runsScored: number
  /** Overs the team's innings was allocated in total (reduced allocations included). */
  oversAllocated: number
  /** Overs left unused when the innings ended — 0 if the team used their full allocation (all out or played it out). */
  oversRemainingAtEnd: number
  wicketsLostAtEnd: number
  /** This team's squad size — DLS's wicket resource is defined for 10 wickets; rescaled for other squad sizes. */
  maxWickets: number
}

export interface DlsResultInput {
  /** The team that batted first. */
  firstInnings: DlsInningsSnapshot
  secondInnings: DlsInningsSnapshot
  /**
   * Reference average 50-over total for this competition/level, used only
   * when the second team's resources exceed the first's (e.g. the first
   * innings was also interrupted). Undefined falls back to the ICC's
   * commonly cited ODI reference of 245, scaled down proportionally for
   * shorter formats via `fullFormatOvers`.
   */
  g50?: number
  /** The format's normal (uninterrupted) overs per innings, used to scale the G50 default for non-50-over formats. */
  fullFormatOvers: number
}

export interface DlsParResult {
  /** Resources Team 1 used across their innings, as a percentage (0-100). */
  team1ResourcesUsed: number
  /** Resources Team 2 had available across their innings, as a percentage (0-100). */
  team2ResourcesUsed: number
  /** The score Team 2 needed to reach to level the match under DLS; they win by beating it. */
  parScore: number
}

function resourcesUsed(snapshot: DlsInningsSnapshot): number {
  const resourcesAtStart = getResourcePercentage(
    snapshot.oversAllocated,
    0,
    snapshot.maxWickets
  )
  const resourcesAtEnd = getResourcePercentage(
    snapshot.oversRemainingAtEnd,
    snapshot.wicketsLostAtEnd,
    snapshot.maxWickets
  )
  return Math.max(0, resourcesAtStart - resourcesAtEnd)
}

function resolveG50(input: DlsResultInput): number {
  const base = input.g50 ?? 245
  return base * (input.fullFormatOvers / 50)
}

/**
 * Computes each team's resources used and Team 2's DLS par score — the
 * score Team 2 must better to win. Standard Edition formula: when Team
 * 2's resources are no greater than Team 1's, the par score scales
 * Team 1's total proportionally by the resource ratio; when Team 2 has
 * more resources (e.g. Team 1's innings was also interrupted), the par
 * score is Team 1's total plus a G50-scaled allowance for the resource
 * surplus.
 */
export function calculateDlsPar(input: DlsResultInput): DlsParResult {
  const team1ResourcesUsed = resourcesUsed(input.firstInnings)
  const team2ResourcesUsed = resourcesUsed(input.secondInnings)
  const g50 = resolveG50(input)

  const parScore =
    team2ResourcesUsed <= team1ResourcesUsed || team1ResourcesUsed === 0
      ? team1ResourcesUsed === 0
        ? 0
        : (input.firstInnings.runsScored * team2ResourcesUsed) / team1ResourcesUsed
      : input.firstInnings.runsScored +
        (g50 * (team2ResourcesUsed - team1ResourcesUsed)) / 100

  return { team1ResourcesUsed, team2ResourcesUsed, parScore }
}

/**
 * Determines the match result under the DLS method once the second
 * innings has been shortened (reduced overs and/or stopped early) —
 * returns the same `MatchResult` shape as a normal limited-overs result
 * so the UI needs no DLS-specific rendering.
 */
export function determineDlsResult(input: DlsResultInput): MatchResult {
  const { team1ResourcesUsed, team2ResourcesUsed, parScore } = calculateDlsPar(input)
  const roundedPar = Math.round(parScore)
  const actualRuns = input.secondInnings.runsScored

  const outcome: MatchOutcome = actualRuns === roundedPar ? 'tie' : 'win'
  const winningTeamId =
    outcome === 'tie'
      ? undefined
      : actualRuns > roundedPar
        ? input.secondInnings.teamId
        : input.firstInnings.teamId

  const methodNote = `DLS method, resources ${team1ResourcesUsed.toFixed(
    1
  )}% vs ${team2ResourcesUsed.toFixed(1)}%, par score ${roundedPar}`

  if (outcome === 'tie') {
    return { outcome, summary: `Match tied (${methodNote}).` }
  }

  if (winningTeamId === input.secondInnings.teamId) {
    const margin = actualRuns - roundedPar
    return {
      outcome,
      winningTeamId,
      winMargin: { by: 'runs', amount: margin },
      summary: `Won by ${margin} run${margin === 1 ? '' : 's'} (${methodNote}).`,
    }
  }

  const margin = roundedPar - actualRuns
  return {
    outcome,
    winningTeamId,
    winMargin: { by: 'runs', amount: margin },
    summary: `Won by ${margin} run${margin === 1 ? '' : 's'} (${methodNote}).`,
  }
}
