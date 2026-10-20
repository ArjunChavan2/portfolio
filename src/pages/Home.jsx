import { Link } from 'react-router-dom';
import resume from '../data/resume.json';
import { projects } from '../data/projects';
import ProjectCard from '../components/ProjectCard';
import BlurText from '../components/BlurText';
import AuroraBackground from '../components/AuroraBackground';
import AStarLive from '../components/AStarLive';
import ProjectThumb from '../components/ProjectThumb';
import { HEADSHOT, RESUME_PDF, contact, currentRole, currentOrg } from '../site';

const FOCUS = [
  { title: 'Full-stack product', body: 'React and Node.js applications taken from Figma spec to production, including build tooling and release process.' },
  { title: 'Robotics and autonomy', body: 'Path planning, PID control, and computer vision for navigation, from simulation to hardware in the water.' },
  { title: 'Technical leadership', body: 'Co-leading a 10-engineer team: sprint planning, code review with merge authority, and demos to stakeholders.' },
];

function LeadProject({ project }) {
  const live = project.media?.demo === 'astar';
  return (
    <Link to={`/projects/${project.slug}`} className="lead-card">
      <div className="lead-media">{live ? <AStarLive /> : <ProjectThumb project={project} />}</div>
      <div className="lead-body">
        <div className="card-meta">
          <span>{project.category}</span>
          <span>{project.date}</span>
        </div>
        <h3>{project.title}</h3>
        <p>{project.summary}</p>
        <ul className="tags">
          {project.stack.slice(0, 5).map((t) => <li key={t}>{t}</li>)}
        </ul>
        <span className="lead-cta">{live ? 'Open the interactive demo' : 'Read the project'}</span>
      </div>
    </Link>
  );
}

export default function Home() {
  const featured = projects.filter((p) => p.featured);
  const lead = featured.find((p) => p.media?.demo === 'astar') || featured[0];
  const rest = featured.filter((p) => p !== lead);
  return (
    <>
      <section className="hero">
        <AuroraBackground />
        <div className="container hero-grid">
          <div className="hero-copy">
            <p className="kicker">Computer Science · {resume.education.school}</p>
            <h1><BlurText text="Software engineer building products and the systems behind them." /></h1>
            <p className="lede">
              I'm {resume.name.split(' ')[0]}, a computer science student graduating {resume.education.date.replace('Expected ', '')}.
              I'm currently {currentRole.title} at {currentOrg}, co-leading the team building a healthcare scheduling platform.
              My work spans full-stack web, machine learning, and robotics.
            </p>
            <div className="hero-actions">
              <Link to="/projects" className="btn btn-primary">View projects</Link>
              <a href={RESUME_PDF} className="btn btn-secondary" target="_blank" rel="noreferrer">Download resume</a>
            </div>
            <ul className="hero-links">
              <li><a href={contact.linkedin} target="_blank" rel="noreferrer">LinkedIn</a></li>
              <li><a href={contact.github} target="_blank" rel="noreferrer">GitHub</a></li>
              <li><a href={`mailto:${contact.email}`}>{contact.email}</a></li>
            </ul>
          </div>
          <div className="hero-photo">
            <img src={HEADSHOT} alt={`Portrait of ${resume.name}`} width="360" height="480" />
          </div>
        </div>
      </section>

      <section className="section section-subtle">
        <div className="container">
          <ul className="focus-list">
            {FOCUS.map((f) => (
              <li key={f.title} className="focus-row">
                <h2>{f.title}</h2>
                <p>{f.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <h2>Featured projects</h2>
            <Link to="/projects" className="text-link">All projects →</Link>
          </div>
          {lead && <LeadProject project={lead} />}
          {rest.length > 0 && (
            <div className="card-grid pair">
              {rest.map((p) => <ProjectCard key={p.slug} project={p} />)}
            </div>
          )}
        </div>
      </section>

      <section className="section section-subtle">
        <div className="container">
          <div className="section-head">
            <h2>Where I've worked</h2>
            <Link to="/experience" className="text-link">Full experience →</Link>
          </div>
          <ol className="roles">
            {resume.experience.map((e) => (
              <li key={e.title + e.org} className="role">
                <span className="date">{e.date}</span>
                <div className="role-main">
                  <strong>{e.title}</strong>
                  <span>{e.org.split(',')[0]}</span>
                </div>
                {/present/i.test(e.date) && <span className="role-now">Current</span>}
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="closing">
            <AuroraBackground />
            <h2>Hiring for an internship or new-grad role?</h2>
            <p>I'd be glad to talk about how I can help your team.</p>
            <div className="closing-actions">
              <Link to="/contact" className="btn btn-primary">Get in touch</Link>
              <a href={RESUME_PDF} className="btn btn-secondary" target="_blank" rel="noreferrer">Download resume</a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
