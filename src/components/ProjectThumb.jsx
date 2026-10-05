import { useMemo } from 'react';
import { mazeGrid, search, WALL } from '../demos/astar';

// A static, deterministic render of the planner for the A* card.
function AStarThumb() {
  const w = 41;
  const h = 25;
  const { grid, path, closed } = useMemo(() => {
    const g = mazeGrid(w, h, 11);
    const s = w + 1;
    const t = (h - 2) * w + (w - 2);
    g[s] = 0;
    g[t] = 0;
    const r = search(g, w, h, s, t, 'astar');
    return { grid: g, path: r.path, closed: r.events.filter(([k]) => k === 1).map(([, c]) => c) };
  }, []);
  const rect = (c, cls) => <rect key={`${cls}${c}`} className={cls} x={c % w} y={(c / w) | 0} width="1" height="1" />;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="xMidYMid slice" className="thumb-svg" aria-hidden="true">
      <rect className="t-bg" width={w} height={h} />
      {closed.map((c) => rect(c, 't-closed'))}
      {Array.from(grid, (v, c) => (v === WALL ? rect(c, 't-wall') : null))}
      {path.map((c) => rect(c, 't-path'))}
    </svg>
  );
}

export default function ProjectThumb({ project }) {
  if (project.media?.demo === 'astar') return <div className="thumb"><AStarThumb /></div>;
  if (project.media?.poster) {
    return (
      <div className="thumb">
        <img src={project.media.poster} alt="" loading="lazy" />
      </div>
    );
  }
  return (
    <div className="thumb thumb-plain">
      {project.highlight ? (
        <div className="thumb-stat">
          <strong>{project.highlight.value}</strong>
          <span>{project.highlight.label}</span>
        </div>
      ) : (
        <span className="thumb-cat">{project.category}</span>
      )}
    </div>
  );
}
