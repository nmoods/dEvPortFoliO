import '../src/styles/tokens.css'

/** @type {import('@storybook/react-vite').Preview} */
const preview = {
  tags: ['autodocs'],
  globalTypes: {
    theme: {
      description: 'Basecamp UI theme',
      toolbar: {
        title: 'Theme',
        icon: 'mirror',
        items: [
          { value: 'light', title: 'Light', icon: 'sun' },
          { value: 'dark', title: 'Dark', icon: 'moon' },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    theme: 'light',
  },
  decorators: [
    (Story, { globals }) => (
      <div
        data-bc-theme={globals.theme}
        style={{
          padding: 24,
          minHeight: 120,
          background: 'var(--bc-color-bg)',
          color: 'var(--bc-color-text)',
          fontFamily: 'var(--bc-font-sans)',
        }}
      >
        <Story />
      </div>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
    controls: { expanded: true, sort: 'requiredFirst' },
    a11y: {
      // Fail the a11y panel on violations instead of only listing them.
      test: 'error',
    },
  },
}

export default preview
