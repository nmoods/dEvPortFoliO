// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { Dialog } from './Dialog'

function Harness() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Delete project
      </button>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title="Delete this project?"
        description="This cannot be undone."
        footer={
          <button type="button" onClick={() => setOpen(false)}>
            Cancel
          </button>
        }
      />
    </>
  )
}

describe('Dialog', () => {
  it('opens with an accessible name and description', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.click(screen.getByRole('button', { name: 'Delete project' }))

    const dialog = screen.getByRole('dialog', { name: 'Delete this project?' })
    expect(dialog).toHaveAttribute('open')
    expect(dialog).toHaveAccessibleDescription('This cannot be undone.')
  })

  it('closes on Escape (cancel) through onOpenChange', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.click(screen.getByRole('button', { name: 'Delete project' }))

    const dialog = screen.getByRole('dialog')
    fireEvent(dialog, new Event('cancel', { cancelable: true }))
    expect(dialog).not.toHaveAttribute('open')
  })

  it('closes on backdrop click but not on clicks inside the surface', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.click(screen.getByRole('button', { name: 'Delete project' }))
    const dialog = screen.getByRole('dialog')

    await user.click(screen.getByText('This cannot be undone.'))
    expect(dialog).toHaveAttribute('open')

    await user.click(dialog)
    expect(dialog).not.toHaveAttribute('open')
  })

  it('returns focus to the trigger after closing', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    const trigger = screen.getByRole('button', { name: 'Delete project' })
    await user.click(trigger)
    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(trigger).toHaveFocus()
  })
})
