// Pulls resume content from ~/ResumeDaily/content.js into src/data/resume.json.
// Experience, skills, and education use the default profile, the same tag filter
// build_resume.js uses. Projects are broader: see allProjects below.
const fs = require('fs');
const path = require('path');

const src = process.env.RESUME_CONTENT || path.join(require('os').homedir(), 'ResumeDaily/content.js');
const { PROFILES, HEADER, EDUCATION, SKILLS, EXPERIENCE, PROJECTS } = require(src);

const active = new Set(PROFILES[process.argv[2] || 'default']);
// The portfolio has room for hardware depth the one-page resume cuts.
const projectTags = new Set([...active, 'hwdeep']);
const ships = (x, tags = active) => x.tags.some((t) => tags.has(t));
const clean = (s) => s.replace(/^,\s*/, '');

const toEntry = (e, bullets) => ({
  title: e.title,
  org: clean(e.org),
  date: e.date,
  bullets: bullets.map((b) => b.t),
  skills: [...new Set(bullets.flatMap((b) => b.s || []))],
});

const entries = (list) => list.filter((e) => ships(e)).map((e) => toEntry(e, e.bullets.filter((b) => ships(b))));

// Every project gets a page, including ones benched to keep the resume to one
// page. Projects that ship on the resume keep only their shipped bullets; fully
// benched projects show all of theirs.
const allProjects = PROJECTS.map((e) => {
  const shipped = e.bullets.filter((b) => ships(b, projectTags));
  return toEntry(e, shipped.length ? shipped : e.bullets);
});

const out = {
  name: HEADER.name,
  links: HEADER.links,
  education: { ...EDUCATION, location: clean(EDUCATION.location) },
  skills: SKILLS.filter((s) => ships(s)).map(({ label, body }) => ({ label, items: body.split(', ') })),
  experience: entries(EXPERIENCE),
  projects: allProjects,
};

const dest = path.join(__dirname, '../src/data/resume.json');
fs.writeFileSync(dest, JSON.stringify(out, null, 2) + '\n');
console.log(`Wrote ${out.experience.length} roles and ${out.projects.length} projects to ${path.relative(process.cwd(), dest)}`);
