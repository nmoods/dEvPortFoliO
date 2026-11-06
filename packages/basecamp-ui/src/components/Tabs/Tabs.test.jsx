// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { Tab, TabList, TabPanel, Tabs } from './Tabs'

const renderTabs = (props = {}) =>
  render(
    <>
      <button type="button">Before</button>
      <Tabs defaultValue="overview" {...props}>
        <TabList label="Trail details">
          <Tab value="overview">Overview</Tab>
          <Tab value="weather" disabled>
            Weather
          </Tab>
          <Tab value="elevation">Elevation</Tab>
          <Tab value="gear">Gear</Tab>
        </TabList>
        <TabPanel value="overview">Overview content</TabPanel>
        <TabPanel value="weather">Weather content</TabPanel>
        <TabPanel value="elevation">Elevation content</TabPanel>
        <TabPanel value="gear">Gear content</TabPanel>
      </Tabs>
    </>
  )

describe('Tabs', () => {
  it('links tabs and panels with ARIA', () => {
    renderTabs()
    const tab = screen.getByRole('tab', { name: 'Overview' })
    const panel = screen.getByRole('tabpanel', { name: 'Overview' })

    expect(screen.getByRole('tablist', { name: 'Trail details' })).toBeInTheDocument()
    expect(tab).toHaveAttribute('aria-selected', 'true')
    expect(tab).toHaveAttribute('aria-controls', panel.id)
    expect(panel).toHaveTextContent('Overview content')
  })

  it('is a single tab stop (roving tabindex)', async () => {
    const user = userEvent.setup()
    renderTabs()
    await user.click(screen.getByRole('button', { name: 'Before' }))

    await user.tab()
    expect(screen.getByRole('tab', { name: 'Overview' })).toHaveFocus()
    await user.tab()
    expect(screen.getByRole('tabpanel')).toHaveFocus()
  })

  it('moves with arrow keys, skips disabled tabs and wraps around', async () => {
    const user = userEvent.setup()
    renderTabs()
    await user.click(screen.getByRole('tab', { name: 'Overview' }))

    await user.keyboard('{ArrowRight}')
    expect(screen.getByRole('tab', { name: 'Elevation' })).toHaveFocus()
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Elevation content')

    await user.keyboard('{End}')
    expect(screen.getByRole('tab', { name: 'Gear' })).toHaveFocus()

    await user.keyboard('{ArrowRight}')
    expect(screen.getByRole('tab', { name: 'Overview' })).toHaveFocus()

    await user.keyboard('{ArrowLeft}')
    expect(screen.getByRole('tab', { name: 'Gear' })).toHaveAttribute('aria-selected', 'true')
  })

  it('only moves focus in manual activation mode until Enter is pressed', async () => {
    const user = userEvent.setup()
    renderTabs({ activation: 'manual' })
    await user.click(screen.getByRole('tab', { name: 'Overview' }))

    await user.keyboard('{ArrowRight}')
    expect(screen.getByRole('tab', { name: 'Elevation' })).toHaveFocus()
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Overview content')

    await user.keyboard('{Enter}')
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Elevation content')
  })
})
