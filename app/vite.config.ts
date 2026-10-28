import { sveltekit } from '@sveltejs/kit/vite';
import adapterNode from '@sveltejs/adapter-node';
import adapterStatic from '@sveltejs/adapter-static';
import { defineConfig } from 'vitest/config';

// BUILD_TARGET=pages → static SPA for GitHub Pages (UI only; the API stays on the Mac behind Funnel, set
// VITE_API_BASE). Default → Node server for the Mac (UI + API on one origin).
const pages = process.env.BUILD_TARGET === 'pages';

export default defineConfig({
  plugins: [
    sveltekit({
      adapter: pages ? adapterStatic({ pages: 'build-pages', assets: 'build-pages', fallback: 'index.html', strict: false }) : adapterNode(),
      paths: { base: pages ? ((process.env.BASE_PATH ?? '/fitness') as `/${string}`) : '' }
    })
  ],
  // Fonts ship as separate files (fetched per unicode-range subset) instead of base64 in the blocking CSS.
  build: { assetsInlineLimit: (file) => (/\.woff2?$/.test(file) ? false : undefined) },
  test: { include: ['src/**/*.test.ts'] }
});
