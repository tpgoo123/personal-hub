import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// `base: './'` in the production build keeps asset URLs relative, so the same
// `dist/` output works at a domain root (Vercel) and at a repo subpath
// (GitHub Pages, e.g. https://<user>.github.io/personal-hub/).
export default defineConfig(({ command }) => ({
  base: command === 'build' ? './' : '/',
  plugins: [react()],
  server: { port: 5173 },
}))
