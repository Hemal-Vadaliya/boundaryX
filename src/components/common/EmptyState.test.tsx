import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { EmptyState } from '@/components/common/EmptyState'
import { ListChecks } from 'lucide-react'

describe('EmptyState', () => {
  it('renders the title', () => {
    render(<EmptyState title="No matches in this session" />)
    expect(screen.getByText('No matches in this session')).toBeInTheDocument()
  })

  it('renders the description when provided', () => {
    render(<EmptyState title="No matches" description="Create a match to get started." />)
    expect(screen.getByText('Create a match to get started.')).toBeInTheDocument()
  })

  it('does not render a description when not provided', () => {
    const { container } = render(<EmptyState title="No matches" />)
    expect(container.querySelectorAll('p')).toHaveLength(1)
  })

  it('renders the icon when provided', () => {
    const { container } = render(<EmptyState title="No matches" icon={ListChecks} />)
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('renders action content when provided', () => {
    render(<EmptyState title="No matches" action={<button>Create match</button>} />)
    expect(screen.getByRole('button', { name: 'Create match' })).toBeInTheDocument()
  })
})
