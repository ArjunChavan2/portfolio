// A graph of everything on the site: every project and every role is a node,
// so is every skill that two or more of them share, and so is each category
// (Robotics, Full stack, Experience, ...). Items connect to their skills and to
// their category, so a path reads "role -> skill -> project -> category -> ...".
// Category hops cost a little more than skill hops, so paths prefer a real
// shared skill and fall back on the category when there is none.
// Layout is deterministic (no randomness), so the picture is the same on every visit.
import resume from '../data/resume.json';
import { projects } from '../data/projects';

export const VIEW = { w: 1000, h: 580, cx: 500, cy: 292 };
const RING = { rx: 330, ry: 236 }; // items sit on this ellipse
const INNER = { rx: 262, ry: 176 }; // shared skills stay inside this one
export const HUB_COST = 1.5;
const HUB_INSET = 64; // category hubs sit just inside their group of items

const norm = (s) => s.trim().toLowerCase();

// Short on-graph labels; the full title is in the result list and the tooltip.
function shortTitle(title, max = 22) {
  let t = title.split(/,| for | and /)[0].trim();
  if (t.length <= max) return t;
  const words = t.split(' ');
  t = '';
  for (const w of words) {
    if ((t ? `${t} ${w}` : w).length > max) break;
    t = t ? `${t} ${w}` : w;
  }
  return t || title.slice(0, max);
}
const shortRole = (title) =>
  title.replace('Machine Learning', 'ML').replace('Developer ', '').replace('Assistant', 'Asst.');

export function buildGraph() {
  const items = [
    ...resume.experience.map((e, i) => ({
      id: `r:${i}`,
      kind: 'role',
      group: 'Experience',
      title: `${e.title}, ${e.org.split(',')[0]}`,
      label: shortRole(e.title),
      href: '/experience',
      skills: e.skills || [],
    })),
    ...projects.map((p) => ({
      id: `p:${p.slug}`,
      kind: 'project',
      group: p.category,
      title: p.title,
      label: shortTitle(p.title),
      href: `/projects/${p.slug}`,
      slug: p.slug,
      skills: p.skills || [],
    })),
  ];

  // Keep a skill only if it links two or more items; the rest are dead ends.
  const owners = new Map();
  const display = new Map();
  for (const it of items) {
    for (const s of new Set(it.skills.map(norm))) {
      if (!owners.has(s)) owners.set(s, []);
      owners.get(s).push(it.id);
    }
    for (const s of it.skills) if (!display.has(norm(s))) display.set(norm(s), s);
  }
  const skills = [...owners]
    .filter(([, ids]) => ids.length > 1)
    .map(([key]) => ({ id: `s:${key}`, kind: 'skill', title: display.get(key), label: display.get(key) }));

  const groupNames = [...new Set(items.map((i) => i.group))];
  const hubs = groupNames.map((g) => ({ id: `c:${g}`, kind: 'category', title: g, label: g }));

  const nodes = new Map([...items, ...skills, ...hubs].map((n) => [n.id, { ...n, adj: [] }]));
  const edges = [];
  const link = (a, b, cost) => {
    nodes.get(a).adj.push({ id: b, cost });
    nodes.get(b).adj.push({ id: a, cost });
    edges.push([a, b, cost]);
  };
  for (const it of items) {
    for (const s of new Set(it.skills.map(norm))) if (nodes.has(`s:${s}`)) link(it.id, `s:${s}`, 1);
    link(it.id, `c:${it.group}`, HUB_COST);
  }

  layout(nodes, items, groupNames);
  const maxEdge = Math.max(...edges.map(([a, b]) => dist(nodes.get(a), nodes.get(b))));
  return {
    nodes,
    edges,
    items: items.map((i) => i.id),
    skills: skills.map((s) => s.id),
    hubs: hubs.map((h) => h.id),
    maxEdge,
  };
}

const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

function layout(nodes, items, order) {
  // Items on the outer ellipse, grouped by category, with a gap between groups.
  const sorted = order.flatMap((g) => items.filter((i) => i.group === g));
  const slots = sorted.length + order.length; // one empty slot between groups
  let slot = 0;
  let prev = null;
  for (const it of sorted) {
    if (prev !== null && it.group !== prev) slot += 1;
    prev = it.group;
    const a = -Math.PI / 2 + (slot / slots) * Math.PI * 2;
    const n = nodes.get(it.id);
    n.angle = a;
    n.x = VIEW.cx + RING.rx * Math.cos(a);
    n.y = VIEW.cy + RING.ry * Math.sin(a);
    slot += 1;
  }

  // Each category hub sits just inside the middle of its group.
  for (const g of order) {
    const angles = items.filter((i) => i.group === g).map((i) => nodes.get(i.id).angle);
    const mid = (Math.min(...angles) + Math.max(...angles)) / 2;
    Object.assign(nodes.get(`c:${g}`), ringPoint(mid, -HUB_INSET), { angle: mid });
  }

  // Skills start at the mean of the items they connect, pulled toward the centre,
  // then relax: spring to that target, push away from each other and from hubs.
  const skills = [...nodes.values()].filter((n) => n.kind === 'skill');
  const hubs = [...nodes.values()].filter((n) => n.kind === 'category');
  for (const s of skills) {
    const nb = s.adj.map((e) => nodes.get(e.id));
    s.tx = VIEW.cx + (nb.reduce((t, n) => t + n.x, 0) / nb.length - VIEW.cx) * 0.62;
    s.ty = VIEW.cy + (nb.reduce((t, n) => t + n.y, 0) / nb.length - VIEW.cy) * 0.62;
    s.x = s.tx;
    s.y = s.ty;
  }
  for (let iter = 0; iter < 160; iter++) {
    for (const s of skills) {
      let fx = (s.tx - s.x) * 0.06;
      let fy = (s.ty - s.y) * 0.06;
      for (const o of [...skills, ...hubs]) {
        if (o === s) continue;
        let dx = s.x - o.x;
        let dy = s.y - o.y;
        let d = Math.hypot(dx, dy);
        if (d < 0.01) { dx = Math.cos(s.id.length + o.id.length); dy = Math.sin(s.id.length * 7); d = 1; }
        if (d < 74) {
          const push = (74 - d) / 74;
          fx += (dx / d) * push * 6;
          fy += (dy / d) * push * 6;
        }
      }
      s.x += fx;
      s.y += fy;
      // Stay inside the inner ellipse so skills never sit on the item ring.
      const ex = (s.x - VIEW.cx) / INNER.rx;
      const ey = (s.y - VIEW.cy) / INNER.ry;
      const e = Math.hypot(ex, ey);
      if (e > 1) {
        s.x = VIEW.cx + (ex / e) * INNER.rx;
        s.y = VIEW.cy + (ey / e) * INNER.ry;
      }
    }
  }
}

export const ringPoint = (a, grow = 0) => ({
  x: VIEW.cx + (RING.rx + grow) * Math.cos(a),
  y: VIEW.cy + (RING.ry + grow * (RING.ry / RING.rx)) * Math.sin(a),
});

class MinHeap {
  constructor() { this.a = []; }
  get size() { return this.a.length; }
  less(x, y) { return x.f < y.f || (x.f === y.f && (x.h < y.h || (x.h === y.h && x.n < y.n))); }
  push(x) {
    const a = this.a;
    a.push(x);
    for (let i = a.length - 1; i > 0;) {
      const p = (i - 1) >> 1;
      if (!this.less(a[i], a[p])) break;
      [a[i], a[p]] = [a[p], a[i]];
      i = p;
    }
  }
  pop() {
    const a = this.a;
    const top = a[0];
    const last = a.pop();
    if (a.length) {
      a[0] = last;
      for (let i = 0; ;) {
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

// A* over the graph. A skill hop costs 1 and a category hop costs HUB_COST. The
// heuristic is straight-line distance divided by the longest edge: every hop
// covers at most that distance and costs at least 1, so it never overestimates
// the cost left, and the path returned is a cheapest one. Returns the same event log as the grid demo:
// [0, id] when a node joins the frontier, [1, id] when it is expanded.
export function searchGraph(graph, start, goal) {
  const { nodes, maxEdge } = graph;
  const goalNode = nodes.get(goal);
  const h = (id) => dist(nodes.get(id), goalNode) / maxEdge;
  const g = new Map([[start, 0]]);
  const parent = new Map([[start, null]]);
  const closed = new Set();
  const open = new MinHeap();
  const events = [[0, start]];
  let n = 0;
  open.push({ id: start, f: h(start), h: h(start), n: n++ });
  while (open.size) {
    const { id } = open.pop();
    if (closed.has(id)) continue;
    closed.add(id);
    events.push([1, id]);
    if (id === goal) break;
    for (const { id: nb, cost } of nodes.get(id).adj) {
      if (closed.has(nb)) continue;
      const ng = g.get(id) + cost;
      if (ng < (g.get(nb) ?? Infinity)) {
        g.set(nb, ng);
        parent.set(nb, id);
        const hn = h(nb);
        open.push({ id: nb, f: ng + hn, h: hn, n: n++ });
        events.push([0, nb]);
      }
    }
  }
  const path = [];
  if (parent.has(goal)) for (let c = goal; c !== null; c = parent.get(c)) path.unshift(c);
  return { events, path, expanded: closed.size };
}
