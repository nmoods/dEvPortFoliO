import './Projects.css'

const PROJECTS = [
  {
    name: 'Project One',
    checkpoint: 'Checkpoint 1',
    description: 'A short description of what this project does and the problem it solves.',
    tags: ['React', 'Node.js'],
    href: '#',
  },
  {
    name: 'Project Two',
    checkpoint: 'Checkpoint 2',
    description: 'A short description of what this project does and the problem it solves.',
    tags: ['TypeScript', 'PostgreSQL'],
    href: '#',
  },
  {
    name: 'Project Three',
    checkpoint: 'Checkpoint 3',
    description: 'A short description of what this project does and the problem it solves.',
    tags: ['Vite', 'GraphQL'],
    href: '#',
  },
]

function Projects() {
  return (
    <section id="projects" className="projects">
      <div className="projects__inner">
        <p className="section-eyebrow">Aid Stations</p>
        <h2 className="section-title">Projects</h2>
        <p className="projects__intro">A few checkpoints along the way.</p>

        <div className="projects__grid">
          {PROJECTS.map((project) => (
            <a key={project.name} href={project.href} className="project-card">
              <span className="project-card__flag">🚩 {project.checkpoint}</span>
              <h3 className="project-card__name">{project.name}</h3>
              <p className="project-card__description">{project.description}</p>
              <ul className="project-card__tags">
                {project.tags.map((tag) => (
                  <li key={tag}>{tag}</li>
                ))}
              </ul>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Projects
