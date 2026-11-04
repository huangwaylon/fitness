import { sveltekit } from '@sveltejs/kit/vite';
import adapterStatic from '@sveltejs/adapter-static';
import { defineConfig, type Plugin } from 'vitest/config';
import { execSync } from 'node:child_process';

/** The app version (shown in せってい → あそびかた, names the SW cache, and in _app/version.json for Kit's update
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

/** The art manifest is bundled into the main chunk (lib/art.ts): ship only each key's size, packed per folder (every
 *  file is `<key>.webp`, so the path is implied; the `source` credit URLs stay in static/art/manifest.json for the
 *  runbook). Per folder (`villagers`, and `villagers/*-icon` for the `-icon` keys): its most common size, the height most
 *  of the rest share, the names at the common size and `name:w` / `name:w:h` for the others; art.ts unpacks it.
 *  ~1,300 keys in 13 KB instead of 40. */
type Packed = Record<string, [w: number, h: number, h2: number, plain: string, odd: string]>;
const slimArtManifest: Plugin = {
  name: 'slim-art-manifest',
  enforce: 'pre',
  transform(code, id) {
    if (!id.split('?')[0].endsWith('/static/art/manifest.json')) return;
    const { files } = JSON.parse(code) as { files: Record<string, { path: string; w: number; h: number }> };
    const groups = new Map<string, Map<string, [number, number]>>();
    for (const [k, { path, w, h }] of Object.entries(files)) {
      if (path !== `${k}.webp`) throw new Error(`static/art/manifest.json: ${k} is not at ${k}.webp (lib/art.ts assumes it)`);
      const cut = k.lastIndexOf('/'), icon = k.endsWith('-icon');
      const g = icon ? `${k.slice(0, cut)}/*-icon` : k.slice(0, cut), n = k.slice(cut + 1, icon ? -5 : undefined);
      if (/[,:]/.test(n)) throw new Error(`static/art/manifest.json: ${k} has a , or : (the packing's separators)`);
      if (!groups.has(g)) groups.set(g, new Map());
      groups.get(g)!.set(n, [w, h]);
    }
    const commonest = <T>(xs: T[]): T => {
      const n = new Map<string, [T, number]>();
      for (const x of xs) { const k = String(x); n.set(k, [x, (n.get(k)?.[1] ?? 0) + 1]); }
      return [...n.values()].sort((a, b) => b[1] - a[1])[0][0];
    };
    const packed: Packed = {};
    for (const [g, items] of groups) {
      const [w, h] = commonest([...items.values()]);
      const h2 = commonest([...items.values()].map((s) => s[1]));
      const plain: string[] = [], odd: string[] = [];
      for (const [n, [iw, ih]] of items) {
        if (iw === w && ih === h) plain.push(n);
        else odd.push(ih === h2 ? `${n}:${iw}` : `${n}:${iw}:${ih}`);
      }
      packed[g] = [w, h, h2, plain.join(','), odd.join(',')];
    }
    return { code: JSON.stringify({ files: packed }), map: null };
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

/** Vite's preload helper (a lazy chunk's CSS: a <link> in the head, kept) leaves its load and error listeners on the
 *  link, and the error one's closure holds the import's thunk, so the component that first asked for that CSS (a whole
 *  island: its DOM, its WebGL context) stays alive for the page's life (docs/ops/testing.md "Memory"). Both go once
 *  either fires. */
const preloadListenersOff: Plugin = {
  name: 'preload-listeners-off',
  enforce: 'post',
  transform(code, id) {
    if (id !== '\0vite/preload-helper.js') return;
    const re = /link\.addEventListener\("load", res\);\s*link\.addEventListener\("error", \(\) => rej\((.*)\)\);/;
    const m = re.exec(code);
    if (!m) throw new Error("vite.config.ts preload-listeners-off: Vite's preload helper changed; recheck its CSS link listeners");
    const off = `const off = new AbortController(), o = { signal: off.signal };
      link.addEventListener("load", () => (off.abort(), res()), o);
      link.addEventListener("error", () => (off.abort(), rej(${m[1]})), o);`;
    return { code: code.replace(re, () => off), map: null };
  }
};

// A static SPA (GitHub Pages). The backend is the relay: the record at its /api (lib/sync/transport.ts), the room at /room.
// Output goes to build-pages/.
export default defineConfig({
  plugins: [
    slimArtManifest,
    slimAudioManifest,
    preloadListenersOff,
    sveltekit({
      adapter: adapterStatic({ pages: 'build-pages', assets: 'build-pages', fallback: 'index.html', strict: false }),
      version: { name: appVersion() },
      paths: { base: (process.env.BASE_PATH ?? '/fitness') as `/${string}` },
      // Static hosting has no headers: SvelteKit writes this as a <meta http-equiv> tag and adds the hash of its
      // inline bootstrap script to script-src. Only the relay (its socket, lib/sync/live.ts LIVE_URL, the record's /api,
      // lib/sync/transport.ts, and its /push/* endpoints, lib/sync/push.ts PUSH_URL) is reachable besides our own.
      csp: {
        mode: 'hash',
        directives: {
          'default-src': ['self'],
          'connect-src': ['self', 'wss://island-fund-relay.island-fund-relay.workers.dev', 'https://island-fund-relay.island-fund-relay.workers.dev', 'blob:'],
          // the tent's models carry their textures inside (three.js decodes them from blob: URLs)
          'img-src': ['self', 'data:', 'blob:'],
          // the hourly music plays from blob: URLs (lib/sound/engine.ts), and the first tap's silent unlock clip
          'media-src': ['self', 'blob:'],
          'style-src': ['self', 'unsafe-inline'],
          // the tent's meshopt decoder is WebAssembly (compiled, never eval'd JavaScript)
          'script-src': ['self', 'wasm-unsafe-eval'],
          'object-src': ['none'],
          'base-uri': ['self'],
          'form-action': ['none']
        }
      }
    })
  ],
  build: {
    // The two phones it's for: an iPhone 15 and an iPhone 16 (shipped with iOS 17 and 18), on Safari.
    target: ['safari17', 'ios17'],
    cssTarget: ['safari17', 'ios17'],
    // Fonts ship as separate files (fetched per unicode-range subset) instead of base64 in the blocking CSS.
    assetsInlineLimit: (file) => (/\.woff2?$/.test(file) ? false : undefined)
  },
  test: { include: ['src/**/*.test.ts', 'gas/**/*.test.ts'] }
});
