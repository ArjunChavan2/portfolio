import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Served from https://arjunchavan2.github.io/portfolio/, so every asset and route lives under /portfolio/.
export default defineConfig({
  base: '/portfolio/',
  plugins: [react()],
})
