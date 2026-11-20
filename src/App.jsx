import Navbar from './components/Navbar/Navbar'
import Hero from './components/Hero/Hero'
import About from './components/About/About'
import Projects from './components/Projects/Projects'
import Contact from './components/Contact/Contact'
import Footer from './components/Footer/Footer'
import TrailBackground from './components/TrailBackground/TrailBackground'
import { useTrailMood } from './hooks/useTrailMood'
import './App.css'

// Scroll effects (parallax, progress bar, reveals) are CSS scroll timelines: scrolling never re-renders React.
function App() {
  const [mood, setMood] = useTrailMood()

  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <div className="scroll-progress" aria-hidden="true" />
      <TrailBackground />
      <Navbar mood={mood} onMoodChange={setMood} />
      <main id="main">
        <Hero />
        <About />
        <Projects />
        <Contact />
      </main>
      <Footer />
    </>
  )
}

export default App
