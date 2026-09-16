import MoodToggle from '../MoodToggle/MoodToggle'
import './Navbar.css'

const NAV_LINKS = [
  { label: 'About', href: '#about' },
  { label: 'Projects', href: '#projects' },
  { label: 'Contact', href: '#contact' },
]

function Navbar({ mood, onMoodChange }) {
  return (
    <header className="navbar">
      <div className="navbar__inner">
        <a href="#home" className="navbar__logo">
          YN<span className="navbar__logo-dot">.</span>
        </a>

        <nav className="navbar__nav" aria-label="Primary">
          <ul>
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <a href={link.href}>{link.label}</a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="navbar__actions">
          <MoodToggle mood={mood} onChange={onMoodChange} />

          <a href="mailto:you@example.com" className="navbar__cta">
            Say Hello
          </a>
        </div>
      </div>
    </header>
  )
}

export default Navbar
