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
/** The first load's caps (gzipped) and the install-time precache's. Why each is what it is: `git log -p` on this file. */
const FIRST_JS = 373 * 1024;
const FIRST_CSS = 70 * 1024;
const PRECACHE = 3.6 * 1024 * 1024;
/** English Study's sheet chunk with the library's index. */
const ENGLISH_SHEET = 80 * 1024;
/** A 共有リンク's page (/s, build-pages/s.html): its JS before the map (a stranger's phone; its CSS is the app's, FIRST_CSS). */
const SHARE_FIRST = 250 * 1024;
/** ジム's page (/gym, build-pages/gym.html: the LINE menu's link, LINE's browser, cold, no service worker, often on
 *  mobile data): its JS and CSS, and the fonts it draws with (its own Zen Maru Gothic, styles/fonts-gym.css, and
 *  Fredoka's two), on the wire. */
const GYM_FIRST_JS = 153 * 1024;
const GYM_FIRST_CSS = 21 * 1024;
const GYM_FONTS = 170 * 1024;
/** フレーズ's deck files (lib/english/catalog.ts SHARDS), each gzipped at most. */
const ENGLISH_SHARD = 32 * 1024;
/** Chunks the first load never holds (vite's manifest: a chunk's `name`, or its source). A module the lazy features import
 *  statically too is a shared chunk, keyed by its file, not its source: by its name (`critters`: world/critters.ts, the
 *  critters' tables; the first load has world/critterBits.ts, the catch line imports the tables for its caption). */
const LAZY_NAMES = ['three.module', 'critters'];
const LAZY_SOURCES = [
  'src/lib/components/world3d/Island3D.svelte', 'src/lib/components/travel/TravelSheet.svelte', 'src/lib/components/hiking/HikingSheet.svelte',
  'src/lib/components/wedding/WeddingSheet.svelte', 'src/lib/components/health/HealthSheet.svelte', 'src/lib/components/places/PlacesSheet.svelte',
  'src/lib/components/food/FoodScan.svelte', 'src/lib/scan/decode.ts', 'src/lib/sugoroku/board3d/engine.ts',
  // the sound's player and engine (sound.svelte.ts loads them: at launch with a setting on, else at the first tap)
  'src/lib/sound/player.svelte.ts',
  // the look's part table (store/partTable.svelte.ts: asked for at launch, off the first load)
  'src/lib/contract/partIds.json',
  // the editor's 川の道 (and layout/riverPath.ts with it), imported as the tool opens
  'src/lib/components/editor/RiverTool.svelte'
];

const base = (process.env.BASE_PATH ?? '').replace(/\/$/, '');
const html = readFileSync(join(BUILD, 'index.html'), 'utf8');
const kb = (n: number) => `${(n / 1024).toFixed(1)} KB`;
const fail: string[] = [];

// the first load: index.html's own files and, transitively, their static imports (a chunk's import names a stable key:
// index.html's import map gives its file, scripts/headers.ts)
const importMap = JSON.parse(/<script type="importmap">([^<]*)<\/script>/.exec(html)?.[1] ?? '{"imports":{}}') as { imports: Record<string, string> };
/** A page's first load: its own files and their static imports. */
const firstOf = (page: string): Set<string> => closure([...page.matchAll(/(?:href|src)="([^"]+\.(?:js|css))"/g)].map((m) => m[1].slice(base.length + 1)));
/** Files and, transitively, their static imports. */
function closure(queue: string[]): Set<string> {
  const seen = new Set<string>();
  while (queue.length) {
    const f = queue.shift()!;
    if (seen.has(f)) continue;
    seen.add(f);
    if (!f.endsWith('.js')) continue;
    const dir = f.slice(0, f.lastIndexOf('/') + 1);
    for (const m of readFileSync(join(BUILD, f), 'utf8').matchAll(/(?:import|from)\s*["'](\.{1,2}\/[^"']+\.js)["']/g)) {
      const at = new URL(m[1], `http://x${base}/${dir}`).pathname;
      queue.push((importMap.imports[at] ?? at).slice(base.length + 1));
    }
  }
  return seen;
}
/** Its JS and CSS, gzipped. */
function sizes(files: Set<string>): { js: number; css: number } {
  let js = 0, css = 0;
  for (const f of files) {
    const n = gzipSync(readFileSync(join(BUILD, f))).length;
    if (f.endsWith('.css')) css += n;
    else js += n;
  }
  return { js, css };
}
const first = firstOf(html);
const { js, css } = sizes(first);
if (js > FIRST_JS) fail.push(`the first load's JS is ${kb(js)} gzipped (≤ ${kb(FIRST_JS)})`);
if (css > FIRST_CSS) fail.push(`the first load's CSS is ${kb(css)} gzipped (≤ ${kb(FIRST_CSS)})`);
// a 共有リンク's page (build-pages/s.html: a stranger's phone, the root layout and the page, no island, no MapLibre)
const shareFirst = firstOf(readFileSync(join(BUILD, 's.html'), 'utf8'));
const share = sizes(shareFirst);
if (share.js > SHARE_FIRST) fail.push(`/s's first load's JS is ${kb(share.js)} gzipped (≤ ${kb(SHARE_FIRST)})`);
for (const f of shareFirst) if (/\/(maplibre|three\.module)\./.test(f)) fail.push(`${f} is in /s's first load`);
// ジム's page (build-pages/gym.html): the root layout bare and the page, no app shell, no island
const gymFirst = firstOf(readFileSync(join(BUILD, 'gym.html'), 'utf8'));
const gym = sizes(gymFirst);
if (gym.js > GYM_FIRST_JS) fail.push(`/gym's first load's JS is ${kb(gym.js)} gzipped (≤ ${kb(GYM_FIRST_JS)})`);
if (gym.css > GYM_FIRST_CSS) fail.push(`/gym's first load's CSS is ${kb(gym.css)} gzipped (≤ ${kb(GYM_FIRST_CSS)})`);
for (const f of gymFirst) if (/\/(maplibre|three\.module|AppShell)\./.test(f)) fail.push(`${f} is in /gym's first load`);
// its fonts: the faces its CSS draws it with, its own Zen Maru Gothic first (--font-zmg) and Fredoka's (the numbers'),
// not the app's six (kana, 常用, extra: a character outside its own only)
const gymCss = [...gymFirst].filter((f) => f.endsWith('.css')).map((f) => readFileSync(join(BUILD, f), 'utf8')).join('\n');
if (!/--font-zmg:\s*["']?Zen Maru Gothic Gym["']?,/.test(gymCss)) fail.push("/gym's CSS doesn't put its own Zen Maru Gothic first (--font-zmg: styles/fonts-gym.css)");
const gymFaces = [...gymCss.matchAll(/@font-face\s*\{([^}]*)\}/g)].map((m) => m[1]).filter((b) => /font-family:\s*["']?(Zen Maru Gothic Gym|Fredoka)["']?;/.test(b));
const gymFonts = new Set(gymFaces.flatMap((b) => [...b.matchAll(/url\(\.\/([^)]+\.woff2)\)/g)].map((m) => m[1])));
if (gymFonts.size !== 4) fail.push(`/gym draws with ${gymFonts.size} font files, not 4 (its own two weights, Fredoka's two)`);
const gymFontBytes = [...gymFonts].reduce((n, f) => n + statSync(join(BUILD, '_app/immutable/assets', f)).size, 0);
if (gymFontBytes > GYM_FONTS) fail.push(`/gym's fonts are ${kb(gymFontBytes)} (≤ ${kb(GYM_FONTS)})`);

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
// nor the maps' data (vite.config.ts names every map engine's chunk maplibre.*, above): by what only it holds, the
// places' store (its '/places/sync') and the basemap's style (its tile host); chunks shared with the island would
// carry them in unnamed
for (const [what, mark] of [["the places' store", '/places/sync'], ["the basemap's style", 'tiles.openfreemap.org']]) {
  for (const f of first) if (f.endsWith('.js') && readFileSync(join(BUILD, f), 'utf8').includes(mark)) fail.push(`${f} (${what}) is in the first load`);
}
// /s's map (AllDaysMap, lazy) never holds the places' store (TripView hands it the saved places' layer; its fetch's
// '/places/sync' the store's alone; a shared chunk: by its name)
const pane = Object.values(manifest).find((x) => x.name === 'AllDaysMap' && x.file.endsWith('.js'));
if (!pane) fail.push('no AllDaysMap chunk in the build');
else for (const f of closure([...shareFirst, pane.file])) if (f.endsWith('.js') && readFileSync(join(BUILD, f), 'utf8').includes('/places/sync')) fail.push(`${f} (the places' store) is in /s's map`);

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

// 保存した場所's search lexicon (lib/places/facets.ts loadLexicon): kinds.ts's table and romaji.ts's gazetteer, as
// hashed assets fetched when the sheet opens, never in the first load nor precached (caches.ts isFeatureChunk).
const PLACES_KINDS = 24 * 1024, PLACES_GAZETTEER = 32 * 1024;
const assetDir = join(BUILD, '_app/immutable/assets');
for (const [name, cap] of [['places-kinds', PLACES_KINDS], ['places-gazetteer', PLACES_GAZETTEER]] as const) {
  const f = readdirSync(assetDir).find((x) => x.startsWith(`${name}.`) && x.endsWith('.json'));
  if (!f) {
    fail.push(`no ${name} asset in the build`);
    continue;
  }
  const path = `_app/immutable/assets/${f}`, gz = gzipSync(readFileSync(join(assetDir, f))).length;
  if (gz > cap) fail.push(`${path} is ${kb(gz)} gzipped (≤ ${kb(cap)})`);
  if (first.has(path) || precachable(path)) fail.push(`${path} (the places' search ${name}) is in the first load or the precache`);
}

// the precache: what the worker fetches at install (its index.html and its own script aside; the bare pages' shells,
// s.html and gym.html, are no files of Kit's: never precached)
let pre = 0, preFiles = 0;
const walk = (d: string) => {
  for (const e of readdirSync(d)) {
    const p = join(d, e);
    if (statSync(p).isDirectory()) walk(p);
    else {
      const r = relative(BUILD, p);
      if (/^(index|404|s|gym)\.html$|^_headers$|^service-worker\.js$/.test(r) || !precachable(r)) continue;
      const b = readFileSync(p);
      pre += /\.(js|css|json|html|svg|webmanifest)$/.test(r) ? gzipSync(b).length : b.length;
      preFiles++;
    }
  }
};
walk(BUILD);
if (pre > PRECACHE) fail.push(`the precache is ${kb(pre)} on the wire (≤ ${kb(PRECACHE)})`);

console.log(`first load (gzipped): JS ${kb(js)}, CSS ${kb(css)}, ${first.size} files, index.html ${kb(gzipSync(html).length)} (its import map); /s JS ${kb(share.js)}, CSS ${kb(share.css)}; /gym JS ${kb(gym.js)}, CSS ${kb(gym.css)}, fonts ${kb(gymFontBytes)}; precache ${preFiles} files, ${(pre / 1048576).toFixed(2)} MB on the wire; English Study's sheet ${kb(englishGz)}, ${banks.length} banks, ${deck.length} deck files ≤ ${kb(deckGz)}`);
if (fail.length) {
  console.error(`load-budget: ${fail.join('; ')}`);
  process.exit(1);
}
