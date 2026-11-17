import { createBrowserRouter } from 'react-router-dom'
import { Suspense } from 'react'
import type { ReactNode } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { LoadingState } from '@/components/common/LoadingState'
import {
  DashboardPage,
  MatchCollectionPage,
  MatchSetupPage,
  MatchOverviewPage,
  LiveScoringPage,
  ScorecardPage,
  MatchStatisticsPage,
  StatisticsOverviewPage,
  ImportMatchPage,
  SettingsPage,
} from '@/app/lazyPages'

/**
 * Wraps each route's page in the app shell and a Suspense boundary so the
 * per-route code-split chunk (Recharts for statistics, Motion-heavy
 * scoring UI, etc.) only loads when that route is actually visited,
 * instead of bloating every route's initial bundle.
 */
function withShell(element: ReactNode) {
  return (
    <AppShell>
      <Suspense fallback={<LoadingState />}>{element}</Suspense>
    </AppShell>
  )
}

export const router = createBrowserRouter([
  { path: '/', element: withShell(<DashboardPage />) },
  { path: '/matches', element: withShell(<MatchCollectionPage />) },
  { path: '/matches/new', element: withShell(<MatchSetupPage />) },
  { path: '/matches/:matchId', element: withShell(<MatchOverviewPage />) },
  { path: '/matches/:matchId/score', element: withShell(<LiveScoringPage />) },
  { path: '/matches/:matchId/scorecard', element: withShell(<ScorecardPage />) },
  {
    path: '/matches/:matchId/statistics',
    element: withShell(<MatchStatisticsPage />),
  },
  { path: '/statistics', element: withShell(<StatisticsOverviewPage />) },
  { path: '/import', element: withShell(<ImportMatchPage />) },
  { path: '/settings', element: withShell(<SettingsPage />) },
])
