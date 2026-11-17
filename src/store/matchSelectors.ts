import { useMemo } from 'react'
import { useSessionStore } from '@/store/sessionStore'
import { toMatchSummary } from '@/domain/match/types'

/**
 * Builds summaries outside the Zustand selector, in a useMemo keyed on the
 * store's actual stable slices (matchOrder, matches). toMatchSummary
 * allocates a new object per match; doing that allocation *inside* a
 * Zustand selector defeats useShallow's per-element equality check (the
 * freshly-built objects are never reference-equal across renders), which
 * causes an infinite render loop rather than a stable memoized value.
 */
export function useLoadedMatches() {
  const matchOrder = useSessionStore((s) => s.matchOrder)
  const matches = useSessionStore((s) => s.matches)
  return useMemo(
    () =>
      matchOrder.map((id) => ({
        summary: toMatchSummary(matches[id].document),
        dirty: matches[id].dirty,
      })),
    [matchOrder, matches]
  )
}

/** Full match documents for every loaded match, for cross-match aggregation (statistics, export-all). */
export function useLoadedMatchDocuments() {
  const matchOrder = useSessionStore((s) => s.matchOrder)
  const matches = useSessionStore((s) => s.matches)
  return useMemo(
    () => matchOrder.map((id) => matches[id].document),
    [matchOrder, matches]
  )
}

export function useHasUnsavedWork() {
  return useSessionStore((state) =>
    state.matchOrder.some((id) => state.matches[id]?.dirty)
  )
}

export function useActiveMatch() {
  return useSessionStore((state) =>
    state.activeMatchId ? state.matches[state.activeMatchId] : undefined
  )
}

export function useMatch(matchId: string | undefined) {
  return useSessionStore((state) => (matchId ? state.matches[matchId] : undefined))
}
