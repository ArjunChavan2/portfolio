// A graph of everything on the site: every project and every role is a node,
// so is every skill that two or more of them share, and so is each project
// category (Robotics, Full stack, ...). Items connect to their skills, projects
// also connect to their category, so a path reads "role -> skill -> project".
// Links are weighted by evidence, so the shortest path is also the most
// relevant one: an item-skill link costs 1 plus a penalty that shrinks the
// more of that item's resume lines show the skill, plus small penalties for
// older work and for projects that didn't make the one-page resume. Category links cost more, so paths prefer a real shared skill
// and fall back on the category when there is none. Every link costs at least
// 1, which keeps the A* heuristic below admissible.
//
// Layout is four ordered columns, left to right: roles, shared skills,
// projects (grouped by category), categories. Every edge joins neighbouring
// columns, and each column is ordered to keep lines from crossing. Layout is
// deterministic, so the picture is the same on every visit.
import resume from '../data/resume.json';
import { projects } from '../data/projects';

export const HUB_COST = 1.5;
const EVIDENCE_PENALTY = 0.6; // one supporting line adds 0.6, two add 0.3, three 0.2
const AGE_PENALTY = 0.4; // the oldest work adds 0.4, the newest adds nothing
const OFF_RESUME_PENALTY = 0.3; // projects cut from the one-page resume, or only on this site

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
// End of a date range as a month count ("Feb 2026 – Present" ends now).
function endMonth(date) {
  if (/present/i.test(date)) return Infinity;
  const parts = [...date.toLowerCase().matchAll(/(?:([a-z]{3})[a-z]*\s+)?(\d{4})/g)];
  if (!parts.length) return 0;
  const [, mon, year] = parts[parts.length - 1];
  return Number(year) * 12 + (mon && MONTHS.includes(mon) ? MONTHS.indexOf(mon) : 11);
}
export const COLUMNS = [
  { kind: 'role', x: 118, title: 'Roles' },
  { kind: 'skill', x: 468, title: 'Shared skills' },
  { kind: 'project', x: 792, title: 'Projects' },
  { kind: 'category', x: 1008, title: 'Area' },
];
const COL_X = Object.fromEntries(COLUMNS.map((c) => [c.kind, c.x]));
const GAP = { role: 64, skill: 30, project: 40, group: 22 };
const PAD = { top: 56, bottom: 24 };
export const PILL_H = 26;

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

// Pill width from the label: roles and projects are set a size up from skills.
const pillWidth = (n) => Math.round(n.label.length * (n.kind === 'role' || n.kind === 'project' ? 7.7 : 7.1) + 26);

export function buildGraph() {
  const items = [
    ...resume.experience.map((e, i) => ({
      id: `r:${i}`,
      kind: 'role',
      title: `${e.title}, ${e.org.split(',')[0]}`,
      label: shortRole(e.title),
      href: '/experience',
      date: e.date,
      bullets: e.bullets || [],
      bulletSkills: e.bulletSkills,
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
      date: p.date,
      offResume: !p.onResume,
      bullets: p.bullets || [],
      bulletSkills: p.bulletSkills,
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

  const groupNames = [...new Set(projects.map((p) => p.category))];
  const hubs = groupNames.map((g) => ({ id: `c:${g}`, kind: 'category', title: g, label: g }));

  const nodes = new Map([...items, ...skills, ...hubs].map((n) => [n.id, { ...n, adj: [], w: pillWidth(n) }]));
  // Age penalty: 0 for the most recent end date, AGE_PENALTY for the oldest.
  const ends = items.map((i) => endMonth(i.date || ''));
  const finite = ends.filter(Number.isFinite);
  const newest = Math.max(...finite);
  const oldest = Math.min(...finite);
  const age = (it) => {
    const e = Math.min(endMonth(it.date || ''), newest);
    return newest === oldest ? 0 : (AGE_PENALTY * (newest - e)) / (newest - oldest);
  };

  const edges = [];
  const link = (a, b, cost, evidence) => {
    nodes.get(a).adj.push({ id: b, cost, evidence });
    nodes.get(b).adj.push({ id: a, cost, evidence });
    edges.push([a, b, cost, evidence]);
  };
  for (const it of items) {
    for (const s of new Set(it.skills.map(norm))) {
      if (!nodes.has(`s:${s}`)) continue;
      // The resume lines that show this skill. Older data without per-line
      // tags counts as one supporting line.
      const lines = it.bulletSkills
        ? it.bullets.filter((_, i) => (it.bulletSkills[i] || []).some((x) => norm(x) === s))
        : [];
      const strength = Math.max(1, lines.length);
      const cost = 1 + EVIDENCE_PENALTY / strength + age(it) + (it.offResume ? OFF_RESUME_PENALTY : 0);
      link(it.id, `s:${s}`, cost, { lines, strength });
    }
    if (it.kind === 'project') {
      link(it.id, `c:${it.group}`, HUB_COST + age(it) + (it.offResume ? OFF_RESUME_PENALTY : 0), { lines: [], strength: 0, area: it.group });
    }
  }

  const view = layout(nodes, groupNames);
  const maxEdge = Math.max(...edges.map(([a, b]) => dist(nodes.get(a), nodes.get(b))));
  return {
    nodes,
    edges,
    view,
    items: items.map((i) => i.id),
    skills: skills.map((s) => s.id),
    hubs: hubs.map((h) => h.id),
    maxEdge,
  };
}

const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const mean = (xs) => xs.reduce((t, v) => t + v, 0) / xs.length;

function layout(nodes, groupNames) {
  const all = [...nodes.values()];
  const roles = all.filter((n) => n.kind === 'role');
  let skills = all.filter((n) => n.kind === 'skill');
  const projectsIn = (g) => all.filter((n) => n.kind === 'project' && n.group === g);
  let groups = groupNames.map((g) => ({ name: g, members: projectsIn(g) }));

  const spans = {
    role: (roles.length - 1) * GAP.role,
    skill: (skills.length - 1) * GAP.skill,
    project: (all.filter((n) => n.kind === 'project').length - 1) * GAP.project + (groups.length - 1) * GAP.group,
  };
  const height = Math.max(...Object.values(spans)) + PAD.top + PAD.bottom + PILL_H;
  const mid = PAD.top + (height - PAD.top - PAD.bottom) / 2;

  const placeColumn = (list, kind, gap) => {
    let y = mid - ((list.length - 1) * gap) / 2;
    for (const n of list) { n.x = COL_X[kind]; n.y = y; y += gap; }
  };
  const placeProjectsExact = () => {
    let y = mid - spans.project / 2;
    groups.forEach((g, gi) => {
      if (gi > 0) y += GAP.group;
      for (const n of g.members) { n.x = COL_X.project; n.y = y; y += GAP.project; }
    });
  };

  // Roles keep resume order (newest first). Skills and projects are ordered by
  // the average height of what they connect to (the barycentre heuristic),
  // repeated a few times so the columns settle with few crossings.
  placeColumn(roles, 'role', GAP.role);
  placeProjectsExact();
  const neighbourY = (n, kinds) => {
    const ys = n.adj.map((e) => nodes.get(e.id)).filter((m) => kinds.includes(m.kind)).map((m) => m.y);
    return ys.length ? mean(ys) : n.y;
  };
  for (let round = 0; round < 8; round++) {
    skills = skills
      .map((n) => ({ n, k: neighbourY(n, ['role', 'project']) }))
      .sort((a, b) => a.k - b.k || a.n.label.localeCompare(b.n.label))
      .map((e) => e.n);
    placeColumn(skills, 'skill', GAP.skill);
    groups = groups
      .map((g) => {
        const members = g.members
          .map((n) => ({ n, k: neighbourY(n, ['skill']) }))
          .sort((a, b) => a.k - b.k || a.n.label.localeCompare(b.n.label));
        return { ...g, members: members.map((e) => e.n), k: mean(members.map((e) => e.k)) };
      })
      .sort((a, b) => a.k - b.k);
    placeProjectsExact();
  }
  for (const g of groups) {
    const hub = nodes.get(`c:${g.name}`);
    hub.x = COL_X.category;
    hub.y = mean(g.members.map((n) => n.y));
  }
  return { w: 1100, h: height };
}

// The two attach points and a horizontal S-curve between two nodes in
// neighbouring columns (or a loop back into the same side for a skill shared
// by two projects, which is still left-to-right between columns).
export function edgePath(a, b) {
  const [l, r] = a.x <= b.x ? [a, b] : [b, a];
  const x1 = l.x + l.w / 2;
  const x2 = r.x - r.w / 2;
  const dx = Math.max(40, (x2 - x1) / 2);
  return `M${x1},${l.y} C${x1 + dx},${l.y} ${x2 - dx},${r.y} ${x2},${r.y}`;
}

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
// heuristic is straight-line distance (between node centres) divided by the
// longest edge: every hop covers at most that distance and costs at least 1,
// so it never overestimates the cost left, and the path is a cheapest one. Returns the same event log as the grid demo:
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
