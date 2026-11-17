import type { ReactNode } from 'react'
import { MotionConfig } from 'motion/react'
import { TooltipProvider } from '@/components/ui/tooltip'

interface AppProvidersProps {
  children: ReactNode
}

/** reducedMotion="user" makes every Motion consumer in the app honor the OS/browser reduced-motion preference automatically, without each feature having to opt in individually. */
export function AppProviders({ children }: AppProvidersProps) {
  return (
    <MotionConfig reducedMotion="user">
      <TooltipProvider>{children}</TooltipProvider>
    </MotionConfig>
  )
}
