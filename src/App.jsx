import { useEffect, useMemo, useState } from 'react'
import Navbar from './components/Navbar/Navbar'
import Hero from './components/Hero/Hero'
import About from './components/About/About'
import Projects from './components/Projects/Projects'
import Contact from './components/Contact/Contact'
import TrailBackground from './components/TrailBackground/TrailBackground'
import TrailProgress from './components/TrailProgress/TrailProgress'
import BadgeTray from './components/BadgeTray/BadgeTray'
import Confetti from './components/Confetti/Confetti'
import { useScrollProgress } from './hooks/useScrollProgress'
import { useTrailCheckpoints } from './hooks/useTrailCheckpoints'
import { useTrailMood } from './hooks/useTrailMood'
import './App.css'

const CHECKPOINTS = [
  { id: 'home', label: 'Trailhead', icon: '🚩', toast: 'Trailhead — the journey begins' },
  { id: 'about', label: 'Basecamp', icon: '⛺', toast: 'Basecamp reached' },
  { id: 'projects', label: 'Aid Station', icon: '🗺️', toast: 'Aid station — checkpoints unlocked' },
  { id: 'contact', label: 'Summit', icon: '🏔️', toast: 'You reached the summit!' },
]

const CHECKPOINT_IDS = CHECKPOINTS.map((c) => c.id)

function App() {
  const { scrollY, progress } = useScrollProgress()
  const { unlocked, lastUnlocked } = useTrailCheckpoints(CHECKPOINT_IDS)
  const [showConfetti, setShowConfetti] = useState(false)
  const [mood, setMood] = useTrailMood()

  useEffect(() => {
    if (lastUnlocked !== 'contact') return undefined
    setShowConfetti(true)
    const timer = setTimeout(() => setShowConfetti(false), 4000)
    return () => clearTimeout(timer)
  }, [lastUnlocked])

  // Static markup is memoized so scroll-driven state updates don't re-render the whole page.
  const staticContent = useMemo(
    () => (
      <>
        <Navbar mood={mood} onMoodChange={setMood} />
        <main>
          <Hero />
          <About />
          <Projects />
          <Contact />
        </main>
      </>
    ),
    [mood, setMood]
  )

  return (
    <>
      <TrailBackground scrollY={scrollY} />
      {staticContent}
      <TrailProgress progress={progress} />
      <BadgeTray checkpoints={CHECKPOINTS} unlocked={unlocked} lastUnlocked={lastUnlocked} />
      <Confetti active={showConfetti} />
    </>
  )
}

export default App
