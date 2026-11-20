import { useActiveSection } from '../../hooks/useActiveSection'
import MoodToggle from '../MoodToggle/MoodToggle'
import './Navbar.css'

const NAV_LINKS = [
  { label: 'About', id: 'about' },
  { label: 'Projects', id: 'projects' },
  { label: 'Contact', id: 'contact' },
]
const SECTION_IDS = NAV_LINKS.map((link) => link.id)

function Navbar({ mood, onMoodChange }) {
  const active = useActiveSection(SECTION_IDS)

  return (
    <header className="navbar">
      <div className="navbar__inner">
        <a href="#home" className="navbar__logo" aria-label="Moodhoo Neehal, back to top">
          NM<span className="navbar__logo-dot">.</span>
        </a>

        <nav className="navbar__nav" aria-label="Primary">
          <ul>
            {NAV_LINKS.map((link) => (
              <li key={link.id}>
                <a href={`#${link.id}`} aria-current={active === link.id ? 'location' : undefined}>
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="navbar__actions">
          <MoodToggle mood={mood} onChange={onMoodChange} />
          <a href="mailto:neehal1002@gmail.com" className="navbar__cta">
            Say Hello
          </a>
        </div>
      </div>
    </header>
  )
}

export default Navbar
