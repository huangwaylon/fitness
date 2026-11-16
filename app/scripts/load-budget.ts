// The first load's budget, after scripts/headers.ts (npm run build runs it): what build-pages/index.html loads before
// the island can paint (its scripts, modulepreloads and stylesheets: the root layout's and the island page's, the
// static imports of each) ≤ FIRST_JS / FIRST_CSS gzipped; none of it three.js, MapLibre nor a feature's sheet (each
// lazy: imported when opened); and the service worker's install-time precache (service-worker/caches.ts precachable)
// ≤ PRECACHE. Bytes only, no timing (docs/ops/testing.md): deterministic per build. Over one, the build fails: make
// what grew lazy, or raise the cap here with the reason.
//   node scripts/load-budget.ts
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { gzipSync } from 'node:zlib';
import { precachable } from '../src/service-worker/caches.ts';

const APP = join(import.meta.dirname, '..');
const BUILD = join(APP, 'build-pages');
const MANIFEST = join(APP, '.svelte-kit/output/client/.vite/manifest.json');
/** 2026-11-07: 365 KB of JS, 60 KB of CSS (most of it the fonts' 150 unicode-range rules; 2026-11-11: 396.9 KB of
 *  JS, 361.3 with the critters, the day's finds and the weeds lazy: island/SceneTaps.svelte); the precache 2.6 MB, then
 *  3.3 MB with offline phase A (docs/backend.md "Service worker" › Offline: the common font slices 0.7 MB, the trips'
 *  covers and heroes and the trails' tracks 0.26 MB), so its cap 3 → 3.5 MB; 3.6 MB with wave 2's lanes and the mic
 *  games' pages (ロールプレイ's took it past 3.5); 2.88 MB with ききみみ's parts (levels/parts/*.json's chunks, 0.69 MB:
 *  useless offline without their audio packs, which aren't precached either) kept on first use instead (caches.ts
 *  isKikiPart), so the cap back to 3 MB; 2.94 → 2.61 MB with the wedding's and the trips' heroes cached on first view
 *  (2026-11-09: caches.ts isGuidePhoto); 2.95 → 2.85 MB with the English catalogs and the wedding board carried
 *  once used (2026-11-11: caches.ts carried); 2.85 → 2.64 MB with ききみみ's sheet gone (2026-11-16). */
const FIRST_JS = 400 * 1024;
const FIRST_CSS = 70 * 1024;
const PRECACHE = 3 * 1024 * 1024;
/** Chunks the first load never holds (vite's manifest: a chunk's `name`, or its source). */
const LAZY_NAMES = ['three.module'];
const LAZY_SOURCES = [
  'src/lib/components/world3d/Island3D.svelte', 'src/lib/components/travel/TravelSheet.svelte', 'src/lib/components/hiking/HikingSheet.svelte',
  'src/lib/components/wedding/WeddingSheet.svelte', 'src/lib/components/health/HealthSheet.svelte',
  'src/lib/components/food/FoodScan.svelte', 'src/lib/scan/decode.ts'
];

const base = (process.env.BASE_PATH ?? '').replace(/\/$/, '');
const html = readFileSync(join(BUILD, 'index.html'), 'utf8');
const kb = (n: number) => `${(n / 1024).toFixed(1)} KB`;
const fail: string[] = [];

// the first load: index.html's own files and, transitively, their static imports (a chunk's import names a stable key:
// index.html's import map gives its file, scripts/headers.ts)
const importMap = JSON.parse(/<script type="importmap">([^<]*)<\/script>/.exec(html)?.[1] ?? '{"imports":{}}') as { imports: Record<string, string> };
const first = new Set<string>();
const queue = [...html.matchAll(/(?:href|src)="([^"]+\.(?:js|css))"/g)].map((m) => m[1].slice(base.length + 1));
while (queue.length) {
  const f = queue.shift()!;
  if (first.has(f)) continue;
  first.add(f);
  if (!f.endsWith('.js')) continue;
  const dir = f.slice(0, f.lastIndexOf('/') + 1);
  for (const m of readFileSync(join(BUILD, f), 'utf8').matchAll(/(?:import|from)\s*["'](\.{1,2}\/[^"']+\.js)["']/g)) {
    const at = new URL(m[1], `http://x${base}/${dir}`).pathname;
    queue.push((importMap.imports[at] ?? at).slice(base.length + 1));
  }
}
let js = 0, css = 0;
for (const f of first) {
  const n = gzipSync(readFileSync(join(BUILD, f))).length;
  if (f.endsWith('.css')) css += n;
  else js += n;
}
if (js > FIRST_JS) fail.push(`the first load's JS is ${kb(js)} gzipped (≤ ${kb(FIRST_JS)})`);
if (css > FIRST_CSS) fail.push(`the first load's CSS is ${kb(css)} gzipped (≤ ${kb(FIRST_CSS)})`);

const manifest = JSON.parse(readFileSync(MANIFEST, 'utf8')) as Record<string, { file: string; name?: string; imports?: string[]; assets?: string[] }>;
for (const name of LAZY_NAMES) {
  const c = Object.values(manifest).find((x) => x.name === name);
  if (!c) fail.push(`no ${name} chunk in the build`);
  else if (first.has(c.file)) fail.push(`${name} is in the first load (it must stay lazy)`);
}
for (const src of LAZY_SOURCES) {
  const c = manifest[src];
  if (!c) fail.push(`no ${src} chunk in the build (it must stay lazy)`);
  else if (first.has(c.file)) fail.push(`${src} is in the first load (it must stay lazy)`);
}
for (const f of first) if (/\/maplibre\./.test(f)) fail.push(`${f} (MapLibre) is in the first load`);

// what a phone may never open (the English catalogs, the wedding board: vite.config.ts feature-names): carried
const feats = readdirSync(join(BUILD, '_app/immutable/chunks')).filter((f) => /^(en|en-[\w-]+|wedding)\./.test(f)).map((f) => `_app/immutable/chunks/${f}`);
for (const f of feats) if (first.has(f) || precachable(f)) fail.push(`${f} (a feature carried once used) is in the first load or the precache`);

// the precache: what the worker fetches at install (its index.html and its own script aside)
let pre = 0, preFiles = 0;
const walk = (d: string) => {
  for (const e of readdirSync(d)) {
    const p = join(d, e);
    if (statSync(p).isDirectory()) walk(p);
    else {
      const r = relative(BUILD, p);
      if (/^(index|404)\.html$|^_headers$|^service-worker\.js$/.test(r) || !precachable(r)) continue;
      const b = readFileSync(p);
      pre += /\.(js|css|json|html|svg|webmanifest)$/.test(r) ? gzipSync(b).length : b.length;
      preFiles++;
    }
  }
};
walk(BUILD);
if (pre > PRECACHE) fail.push(`the precache is ${kb(pre)} on the wire (≤ ${kb(PRECACHE)})`);

console.log(`first load (gzipped): JS ${kb(js)}, CSS ${kb(css)}, ${first.size} files, index.html ${kb(gzipSync(html).length)} (its import map); precache ${preFiles} files, ${(pre / 1048576).toFixed(2)} MB on the wire`);
if (fail.length) {
  console.error(`load-budget: ${fail.join('; ')}`);
  process.exit(1);
}
