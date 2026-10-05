// GitHub Pages serves files, not an SPA. After `vite build`, give every client
// route its own index.html (so deep links return 200, not 404), add a 404.html
// fallback, and keep the old static-site URLs working with redirects.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const base = '/portfolio/';
const shell = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');

// Project slugs: explicit ones from projects.js, plus the slugified title for
// any synced project without one. Mirrors slugify() in src/data/projects.js.
const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
const projectsSrc = fs.readFileSync(path.join(root, 'src/data/projects.js'), 'utf8');
const detailTitles = [...projectsSrc.matchAll(/^ {2}'([^']+)': \{\n {4}slug: '([^']+)'/gm)];
const slugByTitle = new Map(detailTitles.map(([, title, slug]) => [title, slug]));
const resume = JSON.parse(fs.readFileSync(path.join(root, 'src/data/resume.json'), 'utf8'));
const titles = [...resume.projects.map((p) => p.title), ...slugByTitle.keys()];
const slugs = [...new Set(titles.map((t) => slugByTitle.get(t) || slugify(t)))];

const routes = ['projects', 'experience', 'contact', ...slugs.map((s) => `projects/${s}`)];
for (const route of routes) {
  const dir = path.join(dist, route);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), shell);
}
fs.writeFileSync(path.join(dist, '404.html'), shell);

const redirect = (to) => `<!doctype html>
<meta charset="utf-8">
<title>Redirecting…</title>
<link rel="canonical" href="${to}">
<meta http-equiv="refresh" content="0; url=${to}">
<a href="${to}">Continue to ${to}</a>
`;
const legacy = { 'about.html': `${base}experience`, 'projects.html': `${base}projects` };
for (const [file, to] of Object.entries(legacy)) fs.writeFileSync(path.join(dist, file), redirect(to));

console.log(`spa-routes: ${routes.length} routes, 404.html, ${Object.keys(legacy).length} legacy redirects`);
