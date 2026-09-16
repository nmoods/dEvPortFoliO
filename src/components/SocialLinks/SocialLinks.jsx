import './SocialLinks.css'

export const SOCIAL_LINKS = [
  { label: 'GitHub', href: 'https://github.com/your-username', icon: 'github' },
  { label: 'LinkedIn', href: 'https://linkedin.com/in/your-username', icon: 'linkedin' },
  { label: 'Email', href: 'mailto:you@example.com', icon: 'email' },
]

function SocialLinks({ className = '' }) {
  return (
    <ul className={`social-links${className ? ` ${className}` : ''}`}>
      {SOCIAL_LINKS.map((link) => (
        <li key={link.label}>
          <a href={link.href} target="_blank" rel="noreferrer" aria-label={link.label}>
            <SocialIcon name={link.icon} />
          </a>
        </li>
      ))}
    </ul>
  )
}

function SocialIcon({ name }) {
  switch (name) {
    case 'github':
      return (
        <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true">
          <path d="M12 .5C5.73.5.75 5.48.75 11.75c0 5.02 3.26 9.28 7.78 10.78.57.1.78-.25.78-.55v-2.15c-3.16.69-3.83-1.36-3.83-1.36-.52-1.31-1.26-1.66-1.26-1.66-1.03-.7.08-.69.08-.69 1.14.08 1.74 1.17 1.74 1.17 1.01 1.73 2.65 1.23 3.3.94.1-.73.4-1.23.72-1.51-2.52-.29-5.17-1.26-5.17-5.6 0-1.24.44-2.25 1.17-3.04-.12-.29-.51-1.45.11-3.02 0 0 .96-.31 3.14 1.16a10.9 10.9 0 0 1 5.72 0c2.18-1.47 3.14-1.16 3.14-1.16.62 1.57.23 2.73.11 3.02.73.79 1.17 1.8 1.17 3.04 0 4.35-2.66 5.31-5.19 5.59.41.35.77 1.04.77 2.1v3.11c0 .3.2.66.79.55A11.26 11.26 0 0 0 23.25 11.75C23.25 5.48 18.27.5 12 .5Z" />
        </svg>
      )
    case 'linkedin':
      return (
        <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true">
          <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.03-1.85-3.03-1.85 0-2.14 1.45-2.14 2.94v5.66H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29ZM5.34 7.43a2.07 2.07 0 1 1 0-4.14 2.07 2.07 0 0 1 0 4.14ZM7.12 20.45H3.56V9h3.56v11.45Z" />
        </svg>
      )
    case 'email':
      return (
        <svg
          viewBox="0 0 24 24"
          width="22"
          height="22"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          aria-hidden="true"
        >
          <rect x="2.5" y="4.5" width="19" height="15" rx="2.2" />
          <path d="m3.5 6 8.5 7 8.5-7" />
        </svg>
      )
    default:
      return null
  }
}

export default SocialLinks
