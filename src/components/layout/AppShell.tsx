import { useState } from 'react'
import type { ReactNode } from 'react'
import { DesktopSidebar } from '@/components/navigation/DesktopSidebar'
import { MobileBottomNavigation } from '@/components/navigation/MobileBottomNavigation'
import { MobileNavSheet } from '@/components/navigation/MobileNavSheet'
import { AppHeader } from '@/components/layout/AppHeader'
import { UnsavedChangesBanner } from '@/components/feedback/UnsavedChangesBanner'
import { RouteTransition } from '@/components/layout/RouteTransition'

interface AppShellProps {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  return (
    <div className="bg-background text-foreground flex min-h-svh">
      <DesktopSidebar />

      <div className="flex min-h-svh flex-1 flex-col">
        <AppHeader onOpenMobileMenu={() => setMobileNavOpen(true)} />
        <UnsavedChangesBanner />
        <main className="flex-1">
          <RouteTransition>{children}</RouteTransition>
        </main>
      </div>

      <MobileNavSheet open={mobileNavOpen} onOpenChange={setMobileNavOpen} />
      <MobileBottomNavigation />
    </div>
  )
}
