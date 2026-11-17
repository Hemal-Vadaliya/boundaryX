import {
  LayoutDashboard,
  ListChecks,
  PlusCircle,
  BarChart3,
  Settings,
  Home,
  Gauge,
  MoreHorizontal,
} from 'lucide-react'
import type { ComponentType } from 'react'

export interface NavItem {
  label: string
  path: string
  icon: ComponentType<{ className?: string }>
}

export const desktopNavItems: NavItem[] = [
  { label: 'Dashboard', path: '/', icon: LayoutDashboard },
  { label: 'Matches', path: '/matches', icon: ListChecks },
  { label: 'New Match', path: '/matches/new', icon: PlusCircle },
  { label: 'Statistics', path: '/statistics', icon: BarChart3 },
  { label: 'Settings', path: '/settings', icon: Settings },
]

export const mobileNavItems: NavItem[] = [
  { label: 'Home', path: '/', icon: Home },
  { label: 'Matches', path: '/matches', icon: ListChecks },
  { label: 'Score', path: '/matches', icon: Gauge },
  { label: 'More', path: '/settings', icon: MoreHorizontal },
]
