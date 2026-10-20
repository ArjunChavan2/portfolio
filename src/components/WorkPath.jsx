import '../styles/workpath.css';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { buildGraph, searchGraph, VIEW } from '../demos/workGraph';

// "How my work connects": every project, role, shared skill and category as a
// graph. Pick two ends (or click a node) and the same A* idea as the path
// planner demo searches it live: frontier, explored nodes, then the path. The
// result reads as a chain with links, and can filter the project list below.
const DEFAULT_FROM = 'r:0';
const DEFAULT_TO = 'p:astar-path-planner';
const KIND_NAME = { role: 'Role', project: 'Project', skill: 'Skill', category: 'Category' };

function labelAnchor(n) {
  const c = Math.cos(n.angle);
  if (c > 0.25) return { x: n.x + 14, y: n.y + 4, anchor: 'start' };
  if (c < -0.25) return { x: n.x - 14, y: n.y + 4, anchor: 'end' };
  return Math.sin(n.angle) < 0 ? { x: n.x, y: n.y - 16, anchor: 'middle' } : { x: n.x, y: n.y + 24, anchor: 'middle' };
}

export default function WorkPath({ onShowProjects }) {
  const graph = useMemo(() => buildGraph(), []);
  const { nodes, edges } = graph;
  const [from, setFrom] = useState(DEFAULT_FROM);
  const [to, setTo] = useState(DEFAULT_TO);
  const [state, setState] = useState({}); // id -> 'open' | 'closed'
  const [path, setPath] = useState([]);
  const [pathShown, setPathShown] = useState(0);
  const [stats, setStats] = useState(null);
  const [hover, setHover] = useState(null);
  const timer = useRef(0);
  const root = useRef(null);
  const started = useRef(false);

  const reduce = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const run = (a, b) => {
    clearInterval(timer.current);
    const r = searchGraph(graph, a, b);
    const total = nodes.size;
    const finalState = {};
    for (const [kind, id] of r.events) finalState[id] = kind === 1 ? 'closed' : finalState[id] || 'open';
    const done = () => {
      setState(finalState);
      setPath(r.path);
      setPathShown(r.path.length);
      setStats({ expanded: r.expanded, total, hops: r.path.length - 1 });
    };
    setStats(null);
    setPath(r.path);
    setPathShown(0);
    if (reduce) { done(); return; }
    let i = 0;
    let shown = 0;
    const live = {};
    setState({});
    timer.current = setInterval(() => {
      if (i < r.events.length) {
        for (let k = 0; k < 2 && i < r.events.length; k++, i++) {
          const [kind, id] = r.events[i];
          live[id] = kind === 1 ? 'closed' : live[id] || 'open';
        }
        setState({ ...live });
      } else if (shown < r.path.length) {
        shown += 1;
        setPathShown(shown);
      } else {
        clearInterval(timer.current);
        done();
      }
    }, 70);
  };

  // Run the default search once, the first time the graph scrolls into view.
  useEffect(() => {
    const el = root.current;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started.current) {
        started.current = true;
        run(from, to);
        io.disconnect();
      }
    }, { threshold: 0.3 });
    io.observe(el);
    return () => { io.disconnect(); clearInterval(timer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const go = (a, b) => { setFrom(a); setTo(b); started.current = true; run(a, b); };
  const onNode = (id) => { if (id !== from) go(from, id); };

  const onPath = new Set(path.slice(0, pathShown));
  const pathEdges = new Set();
  for (let i = 1; i < pathShown; i++) pathEdges.add([path[i - 1], path[i]].sort().join('|'));
  const pathProjects = path.map((id) => nodes.get(id)).filter((n) => n.kind === 'project');

  const options = (kind) => [...nodes.values()].filter((n) => n.kind === kind).sort((a, b) => a.title.localeCompare(b.title));
  const picker = (value, set, other) => (
    <select value={value} onChange={(e) => { set(e.target.value); }}>
      {['role', 'project', 'skill', 'category'].map((k) => (
        <optgroup key={k} label={`${KIND_NAME[k]}s`}>
          {options(k).map((n) => <option key={n.id} value={n.id} disabled={n.id === other}>{n.title}</option>)}
        </optgroup>
      ))}
    </select>
  );

  return (
    <div className="wp" ref={root}>
      <form className="wp-controls" onSubmit={(e) => { e.preventDefault(); go(from, to); }}>
        <label>From {picker(from, setFrom, to)}</label>
        <label>To {picker(to, setTo, from)}</label>
        <button type="submit" className="btn btn-primary">Find the path</button>
      </form>

      <div className="wp-stage">
        <svg viewBox={`0 0 ${VIEW.w} ${VIEW.h}`} className="wp-svg" aria-hidden="true">
          <g className="wp-edges">
            {edges.map(([a, b]) => {
              const na = nodes.get(a);
              const nb = nodes.get(b);
              const key = [a, b].sort().join('|');
              const lit = pathEdges.has(key);
              const touched = state[a] === 'closed' && state[b];
              return (
                <line
                  key={key}
                  x1={na.x} y1={na.y} x2={nb.x} y2={nb.y}
                  className={`wp-edge${na.kind === 'category' || nb.kind === 'category' ? ' hub' : ''}${lit ? ' on-path' : touched ? ' touched' : ''}`}
                />
              );
            })}
          </g>
          {[...nodes.values()].map((n) => {
            const s = state[n.id];
            const cls = ['wp-node', `k-${n.kind}`, s, onPath.has(n.id) && 'on-path', n.id === from && 'is-from', n.id === to && 'is-to', hover === n.id && 'is-hover']
              .filter(Boolean).join(' ');
            const ring = n.kind === 'project' || n.kind === 'role';
            const showLabel = ring || n.kind === 'category' || onPath.has(n.id) || hover === n.id;
            const lab = ring ? labelAnchor(n) : { x: n.x, y: n.y - (n.kind === 'category' ? 14 : 11), anchor: 'middle' };
            return (
              <g
                key={n.id}
                className={cls}
                onClick={() => onNode(n.id)}
                onMouseEnter={() => setHover(n.id)}
                onMouseLeave={() => setHover(null)}
              >
                <title>{`${KIND_NAME[n.kind]}: ${n.title}`}</title>
                <circle cx={n.x} cy={n.y} r="22" className="wp-hit" />
                {n.kind === 'category'
                  ? <rect x={n.x - 6} y={n.y - 6} width="12" height="12" rx="2" className="wp-dot" transform={`rotate(45 ${n.x} ${n.y})`} />
                  : <circle cx={n.x} cy={n.y} r={ring ? 8 : 5} className="wp-dot" />}
                {showLabel && (
                  <text x={lab.x} y={lab.y} textAnchor={lab.anchor} className="wp-label">{n.label}</text>
                )}
              </g>
            );
          })}
        </svg>
        <ul className="wp-legend" aria-hidden="true">
          <li><span className="wp-key k-item" />Project or role</li>
          <li><span className="wp-key k-skill" />Shared skill</li>
          <li><span className="wp-key k-category" />Category</li>
          <li><span className="wp-key k-frontier" />Frontier</li>
          <li><span className="wp-key k-explored" />Explored</li>
          <li><span className="wp-key k-path" />Path</li>
        </ul>
      </div>

      <div className="wp-result" aria-live="polite">
        {stats && path.length > 0 && (
          <>
            <p className="wp-stats">
              A* explored {stats.expanded} of {stats.total} nodes and found a path of {stats.hops} hops.
            </p>
            <ol className="wp-chain">
              {path.map((id) => {
                const n = nodes.get(id);
                return (
                  <li key={id} className={`k-${n.kind}`}>
                    <span className="wp-kind">{KIND_NAME[n.kind]}</span>
                    {n.href ? <Link to={n.href}>{n.title}</Link> : <span>{n.title}</span>}
                  </li>
                );
              })}
            </ol>
            {pathProjects.length > 0 && onShowProjects && (
              <button type="button" className="btn btn-secondary wp-show" onClick={() => onShowProjects(pathProjects.map((p) => p.slug))}>
                Show {pathProjects.length === 1 ? 'this project' : `these ${pathProjects.length} projects`} in the list
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
