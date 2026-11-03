import { expect, fn, userEvent, within } from 'storybook/test'
import { Button } from './Button'

export default {
  title: 'Components/Button',
  component: Button,
  args: {
    children: 'Save changes',
    variant: 'primary',
    size: 'md',
    loading: false,
    disabled: false,
    onClick: fn(),
  },
  argTypes: {
    variant: { control: 'inline-radio', options: ['primary', 'secondary', 'ghost', 'danger'] },
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    children: { control: 'text' },
  },
}

export const Primary = {}

export const Secondary = { args: { variant: 'secondary' } }

export const Ghost = { args: { variant: 'ghost' } }

export const Danger = { args: { variant: 'danger', children: 'Delete project' } }

export const Disabled = { args: { disabled: true } }

export const Sizes = {
  render: (args) => (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      <Button {...args} size="sm">
        Small
      </Button>
      <Button {...args} size="md">
        Medium
      </Button>
      <Button {...args} size="lg">
        Large
      </Button>
    </div>
  ),
}

export const Loading = {
  args: { loading: true },
  parameters: {
    docs: {
      description: {
        story: 'Stays focusable (`aria-disabled`, not `disabled`) and keeps its width; clicks are swallowed.',
      },
    },
  },
  play: async ({ args, canvasElement }) => {
    const button = within(canvasElement).getByRole('button', { name: 'Save changes' })
    await userEvent.tab()
    await expect(button).toHaveFocus()
    await expect(button).toHaveAttribute('aria-busy', 'true')
    await userEvent.click(button)
    await expect(args.onClick).not.toHaveBeenCalled()
  },
}
