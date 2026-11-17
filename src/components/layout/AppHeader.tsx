import { Moon, Sun, Menu } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useUiStore } from '@/store/uiStore'

interface AppHeaderProps {
  onOpenMobileMenu?: () => void
}

export function AppHeader({ onOpenMobileMenu }: AppHeaderProps) {
  const theme = useUiStore((state) => state.theme)
  const toggleTheme = useUiStore((state) => state.toggleTheme)

  return (
    <header className="border-border flex h-14 items-center justify-between gap-2 border-b px-4">
      <div className="flex items-center gap-2 md:hidden">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Open menu"
          onClick={onOpenMobileMenu}
        >
          <Menu className="size-5" />
        </Button>
        <Link to="/" className="text-sm font-semibold tracking-tight">
          BoundaryX
        </Link>
      </div>

      <div className="hidden md:block" />

      <Button
        variant="ghost"
        size="icon"
        aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
        onClick={toggleTheme}
      >
        {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
      </Button>
    </header>
  )
}
