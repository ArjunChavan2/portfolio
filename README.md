# Arjun Chavan — Portfolio

Personal portfolio at **https://arjunchavan2.github.io/portfolio/**. Vite + React, deployed to GitHub Pages
by `.github/workflows/deploy.yml` on every push to `main`.

## Develop

```bash
npm install
npm run dev        # http://localhost:5173/portfolio/
npm run build      # vite build + scripts/spa-routes.mjs
npm run lint
```

## Content

Résumé content is not edited here. It comes from `~/ResumeDaily/content.js`:

```bash
npm run sync-resume    # regenerate src/data/resume.json, then commit it
```

- Experience, skills, and education use the resume's default profile.
- Projects include everything in `content.js`, benched ones too: a portfolio has room the one-page résumé doesn't.

Project pages (`/projects/:slug`) combine each synced entry with the portfolio-only detail in
`src/data/projects.js`: slug, category, summary, headline stat, links, and media. Site-only projects that
aren't on the résumé (like Assignment Calendar) live in `SITE_ONLY` in the same file.

- **Video:** put the file in `public/media/` and set `media: { type: 'video', src: asset('media/…'), poster }`.
  Keep videos to a few MB (`ffmpeg -i in.mp4 -vf scale=-2:720 -crf 27 -movflags +faststart out.mp4`).
- **Interactive demo:** add a component under `src/demos/` and register it in `DEMOS` in
  `src/pages/ProjectDetail.jsx`. The A* demo (`src/demos/astar.js`) is a fresh browser implementation written
  for the visualisation, not the EECS 367 submission code.

Replace `public/resume.pdf` when a new PDF is cut.

## Hosting notes

- The site lives under `/portfolio/`, set as `base` in `vite.config.js`. Use `asset()` from `src/site.js`
  for anything in `public/`.
- GitHub Pages has no SPA fallback, so `scripts/spa-routes.mjs` writes an `index.html` for every route
  (deep links return 200), a `404.html`, and redirects from the old `about.html` and `projects.html`.
  A new top-level page needs adding to its `routes` list.
- `public/skillmap.html` is the standalone résumé skill map, served as-is at `/portfolio/skillmap.html`.
- The contact form has no backend; it opens the visitor's email client with the message prefilled.
