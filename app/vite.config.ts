import { sveltekit } from '@sveltejs/kit/vite';
import adapterStatic from '@sveltejs/adapter-static';
import { defineConfig, type Plugin } from 'vitest/config';
import { execSync } from 'node:child_process';

/** The app version (shown in しまフォン → あそびかた, names the SW cache, and in _app/version.json for Kit's update
 *  check): the build date (UTC) + the commit, e.g. `2026-10-29.ef93d8b`. Deterministic per commit and day. */
function appVersion(): string {
  let sha = process.env.GITHUB_SHA?.slice(0, 7);
  if (!sha) {
    try {
      sha = execSync('git rev-parse --short=7 HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
    } catch {
      sha = 'local';
    }
  }
  return `${new Date().toISOString().slice(0, 10)}.${sha}`;
}

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

/** The audio manifest (lib/sound/manifest.ts) ships without its `_readme`: only paths and loop starts reach the JS.
 *  The audio itself is never imported: it is served from static/audio/ and fetched on demand. */
const slimAudioManifest: Plugin = {
  name: 'slim-audio-manifest',
  enforce: 'pre',
  transform(code, id) {
    if (!id.split('?')[0].endsWith('/static/audio/manifest.json')) return;
    const { _readme, ...rest } = JSON.parse(code) as Record<string, unknown>;
    void _readme;
    return { code: JSON.stringify(rest), map: null };
  }
};

// A static SPA (GitHub Pages). The backend is the Apps Script web app: its /exec URL is VITE_GAS_URL.
// Output goes to build-pages/.
export default defineConfig({
  plugins: [
    slimArtManifest,
    slimAudioManifest,
    sveltekit({
      adapter: adapterStatic({ pages: 'build-pages', assets: 'build-pages', fallback: 'index.html', strict: false }),
      version: { name: appVersion() },
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
          // the hourly music plays from blob: URLs (lib/sound/engine.ts), and the first tap's silent unlock clip
          'media-src': ['self', 'blob:'],
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
