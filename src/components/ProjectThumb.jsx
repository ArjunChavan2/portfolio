import { useEffect, useMemo, useRef } from 'react';
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
  const rect = (c, cls, i) => (
    <rect key={`${cls}${c}`} className={cls} x={c % w} y={(c / w) | 0} width="1" height="1" style={i === undefined ? undefined : { '--i': i }} />
  );
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="xMidYMid slice" className="thumb-svg" aria-hidden="true">
      <rect className="t-bg" width={w} height={h} />
      {closed.map((c) => rect(c, 't-closed'))}
      {Array.from(grid, (v, c) => (v === WALL ? rect(c, 't-wall') : null))}
      {path.map((c, i) => rect(c, 't-path', i))}
    </svg>
  );
}

// The poster, playing its clip muted while the card around it is hovered or focused.
// Nothing downloads until then, and it stays a still for visitors who prefer reduced motion.
function HoverVideo({ src, poster }) {
  const ref = useRef(null);
  useEffect(() => {
    const video = ref.current;
    const card = video?.closest('a') || video;
    if (!video || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const play = () => { video.play().catch(() => {}); };
    const stop = () => { video.pause(); video.currentTime = 0; };
    const events = [['mouseenter', play], ['focusin', play], ['mouseleave', stop], ['focusout', stop]];
    events.forEach(([e, f]) => card.addEventListener(e, f));
    return () => events.forEach(([e, f]) => card.removeEventListener(e, f));
  }, []);
  return <video ref={ref} src={src} poster={poster} muted loop playsInline preload="none" aria-hidden="true" />;
}

export default function ProjectThumb({ project }) {
  if (project.media?.demo === 'astar') return <div className="thumb"><AStarThumb /></div>;
  const clip = project.media?.type === 'video' ? project.media.src : project.media?.preview;
  if (project.media?.poster && clip) {
    return <div className="thumb"><HoverVideo src={clip} poster={project.media.poster} /></div>;
  }
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
