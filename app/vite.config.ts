import { sveltekit } from '@sveltejs/kit/vite';
import adapterStatic from '@sveltejs/adapter-static';
import { defineConfig, type Plugin } from 'vitest/config';
import { execSync } from 'node:child_process';
import { precachable } from './src/service-worker/caches.ts';

/** The app version (the log's `build`, names the SW cache, and in _app/version.json for Kit's update check): the build date (UTC) + the commit, e.g. `2026-10-29.ef93d8b`. Deterministic per commit and day. */
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

/** The service worker's `$app/manifest` carries only what it precaches (service-worker/caches.ts precachable): Kit's
 *  lists every file of the build (~11,700: the art, the rooms, the fonts' subsets), which the worker filtered as it
 *  started, 560 KB of script (56 KB gzipped) fetched with each update check that finds a deploy. The lists are Kit's
 *  defines, set on the worker's environment just before its build; its manifest module names them, and here they're
 *  written in already filtered. */
const swPrecacheOnly: Plugin = {
  name: 'sw-precache-only',
  applyToEnvironment: (env) => env.name === 'serviceWorker',
  transform(code, id) {
    if (!id.split('?')[0].endsWith('/generated/build/app-manifest.js')) return;
    const define = (this.environment.config.define ?? {}) as Record<string, unknown>;
    let out = code;
    for (const name of ['__SVELTEKIT_MANIFEST_IMMUTABLE__', '__SVELTEKIT_MANIFEST_ASSETS__']) {
      const list = define[name];
      if (typeof list !== 'string' || !out.includes(name)) throw new Error(`vite.config.ts sw-precache-only: Kit's ${name} changed; recheck the service worker's manifest`);
      const kept = (JSON.parse(list) as { path: string }[]).filter((f) => precachable(f.path));
      out = out.replace(name, JSON.stringify(kept));
    }
    return { code: out, map: null };
  }
};

/** Vitest's file-system module cache (on by default, node_modules/.vitest-cache) keys a module on its own source: an
 *  `import.meta.glob`'s list of files was cached with it, so a file added under the glob (kikimimi's levels/parts/*.json,
 *  a new unit's chunk) stayed unseen by vitest till the cache was cleared. A module with a glob is never cached. */
const globsUncached: Plugin = {
  name: 'vitest-globs-uncached',
  configureVitest(ctx) {
    ctx.defineCacheKeyGenerator(({ sourceCode }) => (sourceCode.includes('import.meta.glob') ? false : undefined));
  }
};

/** The trip map's MapLibre chunk and its CSS under a stable name (`_app/immutable/chunks/maplibre.<hash>.js`,
 *  `assets/maplibre.<hash>.css`; its worker is `workers/maplibre-gl-worker-<hash>.js` already), so the service worker
 *  leaves them out of its precache (caches.ts isMapLibre: the map is online only). So are the maps' engines (travel's
 *  and トレイル's map/engine.ts: their basemap, fonts and layers, ~40 KB gzipped), which import MapLibre and run only
 *  with it; the bundle's check keeps any other chunk from importing MapLibre. Kit enforces its own file names in the
 *  client build; this wraps them. */
const MAP_ENGINE = /\/src\/lib\/components\/(travel|hiking)\/map\/engine\.ts$/;
const mapLibreNames: Plugin = {
  name: 'maplibre-names',
  applyToEnvironment: (env) => env.name === 'client',
  outputOptions(o) {
    const chunk = o.chunkFileNames, asset = o.assetFileNames;
    if (typeof chunk !== 'function' || typeof asset !== 'string' || !asset.endsWith('/[name].[hash][extname]')) throw new Error("vite.config.ts maplibre-names: Kit's client file names changed; recheck the map's chunk names");
    const ours = (c: { moduleIds?: readonly string[]; facadeModuleId?: string | null }) =>
      !!c.moduleIds?.some((id) => id.includes('/node_modules/maplibre-gl/')) || MAP_ENGINE.test(c.facadeModuleId ?? '');
    return {
      ...o,
      chunkFileNames: (c) => (ours(c) ? chunk(c).replace('[hash]', 'maplibre.[hash]') : chunk(c)),
      // (a chunk's CSS has no module ids: MapLibre's is told by its own selectors)
      assetFileNames: (a) => (a.names.some((n) => n.endsWith('.css')) && String(a.source).includes('.maplibregl-map') ? asset.replace('[name]', 'maplibre') : asset)
    };
  },
  generateBundle(_, bundle) {
    // a chunk that imports MapLibre is only of use with it (online): out of the precache with it, by its name
    const isMap = (f: string) => /(^|\/)maplibre\./.test(f.slice(f.lastIndexOf('/') + 1));
    for (const c of Object.values(bundle)) {
      if (c.type === 'chunk' && !isMap(c.fileName) && c.imports.some(isMap)) throw new Error(`vite.config.ts maplibre-names: ${c.fileName} imports MapLibre statically (${[...c.moduleIds].find((id) => id.includes('/src/'))}); name it a map chunk or import MapLibre lazily`);
    }
  }
};

/** ききみみ's recogniser (lib/mic/backends/whisper.worker.ts: transformers.js and the ONNX runtime's JS, ~1 MB) under a
 *  stable name (`_app/immutable/workers/stt.<hash>.js`, a split chunk `workers/chunks/stt.<hash>.js`), so the service
 *  worker leaves it out of its precache and serves it from the recogniser's own cache (caches.ts isStt). A worker's
 *  build has its own output names (Kit's `worker` options); this wraps them. */
const STT_WORKER = /\/src\/lib\/mic\/backends\/whisper\.worker\.ts$/;
const sttNames: Plugin = {
  name: 'stt-names',
  outputOptions(o) {
    const entry = o.entryFileNames, chunk = o.chunkFileNames;
    if (typeof entry !== 'string' || typeof chunk !== 'string' || !entry.endsWith('/workers/[name]-[hash].js') || !chunk.endsWith('/workers/chunks/[hash].js')) throw new Error("vite.config.ts stt-names: Kit's worker file names changed; recheck the recogniser's names");
    const ours = (c: { facadeModuleId?: string | null; moduleIds?: readonly string[] }) =>
      STT_WORKER.test(c.facadeModuleId ?? '') || !!c.moduleIds?.some((id) => id.includes('/node_modules/@huggingface/transformers/') || id.includes('/node_modules/onnxruntime-'));
    return {
      ...o,
      entryFileNames: (c) => (ours(c) ? entry.replace('[name]-[hash]', 'stt.[hash]') : entry),
      chunkFileNames: (c) => (ours(c) ? chunk.replace('[hash]', 'stt.[hash]') : chunk)
    };
  }
};

// A static SPA (GitHub Pages). The backend is the relay: the record at its /api (lib/sync/transport.ts), the room at /room.
// Output goes to build-pages/.
export default defineConfig({
  plugins: [
    slimArtManifest,
    slimAudioManifest,
    preloadListenersOff,
    swPrecacheOnly,
    globsUncached,
    mapLibreNames,
    sveltekit({
      adapter: adapterStatic({ pages: 'build-pages', assets: 'build-pages', fallback: 'index.html', strict: false }),
      version: { name: appVersion() },
      paths: { base: (process.env.BASE_PATH ?? '') as '' | `/${string}` },
      // SvelteKit writes this as a <meta http-equiv> tag and adds the hash of its inline bootstrap script to
      // script-src; scripts/headers.ts copies it into build-pages/_headers too. Only the relay (its socket, lib/sync/live.ts LIVE_URL, and the record's /api,
      // lib/sync/transport.ts) and the trip map's tiles are reachable besides our own.
      csp: {
        mode: 'hash',
        directives: {
          'default-src': ['self'],
          // + the trip map's basemap (components/travel/map/style.ts BASEMAP: OpenFreeMap's TileJSON and tiles, fetched by
          // MapLibre's worker; its fonts are ours), and トレイル's raster topo (components/hiking/map/style.ts TOPO: USGS
          // Topo, GSI 地理院タイル; fetched, then decoded from blob:)
          'connect-src': ['self', 'wss://island-fund-relay.island-fund-relay.workers.dev', 'https://island-fund-relay.island-fund-relay.workers.dev', 'https://tiles.openfreemap.org', 'https://basemap.nationalmap.gov', 'https://cyberjapandata.gsi.go.jp', 'blob:'],
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
  // The recogniser's worker (sttNames): the ONNX runtime's build that takes its wasm from where it's told
  // (lib/mic/backends/whisper.worker.ts: `/stt/ort/<ver>/`), not the bundle's, which names its 27 MB wasm for Vite to
  // emit (over Pages' 25 MiB a file, and into the precache).
  resolve: { alias: [{ find: /^onnxruntime-web\/webgpu$/, replacement: `${import.meta.dirname}/node_modules/onnxruntime-web/dist/ort.webgpu.min.mjs` }] },
  worker: { format: 'es', plugins: () => [sttNames] },
  build: {
    // The two phones it's for: an iPhone 15 and an iPhone 16 (shipped with iOS 17 and 18), on Safari.
    target: ['safari17', 'ios17'],
    cssTarget: ['safari17', 'ios17'],
    // Fonts ship as separate files (fetched per unicode-range subset) instead of base64 in the blocking CSS.
    assetsInlineLimit: (file) => (/\.woff2?$/.test(file) ? false : undefined)
  },
  test: { include: ['src/**/*.test.ts'] }
});
