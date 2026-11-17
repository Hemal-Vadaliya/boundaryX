import { useEffect } from 'react'
import { useUiStore } from '@/store/uiStore'

/** Applies the current theme as a class on <html> so Tailwind's `dark:` variant works. */
export function useThemeSync() {
  const theme = useUiStore((state) => state.theme)

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', theme === 'dark')
    root.style.colorScheme = theme
  }, [theme])
}
