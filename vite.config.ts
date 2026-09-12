import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// On GitHub Pages the site is served from https://<user>.github.io/<repo>/,
// so Vite must produce asset paths under that base. For local dev / other
// hosts, leave the base as './' so the build is portable.
const repoName = process.env.GITHUB_REPOSITORY?.split('/')[1] ?? 'PlankTime';

export default defineConfig({
  base: process.env.GITHUB_PAGES ? `/${repoName}/` : './',
  plugins: [react()],
  server: {
    port: 5173,
    open: true,
  },
});