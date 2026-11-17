// Copies dist/index.html to dist/404.html so GitHub Pages serves the SPA
// shell for any unknown path (client-side routes like /matches/:id) instead
// of its default 404 page. No-op for Vercel/Netlify, which use vercel.json
// / netlify.toml rewrites instead — this only matters for GitHub Pages.
import { copyFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

const distDir = resolve(import.meta.dirname, '..', 'dist')
const indexPath = resolve(distDir, 'index.html')
const notFoundPath = resolve(distDir, '404.html')

if (existsSync(indexPath)) {
  copyFileSync(indexPath, notFoundPath)
  console.log('Created dist/404.html for GitHub Pages SPA fallback.')
} else {
  console.warn('dist/index.html not found — run `npm run build` first.')
}
