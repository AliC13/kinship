import path from 'node:path'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages project sites are served from https://<user>.github.io/<repo>/,
  // so assets need to be requested with that /<repo>/ prefix. Set VITE_BASE_PATH
  // in your GitHub Actions workflow (see .github/workflows/deploy.yml) or .env
  // to "/<repo-name>/". Defaults to "/" for local dev and user/org sites
  // (https://<user>.github.io) where no prefix is needed.
  base: process.env.VITE_BASE_PATH || '/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  plugins: [react()],
});
