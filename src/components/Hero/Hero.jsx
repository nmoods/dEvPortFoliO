import { useEffect, useState } from 'react'
import SocialLinks from '../SocialLinks/SocialLinks'
import './Hero.css'

const ROLES = [
  'Full-Stack Developer',
  'Problem Solver',
  'Scrum Master',
]

function Hero() {
  const [roleIndex, setRoleIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setRoleIndex((prev) => (prev + 1) % ROLES.length)
    }, 2600)
    return () => clearInterval(interval)
  }, [])

  return (
    <section id="home" className="hero">
      <div className="hero__inner">
        <p className="hero__eyebrow">Hello  there</p>
        <h1 className="hero__name">Moodhoo Neehal</h1>
        <h2 className="hero__role" key={roleIndex}>
          {ROLES[roleIndex]}
        </h2>
        <p className="hero__bio">
          I build fast, accessible, and thoughtfully designed web
          applications — from idea to production. Currently focused on
          crafting clean front-end experiences backed by solid engineering.
        </p>
        <div className="hero__actions">
          <a href="#projects" className="btn btn--primary">
            View My Work
          </a>
          <a href="#contact" className="btn btn--ghost">
            Get In Touch
          </a>
        </div>
        <SocialLinks className="hero__socials" />
      </div>

      <a href="#about" className="hero__scroll" aria-label="Scroll down">
        <span className="hero__scroll-line" />
      </a>
    </section>
  )
}

export default Hero
