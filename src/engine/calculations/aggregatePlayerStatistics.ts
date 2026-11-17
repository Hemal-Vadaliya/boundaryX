import type { MatchDocument } from '@/domain/match/types'

export interface AggregatedPlayerStats {
  playerId: string
  playerName: string
  matches: number
  runs: number
  ballsFaced: number
  fours: number
  sixes: number
  wickets: number
  runsConceded: number
  legalBallsBowled: number
}

/**
 * Aggregates batting/bowling figures for every player across every loaded
 * match, keyed strictly by playerId — never by display name — so two
 * unrelated players who happen to share a name are never merged. Matches
 * imported with different player IDs for what a user considers "the same
 * person" are intentionally kept separate; the plan calls for an explicit
 * merge/linking mechanism as a future enhancement, not silent merging here.
 */
export function aggregatePlayerStatistics(
  matches: MatchDocument[]
): AggregatedPlayerStats[] {
  const byPlayer = new Map<string, AggregatedPlayerStats>()

  function ensure(playerId: string, playerName: string): AggregatedPlayerStats {
    let entry = byPlayer.get(playerId)
    if (!entry) {
      entry = {
        playerId,
        playerName,
        matches: 0,
        runs: 0,
        ballsFaced: 0,
        fours: 0,
        sixes: 0,
        wickets: 0,
        runsConceded: 0,
        legalBallsBowled: 0,
      }
      byPlayer.set(playerId, entry)
    }
    return entry
  }

  for (const match of matches) {
    const playersInMatch = new Set<string>()
    const allPlayers = [...match.teams[0].team.squad, ...match.teams[1].team.squad]
    const nameForId = new Map(allPlayers.map((p) => [p.id, p.name]))

    for (const innings of match.innings) {
      for (const batter of Object.values(innings.batterInnings)) {
        if (batter.state === 'did-not-bat') continue
        const entry = ensure(
          batter.playerId,
          nameForId.get(batter.playerId) ?? batter.playerId
        )
        entry.runs += batter.runs
        entry.ballsFaced += batter.ballsFaced
        entry.fours += batter.fours
        entry.sixes += batter.sixes
        playersInMatch.add(batter.playerId)
      }
      for (const bowler of Object.values(innings.bowlerFigures)) {
        const entry = ensure(
          bowler.playerId,
          nameForId.get(bowler.playerId) ?? bowler.playerId
        )
        entry.wickets += bowler.wickets
        entry.runsConceded += bowler.runsConceded
        entry.legalBallsBowled += bowler.legalBallsBowled
        playersInMatch.add(bowler.playerId)
      }
    }

    for (const playerId of playersInMatch) {
      byPlayer.get(playerId)!.matches += 1
    }
  }

  return Array.from(byPlayer.values())
}
