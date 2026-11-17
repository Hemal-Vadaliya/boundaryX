import { lazy } from 'react'

/**
 * Centralizes every route's lazy import so router.tsx stays a pure route
 * table (only lucide-react style "not a component" files trip the
 * only-export-components lint rule otherwise).
 */
export const DashboardPage = lazy(() =>
  import('@/features/dashboard/DashboardPage').then((m) => ({ default: m.DashboardPage }))
)
export const MatchCollectionPage = lazy(() =>
  import('@/features/matches/MatchCollectionPage').then((m) => ({
    default: m.MatchCollectionPage,
  }))
)
export const MatchSetupPage = lazy(() =>
  import('@/features/match-setup/MatchSetupPage').then((m) => ({
    default: m.MatchSetupPage,
  }))
)
export const MatchOverviewPage = lazy(() =>
  import('@/features/matches/MatchOverviewPage').then((m) => ({
    default: m.MatchOverviewPage,
  }))
)
export const LiveScoringPage = lazy(() =>
  import('@/features/scoring/LiveScoringPage').then((m) => ({
    default: m.LiveScoringPage,
  }))
)
export const ScorecardPage = lazy(() =>
  import('@/features/scorecard/ScorecardPage').then((m) => ({ default: m.ScorecardPage }))
)
export const MatchStatisticsPage = lazy(() =>
  import('@/features/statistics/MatchStatisticsPage').then((m) => ({
    default: m.MatchStatisticsPage,
  }))
)
export const StatisticsOverviewPage = lazy(() =>
  import('@/features/statistics/StatisticsOverviewPage').then((m) => ({
    default: m.StatisticsOverviewPage,
  }))
)
export const ImportMatchPage = lazy(() =>
  import('@/features/import-export/ImportMatchPage').then((m) => ({
    default: m.ImportMatchPage,
  }))
)
export const SettingsPage = lazy(() =>
  import('@/features/settings/SettingsPage').then((m) => ({ default: m.SettingsPage }))
)
