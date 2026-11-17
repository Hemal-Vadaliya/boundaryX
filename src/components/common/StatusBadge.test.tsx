import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StatusBadge } from '@/components/common/StatusBadge'

describe('StatusBadge', () => {
  it('renders the upcoming label', () => {
    render(<StatusBadge status="upcoming" />)
    expect(screen.getByText('Upcoming')).toBeInTheDocument()
  })

  it('renders the ongoing label as "Live" with a status dot', () => {
    const { container } = render(<StatusBadge status="ongoing" />)
    expect(screen.getByText('Live')).toBeInTheDocument()
    expect(container.querySelector('.rounded-full')).toBeInTheDocument()
  })

  it('renders the completed label', () => {
    render(<StatusBadge status="completed" />)
    expect(screen.getByText('Completed')).toBeInTheDocument()
  })

  it('renders the abandoned label', () => {
    render(<StatusBadge status="abandoned" />)
    expect(screen.getByText('Abandoned')).toBeInTheDocument()
  })

  it('does not render a status dot for non-ongoing statuses', () => {
    const { container } = render(<StatusBadge status="completed" />)
    expect(container.querySelector('.rounded-full')).not.toBeInTheDocument()
  })
})
