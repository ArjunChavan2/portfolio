import { useState } from 'react';
import { projects } from '../data/projects';
import ProjectCard from '../components/ProjectCard';

export default function Projects() {
  const categories = ['All', ...new Set(projects.map((p) => p.category))];
  const [filter, setFilter] = useState('All');
  const shown = filter === 'All' ? projects : projects.filter((p) => p.category === filter);
  return (
    <section className="section page-top">
      <div className="container">
        <header className="page-head">
          <p className="kicker">Projects</p>
          <h1>Things I've built</h1>
          <p className="lede">
            Coursework, hackathons, and team builds across robotics, machine learning, hardware, and the web.
            Some include an interactive demo or video.
          </p>
        </header>
        <div className="filter-bar" role="tablist" aria-label="Filter projects by category">
          {categories.map((c) => (
            <button
              key={c}
              role="tab"
              aria-selected={filter === c}
              className={filter === c ? 'chip active' : 'chip'}
              onClick={() => setFilter(c)}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="card-grid">
          {shown.map((p) => <ProjectCard key={p.slug} project={p} />)}
        </div>
      </div>
    </section>
  );
}
