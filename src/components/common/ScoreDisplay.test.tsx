import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ScoreDisplay } from '@/components/common/ScoreDisplay'

describe('ScoreDisplay', () => {
  it('renders runs and wickets as runs/wickets', () => {
    render(<ScoreDisplay runs={142} wickets={3} overs="18.4" />)
    expect(screen.getByText('142/3')).toBeInTheDocument()
  })

  it('renders the overs value with the default oversLabel', () => {
    render(<ScoreDisplay runs={0} wickets={0} overs="0.0" />)
    expect(screen.getByText('0.0 overs')).toBeInTheDocument()
  })

  it('renders a custom oversLabel when provided', () => {
    render(<ScoreDisplay runs={181} wickets={5} overs="20.0" oversLabel="/ 20 overs" />)
    expect(screen.getByText('20.0 / 20 overs')).toBeInTheDocument()
  })
})
