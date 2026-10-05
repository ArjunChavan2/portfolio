import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { EMPTY, WALL, search, mazeGrid, roomsGrid, scatterGrid } from './astar';

const W = 41;
const H = 25;
const START = W * 1 + 1;
const GOAL = W * (H - 2) + (W - 2);

const PRESETS = {
  maze: { label: 'Maze', make: (seed) => mazeGrid(W, H, seed) },
  rooms: { label: 'Rooms', make: (seed) => roomsGrid(W, H, seed) },
  scatter: { label: 'Obstacles', make: (seed) => scatterGrid(W, H, 0.28, seed) },
  empty: { label: 'Empty', make: () => new Uint8Array(W * H) },
};

const ALGOS = {
  astar: 'A* (Manhattan)',
  dijkstra: 'Dijkstra',
};

// Visual state per cell while a run plays back.
const V_NONE = 0;
const V_OPEN = 1;
const V_CLOSED = 2;
const V_PATH = 3;

function cssVar(el, name) {
  return getComputedStyle(el).getPropertyValue(name).trim();
}

export default function AStarDemo() {
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);
  const [preset, setPreset] = useState('maze');
  const [algo, setAlgo] = useState('astar');
  const [speed, setSpeed] = useState(6);
  const [grid, setGrid] = useState(() => {
    const g = PRESETS.maze.make(7);
    g[START] = EMPTY;
    g[GOAL] = EMPTY;
    return g;
  });
  const [start, setStart] = useState(START);
  const [goal, setGoal] = useState(GOAL);
  const [running, setRunning] = useState(false);
  const [stats, setStats] = useState(null);

  const visual = useRef(new Uint8Array(W * H));
  const anim = useRef(0);
  const drag = useRef(null);
  const cellSize = useRef(16);
  const seed = useRef(7);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const s = cellSize.current;
    const dpr = window.devicePixelRatio || 1;
    const colors = {
      bg: cssVar(canvas, '--demo-bg'),
      grid: cssVar(canvas, '--demo-grid'),
      wall: cssVar(canvas, '--demo-wall'),
      open: cssVar(canvas, '--demo-open'),
      closed: cssVar(canvas, '--demo-closed'),
      path: cssVar(canvas, '--demo-path'),
      start: cssVar(canvas, '--demo-start'),
      goal: cssVar(canvas, '--demo-goal'),
    };
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = colors.bg;
    ctx.fillRect(0, 0, W * s, H * s);
    const v = visual.current;
    for (let i = 0; i < W * H; i++) {
      const x = (i % W) * s;
      const y = ((i / W) | 0) * s;
      let fill = null;
      if (grid[i] === WALL) fill = colors.wall;
      else if (v[i] === V_PATH) fill = colors.path;
      else if (v[i] === V_CLOSED) fill = colors.closed;
      else if (v[i] === V_OPEN) fill = colors.open;
      if (fill) {
        ctx.fillStyle = fill;
        ctx.fillRect(x, y, s, s);
      }
    }
    ctx.strokeStyle = colors.grid;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x <= W; x++) { ctx.moveTo(x * s + 0.5, 0); ctx.lineTo(x * s + 0.5, H * s); }
    for (let y = 0; y <= H; y++) { ctx.moveTo(0, y * s + 0.5); ctx.lineTo(W * s, y * s + 0.5); }
    ctx.stroke();
    for (const [cell, color] of [[start, colors.start], [goal, colors.goal]]) {
      const cx = (cell % W) * s + s / 2;
      const cy = ((cell / W) | 0) * s + s / 2;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(cx, cy, s * 0.42, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [grid, start, goal]);

  // Size the canvas to its container.
  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    const resize = () => {
      const s = Math.max(6, Math.floor(wrap.clientWidth / W));
      cellSize.current = s;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = W * s * dpr;
      canvas.height = H * s * dpr;
      canvas.style.width = `${W * s}px`;
      canvas.style.height = `${H * s}px`;
      draw();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', draw);
    return () => { ro.disconnect(); mq.removeEventListener('change', draw); };
  }, [draw]);

  useEffect(() => { draw(); }, [draw]);
  useEffect(() => () => cancelAnimationFrame(anim.current), []);

  const clearRun = useCallback(() => {
    cancelAnimationFrame(anim.current);
    visual.current.fill(V_NONE);
    setRunning(false);
    setStats(null);
  }, []);

  const loadPreset = (key) => {
    clearRun();
    setPreset(key);
    seed.current += 1;
    const g = PRESETS[key].make(seed.current * 7919);
    g[start] = EMPTY;
    g[goal] = EMPTY;
    setGrid(g);
  };

  const comparison = useMemo(() => {
    const a = search(grid, W, H, start, goal, 'astar');
    const d = search(grid, W, H, start, goal, 'dijkstra');
    return { astar: a.expanded, dijkstra: d.expanded };
  }, [grid, start, goal]);

  const run = () => {
    clearRun();
    const result = search(grid, W, H, start, goal, algo);
    const v = visual.current;
    let i = 0;
    let p = 0;
    setRunning(true);
    const t0 = performance.now();
    // Time-based playback so a slow or throttled display still finishes on schedule.
    const eventsPerSec = 60 * Math.ceil(speed ** 1.6);
    const pathPerSec = 60 * Math.max(1, speed);
    let last = t0;
    let budget = 0;
    let pathBudget = 0;
    const step = (now) => {
      const dt = Math.min(1, (now - last) / 1000);
      last = now;
      budget += eventsPerSec * dt;
      for (; budget >= 1 && i < result.events.length; budget--, i++) {
        const [kind, cell] = result.events[i];
        v[cell] = kind === 1 ? V_CLOSED : Math.max(v[cell], V_OPEN);
      }
      if (i >= result.events.length) {
        pathBudget += pathPerSec * dt;
        for (; pathBudget >= 1 && p < result.path.length; pathBudget--, p++) v[result.path[p]] = V_PATH;
      }
      draw();
      if (i < result.events.length || p < result.path.length) {
        anim.current = requestAnimationFrame(step);
      } else {
        setRunning(false);
        setStats({
          algo,
          expanded: result.expanded,
          length: result.path.length ? result.path.length - 1 : null,
          ms: Math.round(performance.now() - t0),
        });
      }
    };
    anim.current = requestAnimationFrame(step);
  };

  const cellAt = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const s = cellSize.current;
    const x = Math.floor((e.clientX - rect.left) / s);
    const y = Math.floor((e.clientY - rect.top) / s);
    if (x < 0 || y < 0 || x >= W || y >= H) return -1;
    return y * W + x;
  };

  const onPointerDown = (e) => {
    const c = cellAt(e);
    if (c < 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    clearRun();
    if (c === start) drag.current = { kind: 'start' };
    else if (c === goal) drag.current = { kind: 'goal' };
    else {
      const paint = grid[c] === WALL ? EMPTY : WALL;
      drag.current = { kind: 'paint', paint, last: c };
      const g = grid.slice();
      g[c] = paint;
      setGrid(g);
    }
  };

  const onPointerMove = (e) => {
    const d = drag.current;
    if (!d) return;
    const c = cellAt(e);
    if (c < 0) return;
    if (d.kind === 'start' && c !== goal && grid[c] !== WALL) setStart(c);
    else if (d.kind === 'goal' && c !== start && grid[c] !== WALL) setGoal(c);
    else if (d.kind === 'paint' && c !== d.last && c !== start && c !== goal) {
      d.last = c;
      setGrid((g) => {
        if (g[c] === d.paint) return g;
        const n = g.slice();
        n[c] = d.paint;
        return n;
      });
    }
  };

  const onPointerUp = () => { drag.current = null; };

  const saved = comparison.dijkstra > 0
    ? Math.round((1 - comparison.astar / comparison.dijkstra) * 100)
    : 0;

  return (
    <div className="demo">
      <div className="demo-toolbar">
        <div className="segmented" role="group" aria-label="Map">
          {Object.entries(PRESETS).map(([key, p]) => (
            <button key={key} className={preset === key ? 'active' : ''} onClick={() => loadPreset(key)}>
              {p.label}
            </button>
          ))}
        </div>
        <div className="segmented" role="group" aria-label="Algorithm">
          {Object.entries(ALGOS).map(([key, label]) => (
            <button key={key} className={algo === key ? 'active' : ''} onClick={() => { clearRun(); setAlgo(key); }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="demo-canvas" ref={wrapRef}>
        <canvas
          ref={canvasRef}
          role="img"
          aria-label="Occupancy grid. Drag the start or goal marker to move it; click or drag on cells to add or remove walls."
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        />
      </div>

      <div className="demo-controls">
        <button className="btn btn-primary" onClick={run} disabled={running}>
          {running ? 'Searching…' : `Run ${algo === 'astar' ? 'A*' : 'Dijkstra'}`}
        </button>
        <button className="btn btn-secondary" onClick={clearRun}>Clear</button>
        <label className="speed">
          Speed
          <input type="range" min="1" max="12" value={speed} onChange={(e) => setSpeed(Number(e.target.value))} />
        </label>
        <ul className="legend" aria-label="Legend">
          <li><span className="swatch start" />Start</li>
          <li><span className="swatch goal" />Goal</li>
          <li><span className="swatch open" />Frontier</li>
          <li><span className="swatch closed" />Expanded</li>
          <li><span className="swatch path" />Path</li>
        </ul>
      </div>

      <dl className="demo-stats">
        <div>
          <dt>Nodes expanded</dt>
          <dd>{stats ? stats.expanded.toLocaleString() : '—'}</dd>
        </div>
        <div>
          <dt>Path length</dt>
          <dd>{stats ? (stats.length === null ? 'No path' : `${stats.length} cells`) : '—'}</dd>
        </div>
        <div>
          <dt>A* vs. Dijkstra on this map</dt>
          <dd>
            {comparison.astar.toLocaleString()} vs. {comparison.dijkstra.toLocaleString()} expansions
            {saved > 0 && <span className="muted"> ({saved}% fewer)</span>}
          </dd>
        </div>
      </dl>
      <p className="demo-hint">
        Drag the start or goal marker to move it. Click or drag on the grid to draw or erase walls.
      </p>
    </div>
  );
}
