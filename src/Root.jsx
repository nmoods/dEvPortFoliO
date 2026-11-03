import { Suspense, lazy, useEffect } from 'react'
import App from './App'
import { useHashRoute } from './hooks/useHashRoute'

const TrailboardPage = lazy(() => import('./projects/trailboard/TrailboardPage'))

const TRAILBOARD_ROUTE = '#/trailboard'
const PORTFOLIO_TITLE = document.title

function Root() {
  const hash = useHashRoute()
  const onTrailboard = hash.startsWith(TRAILBOARD_ROUTE)

  // Coming back from a project page: the section anchor did not exist when the hash changed.
  useEffect(() => {
    if (onTrailboard) return
    document.title = PORTFOLIO_TITLE
    const sectionId = window.location.hash.slice(1)
    if (sectionId) document.getElementById(sectionId)?.scrollIntoView()
  }, [onTrailboard])

  if (onTrailboard) {
    return (
      <Suspense fallback={<p style={{ padding: 48, textAlign: 'center' }}>Loading Trailboard…</p>}>
        <TrailboardPage />
      </Suspense>
    )
  }

  return <App />
}

export default Root
