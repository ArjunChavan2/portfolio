import '../styles/workpath.css';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { buildGraph, searchGraph, edgePath, COLUMNS, PILL_H } from '../demos/workGraph';

// "How my work connects": roles, shared skills, projects and their areas laid
// out in four columns. Pick two ends (or click a start, then an end) and the
// same A* idea as the path planner demo searches it live: frontier, explored
// nodes, then the path. Links are weighted by evidence (see workGraph.js), so
// the path is the most relevant connection, and each step quotes the resume
// line behind it. The path can also filter the project list.
const DEFAULT_FROM = 'r:0';
const DEFAULT_TO = 'p:astar-path-planner';
const KIND_NAME = { role: 'Role', project: 'Project', skill: 'Skill', category: 'Area' };

export default function WorkPath({ onShowProjects }) {
  const graph = useMemo(() => buildGraph(), []);
  const { nodes, edges, view } = graph;
  const [from, setFrom] = useState(DEFAULT_FROM);
  const [to, setTo] = useState(DEFAULT_TO);
  const [state, setState] = useState({}); // id -> 'open' | 'closed'
  const [path, setPath] = useState([]);
  const [pathShown, setPathShown] = useState(0);
  const [stats, setStats] = useState(null);
  const [hover, setHover] = useState(null);
  const [picking, setPicking] = useState('from'); // what the next click on the map sets
  const timer = useRef(0);
  const root = useRef(null);
  const started = useRef(false);

  const reduce = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const run = (a, b) => {
    clearInterval(timer.current);
    const r = searchGraph(graph, a, b);
    const finalState = {};
    for (const [kind, id] of r.events) finalState[id] = kind === 1 ? 'closed' : finalState[id] || 'open';
    const done = () => {
      setState(finalState);
      setPathShown(r.path.length);
      setStats({ expanded: r.expanded, total: nodes.size, hops: r.path.length - 1 });
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

  // Run the default search once, the first time the map scrolls into view.
  useEffect(() => {
    const el = root.current;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started.current) {
        started.current = true;
        run(DEFAULT_FROM, DEFAULT_TO);
        io.disconnect();
      }
    }, { threshold: 0.3 });
    io.observe(el);
    return () => { io.disconnect(); clearInterval(timer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const go = (a, b) => { setFrom(a); setTo(b); setPicking('from'); started.current = true; run(a, b); };
  // First click picks the start and clears the map; the second picks the end and searches.
  const onNode = (id) => {
    if (picking === 'from') {
      clearInterval(timer.current);
      started.current = true;
      setFrom(id);
      setState({});
      setPath([]);
      setPathShown(0);
      setStats(null);
      setPicking('to');
    } else if (id !== from) {
      go(from, id);
    }
  };
  const linkTo = (a, b) => nodes.get(a).adj.find((e) => e.id === b);

  const shownPath = path.slice(0, pathShown);
  const onPath = new Set(shownPath);
  const pathEdges = new Set();
  for (let i = 1; i < shownPath.length; i++) pathEdges.add([shownPath[i - 1], shownPath[i]].sort().join('|'));
  const pathProjects = stats ? path.map((id) => nodes.get(id)).filter((n) => n.kind === 'project') : [];
  // Hovering a node lights its own connections, so a busy column stays readable.
  const hoverEdges = new Set(hover ? nodes.get(hover).adj.map((e) => [hover, e.id].sort().join('|')) : []);

  const options = (kind) => [...nodes.values()].filter((n) => n.kind === kind).sort((a, b) => a.title.localeCompare(b.title));
  const picker = (value, set, other) => (
    <select value={value} onChange={(e) => set(e.target.value)}>
      {['role', 'project', 'skill', 'category'].map((k) => (
        <optgroup key={k} label={k === 'category' ? 'Areas' : `${KIND_NAME[k]}s`}>
          {options(k).map((n) => <option key={n.id} value={n.id} disabled={n.id === other}>{n.title}</option>)}
        </optgroup>
      ))}
    </select>
  );

  // Draw lit edges last so they sit on top of the others.
  const rank = (key) => (pathEdges.has(key) ? 2 : hoverEdges.has(key) ? 1 : 0);
  const sortedEdges = edges
    .map(([a, b]) => ({ a, b, key: [a, b].sort().join('|') }))
    .sort((x, y) => rank(x.key) - rank(y.key));

  return (
    <div className="wp" ref={root}>
      <form className="wp-controls" onSubmit={(e) => { e.preventDefault(); go(from, to); }}>
        <label>From {picker(from, setFrom, to)}</label>
        <label>To {picker(to, setTo, from)}</label>
        <button type="submit" className="btn btn-primary">Find the path</button>
      </form>

      <div className="wp-stage">
        <p className="wp-scroll-hint">Scroll sideways to see the whole map.</p>
        <div className="wp-scroll">
          <svg viewBox={`0 0 ${view.w} ${view.h}`} className="wp-svg" aria-hidden="true">
            {COLUMNS.map((c) => (
              <text key={c.kind} x={c.x} y={22} textAnchor="middle" className="wp-col">{c.title}</text>
            ))}
            <g className="wp-edges">
              {sortedEdges.map(({ a, b, key }) => {
                const na = nodes.get(a);
                const nb = nodes.get(b);
                const hub = na.kind === 'category' || nb.kind === 'category';
                const lit = pathEdges.has(key)
                  ? 'on-path'
                  : hoverEdges.has(key)
                    ? 'hovered'
                    : (state[a] === 'closed' && state[b]) || (state[b] === 'closed' && state[a]) ? 'touched' : null;
                // Thicker links have more resume lines behind them.
                const strength = linkTo(a, b).evidence.strength;
                const width = lit === 'on-path' ? undefined : Math.min(3, 0.9 + 0.55 * strength);
                return (
                  <path
                    key={key}
                    d={edgePath(na, nb)}
                    style={width ? { strokeWidth: width } : undefined}
                    className={['wp-edge', hub && 'hub', lit].filter(Boolean).join(' ')}
                  />
                );
              })}
            </g>
            {[...nodes.values()].map((n) => {
              const cls = ['wp-node', `k-${n.kind}`, state[n.id], onPath.has(n.id) && 'on-path',
                n.id === from && 'is-from', n.id === to && 'is-to', hover === n.id && 'is-hover']
                .filter(Boolean).join(' ');
              return (
                <g
                  key={n.id}
                  className={cls}
                  onClick={() => onNode(n.id)}
                  onMouseEnter={() => setHover(n.id)}
                  onMouseLeave={() => setHover(null)}
                >
                  <title>{`${KIND_NAME[n.kind]}: ${n.title}`}</title>
                  <rect x={n.x - n.w / 2} y={n.y - PILL_H / 2} width={n.w} height={PILL_H} rx={PILL_H / 2} className="wp-pill" />
                  <text x={n.x} y={n.y + 4.5} textAnchor="middle" className="wp-label">{n.label}</text>
                </g>
              );
            })}
          </svg>
        </div>
        <p className="wp-hint" aria-live="polite">
          {picking === 'to'
            ? `Start: ${nodes.get(from).title}. Now click where the path should end.`
            : 'Click any name on the map to start a new path.'}
        </p>
        <ul className="wp-legend" aria-hidden="true">
          <li><span className="wp-key k-start" />Start</li>
          <li><span className="wp-key k-goal" />End</li>
          <li><span className="wp-key k-frontier" />Frontier</li>
          <li><span className="wp-key k-explored" />Explored</li>
          <li><span className="wp-key k-path" />Path</li>
          <li><span className="wp-key k-strong" />Thicker link: more resume lines show it</li>
          <li><span className="wp-key k-hub" />Same area (a weaker link than a shared skill)</li>
        </ul>
      </div>

      <div className="wp-result" aria-live="polite">
        {stats && path.length > 0 && (
          <>
            <p className="wp-stats">
              Most relevant connection: {stats.hops} steps. A* explored {stats.expanded} of {stats.total} nodes to find it.
            </p>
            <ol className="wp-steps">
              {path.map((id, i) => {
                const n = nodes.get(id);
                const next = path[i + 1];
                const ev = next ? linkTo(id, next).evidence : null;
                // A line quoted for the previous link isn't repeated for this one.
                const prevLines = i > 0 ? linkTo(path[i - 1], id).evidence.lines : [];
                const lines = ev ? ev.lines.filter((l) => !prevLines.includes(l)) : [];
                const repeated = ev && ev.lines.length > 0 && lines.length === 0;
                return (
                  <li key={id} className={`wp-step k-${n.kind}`}>
                    <div className="wp-step-head">
                      <span className="wp-kind">{KIND_NAME[n.kind]}</span>
                      {n.href ? <Link to={n.href}>{n.title}</Link> : <span className="wp-step-name">{n.title}</span>}
                    </div>
                    {ev && (ev.area ? (
                      <p className="wp-proof wp-proof-area">Both are {ev.area.toLowerCase()} projects.</p>
                    ) : repeated ? (
                      <p className="wp-proof wp-proof-area">Same line as above.</p>
                    ) : lines.length > 0 ? (
                      <div className="wp-proof">
                        {lines.slice(0, 2).map((line) => <blockquote key={line}>{line}</blockquote>)}
                        {lines.length > 2 && <p className="wp-proof-more">and {lines.length - 2} more lines</p>}
                      </div>
                    ) : (
                      <p className="wp-proof wp-proof-area">Listed as a skill on this project.</p>
                    ))}
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
