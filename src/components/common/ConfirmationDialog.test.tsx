import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ConfirmationDialog } from '@/components/common/ConfirmationDialog'

describe('ConfirmationDialog', () => {
  it('renders the title and description when open', () => {
    render(
      <ConfirmationDialog
        open
        onOpenChange={() => {}}
        title="Remove this match?"
        description="This cannot be undone."
        onConfirm={() => {}}
      />
    )
    expect(screen.getByText('Remove this match?')).toBeInTheDocument()
    expect(screen.getByText('This cannot be undone.')).toBeInTheDocument()
  })

  it('does not render when closed', () => {
    render(
      <ConfirmationDialog
        open={false}
        onOpenChange={() => {}}
        title="Remove this match?"
        onConfirm={() => {}}
      />
    )
    expect(screen.queryByText('Remove this match?')).not.toBeInTheDocument()
  })

  it('calls onConfirm and closes when the confirm button is clicked', () => {
    const onConfirm = vi.fn()
    const onOpenChange = vi.fn()
    render(
      <ConfirmationDialog
        open
        onOpenChange={onOpenChange}
        title="Remove this match?"
        confirmLabel="Remove"
        onConfirm={onConfirm}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: 'Remove' }))
    expect(onConfirm).toHaveBeenCalledTimes(1)
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('closes without calling onConfirm when cancel is clicked', () => {
    const onConfirm = vi.fn()
    const onOpenChange = vi.fn()
    render(
      <ConfirmationDialog
        open
        onOpenChange={onOpenChange}
        title="Remove this match?"
        cancelLabel="Cancel"
        onConfirm={onConfirm}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onConfirm).not.toHaveBeenCalled()
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('uses the default confirm and cancel labels when not provided', () => {
    render(
      <ConfirmationDialog open onOpenChange={() => {}} title="Are you sure?" onConfirm={() => {}} />
    )
    expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
  })
})
