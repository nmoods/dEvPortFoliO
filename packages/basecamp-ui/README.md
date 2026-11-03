# @nmoods/basecamp-ui

Accessible, token-driven React components: **Button**, **Tabs**, **Dialog** and **Combobox**.

```bash
npm install @nmoods/basecamp-ui
```

```jsx
import { Button, Combobox, Dialog, Tab, TabList, TabPanel, Tabs } from '@nmoods/basecamp-ui'
import '@nmoods/basecamp-ui/styles.css'

<div data-bc-theme="dark">
  <Combobox label="Trail" options={[{ value: 'gr20', label: 'GR20' }]} onValueChange={console.log} />
</div>
```

## Theming

Components read semantic tokens only (`--bc-color-accent`, `--bc-color-bg`, …). Set `data-bc-theme="light" | "dark"`
on any ancestor, or override the semantic variables to rebrand.

## Components

| Component | Pattern | Notes |
|---|---|---|
| `Button` | Native button | `variant`, `size`, `loading` (stays focusable via `aria-disabled`) |
| `Tabs` | [APG Tabs](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/) | Roving tabindex, `activation="automatic" \| "manual"`, string values |
| `Dialog` | Native `<dialog>` modal | `open` + `onOpenChange`, focus returns to the trigger |
| `Combobox` | [APG Combobox, list autocomplete](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/) | `aria-activedescendant`, custom `filter`, live result count |

Stateful components support both controlled (`value` + `onValueChange`) and uncontrolled (`defaultValue`) usage.

## Development

```bash
npm test                  # Vitest + Testing Library (jsdom)
npm run build             # Vite library mode -> dist/
npm run storybook         # Storybook on http://localhost:6006 (docs, controls, axe a11y panel)
npm run build-storybook   # Static Storybook -> storybook-static/
```
