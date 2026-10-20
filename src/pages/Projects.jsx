import '../styles/projects.css';
import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { projects } from '../data/projects';
import ProjectThumb from '../components/ProjectThumb';
import BlurText from '../components/BlurText';
import AuroraBackground from '../components/AuroraBackground';
import WorkPath from '../components/WorkPath';

const mediaLabel = (p) => (p.media?.type === 'demo' ? 'Interactive demo' : p.media?.type === 'video' ? 'Video' : null);

// The lead of any filtered set: the live demo if it's in the set, then a featured project, then the newest.
function pickLead(set) {
  return set.find((p) => p.featured && p.media?.demo === 'astar') || set.find((p) => p.featured) || set[0];
}

const years = projects.flatMap((p) => (p.date.match(/\d{4}/g) || []).map(Number));
const span = years.length ? `${Math.min(...years)} to ${Math.max(...years)}` : '';

function LeadProject({ project }) {
  const tag = mediaLabel(project);
  return (
    <Link to={`/projects/${project.slug}`} className="lead-card pp-lead">
      <div className="lead-media"><ProjectThumb project={project} /></div>
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
        <span className="lead-cta">
          {project.media?.type === 'demo' ? 'Open the interactive demo' : tag === 'Video' ? 'Watch the video' : 'Read the project'}
        </span>
      </div>
    </Link>
  );
}

function ProjectRow({ project }) {
  const tag = mediaLabel(project);
  return (
    <li>
      <Link to={`/projects/${project.slug}`} className="pp-row">
        <div className="pp-row-thumb"><ProjectThumb project={project} /></div>
        <div className="pp-row-main">
          <h3>{project.title}</h3>
          <p>{project.summary}</p>
          <ul className="tags">
            {project.stack.slice(0, 4).map((t) => <li key={t}>{t}</li>)}
          </ul>
        </div>
        <div className="pp-row-meta">
          <span className="date">{project.date}</span>
          <span className="pp-row-cat">{project.category}</span>
          {tag && <span className="pill">{tag}</span>}
        </div>
      </Link>
    </li>
  );
}

export default function Projects() {
  const categories = ['All', ...new Set(projects.map((p) => p.category))];
  const count = (c) => (c === 'All' ? projects.length : c === 'On your path' ? (pathSlugs || []).length : projects.filter((p) => p.category === c).length);
  const [filter, setFilter] = useState('All');
  const [pathSlugs, setPathSlugs] = useState(null);
  const listTitle = useRef(null);
  const PATH = 'On your path';
  const shown = filter === 'All'
    ? projects
    : filter === PATH
      ? projects.filter((p) => pathSlugs?.includes(p.slug))
      : projects.filter((p) => p.category === filter);
  const showPath = (slugs) => {
    setPathSlugs(slugs);
    setFilter(PATH);
    listTitle.current?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  };
  const lead = pickLead(shown);
  const rest = shown.filter((p) => p !== lead);

  return (
    <div className="page-projects">
      <section className="pp-hero">
        <AuroraBackground />
        <div className="container">
          <p className="pp-span">{projects.length} projects, {span}</p>
          <h1><BlurText text="Things I've built, in software and in hardware." /></h1>
          <p className="lede">
            Coursework, hackathons, and team builds across robotics, machine learning, hardware, and the web.
            Some include an interactive demo or video.
          </p>
        </div>
      </section>

      <section className="pp-connect" aria-labelledby="pp-connect-title">
        <div className="container">
          <div className="section-head pp-head">
            <h2 id="pp-connect-title">How my work connects</h2>
          </div>
          <p className="pp-connect-lede">
            Every project and role, linked by the skills they share and the area they sit in. Pick a start and an end,
            or click any name, and A* searches this map the same way the path planner searches a maze.
          </p>
          <WorkPath onShowProjects={showPath} />
        </div>
      </section>

      <section className="pp-body" aria-labelledby="pp-list-title">
        <div className="container">
          <div className="pp-filter" role="group" aria-label="Filter projects by category">
            {[...categories, ...(pathSlugs ? [PATH] : [])].map((c) => (
              <button
                key={c}
                type="button"
                aria-pressed={filter === c}
                className="pp-chip"
                onClick={() => setFilter(c)}
              >
                {c}
                <span className="pp-chip-count">{count(c)}</span>
              </button>
            ))}
          </div>

          <div className="section-head pp-head">
            <h2 id="pp-list-title" ref={listTitle}>{filter === 'All' ? 'All projects' : filter === PATH ? 'Projects on your path' : filter}</h2>
            <p className="pp-count" aria-live="polite">
              {shown.length === projects.length
                ? `${shown.length} projects, newest first`
                : `${shown.length} of ${projects.length} projects`}
            </p>
          </div>

          {lead && <LeadProject key={lead.slug} project={lead} />}
          {rest.length > 0 && (
            <ul className="pp-list">
              {rest.map((p) => <ProjectRow key={p.slug} project={p} />)}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
