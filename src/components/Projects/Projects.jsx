import './Projects.css'

const PROJECTS = [
  {
    name: 'Trailboard',
    checkpoint: 'Checkpoint 1 · Live demo',
    description:
      'A real-time collaborative whiteboard built on CRDTs: live cursors, multiplayer sticky notes, offline edits that merge on reconnect, and a hand-written sync protocol.',
    tags: ['React 19', 'Yjs / CRDT', 'IndexedDB', 'Real-time'],
    href: '#/trailboard',
  },
  {
    name: 'Basecamp UI',
    checkpoint: 'Checkpoint 2 · Design system',
    description:
      'An npm-ready React component library: two-tier design tokens, light and dark themes, and accessible Tabs, Dialog and Combobox built to the WAI-ARIA patterns and tested by keyboard.',
    tags: ['React 19', 'Design tokens', 'a11y', 'npm package'],
    href: '#/basecamp-ui',
  },
  {
    name: 'RAG Glass Box',
    checkpoint: 'Checkpoint 3 · AI',
    description:
      'Ask about hiking and training in Mauritius, and watch retrieval-augmented generation work: in-browser embeddings, hand-written vector, keyword and hybrid search with a metadata filter, the exact prompt, and a streamed answer from free LLMs with automatic failover and clickable citations.',
    tags: ['RAG', 'Embeddings', 'Free LLMs', 'Web Workers'],
    href: '#/rag',
  },
]

function Projects() {
  return (
    <section id="projects" className="projects">
      <div className="projects__inner">
        <p className="section-eyebrow">Aid Stations</p>
        <h2 className="section-title">Projects</h2>
        <p className="projects__intro">Three working demos. Each opens a page that explains how it is built.</p>

        <div className="projects__grid">
          {PROJECTS.map((project) => (
            <a key={project.name} href={project.href} className="project-card surface reveal">
              <span className="project-card__flag">{project.checkpoint}</span>
              <h3 className="project-card__name">{project.name}</h3>
              <p className="project-card__description">{project.description}</p>
              <ul className="project-card__tags">
                {project.tags.map((tag) => (
                  <li key={tag}>{tag}</li>
                ))}
              </ul>
              <span className="project-card__open">
                Open project <span className="project-card__arrow" aria-hidden="true">→</span>
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Projects
