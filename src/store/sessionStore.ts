import { create } from 'zustand'
import type { MatchDocument } from '@/domain/match/types'

interface LoadedMatch {
  document: MatchDocument
  /** True when this match has edits that have not been exported to a file. */
  dirty: boolean
}

interface SessionState {
  matches: Record<string, LoadedMatch>
  matchOrder: string[]
  activeMatchId: string | null
  addMatch: (document: MatchDocument, options?: { dirty?: boolean }) => void
  updateMatch: (
    matchId: string,
    updater: (document: MatchDocument) => MatchDocument
  ) => void
  removeMatch: (matchId: string) => void
  setActiveMatch: (matchId: string | null) => void
  markClean: (matchId: string) => void
  markDirty: (matchId: string) => void
}

/**
 * The entire session lives in memory only. No persistence middleware is
 * attached here by design — see the plan's "no automatic browser
 * persistence" rule. Everything is lost on refresh unless exported.
 */
export const useSessionStore = create<SessionState>((set) => ({
  matches: {},
  matchOrder: [],
  activeMatchId: null,

  addMatch: (document, options) =>
    set((state) => {
      if (state.matches[document.id]) {
        return state
      }
      return {
        matches: {
          ...state.matches,
          [document.id]: { document, dirty: options?.dirty ?? true },
        },
        matchOrder: [...state.matchOrder, document.id],
      }
    }),

  updateMatch: (matchId, updater) =>
    set((state) => {
      const existing = state.matches[matchId]
      if (!existing) return state
      return {
        matches: {
          ...state.matches,
          [matchId]: {
            document: updater(existing.document),
            dirty: true,
          },
        },
      }
    }),

  removeMatch: (matchId) =>
    set((state) => {
      const { [matchId]: _removed, ...rest } = state.matches
      return {
        matches: rest,
        matchOrder: state.matchOrder.filter((id) => id !== matchId),
        activeMatchId: state.activeMatchId === matchId ? null : state.activeMatchId,
      }
    }),

  setActiveMatch: (matchId) => set({ activeMatchId: matchId }),

  markClean: (matchId) =>
    set((state) => {
      const existing = state.matches[matchId]
      if (!existing) return state
      return {
        matches: {
          ...state.matches,
          [matchId]: { ...existing, dirty: false },
        },
      }
    }),

  markDirty: (matchId) =>
    set((state) => {
      const existing = state.matches[matchId]
      if (!existing) return state
      return {
        matches: {
          ...state.matches,
          [matchId]: { ...existing, dirty: true },
        },
      }
    }),
}))
