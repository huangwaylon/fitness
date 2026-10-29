import { sveltekit } from '@sveltejs/kit/vite';
import adapterStatic from '@sveltejs/adapter-static';
import { defineConfig, type Plugin } from 'vitest/config';

/** The art manifest is bundled into the main chunk (lib/art.ts): ship only the keys, paths and sizes, not the
 *  `source` credit URLs (they stay in static/art/manifest.json for the runbook). */
const slimArtManifest: Plugin = {
  name: 'slim-art-manifest',
  enforce: 'pre',
  transform(code, id) {
    if (!id.split('?')[0].endsWith('/static/art/manifest.json')) return;
    const { files } = JSON.parse(code) as { files: Record<string, { path: string; w: number; h: number }> };
    const slim = Object.fromEntries(Object.entries(files).map(([k, { path, w, h }]) => [k, { path, w, h }]));
    return { code: JSON.stringify({ files: slim }), map: null };
  }
};

// A static SPA (GitHub Pages). The backend is the Apps Script web app (ADR 0015): its /exec URL is VITE_GAS_URL.
// Output goes to build-pages/ (app/build/ is the old Mac server's output; leave it alone until it's retired).
export default defineConfig({
  plugins: [
    slimArtManifest,
    sveltekit({
      adapter: adapterStatic({ pages: 'build-pages', assets: 'build-pages', fallback: 'index.html', strict: false }),
      paths: { base: (process.env.BASE_PATH ?? '/fitness') as `/${string}` },
      // Static hosting has no headers: SvelteKit writes this as a <meta http-equiv> tag and adds the hash of its
      // inline bootstrap script to script-src. Only the Apps Script origins (the /exec URL and its 302 target) are
      // reachable besides our own.
      csp: {
        mode: 'hash',
        directives: {
          'default-src': ['self'],
          'connect-src': ['self', 'https://script.google.com', 'https://script.googleusercontent.com'],
          'img-src': ['self', 'data:'],
          'style-src': ['self', 'unsafe-inline'],
          'script-src': ['self'],
          'object-src': ['none'],
          'base-uri': ['self'],
          'form-action': ['none']
        }
      }
    })
  ],
  // Fonts ship as separate files (fetched per unicode-range subset) instead of base64 in the blocking CSS.
  build: { assetsInlineLimit: (file) => (/\.woff2?$/.test(file) ? false : undefined) },
  test: { include: ['src/**/*.test.ts', 'gas/**/*.test.ts'] }
});
