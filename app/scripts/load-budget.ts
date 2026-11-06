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
/** 2026-11-07: 365 KB of JS, 60 KB of CSS (most of it the fonts' 150 unicode-range rules); the precache 2.6 MB. */
const FIRST_JS = 400 * 1024;
const FIRST_CSS = 70 * 1024;
const PRECACHE = 3 * 1024 * 1024;
/** Chunks the first load never holds (vite's manifest: a chunk's `name`, or its source). */
const LAZY_NAMES = ['three.module'];
const LAZY_SOURCES = [
  'src/lib/components/world3d/Island3D.svelte', 'src/lib/components/travel/TravelSheet.svelte', 'src/lib/components/hiking/HikingSheet.svelte',
  'src/lib/components/wedding/WeddingSheet.svelte', 'src/lib/components/kikimimi/KikimimiSheet.svelte', 'src/lib/components/food/Food.svelte'
];

const base = (process.env.BASE_PATH ?? '').replace(/\/$/, '');
const html = readFileSync(join(BUILD, 'index.html'), 'utf8');
const kb = (n: number) => `${(n / 1024).toFixed(1)} KB`;
const fail: string[] = [];

// the first load: index.html's own files and, transitively, their static imports
const first = new Set<string>();
const queue = [...html.matchAll(/(?:href|src)="([^"]+\.(?:js|css))"/g)].map((m) => m[1].slice(base.length + 1));
while (queue.length) {
  const f = queue.shift()!;
  if (first.has(f)) continue;
  first.add(f);
  if (!f.endsWith('.js')) continue;
  const dir = f.slice(0, f.lastIndexOf('/') + 1);
  for (const m of readFileSync(join(BUILD, f), 'utf8').matchAll(/(?:import|from)\s*["'](\.{1,2}\/[^"']+\.js)["']/g)) queue.push(new URL(m[1], `http://x/${dir}`).pathname.slice(1));
}
let js = 0, css = 0;
for (const f of first) {
  const n = gzipSync(readFileSync(join(BUILD, f))).length;
  if (f.endsWith('.css')) css += n;
  else js += n;
}
if (js > FIRST_JS) fail.push(`the first load's JS is ${kb(js)} gzipped (≤ ${kb(FIRST_JS)})`);
if (css > FIRST_CSS) fail.push(`the first load's CSS is ${kb(css)} gzipped (≤ ${kb(FIRST_CSS)})`);

const manifest = JSON.parse(readFileSync(MANIFEST, 'utf8')) as Record<string, { file: string; name?: string }>;
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

console.log(`first load (gzipped): JS ${kb(js)}, CSS ${kb(css)}, ${first.size} files; precache ${preFiles} files, ${(pre / 1048576).toFixed(2)} MB on the wire`);
if (fail.length) {
  console.error(`load-budget: ${fail.join('; ')}`);
  process.exit(1);
}
