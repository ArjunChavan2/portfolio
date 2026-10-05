import { Link } from 'react-router-dom';
import resume from '../data/resume.json';
import { projects } from '../data/projects';
import ProjectCard from '../components/ProjectCard';
import { HEADSHOT, RESUME_PDF, contact, currentRole, currentOrg } from '../site';

const FOCUS = [
  { title: 'Full-stack product', body: 'React and Node.js applications taken from Figma spec to production, including build tooling and release process.' },
  { title: 'Robotics and autonomy', body: 'Path planning, PID control, and computer vision for navigation, from simulation to hardware in the water.' },
  { title: 'Technical leadership', body: 'Co-leading a 10-engineer team: sprint planning, code review with merge authority, and demos to stakeholders.' },
];

export default function Home() {
  const featured = projects.filter((p) => p.featured);
  return (
    <>
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-copy">
            <p className="kicker">Computer Science · {resume.education.school}</p>
            <h1>Software engineer building products and the systems behind them.</h1>
            <p className="lede">
              I'm {resume.name.split(' ')[0]}, a computer science student graduating {resume.education.date.replace('Expected ', '')}.
              I'm currently {currentRole.title} at {currentOrg}, co-leading the team building a healthcare scheduling platform.
              My work spans full-stack web, machine learning, and robotics.
            </p>
            <div className="hero-actions">
              <Link to="/projects" className="btn btn-primary">View projects</Link>
              <a href={RESUME_PDF} className="btn btn-secondary" target="_blank" rel="noreferrer">Download résumé</a>
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
          <div className="focus-grid">
            {FOCUS.map((f) => (
              <div key={f.title} className="focus">
                <h2>{f.title}</h2>
                <p>{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <div>
              <p className="kicker">Selected work</p>
              <h2>Featured projects</h2>
            </div>
            <Link to="/projects" className="text-link">All projects →</Link>
          </div>
          <div className="card-grid">
            {featured.map((p) => <ProjectCard key={p.slug} project={p} />)}
          </div>
        </div>
      </section>

      <section className="section section-subtle">
        <div className="container">
          <div className="section-head">
            <div>
              <p className="kicker">Experience</p>
              <h2>Where I've worked</h2>
            </div>
            <Link to="/experience" className="text-link">Full experience →</Link>
          </div>
          <ol className="role-list">
            {resume.experience.map((e) => (
              <li key={e.title + e.org}>
                <div>
                  <strong>{e.title}</strong>
                  <span className="muted"> · {e.org.split(',')[0]}</span>
                </div>
                <span className="date">{e.date}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section">
        <div className="container cta">
          <h2>Hiring for an internship or new-grad role?</h2>
          <p>I'd be glad to talk about how I can help your team.</p>
          <Link to="/contact" className="btn btn-primary">Get in touch</Link>
        </div>
      </section>
    </>
  );
}
