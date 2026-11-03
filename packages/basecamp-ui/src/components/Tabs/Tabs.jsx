import { createContext, use, useId, useMemo } from 'react'
import { cx } from '../../utils/cx'
import { useControllableState } from '../../utils/useControllableState'
import './Tabs.css'

const TabsContext = createContext(null)

const useTabsContext = (component) => {
  const context = use(TabsContext)
  if (!context) throw new Error(`<${component}> must be rendered inside <Tabs>.`)
  return context
}

const toDomId = (value) => String(value).replace(/\s+/g, '-')

/**
 * `activation="automatic"` selects a tab as soon as it receives focus (good when panels are cheap);
 * `"manual"` only moves focus, and Enter/Space selects (good when panels are expensive to render).
 */
export function Tabs({ value, defaultValue, onValueChange, activation = 'automatic', className, children }) {
  const [selectedValue, setSelectedValue] = useControllableState({ value, defaultValue, onChange: onValueChange })
  const baseId = useId()

  const context = useMemo(
    () => ({
      selectedValue,
      select: setSelectedValue,
      activation,
      tabId: (tabValue) => `${baseId}-tab-${toDomId(tabValue)}`,
      panelId: (tabValue) => `${baseId}-panel-${toDomId(tabValue)}`,
    }),
    [selectedValue, setSelectedValue, activation, baseId]
  )

  return (
    <div className={cx('bc-tabs', className)}>
      <TabsContext value={context}>{children}</TabsContext>
    </div>
  )
}

const NEXT_INDEX = {
  ArrowRight: (index, count) => (index + 1) % count,
  ArrowLeft: (index, count) => (index - 1 + count) % count,
  Home: () => 0,
  End: (_, count) => count - 1,
}

export function TabList({ label, className, children }) {
  const { activation, select } = useTabsContext('TabList')

  const handleKeyDown = (event) => {
    const getNextIndex = NEXT_INDEX[event.key]
    if (!getNextIndex) return
    const tabs = [...event.currentTarget.querySelectorAll('[role="tab"]:not(:disabled)')]
    const currentIndex = tabs.indexOf(event.target)
    if (currentIndex === -1) return

    event.preventDefault()
    const nextTab = tabs[getNextIndex(currentIndex, tabs.length)]
    nextTab.focus()
    if (activation === 'automatic') select(nextTab.dataset.value)
  }

  return (
    <div role="tablist" aria-label={label} className={cx('bc-tabs__list', className)} onKeyDown={handleKeyDown}>
      {children}
    </div>
  )
}

export function Tab({ value, disabled = false, className, children }) {
  const { selectedValue, select, tabId, panelId } = useTabsContext('Tab')
  const isSelected = selectedValue === value

  return (
    <button
      type="button"
      role="tab"
      id={tabId(value)}
      aria-selected={isSelected}
      aria-controls={panelId(value)}
      tabIndex={isSelected ? 0 : -1}
      data-value={value}
      disabled={disabled}
      className={cx('bc-tabs__tab', className)}
      onClick={() => select(value)}
    >
      {children}
    </button>
  )
}

export function TabPanel({ value, className, children }) {
  const { selectedValue, tabId, panelId } = useTabsContext('TabPanel')
  const isSelected = selectedValue === value

  return (
    <div
      role="tabpanel"
      id={panelId(value)}
      aria-labelledby={tabId(value)}
      tabIndex={0}
      hidden={!isSelected}
      className={cx('bc-tabs__panel', className)}
    >
      {isSelected && children}
    </div>
  )
}
