import { Suspense, lazy, useEffect } from 'react'
import App from './App'
import { useHashRoute } from './hooks/useHashRoute'

// Each project page is its own lazy chunk, so the portfolio bundle doesn't pay for it.
const PROJECT_ROUTES = [
  { prefix: '#/trailboard', name: 'Trailboard', Page: lazy(() => import('./projects/trailboard/TrailboardPage')) },
  { prefix: '#/basecamp-ui', name: 'Basecamp UI', Page: lazy(() => import('./projects/basecamp-ui/BasecampPage')) },
]

const PORTFOLIO_TITLE = document.title

function Root() {
  const hash = useHashRoute()
  const route = PROJECT_ROUTES.find(({ prefix }) => hash.startsWith(prefix))

  // Coming back from a project page: the section anchor did not exist when the hash changed.
  useEffect(() => {
    if (route) return
    document.title = PORTFOLIO_TITLE
    const sectionId = window.location.hash.slice(1)
    if (sectionId) document.getElementById(sectionId)?.scrollIntoView()
  }, [route])

  if (route) {
    const { Page, name } = route
    return (
      <Suspense fallback={<p style={{ padding: 48, textAlign: 'center' }}>Loading {name}…</p>}>
        <Page />
      </Suspense>
    )
  }

  return <App />
}

export default Root
