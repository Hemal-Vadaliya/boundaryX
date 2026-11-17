import { NavLink } from 'react-router-dom'
import { ChevronsLeft, ChevronsRight } from 'lucide-react'
import { desktopNavItems } from '@/app/routeConfig'
import { useUiStore } from '@/store/uiStore'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

export function DesktopSidebar() {
  const collapsed = useUiStore((state) => state.sidebarCollapsed)
  const toggleSidebar = useUiStore((state) => state.toggleSidebar)

  return (
    <aside
      className={cn(
        'bg-sidebar text-sidebar-foreground border-sidebar-border hidden h-svh flex-col border-r transition-[width] duration-200 md:flex',
        collapsed ? 'w-[72px]' : 'w-64'
      )}
    >
      <div className="border-sidebar-border flex h-14 items-center gap-2 border-b px-4">
        <div className="bg-primary text-primary-foreground flex size-8 shrink-0 items-center justify-center rounded-md font-semibold">
          B
        </div>
        {!collapsed && (
          <span className="truncate text-sm font-semibold tracking-tight">BoundaryX</span>
        )}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-2">
        {desktopNavItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground'
                )
              }
              title={collapsed ? item.label : undefined}
            >
              <Icon className="size-4 shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </NavLink>
          )
        })}
      </nav>

      <div className="border-sidebar-border border-t p-2">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-center"
          onClick={toggleSidebar}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <ChevronsRight className="size-4" />
          ) : (
            <ChevronsLeft className="size-4" />
          )}
        </Button>
      </div>
    </aside>
  )
}
