# Arjun Chavan — Portfolio

Personal portfolio at **https://arjunchavan2.github.io/portfolio/**. Vite + React, deployed to GitHub Pages
by `.github/workflows/deploy.yml` on every push to `main`.

## Environments

Two repos, same code, each on its own GitHub Pages site (this repo is prod):

| Repo | Site | Role |
|---|---|---|
| `portfolio-dev` | https://arjunchavan2.github.io/portfolio-dev/ | Try changes here first (marked `noindex`) |
| `portfolio` | https://arjunchavan2.github.io/portfolio/ | Prod: the real site |

The workflow sets the base path from the repo name, so nothing is edited per repo. Ship by pushing the
reviewed commits from dev to a review branch on prod and merging it there.

## Develop

```bash
npm install
npm run dev        # http://localhost:5173/
npm run build      # vite build + scripts/spa-routes.mjs
npm run lint
```

## Content

Resume content is not edited here. It comes from `~/ResumeDaily/content.js`:

```bash
npm run sync-resume    # regenerate src/data/resume.json, then commit it
```

- Experience, skills, and education use the resume's default profile.
- Projects include everything in `content.js`, benched ones too: a portfolio has room the one-page resume doesn't.

Project pages (`/projects/:slug`) combine each synced entry with the portfolio-only detail in
`src/data/projects.js`: slug, category, summary, headline stat, links, and media. Site-only projects that
aren't on the resume (like Assignment Calendar) live in `SITE_ONLY` in the same file.

- **Video:** put the file in `public/media/` and set `media: { type: 'video', src: asset('media/…'), poster }`.
  Keep videos to a few MB (`ffmpeg -i in.mp4 -vf scale=-2:720 -crf 27 -movflags +faststart out.mp4`).
- **Interactive demo:** add a component under `src/demos/` and register it in `DEMOS` in
  `src/pages/ProjectDetail.jsx`. The A* demo (`src/demos/astar.js`) is a fresh browser implementation written
  for the visualisation, not the EECS 367 submission code.

Replace `public/resume.pdf` when a new PDF is cut.

## Hosting notes

- The site lives under `/<repo name>/` on Pages. `base` in `vite.config.js` comes from `VITE_BASE`, which the
  deploy workflow sets (locally it is `/`). Use `asset()` from `src/site.js` for anything in `public/`.
- GitHub Pages has no SPA fallback, so `scripts/spa-routes.mjs` writes an `index.html` for every route
  (deep links return 200), a `404.html`, and redirects from the old `about.html` and `projects.html`.
  A new top-level page needs adding to its `routes` list.
- `public/skillmap.html` is the standalone resume skill map, served as-is at `<base>skillmap.html`.
- The contact form has no backend; it opens the visitor's email client with the message prefilled.
