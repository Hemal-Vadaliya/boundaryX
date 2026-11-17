import { useState } from 'react'
import { PageContainer } from '@/components/layout/PageContainer'
import { EmptyState } from '@/components/common/EmptyState'
import { PrimaryButton } from '@/components/common/PrimaryButton'
import { useLoadedMatches } from '@/store/matchSelectors'
import { useSessionStore } from '@/store/sessionStore'
import { MatchCard } from '@/components/common/MatchCard'
import { StaggeredCardGrid } from '@/components/common/StaggeredCardGrid'
import { MatchFilterBar } from '@/components/common/MatchFilterBar'
import type { MatchFilters } from '@/components/common/MatchFilterBar'
import { applyMatchFilters } from '@/utils/matchFilters'
import { ConfirmationDialog } from '@/components/common/ConfirmationDialog'
import { ListChecks, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'

export function MatchCollectionPage() {
  const loadedMatches = useLoadedMatches()
  const removeMatch = useSessionStore((s) => s.removeMatch)

  const [filters, setFilters] = useState<MatchFilters>({
    query: '',
    status: 'all',
    format: 'all',
  })
  const [removeTargetId, setRemoveTargetId] = useState<string | undefined>(undefined)

  const filteredMatches = applyMatchFilters(loadedMatches, filters)
  const removeTarget = loadedMatches.find((m) => m.summary.id === removeTargetId)

  return (
    <PageContainer>
      <div className="mb-6 flex items-center justify-between gap-2">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Matches</h1>
          <p className="text-muted-foreground text-sm">
            Every match document loaded in this session.
          </p>
        </div>
        <Link to="/matches/new">
          <PrimaryButton>
            <Plus className="size-4" />
            New Match
          </PrimaryButton>
        </Link>
      </div>

      {loadedMatches.length === 0 ? (
        <EmptyState
          icon={ListChecks}
          title="No matches in this session"
          description="Create a match or import a JSON file to see it listed here."
        />
      ) : (
        <>
          <MatchFilterBar filters={filters} onChange={setFilters} />

          {filteredMatches.length === 0 ? (
            <EmptyState
              icon={ListChecks}
              title="No matches match these filters"
              description="Try a different search term or clear the status/format filters."
            />
          ) : (
            <StaggeredCardGrid
              items={filteredMatches}
              getKey={(loaded) => loaded.summary.id}
              renderItem={(loaded) => (
                <MatchCard
                  match={loaded.summary}
                  dirty={loaded.dirty}
                  onRemove={() => setRemoveTargetId(loaded.summary.id)}
                />
              )}
            />
          )}
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
