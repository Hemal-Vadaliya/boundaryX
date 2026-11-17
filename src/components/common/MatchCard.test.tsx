import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { MatchCard } from '@/components/common/MatchCard'
import type { MatchSummary } from '@/domain/match/types'

function buildMatch(overrides: Partial<MatchSummary> = {}): MatchSummary {
  return {
    id: 'match-1',
    name: 'Alpha vs Beta',
    venue: 'Test Ground',
    format: 'T20',
    status: 'ongoing',
    teamAName: 'Team Alpha',
    teamBName: 'Team Beta',
    matchDate: '2026-11-15',
    createdAt: '2026-11-15T00:00:00.000Z',
    updatedAt: '2026-11-15T00:00:00.000Z',
    ...overrides,
  }
}

function renderCard(props: Parameters<typeof MatchCard>[0]) {
  return render(
    <MemoryRouter>
      <MatchCard {...props} />
    </MemoryRouter>
  )
}

describe('MatchCard', () => {
  it('renders the match name, format, venue and both team names', () => {
    renderCard({ match: buildMatch() })
    expect(screen.getByText('Alpha vs Beta')).toBeInTheDocument()
    expect(screen.getByText('T20 · Test Ground')).toBeInTheDocument()
    expect(screen.getByText('Team Alpha')).toBeInTheDocument()
    expect(screen.getByText('Team Beta')).toBeInTheDocument()
  })

  it('falls back to "Venue TBD" when no venue is set', () => {
    renderCard({ match: buildMatch({ venue: undefined }) })
    expect(screen.getByText('T20 · Venue TBD')).toBeInTheDocument()
  })

  it('links to the match overview page', () => {
    renderCard({ match: buildMatch() })
    expect(screen.getByRole('link', { name: 'Alpha vs Beta' })).toHaveAttribute(
      'href',
      '/matches/match-1'
    )
  })

  it('shows the status badge for the match status', () => {
    renderCard({ match: buildMatch({ status: 'completed' }) })
    expect(screen.getByText('Completed')).toBeInTheDocument()
  })

  it('shows an unsaved-changes note when dirty', () => {
    renderCard({ match: buildMatch(), dirty: true })
    expect(screen.getByText('Unsaved changes')).toBeInTheDocument()
  })

  it('does not show the unsaved-changes note when not dirty', () => {
    renderCard({ match: buildMatch(), dirty: false })
    expect(screen.queryByText('Unsaved changes')).not.toBeInTheDocument()
  })

  it('does not render a remove button when onRemove is not provided', () => {
    renderCard({ match: buildMatch() })
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('calls onRemove without navigating when the remove button is clicked', () => {
    const onRemove = vi.fn()
    renderCard({ match: buildMatch(), onRemove })
    fireEvent.click(screen.getByRole('button', { name: 'Remove Alpha vs Beta from session' }))
    expect(onRemove).toHaveBeenCalledTimes(1)
  })
})
