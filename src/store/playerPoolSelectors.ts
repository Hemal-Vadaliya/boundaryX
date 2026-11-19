import { useMemo } from 'react'
import { usePlayerPoolStore } from '@/store/playerPoolStore'
import type { Player } from '@/domain/player/types'

/**
 * Derives each side's assigned Player objects outside the Zustand
 * selector, in a useMemo keyed on the store's stable slices — allocating
 * fresh arrays inside the selector itself breaks reference-equality
 * checks the same way src/store/matchSelectors.ts already documents for
 * sessionStore.
 */
export function useAssignedPlayers(side: 'A' | 'B'): Player[] {
  const players = usePlayerPoolStore((s) => s.players)
  const assignedIds = usePlayerPoolStore((s) =>
    side === 'A' ? s.teamAAssignedIds : s.teamBAssignedIds
  )
  return useMemo(
    () => assignedIds.map((id) => players.find((p) => p.id === id)).filter((p): p is Player => !!p),
    [assignedIds, players]
  )
}

export function useUnassignedPlayers(): Player[] {
  const players = usePlayerPoolStore((s) => s.players)
  const teamAAssignedIds = usePlayerPoolStore((s) => s.teamAAssignedIds)
  const teamBAssignedIds = usePlayerPoolStore((s) => s.teamBAssignedIds)
  return useMemo(() => {
    const assigned = new Set([...teamAAssignedIds, ...teamBAssignedIds])
    return players.filter((p) => !assigned.has(p.id))
  }, [players, teamAAssignedIds, teamBAssignedIds])
}
