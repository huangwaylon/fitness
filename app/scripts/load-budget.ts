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
/** 2026-11-07: 365 KB of JS, 60 KB of CSS (most of it the fonts' 150 unicode-range rules); the precache 2.6 MB, then
 *  3.3 MB with offline phase A (docs/backend.md "Service worker" › Offline: the common font slices 0.7 MB, the trips'
 *  covers and heroes and the trails' tracks 0.26 MB), so its cap 3 → 3.5 MB; 3.6 MB with wave 2's lanes and the mic
 *  games' pages (ロールプレイ's took it past 3.5); 2.88 MB with ききみみ's parts (levels/parts/*.json's chunks, 0.69 MB:
 *  useless offline without their audio packs, which aren't precached either) kept on first use instead (caches.ts
 *  isKikiPart), so the cap back to 3 MB. */
const FIRST_JS = 400 * 1024;
const FIRST_CSS = 70 * 1024;
const PRECACHE = 3 * 1024 * 1024;
/** ききみみ's recogniser (docs/kikimimi-mic.md §3.6): its worker (`workers/stt.<hash>.js`: transformers.js and the ONNX
 *  runtime's JS) is one file ≤ STT_JS gzipped, never precached, never in the first load; 2026-11-07: 136 KB. */
const STT_JS = 450 * 1024;
/** ききみみ's mic core (§3.6: lib/mic/session.ts, its capture and VAD, the worklet): a lazy chunk and what it alone
 *  loads ≤ MIC_JS gzipped; 2026-11-07: see the build's line. */
const MIC_JS = 10 * 1024;
const MIC_CORE = 'src/lib/mic/session.ts';
/** Chunks the first load never holds (vite's manifest: a chunk's `name`, or its source). */
const LAZY_NAMES = ['three.module'];
const LAZY_SOURCES = [
  'src/lib/components/world3d/Island3D.svelte', 'src/lib/components/travel/TravelSheet.svelte', 'src/lib/components/hiking/HikingSheet.svelte',
  'src/lib/components/wedding/WeddingSheet.svelte', 'src/lib/components/kikimimi/KikimimiSheet.svelte', 'src/lib/components/food/Food.svelte',
  'src/lib/components/kikimimi/mic/MicProbe.svelte', 'src/lib/components/kikimimi/mic/MicOptIn.svelte', MIC_CORE
];
/** Nor any chunk of the mic's own code (lib/mic/). */
const LAZY_DIRS = ['src/lib/mic/'];

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
for (const [src, c] of Object.entries(manifest)) if (LAZY_DIRS.some((d) => src.startsWith(d)) && first.has(c.file)) fail.push(`${src} is in the first load (it must stay lazy)`);
for (const f of first) if (/\/maplibre\./.test(f)) fail.push(`${f} (MapLibre) is in the first load`);

// the mic core: its chunk and the chunks and scripts (the worklet; not a Worker's) it imports that the first load doesn't hold
let micGz = 0;
{
  const seen = new Set<string>(), files = new Set<string>(), todo = [MIC_CORE];
  while (todo.length) {
    const k = todo.pop()!, c = manifest[k];
    if (!c || seen.has(k) || first.has(c.file)) continue;
    seen.add(k);
    files.add(c.file);
    for (const a of c.assets ?? []) if (a.endsWith('.js') && !a.includes('/workers/')) files.add(a);
    todo.push(...(c.imports ?? []));
  }
  for (const f of files) micGz += gzipSync(readFileSync(join(BUILD, f))).length;
  if (micGz > MIC_JS) fail.push(`the mic core is ${kb(micGz)} gzipped (≤ ${kb(MIC_JS)})`);
}

// the recogniser's worker: one file, its own line, never precached nor loaded first
const workers = join(BUILD, '_app/immutable/workers');
const stt = readdirSync(workers).filter((f) => /^stt\./.test(f)).map((f) => `_app/immutable/workers/${f}`);
const sttGz = stt.length === 1 ? gzipSync(readFileSync(join(BUILD, stt[0]))).length : 0;
if (stt.length !== 1) fail.push(`${stt.length} recogniser workers (_app/immutable/workers/stt.*.js; vite.config.ts stt-names): one expected`);
else if (sttGz > STT_JS) fail.push(`the recogniser's worker is ${kb(sttGz)} gzipped (≤ ${kb(STT_JS)})`);
for (const f of stt) if (first.has(f) || precachable(f)) fail.push(`${f} (the recogniser) is in the first load or the precache`);
// ききみみ's parts: never precached (vite.config.ts kiki-part-names names them)
const parts = readdirSync(join(BUILD, '_app/immutable/chunks')).filter((f) => /^kiki-/.test(f)).map((f) => `_app/immutable/chunks/${f}`);
if (!parts.length) fail.push('no ききみみ part chunks (_app/immutable/chunks/kiki-*.js; vite.config.ts kiki-part-names)');
for (const f of parts) if (first.has(f) || precachable(f)) fail.push(`${f} (a ききみみ part) is in the first load or the precache`);

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

console.log(`first load (gzipped): JS ${kb(js)}, CSS ${kb(css)}, ${first.size} files; precache ${preFiles} files, ${(pre / 1048576).toFixed(2)} MB on the wire; the recogniser's worker ${kb(sttGz)}; the mic core ${kb(micGz)}`);
if (fail.length) {
  console.error(`load-budget: ${fail.join('; ')}`);
  process.exit(1);
}
