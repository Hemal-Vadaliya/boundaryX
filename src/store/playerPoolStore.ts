import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { Player } from '@/domain/player/types'
import { createId } from '@/utils/id'

export interface TeamConfigSnapshot {
  teamAName: string
  teamBName: string
  teamAPlayingXiSize: number
  teamAPlayingXiIds: string[]
  teamACaptainId?: string
  teamAWicketkeeperId?: string
  teamBPlayingXiSize: number
  teamBPlayingXiIds: string[]
  teamBCaptainId?: string
  teamBWicketkeeperId?: string
  /** Mirrors teamAAssignedIds/teamBAssignedIds continuously (see assignToTeam/unassign/swapPlayers below) so the latest player-to-team assignment survives resetAssignments() after a match is created, for the next wizard run to offer restoring. */
  savedTeamAAssignedIds: string[]
  savedTeamBAssignedIds: string[]
}

function emptyTeamConfigSnapshot(): TeamConfigSnapshot {
  return {
    teamAName: '',
    teamBName: '',
    teamAPlayingXiSize: 11,
    teamAPlayingXiIds: [],
    teamBPlayingXiSize: 11,
    teamBPlayingXiIds: [],
    savedTeamAAssignedIds: [],
    savedTeamBAssignedIds: [],
  }
}

interface PlayerPoolState extends TeamConfigSnapshot {
  players: Player[]
  teamAAssignedIds: string[]
  teamBAssignedIds: string[]
  /** True once a team configuration has been saved at least once this session — lets the wizard know whether there's anything to offer restoring. */
  teamConfigSaved: boolean
  addPlayer: (name: string) => void
  removePlayer: (playerId: string) => void
  assignToTeam: (playerId: string, side: 'A' | 'B') => void
  unassign: (playerId: string) => void
  swapPlayers: (playerIdA: string, playerIdB: string) => void
  resetAssignments: () => void
  /** Overwrites the saved team-configuration snapshot (names, Playing XI, captain, wicketkeeper) with its latest version — called on every wizard edit so it always reflects the most recent state. */
  saveTeamConfig: (config: Partial<TeamConfigSnapshot>) => void
  /** "Start fresh": clears the saved team-configuration snapshot and the current team assignments, but keeps the player pool itself. */
  resetTeamConfig: () => void
  /** Restores the live player-to-team assignment from the saved snapshot — used when the user accepts the "use previous setup?" prompt. */
  restoreAssignments: () => void
}

/**
 * Deliberate, narrow exception to this app's "no automatic browser
 * persistence" rule (see src/store/sessionStore.ts, which documents why
 * match data stays in-memory only). The player pool is the one piece of
 * session state the user explicitly asked to survive across New Match
 * wizard runs for as long as the browser tab/session stays open — never
 * match data itself, which still only persists via explicit JSON
 * export/import. sessionStorage (not localStorage) matches "until the
 * session is active": it clears when the tab/browser closes.
 */
export const usePlayerPoolStore = create<PlayerPoolState>()(
  persist(
    (set) => ({
      players: [],
      teamAAssignedIds: [],
      teamBAssignedIds: [],
      teamConfigSaved: false,
      ...emptyTeamConfigSnapshot(),

      addPlayer: (name) =>
        set((state) => ({
          players: [...state.players, { id: createId('player'), name }],
        })),

      removePlayer: (playerId) =>
        set((state) => ({
          players: state.players.filter((p) => p.id !== playerId),
          teamAAssignedIds: state.teamAAssignedIds.filter((id) => id !== playerId),
          teamBAssignedIds: state.teamBAssignedIds.filter((id) => id !== playerId),
        })),

      assignToTeam: (playerId, side) =>
        set((state) => {
          const teamAAssignedIds = state.teamAAssignedIds.filter((id) => id !== playerId)
          const teamBAssignedIds = state.teamBAssignedIds.filter((id) => id !== playerId)
          if (side === 'A') teamAAssignedIds.push(playerId)
          else teamBAssignedIds.push(playerId)
          return {
            teamAAssignedIds,
            teamBAssignedIds,
            savedTeamAAssignedIds: teamAAssignedIds,
            savedTeamBAssignedIds: teamBAssignedIds,
          }
        }),

      unassign: (playerId) =>
        set((state) => {
          const teamAAssignedIds = state.teamAAssignedIds.filter((id) => id !== playerId)
          const teamBAssignedIds = state.teamBAssignedIds.filter((id) => id !== playerId)
          return {
            teamAAssignedIds,
            teamBAssignedIds,
            savedTeamAAssignedIds: teamAAssignedIds,
            savedTeamBAssignedIds: teamBAssignedIds,
          }
        }),

      swapPlayers: (playerIdA, playerIdB) =>
        set((state) => {
          const aOnTeamA = state.teamAAssignedIds.includes(playerIdA)
          const aOnTeamB = state.teamBAssignedIds.includes(playerIdA)
          const bOnTeamA = state.teamAAssignedIds.includes(playerIdB)
          const bOnTeamB = state.teamBAssignedIds.includes(playerIdB)
          if (!(aOnTeamA && bOnTeamB) && !(aOnTeamB && bOnTeamA)) return state

          const replace = (ids: string[], from: string, to: string) =>
            ids.map((id) => (id === from ? to : id))

          const teamAAssignedIds = aOnTeamA
            ? replace(state.teamAAssignedIds, playerIdA, playerIdB)
            : replace(state.teamAAssignedIds, playerIdB, playerIdA)
          const teamBAssignedIds = aOnTeamA
            ? replace(state.teamBAssignedIds, playerIdB, playerIdA)
            : replace(state.teamBAssignedIds, playerIdA, playerIdB)
          return {
            teamAAssignedIds,
            teamBAssignedIds,
            savedTeamAAssignedIds: teamAAssignedIds,
            savedTeamBAssignedIds: teamBAssignedIds,
          }
        }),

      resetAssignments: () => set({ teamAAssignedIds: [], teamBAssignedIds: [] }),

      saveTeamConfig: (config) => set({ ...config, teamConfigSaved: true }),

      resetTeamConfig: () =>
        set({
          ...emptyTeamConfigSnapshot(),
          teamAAssignedIds: [],
          teamBAssignedIds: [],
          teamConfigSaved: false,
        }),

      restoreAssignments: () =>
        set((state) => ({
          teamAAssignedIds: [...state.savedTeamAAssignedIds],
          teamBAssignedIds: [...state.savedTeamBAssignedIds],
        })),
    }),
    {
      name: 'boundaryx-player-pool',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
)
