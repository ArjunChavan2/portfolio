import '../styles/project-detail.css';
import { lazy, Suspense } from 'react';
import { Link, useParams } from 'react-router-dom';
import { projects, projectBySlug } from '../data/projects';
import BlurText from '../components/BlurText';
import AuroraBackground from '../components/AuroraBackground';
import ProjectThumb from '../components/ProjectThumb';
import NotFound from './NotFound';

// Interactive demos, keyed by `media.demo` in projects.js. Register new demos here.
const DEMOS = {
  astar: lazy(() => import('../demos/AStarDemo')),
  fk: lazy(() => import('../demos/FkDemo')),
};

function Media({ media, title }) {
  if (!media) return null;
  if (media.type === 'video') {
    return (
      <section className="pd-band" aria-label={`${title} video`}>
        <div className="container">
          <figure className="pd-video">
            <div className="pd-video-frame">
              {/* key: a changed <source> src doesn't reload a reused <video>, so remount per project */}
              <video key={media.src} controls preload="metadata" poster={media.poster} playsInline>
                <source src={media.src} type="video/mp4" />
                Your browser can't play this video. <a href={media.src}>Download it instead.</a>
              </video>
            </div>
            {media.caption && <figcaption>{media.caption}</figcaption>}
          </figure>
        </div>
      </section>
    );
  }
  if (media.type === 'demo') {
    const Demo = DEMOS[media.demo];
    if (!Demo) return null;
    return (
      <section id="demo" className="pd-band pd-demo" aria-labelledby="demo-title">
        <div className="container">
          <div className="pd-demo-head">
            <h2 id="demo-title">Try it in the browser</h2>
            {media.blurb && <p>{media.blurb}</p>}
          </div>
          <Suspense fallback={<div className="demo-loading">Loading demo…</div>}>
            <Demo />
          </Suspense>
        </div>
      </section>
    );
  }
  return null;
}

// "Label: body" strings from projects.js become a titled step; anything else stays plain text.
function splitStep(s) {
  const at = s.indexOf(': ');
  if (at <= 0 || at >= 40) return [null, s];
  const body = s.slice(at + 2);
  return [s.slice(0, at), body.charAt(0).toUpperCase() + body.slice(1)];
}

export default function ProjectDetail() {
  const { slug } = useParams();
  const project = projectBySlug(slug);
  if (!project) return <NotFound />;

  const i = projects.indexOf(project);
  const next = projects[(i + 1) % projects.length];
  const { highlight, badge, links, media } = project;
  // The badge usually restates the headline stat (e.g. "1st Place"); show it only when it adds something.
  const showBadge = badge && !(highlight && badge.includes(highlight.value));
  const hasDemo = media?.type === 'demo' && DEMOS[media.demo];

  return (
    <article className="page-project">
      <header className="pd-head">
        <AuroraBackground />
        <div className="container">
          <Link to="/projects" className="pd-back">← All projects</Link>
          <div className="pd-head-grid">
            <div className="pd-head-copy">
              {showBadge && <p className="pd-badge">{badge}</p>}
              <h1 key={project.slug}><BlurText text={project.title} stagger={45} /></h1>
              <p className="pd-lede">{project.summary}</p>
              {(links.length > 0 || hasDemo) && (
                <div className="pd-actions">
                  {links.map((l, n) => (
                    <a
                      key={l.href}
                      href={l.href}
                      className={`btn ${n === 0 ? 'btn-primary' : 'btn-secondary'}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {l.label} <span aria-hidden="true">↗</span>
                    </a>
                  ))}
                  {hasDemo && (
                    <a href="#demo" className={`btn ${links.length ? 'btn-secondary' : 'btn-primary'}`}>
                      Try the live demo <span aria-hidden="true">↓</span>
                    </a>
                  )}
                </div>
              )}
            </div>

            <aside className="pd-aside" aria-label="Project facts">
              {highlight && (
                <div className="pd-stat">
                  <strong>{highlight.value}</strong>
                  <span>{highlight.label}</span>
                </div>
              )}
              <dl className="pd-facts">
                <div><dt>Area</dt><dd>{project.category}</dd></div>
                <div><dt>When</dt><dd>{project.date}</dd></div>
                {project.context && <div><dt>Context</dt><dd>{project.context}</dd></div>}
                {project.stack.length > 0 && (
                  <div>
                    <dt>Stack</dt>
                    <dd>
                      <ul className="tags">
                        {project.stack.map((s) => <li key={s}>{s}</li>)}
                      </ul>
                    </dd>
                  </div>
                )}
              </dl>
            </aside>
          </div>
        </div>
      </header>

      <Media media={media} title={project.title} />

      <div className="container pd-body">
        {project.howItWorks.length > 0 && (
          <section className="pd-section" aria-labelledby="how-title">
            <h2 id="how-title">How it works</h2>
            <ol className="pd-steps">
              {project.howItWorks.map((s, n) => {
                const [label, body] = splitStep(s);
                return (
                  <li key={s} className="pd-step">
                    <span className="pd-step-n" aria-hidden="true">{String(n + 1).padStart(2, '0')}</span>
                    {label && <h3>{label}</h3>}
                    <p>{body}</p>
                  </li>
                );
              })}
            </ol>
          </section>
        )}

        {project.tech.length > 0 && (
          <section className="pd-section" aria-labelledby="tech-title">
            <h2 id="tech-title">Built with</h2>
            <dl className="pd-tech">
              {project.tech.map((t) => (
                <div key={t.name} className="pd-tech-row">
                  <dt>{t.name}</dt>
                  <dd>{t.use}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        <section className="pd-section" aria-labelledby="did-title">
          <h2 id="did-title">What I did</h2>
          <div className="pd-did">
            <ul className="pd-highlights">
              {project.bullets.map((b) => <li key={b}>{b}</li>)}
            </ul>
            {project.skills.length > 0 && (
              <div className="pd-skills">
                <h3>Skills used</h3>
                <ul className="tags">
                  {project.skills.map((s) => <li key={s}>{s}</li>)}
                </ul>
              </div>
            )}
          </div>
        </section>

        {next !== project && (
          <nav className="pd-next-wrap" aria-label="Next project">
            <div className="pd-next-head">
              <h2>Next project</h2>
              <Link to="/projects" className="text-link">All projects →</Link>
            </div>
            <Link to={`/projects/${next.slug}`} className="pd-next">
              <div className="pd-next-media"><ProjectThumb project={next} /></div>
              <div className="pd-next-body">
                <span className="pd-next-meta">{next.category}, {next.date}</span>
                <h3>{next.title}</h3>
                <p>{next.summary}</p>
                <span className="pd-next-cta">Read the project →</span>
              </div>
            </Link>
          </nav>
        )}
      </div>
    </article>
  );
}
