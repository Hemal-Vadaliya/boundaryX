import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import { cn } from '@/lib/utils'

interface StaggeredCardGridProps<T> {
  items: T[]
  getKey: (item: T) => string
  renderItem: (item: T) => ReactNode
  className?: string
}

/** Subtle appearance stagger for a grid of cards (plan section 7.5). Each item gets a small index-based delay; reduced-motion is handled globally via AppProviders' MotionConfig. */
export function StaggeredCardGrid<T>({
  items,
  getKey,
  renderItem,
  className,
}: StaggeredCardGridProps<T>) {
  return (
    <div
      className={cn('grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3', className)}
    >
      {items.map((item, index) => (
        <motion.div
          key={getKey(item)}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: Math.min(index, 8) * 0.03 }}
        >
          {renderItem(item)}
        </motion.div>
      ))}
    </div>
  )
}
