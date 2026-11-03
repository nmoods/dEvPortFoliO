import { useEffect, useState } from 'react'
import { Button, Combobox, Dialog, Tab, TabList, TabPanel, Tabs } from '@nmoods/basecamp-ui'
import { TRAIL_OPTIONS, SEMANTIC_TOKENS, KEYBOARD, DECISIONS } from './content'
import './BasecampPage.css'

// The production build ships Storybook at dist/storybook; in dev it runs on its own server.
const STORYBOOK_URL = import.meta.env.DEV ? 'http://localhost:6006' : 'storybook/index.html'

const initialTheme =() => (document.documentElement.dataset.mood === 'dusk' ? 'dark' : 'light')

function BasecampPage() {
  const [theme, setTheme] = useState(initialTheme)

  useEffect(() => {
    window.scrollTo(0, 0)
    document.title = 'Basecamp UI · Accessible React design system'
  }, [])

  return (
    <div className="bcp-page">
      <header className="bcp-header">
        <a href="#projects" className="bcp-back">
          ← Back to portfolio
        </a>
        <p className="section-eyebrow">Project 02 · Design system</p>
        <h1 className="bcp-title">Basecamp UI</h1>
        <p className="bcp-lede">
          A small, accessible React component library packaged for npm: two-tier design tokens, light and dark
          themes, and four components that are easy to get wrong. Every demo below is the real package, and
          each one documents the keyboard behavior it guarantees.
        </p>
        <div className="bcp-install">
          <code>npm install @nmoods/basecamp-ui</code>
          <span className="bcp-install__meta">3.4 kB JS + 2.2 kB CSS gzipped · React 19 peer dependency</span>
          <a className="bcp-storybook" href={STORYBOOK_URL} target="_blank" rel="noreferrer">
            Open Storybook ↗
          </a>
        </div>
      </header>

      <div className="bcp-surface" data-bc-theme={theme}>
        <div className="bcp-surface__bar">
          <span className="bcp-surface__label">Theme</span>
          <div className="bcp-segmented" role="group" aria-label="Preview theme">
            {['light', 'dark'].map((option) => (
              <Button
                key={option}
                size="sm"
                variant={theme === option ? 'primary' : 'secondary'}
                aria-pressed={theme === option}
                onClick={() => setTheme(option)}
              >
                {option === 'light' ? 'Light' : 'Dark'}
              </Button>
            ))}
          </div>
        </div>

        <Section id="tokens" title="Tokens" summary="Components only read semantic roles; a theme is just a different mapping of those roles to primitives.">
          <ul className="bcp-tokens">
            {SEMANTIC_TOKENS.map((token) => (
              <li key={token}>
                <span className="bcp-tokens__swatch" style={{ background: `var(${token})` }} />
                <code>{token}</code>
              </li>
            ))}
          </ul>
        </Section>

        <Section id="button" title="Button" summary="Four variants, three sizes. While loading it keeps its width and stays focusable, so keyboard users never lose their place." keyboard={KEYBOARD.button}>
          <ButtonDemo />
        </Section>

        <Section id="tabs" title="Tabs" summary="Compound components with roving tabindex: the tab list is one Tab stop, arrows move inside it, disabled tabs are skipped." keyboard={KEYBOARD.tabs}>
          <TabsDemo />
        </Section>

        <Section id="dialog" title="Dialog" summary="Native <dialog> + showModal(): the browser supplies the focus trap, inert page and top layer. Focus returns to the trigger on close." keyboard={KEYBOARD.dialog}>
          <DialogDemo />
        </Section>

        <Section id="combobox" title="Combobox" summary="WAI-ARIA 1.2 list autocomplete. Focus stays in the input, the active option is announced through aria-activedescendant, and a live region reports the result count." keyboard={KEYBOARD.combobox}>
          <ComboboxDemo />
        </Section>
      </div>

      <section className="bcp-case" aria-labelledby="bcp-case-title">
        <h2 id="bcp-case-title" className="bcp-case__title">
          Engineering decisions
        </h2>
        <div className="bcp-case__grid">
          {DECISIONS.map(({ title, body }) => (
            <article key={title} className="bcp-case__item">
              <h3>{title}</h3>
              <p>{body}</p>
            </article>
          ))}
        </div>
        <ul className="bcp-case__tags" aria-label="Tech stack">
          {['React 19', 'CSS custom properties', 'Vite library mode', 'npm workspaces', 'Vitest', 'Testing Library', 'WAI-ARIA APG'].map(
            (tag) => (
              <li key={tag}>{tag}</li>
            )
          )}
        </ul>
      </section>
    </div>
  )
}

function Section({ id, title, summary, keyboard, children }) {
  return (
    <section className="bcp-section" aria-labelledby={`bcp-${id}`}>
      <div className="bcp-section__intro">
        <h2 id={`bcp-${id}`}>{title}</h2>
        <p>{summary}</p>
      </div>
      <div className="bcp-section__demo">{children}</div>
      {keyboard && (
        <table className="bcp-keys">
          <caption className="bc-visually-hidden">{title} keyboard interactions</caption>
          <thead>
            <tr>
              <th scope="col">Key</th>
              <th scope="col">Behavior</th>
            </tr>
          </thead>
          <tbody>
            {keyboard.map(([keys, behavior]) => (
              <tr key={keys}>
                <td>
                  {keys.split(' / ').map((key) => (
                    <kbd key={key}>{key}</kbd>
                  ))}
                </td>
                <td>{behavior}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  )
}

function ButtonDemo() {
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!saving) return undefined
    const timer = setTimeout(() => setSaving(false), 1600)
    return () => clearTimeout(timer)
  }, [saving])

  return (
    <div className="bcp-stack">
      <div className="bcp-row">
        <Button>Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="danger">Danger</Button>
        <Button disabled>Disabled</Button>
      </div>
      <div className="bcp-row">
        <Button size="sm" variant="secondary">
          Small
        </Button>
        <Button size="md" variant="secondary">
          Medium
        </Button>
        <Button size="lg" variant="secondary">
          Large
        </Button>
        <Button loading={saving} onClick={() => setSaving(true)}>
          Save changes
        </Button>
      </div>
    </div>
  )
}

function TabsDemo() {
  return (
    <Tabs defaultValue="overview">
      <TabList label="Trail details">
        <Tab value="overview">Overview</Tab>
        <Tab value="elevation">Elevation</Tab>
        <Tab value="permits" disabled>
          Permits
        </Tab>
        <Tab value="gear">Gear</Tab>
      </TabList>
      <TabPanel value="overview">170 km loop through France, Italy and Switzerland, usually walked in 10–11 stages.</TabPanel>
      <TabPanel value="elevation">≈ 10,000 m of cumulative ascent; the highest pass is the Fenêtre d’Arpette at 2,665 m.</TabPanel>
      <TabPanel value="permits">No permits required.</TabPanel>
      <TabPanel value="gear">Layers, poles, a light shell and refuge bookings made well ahead of July.</TabPanel>
    </Tabs>
  )
}

function DialogDemo() {
  const [open, setOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!deleting) return undefined
    const timer = setTimeout(() => {
      setDeleting(false)
      setOpen(false)
    }, 1200)
    return () => clearTimeout(timer)
  }, [deleting])

  return (
    <>
      <Button variant="danger" onClick={() => setOpen(true)}>
        Delete project…
      </Button>
      <Dialog
        open={open}
        onOpenChange={(next) => !deleting && setOpen(next)}
        title="Delete “Trailboard”?"
        description="The board and its history will be removed for every collaborator. This can’t be undone."
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="danger" loading={deleting} onClick={() => setDeleting(true)}>
              Delete project
            </Button>
          </>
        }
      />
    </>
  )
}

function ComboboxDemo() {
  const [trail, setTrail] = useState('tmb')
  return (
    <div className="bcp-stack">
      <Combobox
        label="Choose a trail"
        options={TRAIL_OPTIONS}
        value={trail}
        onValueChange={setTrail}
        placeholder="Search 12 long-distance trails"
      />
      <p className="bcp-output">
        value: <code>{JSON.stringify(trail)}</code>
      </p>
    </div>
  )
}

export default BasecampPage
