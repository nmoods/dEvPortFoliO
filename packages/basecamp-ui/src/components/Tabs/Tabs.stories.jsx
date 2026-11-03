import { expect, fn, userEvent, within } from 'storybook/test'
import { Tab, TabList, TabPanel, Tabs } from './Tabs'

export default {
  title: 'Components/Tabs',
  component: Tabs,
  subcomponents: { TabList, Tab, TabPanel },
  args: {
    defaultValue: 'overview',
    activation: 'automatic',
    onValueChange: fn(),
  },
  argTypes: {
    activation: { control: 'inline-radio', options: ['automatic', 'manual'] },
  },
  render: (args) => (
    <Tabs {...args}>
      <TabList label="Trail details">
        <Tab value="overview">Overview</Tab>
        <Tab value="elevation">Elevation</Tab>
        <Tab value="permits" disabled>
          Permits
        </Tab>
        <Tab value="gear">Gear</Tab>
      </TabList>
      <TabPanel value="overview">170 km loop through France, Italy and Switzerland.</TabPanel>
      <TabPanel value="elevation">≈ 10,000 m of cumulative ascent.</TabPanel>
      <TabPanel value="permits">No permits required.</TabPanel>
      <TabPanel value="gear">Layers, poles and a light shell.</TabPanel>
    </Tabs>
  ),
}

export const Automatic = {}

export const Manual = {
  args: { activation: 'manual' },
  parameters: {
    docs: {
      description: { story: 'Arrow keys only move focus; Enter or Space selects. Use when panels are expensive.' },
    },
  },
}

export const KeyboardNavigation = {
  parameters: {
    docs: { description: { story: 'Arrows wrap around and skip the disabled “Permits” tab.' } },
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('tab', { name: 'Overview' }))

    await userEvent.keyboard('{ArrowRight}')
    await expect(canvas.getByRole('tab', { name: 'Elevation' })).toHaveFocus()

    await userEvent.keyboard('{ArrowRight}')
    await expect(canvas.getByRole('tab', { name: 'Gear' })).toHaveFocus()

    await userEvent.keyboard('{ArrowRight}')
    await expect(canvas.getByRole('tab', { name: 'Overview' })).toHaveFocus()
    await expect(args.onValueChange).toHaveBeenLastCalledWith('overview')
  },
}
