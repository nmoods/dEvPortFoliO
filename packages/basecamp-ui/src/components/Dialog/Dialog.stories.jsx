import { useState } from 'react'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { Button } from '../Button/Button'
import { Dialog } from './Dialog'

function DialogWithTrigger(args) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button variant={args.triggerVariant} onClick={() => setOpen(true)}>
        {args.triggerLabel}
      </Button>
      <Dialog
        {...args}
        open={open}
        onOpenChange={setOpen}
        footer={
          args.withFooter && (
            <>
              <Button variant="secondary" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button variant={args.triggerVariant} onClick={() => setOpen(false)}>
                Confirm
              </Button>
            </>
          )
        }
      />
    </>
  )
}

export default {
  title: 'Components/Dialog',
  component: Dialog,
  render: DialogWithTrigger,
  args: {
    title: 'Delete “Trailboard”?',
    description: 'The board and its history will be removed for every collaborator. This can’t be undone.',
    dismissOnBackdrop: true,
    withFooter: true,
    triggerLabel: 'Delete project…',
    triggerVariant: 'danger',
  },
  argTypes: {
    open: { control: false },
    onOpenChange: { control: false },
    footer: { control: false },
    withFooter: { description: 'Story-only: render Cancel / Confirm actions.' },
    triggerLabel: { description: 'Story-only: label of the opening button.' },
    triggerVariant: { description: 'Story-only', control: 'inline-radio', options: ['primary', 'danger'] },
  },
}

export const Confirmation = {}

export const Informational = {
  args: {
    title: 'Refuge bookings open in March',
    description: 'Most refuges on the route sell out within a week. Book early.',
    withFooter: false,
    triggerLabel: 'Show tip',
    triggerVariant: 'primary',
  },
}

export const OpenAndClose = {
  parameters: {
    docs: { description: { story: 'Opens, closes with Escape, and returns focus to the trigger.' } },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const trigger = canvas.getByRole('button', { name: 'Delete project…' })
    await userEvent.click(trigger)

    const dialog = await canvas.findByRole('dialog', { name: 'Delete “Trailboard”?' })
    await expect(dialog).toHaveAttribute('open')

    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(dialog).not.toHaveAttribute('open'))
    await expect(trigger).toHaveFocus()
  },
}
