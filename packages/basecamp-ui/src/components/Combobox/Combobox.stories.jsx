import { useState } from 'react'
import { expect, fn, userEvent, within } from 'storybook/test'
import { Combobox } from './Combobox'
import { normalize } from './filter'

const TRAILS = [
  { value: 'tmb', label: 'Tour du Mont Blanc', description: 'France · Italy · Switzerland' },
  { value: 'gr20', label: 'GR20', description: 'Corsica, France' },
  { value: 'w-trek', label: 'W Trek', description: 'Torres del Paine, Chile' },
  { value: 'kungsleden', label: 'Kungsleden', description: 'Swedish Lapland' },
  { value: 'laugavegur', label: 'Laugavegur', description: 'Iceland' },
  { value: 'west-highland', label: 'West Highland Way', description: 'Scotland' },
  { value: 'annapurna', label: 'Annapurna Circuit', description: 'Nepal' },
  { value: 'le-morne', label: 'Le Morne Brabant', description: 'Mauritius' },
]

export default {
  title: 'Components/Combobox',
  component: Combobox,
  args: {
    label: 'Choose a trail',
    options: TRAILS,
    placeholder: 'Search trails',
    emptyMessage: 'No results',
    onValueChange: fn(),
  },
  argTypes: {
    options: { control: 'object' },
    value: { control: false },
    filter: { control: false },
  },
  // Leave room below the input for the listbox in the docs page.
  decorators: [(Story) => <div style={{ minHeight: 320 }}>{Story()}</div>],
}

export const Uncontrolled = {}

export const WithDefaultValue = { args: { defaultValue: 'gr20' } }

export const Controlled = {
  render: function ControlledCombobox(args) {
    const [value, setValue] = useState('tmb')
    return (
      <div style={{ display: 'grid', gap: 12 }}>
        <Combobox
          {...args}
          value={value}
          onValueChange={(next) => {
            setValue(next)
            args.onValueChange(next)
          }}
        />
        <code>value: {JSON.stringify(value)}</code>
      </div>
    )
  },
}

export const StartsWithFilter = {
  args: {
    label: 'Trail (prefix match)',
    filter: (option, query) => normalize(option.label).startsWith(normalize(query)),
  },
  parameters: {
    docs: { description: { story: 'Pass a custom `filter(option, query)`; here only prefix matches are kept.' } },
  },
}

export const KeyboardSelection = {
  parameters: {
    docs: { description: { story: 'Type to filter, move with ↓, commit with Enter. Focus never leaves the input.' } },
  },
  play: async ({ args, canvasElement }) => {
    const input = within(canvasElement).getByRole('combobox', { name: 'Choose a trail' })
    await userEvent.type(input, 'la')
    await expect(input).toHaveAttribute('aria-expanded', 'true')

    await userEvent.keyboard('{ArrowDown}{Enter}')
    await expect(input).toHaveFocus()
    await expect(input).toHaveValue('Laugavegur')
    await expect(args.onValueChange).toHaveBeenCalledWith('laugavegur')
  },
}
