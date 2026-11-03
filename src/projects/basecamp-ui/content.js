export const TRAIL_OPTIONS = [
  { value: 'tmb', label: 'Tour du Mont Blanc', description: 'France · Italy · Switzerland' },
  { value: 'gr20', label: 'GR20', description: 'Corsica, France' },
  { value: 'w-trek', label: 'W Trek', description: 'Torres del Paine, Chile' },
  { value: 'kungsleden', label: 'Kungsleden', description: 'Swedish Lapland' },
  { value: 'laugavegur', label: 'Laugavegur', description: 'Iceland' },
  { value: 'west-highland', label: 'West Highland Way', description: 'Scotland' },
  { value: 'annapurna', label: 'Annapurna Circuit', description: 'Nepal' },
  { value: 'inca', label: 'Inca Trail', description: 'Peru' },
  { value: 'milford', label: 'Milford Track', description: 'New Zealand' },
  { value: 'jmt', label: 'John Muir Trail', description: 'California, USA' },
  { value: 'alta-via-1', label: 'Alta Via 1', description: 'Dolomites, Italy' },
  { value: 'le-morne', label: 'Le Morne Brabant', description: 'Mauritius' },
]

export const SEMANTIC_TOKENS = [
  '--bc-color-bg',
  '--bc-color-bg-subtle',
  '--bc-color-border',
  '--bc-color-text',
  '--bc-color-text-muted',
  '--bc-color-accent',
  '--bc-color-accent-subtle',
  '--bc-color-danger',
]

export const KEYBOARD = {
  button: [
    ['Enter / Space', 'Activates the button (ignored while loading).'],
    ['Tab', 'Still reaches a loading button: aria-disabled instead of disabled.'],
  ],
  tabs: [
    ['Tab', 'Moves focus into the tab list (selected tab), then to the panel.'],
    ['← / →', 'Previous / next tab, wrapping and skipping disabled tabs.'],
    ['Home / End', 'First / last tab.'],
    ['Enter / Space', 'Selects the focused tab in activation="manual" mode.'],
  ],
  dialog: [
    ['Tab / Shift+Tab', 'Cycles focus inside the dialog only (native modal focus trap).'],
    ['Esc', 'Requests close through onOpenChange(false); the parent decides.'],
  ],
  combobox: [
    ['↓ / ↑', 'Opens the list, then moves the active option (wraps around).'],
    ['Enter', 'Commits the active option and closes.'],
    ['Esc', 'Closes and restores the selection; pressed again, clears it.'],
    ['Tab', 'Closes and moves on; unfinished text reverts to the selection.'],
  ],
}

export const DECISIONS = [
  {
    title: 'Two-tier tokens',
    body: 'Primitives (pine-500, night-800) never appear in component CSS. Components read semantic roles (color-accent, color-bg), so a theme is ~15 variable remaps and a rebrand never touches a component.',
  },
  {
    title: 'Use the platform',
    body: 'Dialog is built on native <dialog>.showModal(): focus trap, inert background, top layer and Escape come from the browser. Less code to ship and maintain, and fewer subtle a11y bugs than a hand-rolled portal.',
  },
  {
    title: 'aria-activedescendant over moving focus',
    body: 'In the combobox, DOM focus never leaves the input, so typing, caret movement and IME composition keep working while screen readers still announce the highlighted option.',
  },
  {
    title: 'Controlled and uncontrolled',
    body: 'A shared useControllableState hook gives every stateful component both modes (value/onValueChange or defaultValue) with one code path, the API consumers expect from mature libraries.',
  },
  {
    title: 'A real package boundary',
    body: 'Lives in an npm workspace with its own manifest, Vite library build, external React peer dependency and a sideEffects flag for tree-shaking. The portfolio aliases the source in dev for instant HMR.',
  },
  {
    title: 'Tests that read like a user',
    body: 'Testing Library + user-event drive real keyboard sequences and query by role and accessible name. If a test can’t find an element by its role, neither can a screen reader.',
  },
]
