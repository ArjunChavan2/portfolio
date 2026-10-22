import { Link } from 'react-router-dom';
import Keyterms from '../components/Keyterms';
import resume from '../data/resume.json';
import { projects } from '../data/projects';
import ProjectCard from '../components/ProjectCard';
import AuroraBackground from '../components/AuroraBackground';
import AStarLive from '../components/AStarLive';
import ProjectThumb from '../components/ProjectThumb';
import { HEADSHOT, RESUME_PDF, contact, currentRole, currentOrg } from '../site';
import { isCurrent } from '../dates';

const FOCUS = [
  { title: 'Full-stack product', body: 'React and Node.js applications taken from Figma spec to production, including build tooling and release process.' },
  { title: 'Robotics and autonomy', body: 'Path planning, PID control, and computer vision for navigation, from simulation to hardware in the water.' },
  { title: 'Technical leadership', body: 'Co-led a 10-engineer team: sprint planning, code review with merge authority, and demos to stakeholders.' },
];

function LeadProject({ project }) {
  const live = project.media?.type === 'demo';
  return (
    <Link to={`/projects/${project.slug}`} className="lead-card">
      <div className="lead-media"><ProjectThumb project={project} /></div>
      <div className="lead-body">
        <div className="card-meta">
          <span>{project.category}</span>
          <span>{project.date}</span>
        </div>
        <h3>{project.title}</h3>
        <p><Keyterms text={project.summary} /></p>
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
  const lead = featured.find((p) => p.media?.demo === 'fk') || featured[0];
  const rest = featured.filter((p) => p !== lead);
  const astar = projects.find((p) => p.media?.demo === 'astar');
  const now = isCurrent(currentRole.date);
  // The platform describes Altheros only; a newer role synced to the top gets the plain sentence.
  const work = currentOrg.startsWith('Altheros')
    ? `, co-leading the team ${now ? 'building' : 'that built'} a healthcare scheduling platform`
    : '';
  return (
    <>
      <section className="hero">
        <AuroraBackground />
        <div className="container">
          <p className="kicker">Computer Science · {resume.education.school}</p>
          <h1>Software engineer building products and the systems behind them.</h1>
        </div>
        <div className="container hero-grid">
          <div className="hero-copy">
            <p className="lede">
              I'm {resume.name.split(' ')[0]}, a computer science student graduating {resume.education.date.replace('Expected ', '')}.
              {` ${now ? "I'm currently" : 'Most recently I was'} ${currentRole.title} at ${currentOrg}${work}. `}
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
          {astar && (
            <Link to={`/projects/${astar.slug}`} className="hero-live">
              <AStarLive />
              <span className="hero-live-cap"><span className="hero-live-dot" aria-hidden="true" />Live: the A* planner from my robotics runtime →</span>
            </Link>
          )}
          <div className="hero-photo">
            <img src={HEADSHOT} alt={`Portrait of ${resume.name}`} width="360" height="480" />
          </div>
        </div>
      </section>

      <section className="section on-dark">
        <div className="container">
          <div className="section-head">
            <h2>Selected work</h2>
            <Link to="/projects" className="text-link">All projects →</Link>
          </div>
          <div className="bento">
            {lead && <LeadProject project={lead} />}
            {rest.slice(0, 2).map((p) => <ProjectCard key={p.slug} project={p} />)}
            <ul className="focus-tiles">
              {FOCUS.map((f, i) => (
                <li key={f.title} className="focus-tile">
                  <span className="focus-num">0{i + 1}</span>
                  <h3>{f.title}</h3>
                  <p>{f.body}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="section section-subtle">
        <div className="container split">
          <div className="split-head">
            <h2>Where I've worked</h2>
            <p>From ML research at MIT Lincoln Lab to leading a product team.</p>
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
                {isCurrent(e.date) && <span className="role-now">Current</span>}
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="closing">
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
