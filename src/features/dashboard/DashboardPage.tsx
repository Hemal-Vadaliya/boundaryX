import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PageContainer } from '@/components/layout/PageContainer'
import { EmptyState } from '@/components/common/EmptyState'
import { PrimaryButton } from '@/components/common/PrimaryButton'
import { Button } from '@/components/ui/button'
import {
  LayoutDashboard,
  ListChecks,
  Clock,
  CheckCircle2,
  CalendarClock,
  Plus,
  Upload,
} from 'lucide-react'
import { DashboardStatCard } from '@/components/common/DashboardStatCard'
import { MatchCard } from '@/components/common/MatchCard'
import { StaggeredCardGrid } from '@/components/common/StaggeredCardGrid'
import { ConfirmationDialog } from '@/components/common/ConfirmationDialog'
import { useLoadedMatches } from '@/store/matchSelectors'
import { useSessionStore } from '@/store/sessionStore'
import { ExportAllButton } from '@/features/import-export/ExportAllButton'

const RECENT_MATCHES_LIMIT = 6

export function DashboardPage() {
  const loadedMatches = useLoadedMatches()
  const removeMatch = useSessionStore((s) => s.removeMatch)

  const [removeTargetId, setRemoveTargetId] = useState<string | undefined>(undefined)

  const total = loadedMatches.length
  const ongoing = loadedMatches.filter((m) => m.summary.status === 'ongoing').length
  const completed = loadedMatches.filter((m) => m.summary.status === 'completed').length
  const upcoming = loadedMatches.filter((m) => m.summary.status === 'upcoming').length

  const recentMatches = [...loadedMatches]
    .sort((a, b) => b.summary.updatedAt.localeCompare(a.summary.updatedAt))
    .slice(0, RECENT_MATCHES_LIMIT)

  const removeTarget = loadedMatches.find((m) => m.summary.id === removeTargetId)

  return (
    <PageContainer>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm">
            An overview of every match currently loaded in this session.
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/import">
            <Button variant="outline">
              <Upload className="size-4" />
              Import Match
            </Button>
          </Link>
          <ExportAllButton />
          <Link to="/matches/new">
            <PrimaryButton>
              <Plus className="size-4" />
              New Match
            </PrimaryButton>
          </Link>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <DashboardStatCard label="Total matches" value={total} icon={ListChecks} />
        <DashboardStatCard label="Ongoing" value={ongoing} icon={Clock} />
        <DashboardStatCard label="Completed" value={completed} icon={CheckCircle2} />
        <DashboardStatCard label="Upcoming" value={upcoming} icon={CalendarClock} />
      </div>

      {loadedMatches.length === 0 ? (
        <EmptyState
          icon={LayoutDashboard}
          title="No matches loaded yet"
          description="Create a new match or import an existing match JSON file to get started."
        />
      ) : (
        <>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Recent matches</h2>
            <Link to="/matches" className="text-primary text-xs hover:underline">
              View all
            </Link>
          </div>
          <StaggeredCardGrid
            items={recentMatches}
            getKey={(loaded) => loaded.summary.id}
            renderItem={(loaded) => (
              <MatchCard
                match={loaded.summary}
                dirty={loaded.dirty}
                onRemove={() => setRemoveTargetId(loaded.summary.id)}
              />
            )}
          />
        </>
      )}

      <ConfirmationDialog
        open={!!removeTarget}
        onOpenChange={(open) => !open && setRemoveTargetId(undefined)}
        title="Remove this match from the session?"
        description={
          removeTarget?.dirty
            ? `${removeTarget.summary.name} has unsaved changes that have not been exported. Removing it will discard that work — export it first if you want to keep it.`
            : `${removeTarget?.summary.name ?? ''} will be removed from this session. This does not delete any exported file on your device.`
        }
        confirmLabel="Remove"
        destructive
        onConfirm={() => {
          if (removeTargetId) removeMatch(removeTargetId)
        }}
      />
    </PageContainer>
  )
}
