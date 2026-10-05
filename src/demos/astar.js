// Grid search for the interactive demo. Written for the browser visualisation,
// not ported from the course submission: it records every frontier push and
// expansion so the UI can replay the search step by step.

export const EMPTY = 0;
export const WALL = 1;

class MinHeap {
  constructor(less) {
    this.items = [];
    this.less = less;
  }
  get size() { return this.items.length; }
  push(x) {
    const a = this.items;
    a.push(x);
    let i = a.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (!this.less(a[i], a[p])) break;
      [a[i], a[p]] = [a[p], a[i]];
      i = p;
    }
  }
  pop() {
    const a = this.items;
    const top = a[0];
    const last = a.pop();
    if (a.length) {
      a[0] = last;
      let i = 0;
      for (;;) {
        const l = 2 * i + 1;
        const r = l + 1;
        let m = i;
        if (l < a.length && this.less(a[l], a[m])) m = l;
        if (r < a.length && this.less(a[r], a[m])) m = r;
        if (m === i) break;
        [a[i], a[m]] = [a[m], a[i]];
        i = m;
      }
    }
    return top;
  }
}

/**
 * 4-connected search with unit step cost.
 * mode 'astar' uses the Manhattan heuristic; 'dijkstra' uses h = 0.
 * Returns { events, path, expanded } where events is an ordered list of
 * [kind, cell] pairs, kind 0 = pushed to frontier, 1 = expanded.
 */
export function search(grid, w, h, start, goal, mode = 'astar') {
  const gx = goal % w;
  const gy = (goal / w) | 0;
  const heur = mode === 'astar'
    ? (c) => Math.abs((c % w) - gx) + Math.abs(((c / w) | 0) - gy)
    : () => 0;

  const g = new Float64Array(w * h).fill(Infinity);
  const parent = new Int32Array(w * h).fill(-1);
  const closed = new Uint8Array(w * h);
  // Ties on f prefer the node closer to the goal, then insertion order.
  const open = new MinHeap((a, b) => (a.f - b.f || a.h - b.h || a.n - b.n) < 0);
  const events = [];
  let n = 0;

  g[start] = 0;
  open.push({ c: start, f: heur(start), h: heur(start), n: n++ });
  events.push([0, start]);

  while (open.size) {
    const { c } = open.pop();
    if (closed[c]) continue;
    closed[c] = 1;
    events.push([1, c]);
    if (c === goal) break;

    const x = c % w;
    const y = (c / w) | 0;
    const nbrs = [];
    if (y > 0) nbrs.push(c - w);
    if (x < w - 1) nbrs.push(c + 1);
    if (y < h - 1) nbrs.push(c + w);
    if (x > 0) nbrs.push(c - 1);

    for (const nb of nbrs) {
      if (grid[nb] === WALL || closed[nb]) continue;
      const ng = g[c] + 1;
      if (ng < g[nb]) {
        g[nb] = ng;
        parent[nb] = c;
        const hn = heur(nb);
        open.push({ c: nb, f: ng + hn, h: hn, n: n++ });
        events.push([0, nb]);
      }
    }
  }

  const path = [];
  if (closed[goal]) {
    for (let c = goal; c !== -1; c = parent[c]) path.push(c);
    path.reverse();
  }
  const expanded = events.reduce((k, [kind]) => k + kind, 0);
  return { events, path, expanded };
}

// ---- map presets --------------------------------------------------------

function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/** Recursive-backtracker maze on odd dimensions, then a few walls knocked out so there are multiple routes. */
export function mazeGrid(w, h, seed = Date.now()) {
  const rand = rng(seed);
  const grid = new Uint8Array(w * h).fill(WALL);
  const stack = [[1, 1]];
  grid[w + 1] = EMPTY;
  while (stack.length) {
    const [x, y] = stack[stack.length - 1];
    const dirs = [[2, 0], [-2, 0], [0, 2], [0, -2]].filter(([dx, dy]) => {
      const nx = x + dx;
      const ny = y + dy;
      return nx > 0 && ny > 0 && nx < w - 1 && ny < h - 1 && grid[ny * w + nx] === WALL;
    });
    if (!dirs.length) { stack.pop(); continue; }
    const [dx, dy] = dirs[(rand() * dirs.length) | 0];
    grid[(y + dy / 2) * w + (x + dx / 2)] = EMPTY;
    grid[(y + dy) * w + (x + dx)] = EMPTY;
    stack.push([x + dx, y + dy]);
  }
  for (let i = 0; i < (w * h) / 18; i++) {
    const x = 1 + ((rand() * (w - 2)) | 0);
    const y = 1 + ((rand() * (h - 2)) | 0);
    grid[y * w + x] = EMPTY;
  }
  return grid;
}

/** A floor plan: a grid of rooms separated by walls with one or two doorways each. */
export function roomsGrid(w, h, seed = Date.now()) {
  const rand = rng(seed);
  const grid = new Uint8Array(w * h);
  const cols = [Math.round(w / 3), Math.round((2 * w) / 3)];
  const rows = [Math.round(h / 2)];
  for (const x of cols) for (let y = 0; y < h; y++) grid[y * w + x] = WALL;
  for (const y of rows) for (let x = 0; x < w; x++) grid[y * w + x] = WALL;
  const door = (lo, hi) => lo + 1 + ((rand() * Math.max(1, hi - lo - 3)) | 0);
  const xs = [0, ...cols, w];
  const ys = [0, ...rows, h];
  for (const x of cols) for (let j = 0; j < ys.length - 1; j++) {
    const y = door(ys[j], ys[j + 1]);
    grid[y * w + x] = EMPTY;
    grid[(y + 1) * w + x] = EMPTY;
  }
  for (const y of rows) for (let i = 0; i < xs.length - 1; i++) {
    if (rand() < 0.35) continue; // leave some rooms closed on this side
    const x = door(xs[i], xs[i + 1]);
    grid[y * w + x] = EMPTY;
    grid[y * w + x + 1] = EMPTY;
  }
  return grid;
}

/** Scattered obstacles at the given density. */
export function scatterGrid(w, h, density = 0.28, seed = Date.now()) {
  const rand = rng(seed);
  const grid = new Uint8Array(w * h);
  for (let i = 0; i < grid.length; i++) if (rand() < density) grid[i] = WALL;
  return grid;
}
