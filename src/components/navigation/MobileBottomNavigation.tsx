import { NavLink } from 'react-router-dom'
import { mobileNavItems } from '@/app/routeConfig'
import { cn } from '@/lib/utils'

export function MobileBottomNavigation() {
  return (
    <nav className="bg-background/95 border-border fixed inset-x-0 bottom-0 z-40 flex h-16 items-stretch border-t backdrop-blur md:hidden">
      {mobileNavItems.map((item) => {
        const Icon = item.icon
        return (
          <NavLink
            key={item.label}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              cn(
                'flex flex-1 flex-col items-center justify-center gap-1 text-xs font-medium transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )
            }
          >
            <Icon className="size-5" />
            <span>{item.label}</span>
          </NavLink>
        )
      })}
    </nav>
  )
}
