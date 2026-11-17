import { NavLink } from 'react-router-dom'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { desktopNavItems } from '@/app/routeConfig'
import { cn } from '@/lib/utils'

interface MobileNavSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MobileNavSheet({ open, onOpenChange }: MobileNavSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-72">
        <SheetHeader>
          <SheetTitle>BoundaryX</SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col gap-1 px-4">
          {desktopNavItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                onClick={() => onOpenChange(false)}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-accent/10 text-accent'
                      : 'text-muted-foreground hover:bg-muted'
                  )
                }
              >
                <Icon className="size-4 shrink-0" />
                {item.label}
              </NavLink>
            )
          })}
        </nav>
      </SheetContent>
    </Sheet>
  )
}
