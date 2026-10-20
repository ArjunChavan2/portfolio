import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// The same code ships to two GitHub Pages sites, portfolio (prod) and portfolio-dev,
// so the base path comes from the deploy workflow (VITE_BASE=/<repo name>/).
// Local dev serves from '/'. Non-prod builds (VITE_NOINDEX=true) get a noindex tag.
const base = process.env.VITE_BASE || '/'

const noindexNonProd = () => ({
  name: 'noindex-non-prod',
  transformIndexHtml: (html) =>
    process.env.VITE_NOINDEX === 'true'
      ? html.replace('</head>', '    <meta name="robots" content="noindex, nofollow" />\n  </head>')
      : html,
})

export default defineConfig({
  base,
  plugins: [react(), noindexNonProd()],
})
