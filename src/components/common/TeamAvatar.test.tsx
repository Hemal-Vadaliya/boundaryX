import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TeamAvatar } from '@/components/common/TeamAvatar'

describe('TeamAvatar', () => {
  it('renders initials from a two-word name', () => {
    render(<TeamAvatar name="Mumbai Strikers" />)
    expect(screen.getByText('MS')).toBeInTheDocument()
  })

  it('renders initials from a single-word name using its first two letters', () => {
    render(<TeamAvatar name="Strikers" />)
    expect(screen.getByText('ST')).toBeInTheDocument()
  })

  it('renders a fallback for an empty name', () => {
    render(<TeamAvatar name="   " />)
    expect(screen.getByText('?')).toBeInTheDocument()
  })

  it('uses the first and last word initials for a multi-word name', () => {
    render(<TeamAvatar name="Royal Challengers Bangalore" />)
    expect(screen.getByText('RB')).toBeInTheDocument()
  })
})
