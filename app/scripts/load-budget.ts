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
import { SHARDS } from '../src/lib/english/catalog.ts';

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
 *  once used (2026-11-11: caches.ts carried); 2.85 → 2.64 MB with ききみみ's sheet gone (2026-11-16); 2.92 → 2.77 MB with
 *  英語すごろく's word lists carried once used (2026-11-18). */
const FIRST_JS = 400 * 1024;
const FIRST_CSS = 70 * 1024;
const PRECACHE = 3 * 1024 * 1024;
/** English Study's sheet chunk with the library's index (2026-11-16: 133.7 KB with the 25 banks inside, 18.5 KB without). */
const ENGLISH_SHEET = 80 * 1024;
/** フレーズ's deck files (lib/english/catalog.ts SHARDS), each gzipped at most (2026-11-17: 10, ≤ 28.1 KB with the 意味, ~2,400 cards). */
const ENGLISH_SHARD = 32 * 1024;
/** Chunks the first load never holds (vite's manifest: a chunk's `name`, or its source). */
const LAZY_NAMES = ['three.module'];
const LAZY_SOURCES = [
  'src/lib/components/world3d/Island3D.svelte', 'src/lib/components/travel/TravelSheet.svelte', 'src/lib/components/hiking/HikingSheet.svelte',
  'src/lib/components/wedding/WeddingSheet.svelte', 'src/lib/components/health/HealthSheet.svelte',
  'src/lib/components/food/FoodScan.svelte', 'src/lib/scan/decode.ts', 'src/lib/components/sugoroku3d/engine.ts'
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

// what a phone may never open (the English catalogs, the wedding board, ごはん's scanner, すごろく's word lists:
// vite.config.ts feature-names): carried
const feats = readdirSync(join(BUILD, '_app/immutable/chunks')).filter((f) => /^(en|en-[\w-]+|wedding|scan|sg)\./.test(f)).map((f) => `_app/immutable/chunks/${f}`);
for (const f of feats) if (first.has(f) || precachable(f)) fail.push(`${f} (a feature carried once used) is in the first load or the precache`);

// English Study: its banks are files fetched on use (caches.ts isEnglishData), never precached; its sheet's chunk holds
// the library's index, which grows with the clips (~41 KB gzipped at 1,000), so it's capped
const banks = readdirSync(join(BUILD, 'english/c'));
if (!banks.length) fail.push('no English Study banks in build-pages/english/c/');
for (const b of banks) if (precachable(`english/c/${b}`)) fail.push(`english/c/${b} (an English Study bank) is precachable`);
// フレーズ's deck: SHARDS files, never precached, each ≤ ENGLISH_SHARD (past it: raise SHARDS, a constant)
const deck = readdirSync(join(BUILD, 'english/p'));
if (deck.length !== SHARDS) fail.push(`build-pages/english/p/ has ${deck.length} deck files, not ${SHARDS}`);
let deckGz = 0;
for (const f of deck) {
  const gz = gzipSync(readFileSync(join(BUILD, 'english/p', f))).length;
  deckGz = Math.max(deckGz, gz);
  if (precachable(`english/p/${f}`)) fail.push(`english/p/${f} (a フレーズ deck file) is precachable`);
  if (gz > ENGLISH_SHARD) fail.push(`english/p/${f} is ${kb(gz)} gzipped (≤ ${kb(ENGLISH_SHARD)}: raise catalog.ts SHARDS)`);
}
const englishSheet = manifest['src/lib/english/components/EnglishSheet.svelte'];
const englishGz = englishSheet ? gzipSync(readFileSync(join(BUILD, englishSheet.file))).length : 0;
if (!englishSheet) fail.push('no English Study sheet chunk in the build');
else if (englishGz > ENGLISH_SHEET) fail.push(`English Study's sheet chunk is ${kb(englishGz)} gzipped (≤ ${kb(ENGLISH_SHEET)}: its banks bundled?)`);

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

console.log(`first load (gzipped): JS ${kb(js)}, CSS ${kb(css)}, ${first.size} files, index.html ${kb(gzipSync(html).length)} (its import map); precache ${preFiles} files, ${(pre / 1048576).toFixed(2)} MB on the wire; English Study's sheet ${kb(englishGz)}, ${banks.length} banks, ${deck.length} deck files ≤ ${kb(deckGz)}`);
if (fail.length) {
  console.error(`load-budget: ${fail.join('; ')}`);
  process.exit(1);
}
