# Portfolio (dev)

React 19 + Vite 8 + react-router 7, deployed to GitHub Pages. The same code
ships from two repos: **dev** `ArjunChavan2/portfolio-dev` (where work happens)
and **prod** `ArjunChavan2/portfolio` (promoted from dev, see below).

## Commands
- `npx vite --port 5199`: dev server
- `npm run lint` (oxlint), `npm test` (node:test, demo math) and `npm run build`: all must pass before any push;
  CI runs the same on push to `main`
- `npm run sync-resume`: regenerates `src/data/resume.json` from `~/ResumeDaily/content.js`

## Data, and what not to hand-edit
- `src/data/resume.json` is generated. Edit `content.js` in ResumeDaily, then sync.
- `src/data/projects.js` is hand-written site detail in `DETAILS`, keyed by the
  **exact resume title**. If the resume renames a project, rename its key too,
  and its key in `src/data/slugs.json` (the URL slugs, read by the build's route script).
- `public/resume.pdf` is copied from `~/Desktop/Resumes/Arjun_Chavan_Resume.pdf`
  (built by `~/ResumeDaily/build.sh`); `public/skillmap.html` comes from
  `node ~/ResumeDaily/build_mindmap.js public/skillmap.html`.
- Copy that depends on dates (current role, "Current" badges) reads the
  resume's "Present"; never hard-code it.

## Shipping to prod
Prod has its own squash history. In `~/Documents/GitHub/portfolio`: branch
`promote/<name>` from `origin/main`, `git read-tree -u --reset <dev main>`,
lint + `VITE_BASE=/portfolio/ npm run build`, PR titled "Ship ... from dev"
saying which dev commit prod matched before, squash-merge.

## Design rules (already applied site-wide; keep them)
- **One accent:** Michigan maize `var(--accent)` only on primary buttons and
  active states. Links and decoration use `var(--text)`.
- **No pure black or white:** use the tokens on `:root` (warm off-whites, navy-tinted darks).
- **Mono for data:** labels, dates, tags and stats use `var(--mono)`.
- **Metric first, label second:** the number big, its caption small beneath.
- **One dark band per page** (`.on-dark`); `.closing` is the inverted CTA panel.
- Every color goes through a token so light and dark mode both work.

## UX laws that apply here
- Fitts: touch targets at least 44px on phones.
- Hick: keep option sets short; filter chips and tabs, not long menus.
- Von Restorff: if everything is highlighted, nothing is (see one accent).
- Proximity: group with spacing before reaching for borders and boxes.
- Doherty: every control responds instantly (hover, pressed, active states).
- Progressive disclosure: demos show the simple view first, details one tap deeper.

## Copy
Plain and specific, no em dashes, no salesy adjectives. Numbers come from the
project's own repo or results, never estimated.

## Verify before calling UI work done
Check light and dark, and a 390px phone width (Playwright MCP can resize; plain
headless Chrome cannot go below 500px). Respect `prefers-reduced-motion`.
