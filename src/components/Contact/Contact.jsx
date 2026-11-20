import { useEffect, useState } from 'react'
import SocialLinks from '../SocialLinks/SocialLinks'
import './Contact.css'

const EMAIL = 'neehal1002@gmail.com'

/** mailto only works with a desktop mail client, so the address is also one click away from the clipboard. */
function CopyEmail() {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return undefined
    const timer = setTimeout(() => setCopied(false), 2000)
    return () => clearTimeout(timer)
  }, [copied])

  return (
    <button
      type="button"
      className="btn btn--ghost contact__copy"
      onClick={() => navigator.clipboard?.writeText(EMAIL).then(() => setCopied(true), () => {})}
    >
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        {copied ? <path d="m5 12.5 4.5 4.5L19 7.5" /> : <path d="M9 9h10v11H9zM5 15V4h10" />}
      </svg>
      <span aria-live="polite">{copied ? 'Copied!' : EMAIL}</span>
    </button>
  )
}

function Contact() {
  return (
    <section id="contact" className="contact">
      <div className="contact__card surface reveal">
        <p className="section-eyebrow">Summit</p>
        <h2 className="section-title">Let&apos;s Connect</h2>
        <p className="contact__text">
          Got a project, an opportunity, or just want to trade trail recommendations? My inbox is always open.
        </p>
        <div className="contact__actions">
          <a href={`mailto:${EMAIL}`} className="btn btn--primary">
            Say Hello
          </a>
          <CopyEmail />
        </div>
        <SocialLinks className="contact__socials" />
      </div>
    </section>
  )
}

export default Contact
