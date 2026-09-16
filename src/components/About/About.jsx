import './About.css'

function About() {
  return (
    <section id="about" className="about">
      <div className="about__card">
        <p className="section-eyebrow">Basecamp</p>
        <h2 className="section-title">About Me</h2>
        <p className="about__text">
          When I&apos;m not shipping code, I&apos;m out logging kilometres on singletrack. Trail
          running keeps me level-headed and reminds me that steady, consistent effort beats
          sprinting every time — I bring that same mindset to engineering: plan the route, watch
          your footing, and keep moving forward.
        </p>
        <ul className="about__stats">
          <li>
            <span className="about__stat-icon">🏔️</span>
            <span>Always chasing the next trail and the next stack</span>
          </li>
          <li>
            <span className="about__stat-icon">🧭</span>
            <span>Comfortable navigating ambiguous problems</span>
          </li>
          <li>
            <span className="about__stat-icon">🤝</span>
            <span>Runs well with a team, solo when it counts</span>
          </li>
        </ul>
      </div>
    </section>
  )
}

export default About
