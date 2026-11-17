import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import { useLocation } from 'react-router-dom'

interface RouteTransitionProps {
  children: ReactNode
}

/** Short fade/slide on route change (plan section 7.5). Keyed on the current path so the transition replays on navigation; respects the app-wide reduced-motion config set in AppProviders. */
export function RouteTransition({ children }: RouteTransitionProps) {
  const location = useLocation()

  return (
    <motion.div
      key={location.pathname}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}
