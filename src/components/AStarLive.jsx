import { useEffect, useRef } from 'react';
import { mazeGrid, search, WALL } from '../demos/astar';

// A live replay of the A* planner from the interactive demo: the frontier and
// expanded cells fill in as the search runs, the path is drawn, then a new maze
// is generated and it runs again. Canvas, so it stays cheap. It pauses when
// offscreen or in a hidden tab, follows the demo colour tokens in light and
// dark, and shows a finished frame when the visitor prefers reduced motion.
const W = 41;
const H = 25;
const CELL = 32; // internal pixels per cell; CSS scales the canvas down
const OPEN = 1;
const CLOSED = 2;

const token = (el, name) => getComputedStyle(el).getPropertyValue(name).trim();

// Blend two CSS colours (t = share of a). Used so the frontier and explored
// cells are tints of the site accent and stay readable in both themes. The
// canvas normalises whatever format the stylesheet ends up with (the build
// minifies #ffffff to #fff) to #rrggbb before the channels are read.
const rgb = (ctx, color) => {
  ctx.fillStyle = '#000000';
  ctx.fillStyle = color;
  const hex = ctx.fillStyle;
  return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
};
const mix = (ctx, a, b, t) => {
  const [ca, cb] = [rgb(ctx, a), rgb(ctx, b)];
  return `rgb(${ca.map((v, i) => Math.round(v * t + cb[i] * (1 - t))).join(',')})`;
};

export default function AStarLive() {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas.getContext('2d');
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const dark = window.matchMedia('(prefers-color-scheme: dark)');

    let colors = {};
    let run = null;
    let state = null;
    let seed = 11;
    let phase = 'search';
    let cursor = 0;
    let pathAt = 0;
    let hold = 0;
    let raf = 0;
    let visible = true;

    const readColors = () => {
      const bg = token(canvas, '--demo-bg');
      const accent = token(canvas, '--accent');
      colors = {
        bg,
        wall: token(canvas, '--demo-wall'),
        open: mix(ctx, accent, bg, 0.5),
        closed: mix(ctx, accent, bg, 0.2),
        path: token(canvas, '--demo-path'),
        start: token(canvas, '--demo-start'),
        goal: token(canvas, '--demo-goal'),
      };
    };

    const build = () => {
      const grid = mazeGrid(W, H, seed);
      const start = W + 1;
      const goal = (H - 2) * W + (W - 2);
      grid[start] = 0;
      grid[goal] = 0;
      const result = search(grid, W, H, start, goal, 'astar');
      run = { grid, start, goal, events: result.events, path: result.path.slice().reverse() };
      state = new Uint8Array(W * H);
      phase = 'search';
      cursor = 0;
      pathAt = 0;
      hold = 0;
    };

    const cell = (c, color, inset = 0) => {
      ctx.fillStyle = color;
      ctx.fillRect((c % W) * CELL + inset, ((c / W) | 0) * CELL + inset, CELL - inset * 2, CELL - inset * 2);
    };

    const dot = (c, color) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc((c % W) * CELL + CELL / 2, ((c / W) | 0) * CELL + CELL / 2, CELL * 0.42, 0, Math.PI * 2);
      ctx.fill();
    };

    const draw = () => {
      ctx.fillStyle = colors.bg;
      ctx.fillRect(0, 0, W * CELL, H * CELL);
      for (let c = 0; c < state.length; c++) {
        if (state[c] === CLOSED) cell(c, colors.closed);
        else if (state[c] === OPEN) cell(c, colors.open);
      }
      for (let c = 0; c < run.grid.length; c++) if (run.grid[c] === WALL) cell(c, colors.wall);
      for (let i = 0; i < pathAt; i++) cell(run.path[i], colors.path);
      dot(run.start, colors.start);
      dot(run.goal, colors.goal);
    };

    const finish = () => {
      for (const [kind, c] of run.events) state[c] = kind === 1 ? CLOSED : Math.max(state[c], OPEN);
      cursor = run.events.length;
      pathAt = run.path.length;
      phase = 'hold';
    };

    const step = () => {
      if (phase === 'search') {
        const perFrame = Math.max(2, Math.ceil(run.events.length / 220));
        const end = Math.min(run.events.length, cursor + perFrame);
        for (; cursor < end; cursor++) {
          const [kind, c] = run.events[cursor];
          state[c] = kind === 1 ? CLOSED : Math.max(state[c], OPEN);
        }
        if (cursor >= run.events.length) phase = 'path';
      } else if (phase === 'path') {
        pathAt = Math.min(run.path.length, pathAt + 2);
        if (pathAt >= run.path.length) phase = 'hold';
      } else {
        hold += 1;
        if (hold > 110) {
          seed += 1;
          build();
        }
      }
    };

    const tick = () => {
      raf = 0;
      if (!visible || document.hidden) return;
      step();
      draw();
      raf = requestAnimationFrame(tick);
    };
    const start = () => { if (!raf && !reduce) raf = requestAnimationFrame(tick); };

    canvas.width = W * CELL;
    canvas.height = H * CELL;
    readColors();
    build();
    if (reduce) {
      finish();
      draw();
    } else {
      draw();
    }

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start();
    }, { threshold: 0.15 });
    io.observe(canvas);

    const onVisibility = () => { if (!document.hidden) start(); };
    const onTheme = () => { readColors(); draw(); };
    document.addEventListener('visibilitychange', onVisibility);
    dark.addEventListener('change', onTheme);

    return () => {
      if (raf) cancelAnimationFrame(raf);
      io.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      dark.removeEventListener('change', onTheme);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      className="astar-live"
      role="img"
      aria-label="Animation of an A* search exploring a maze and drawing the shortest path"
    />
  );
}
