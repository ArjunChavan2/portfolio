import { lazy, Suspense } from 'react';
import { Link, useParams } from 'react-router-dom';
import { projects, projectBySlug } from '../data/projects';
import NotFound from './NotFound';

const DEMOS = {
  astar: lazy(() => import('../demos/AStarDemo')),
};

function Media({ media, title }) {
  if (!media) return null;
  if (media.type === 'video') {
    return (
      <figure className="media">
        <video controls preload="metadata" poster={media.poster} playsInline>
          <source src={media.src} type="video/mp4" />
          Your browser can't play this video. <a href={media.src}>Download it instead.</a>
        </video>
        {media.caption && <figcaption>{media.caption}</figcaption>}
      </figure>
    );
  }
  if (media.type === 'demo') {
    const Demo = DEMOS[media.demo];
    return (
      <section className="media" aria-label={`${title} interactive demo`}>
        <div className="media-head">
          <h2>Try it</h2>
          <p>
            A browser reimplementation of the planner. Change the map, then compare how many cells A* expands
            against uninformed Dijkstra search for the same shortest path.
          </p>
        </div>
        <Suspense fallback={<div className="demo-loading">Loading demo…</div>}>
          <Demo />
        </Suspense>
      </section>
    );
  }
  return null;
}

export default function ProjectDetail() {
  const { slug } = useParams();
  const project = projectBySlug(slug);
  if (!project) return <NotFound />;

  const i = projects.indexOf(project);
  const next = projects[(i + 1) % projects.length];

  return (
    <article className="section page-top">
      <div className="container narrow">
        <Link to="/projects" className="back-link">← All projects</Link>
        <header className="project-head">
          <p className="kicker">{project.category}</p>
          <h1>{project.title}</h1>
          <p className="lede">{project.summary}</p>
          {project.badge && <p className="badge">{project.badge}</p>}
          <dl className="facts">
            <div><dt>When</dt><dd>{project.date}</dd></div>
            {project.context && <div><dt>Context</dt><dd>{project.context}</dd></div>}
            <div><dt>Stack</dt><dd>{project.stack.join(', ')}</dd></div>
          </dl>
          {project.links.length > 0 && (
            <div className="project-links">
              {project.links.map((l) => (
                <a key={l.href} href={l.href} className="btn btn-secondary btn-sm" target="_blank" rel="noreferrer">{l.label} ↗</a>
              ))}
            </div>
          )}
        </header>
      </div>

      <div className="container">
        <Media media={project.media} title={project.title} />
      </div>

      <div className="container narrow">
        <section className="project-section">
          <h2>What I did</h2>
          <ul className="highlights">
            {project.bullets.map((b) => <li key={b}>{b}</li>)}
          </ul>
        </section>
        {project.skills.length > 0 && (
          <section className="project-section">
            <h2>Skills</h2>
            <ul className="tags">
              {project.skills.map((s) => <li key={s}>{s}</li>)}
            </ul>
          </section>
        )}
        <nav className="next-project" aria-label="Next project">
          <span className="muted">Next project</span>
          <Link to={`/projects/${next.slug}`}>{next.title} →</Link>
        </nav>
      </div>
    </article>
  );
}
