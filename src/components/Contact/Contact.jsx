import SocialLinks from '../SocialLinks/SocialLinks'
import './Contact.css'

function Contact() {
  return (
    <section id="contact" className="contact">
      <div className="contact__card">
        <span className="contact__flag" aria-hidden="true">
          🏔️
        </span>
        <p className="section-eyebrow">Summit</p>
        <h2 className="section-title">Let&apos;s Connect</h2>
        <p className="contact__text">
          Got a project, an opportunity, or just want to trade trail recommendations? My inbox is
          always open.
        </p>
        <a href="mailto:you@example.com" className="btn btn--primary">
          Say Hello
        </a>
        <SocialLinks className="contact__socials" />
      </div>
    </section>
  )
}

export default Contact
