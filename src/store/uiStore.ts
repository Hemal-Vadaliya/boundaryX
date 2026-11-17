import { create } from 'zustand'
import type { ThemeMode } from '@/types/common'

function getPreferredTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'dark'
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

interface UiState {
  theme: ThemeMode
  sidebarCollapsed: boolean
  setTheme: (theme: ThemeMode) => void
  toggleTheme: () => void
  toggleSidebar: () => void
}

/**
 * Presentation-only preferences. Never persisted — match documents are the
 * only things the user explicitly saves, and this store must stay that way.
 */
export const useUiStore = create<UiState>((set) => ({
  theme: getPreferredTheme(),
  sidebarCollapsed: false,
  setTheme: (theme) => set({ theme }),
  toggleTheme: () =>
    set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
}))
