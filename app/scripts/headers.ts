// Writes build-pages/_headers, the response headers Cloudflare Pages serves the site with (docs/ops/runbook.md §1). `npm run build` runs it after `vite build`.
// - The Content-Security-Policy is the one SvelteKit wrote into index.html's <meta> (vite.config.ts `csp`: the relay's
//   origins, data:/blob: images and media, the hash of its inline bootstrap script, inline styles), plus what a <meta>
//   can't carry: frame-ancestors 'none'. The <meta> stays (the same policy; both apply).
// - The Permissions-Policy turns every powerful feature off but geolocation, the camera, the mic and the motion sensors,
//   which only our origin may ask for (the maps' locate buttons, ごはん's barcode scanner, the speech test, a trail map's
//   進行方向: the compass).
// - Hashed files (`_app/immutable/`) are cached for a year, and so is the audio (`audio/`): every audio URL the app
//   fetches carries its file's content hash (`?v=`, lib/sound/manifest.ts: sound.test fails on a file whose bytes
//   changed alone), and so are ごはん's picture sheets (`food-img/*.webp`:
//   their names carry their content hash), the rooms' and the players' packs (`room/pack/*.pak`, `room/player/*.pak`:
//   `<name>.<hash>.pak`, more.json and parts.json name them), the island's KTX2 packs (`room/tex/`: named by their
//   images' hashes, fetched with the encoder's `?e=`), the Basis transcoder (`room/basis/`, fetched with its `?v=`), and the models (`*.glb`, all
//   under room/: every load carries its manifest's `?v=`, the converter's hash, and the room cache keeps them by URL
//   for good anyway; world3d/hashed.test checks each file has its manifest's `v`); everything else keeps Pages'
//   default (revalidated: art/, terrain/, room/homes' loose KTX2s). One rule a path: Pages joins
//   two rules' same header with a comma.
// - index.html (the SPA shell every route opens with) preloads the island's page too: Kit's fallback page preloads
//   only the root layout's chunks, so the island page's chunk and its own imports were asked for only once the
//   layout's had run (the startup review). Its chunk and its static imports, transitively, as modulepreload; its
//   stylesheets as preload, crossorigin as Vite asks for them (else the preload goes unused and they come twice).
//   (Before 404.html is copied from it: `npm run build`.)
// - index.html carries the chunks' import map (vite.config.ts chunkImportMap: a chunk imports another by a stable key),
//   inline before any module, its hash added to the CSP's script-src.
// - The models (`*.glb`, ~1,800 files, 51 MB) and the room and player packs go as application/x-protobuf: Cloudflare
//   compresses only the types on its list, and model/gltf-binary and octet-stream aren't (gzip takes 28 % off the
//   models, ~16 % off the packs); the loaders read the bytes whatever the type, and none trusts content-length (a
//   compressed answer has none).
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { BOOT_WATCH_JS } from '../src/lib/ui-state/bootWatch.ts';

const root = join(import.meta.dirname, '..', 'build-pages');
const base = (process.env.BASE_PATH ?? '').replace(/\/$/, '');
let html = readFileSync(join(root, 'index.html'), 'utf8');

// a page's chunk and its static imports, transitively (Kit's generated nodes: the one whose component is `page`, a
// path under src/routes), as the preloads `html` lacks
/** The island page's scene (routes/+page.svelte imports it lazily: the HUD first). */
const ISLAND_SCENE = 'src/lib/components/island/IslandScene.svelte';
function preloadsOf(page: string, html: string): string[] {
  const nodes = join(import.meta.dirname, '..', '.svelte-kit', 'generated', 'build', 'client-optimized', 'nodes');
  const re = new RegExp(`from "(\\.\\./)+src/routes/${page.replace(/[+.]/g, '\\$&')}"`);
  const node = readdirSync(nodes).find((f) => re.test(readFileSync(join(nodes, f), 'utf8')));
  if (!node) throw new Error(`headers: no node for src/routes/${page}`);
  type Chunk = { file: string; imports?: string[]; dynamicImports?: string[]; css?: string[] };
  const manifest = JSON.parse(readFileSync(join(import.meta.dirname, '..', '.svelte-kit', 'output', 'client', '.vite', 'manifest.json'), 'utf8')) as Record<string, Chunk>;
  const key = Object.keys(manifest).find((k) => k.endsWith(`client-optimized/nodes/${node}`));
  if (!key) throw new Error(`headers: ${node} not in the client manifest`);
  const js = new Set<string>(), css = new Set<string>();
  const walk = (k: string) => {
    const c = manifest[k];
    if (!c || js.has(c.file)) return;
    js.add(c.file);
    for (const f of c.css ?? []) css.add(f);
    for (const i of c.imports ?? []) walk(i);
  };
  walk(key);
  // and the island's scene, which the page mounts lazily (its HUD first): fetched with the page's, not after it runs
  for (const k of manifest[key].dynamicImports ?? []) if (k.endsWith(ISLAND_SCENE)) walk(k);
  const has = (f: string) => html.includes(`"${base}/${f}"`);
  return [...[...js].filter((f) => !has(f)).map((f) => `<link href="${base}/${f}" rel="modulepreload">`), ...[...css].filter((f) => !has(f)).map((f) => `<link href="${base}/${f}" rel="preload" as="style" crossorigin>`)];
}
/** `html` with `links` after its last modulepreload, marked `mark`. */
function withPreloads(html: string, mark: string, links: string[]): string {
  const at = html.lastIndexOf('rel="modulepreload">');
  if (at < 0) throw new Error('headers: no modulepreload in build-pages/index.html');
  const end = at + 'rel="modulepreload">'.length;
  return `${html.slice(0, end)}\n\t\t<!-- ${mark} (scripts/headers.ts) -->\n\t\t${links.join('\n\t\t')}${html.slice(end)}`;
}
/** The island page's preloads (as withPreloads put them) taken out again. */
const ISLAND_PRELOADS = /\n\t\t<!-- data-island-preload[^>]*-->(?:\n\t\t<link href="[^"]+" rel="(?:modulepreload|preload" as="style" crossorigin)">)*/;

if (!html.includes('data-island-preload')) {
  const links = preloadsOf('+page.svelte', html);
  html = withPreloads(html, "data-island-preload: the island page's chunks", links);
  writeFileSync(join(root, 'index.html'), html);
  console.log(`build-pages/index.html: the island page's ${links.length} preloads`);
}

{
  // the chunks' import map (vite.config.ts chunkImportMap: build-pages/importmap.json) inline, first in the head (before
  // any module is fetched), its paths from the site's root (Vite writes them from the page's: a route's own path broke
  // them), its hash in the CSP's script-src
  const file = join(root, 'importmap.json');
  if (existsSync(file)) {
    const { imports } = JSON.parse(readFileSync(file, 'utf8')) as { imports: Record<string, string> };
    const abs = (u: string) => (u.startsWith('./_app/') ? `${base}/${u.slice(2)}` : u);
    const json = JSON.stringify({ imports: Object.fromEntries(Object.entries(imports).map(([k, v]) => [abs(k), abs(v)])) });
    const sha = `'sha256-${createHash('sha256').update(json).digest('base64')}'`;
    const meta = /(<meta http-equiv="content-security-policy" content="[^"]*script-src [^;"]*)([^>]*>)/.exec(html);
    if (!meta) throw new Error('headers: no script-src in index.html\'s CSP <meta>, for the import map\'s hash');
    html = html.replace(meta[0], `${meta[1]} ${sha}${meta[2]}\n\t\t<script type="importmap">${json}</script>`);
    writeFileSync(join(root, 'index.html'), html);
    rmSync(file);
    console.log(`build-pages/index.html: the import map, ${Object.keys(imports).length} chunks`);
  } else if (!html.includes('<script type="importmap">')) throw new Error('headers: no build-pages/importmap.json (vite.config.ts chunkImportMap)');
}
{
  // the boot watchdog (ui-state/bootWatch.ts) inline after the import map, before any module, its hash in the CSP
  if (!html.includes('data-boot-watch')) {
    const sha = `'sha256-${createHash('sha256').update(BOOT_WATCH_JS).digest('base64')}'`;
    const meta = /(<meta http-equiv="content-security-policy" content="[^"]*script-src [^;"]*)([^>]*>)/.exec(html);
    if (!meta) throw new Error('headers: no script-src in index.html\'s CSP <meta>, for the boot watchdog\'s hash');
    html = html.replace(meta[0], `${meta[1]} ${sha}${meta[2]}`).replace(/<script type="importmap">.*?<\/script>/s, (m) => `${m}\n\t\t<script data-boot-watch>${BOOT_WATCH_JS}</script>`);
    writeFileSync(join(root, 'index.html'), html);
    console.log('build-pages/index.html: the boot watchdog');
  }
}
{
  // a 共有リンク's page (routes/s): its own shell, so `/s` answers 200 (Pages serves s.html for it) and a stranger's
  // phone loads the root layout's chunks and the page's, not the island's (scripts/load-budget.ts `/s`)
  const bare = html.replace(ISLAND_PRELOADS, '');
  if (bare === html) throw new Error('headers: no island preloads to take out of s.html');
  const links = preloadsOf('s/+page.svelte', bare.replace(/<script type="importmap">.*?<\/script>/s, ''));
  writeFileSync(join(root, 's.html'), withPreloads(bare, "data-share-preload: the shared link page's chunks", links));
  console.log(`build-pages/s.html: the shared link page's ${links.length} preloads`);
}
const csp = /<meta http-equiv="content-security-policy" content="([^"]+)"/.exec(html)?.[1];
if (!csp) throw new Error('headers: no content-security-policy <meta> in build-pages/index.html');

const permissions = ['payment', 'usb', 'serial', 'bluetooth', 'hid', 'midi', 'display-capture', 'browsing-topics']
  .map((f) => `${f}=()`)
  // the trip map's location dot (docs/travel.md "Maps"): our own origin only, asked when its button is tapped
  .concat('geolocation=(self)')
  // the speech test (docs/speech-test.md): our own origin only, asked when its 録音 is tapped
  .concat('microphone=(self)')
  // ごはん's barcode scanner (docs/food-data.md "Barcodes"): our own origin only, opened only from its button's tap
  .concat('camera=(self)')
  // a trail map's 進行方向 (docs/hiking.md "In-hike map"): the compass (deviceorientation's heading), our own origin
  // only, asked only when the location button is tapped into heading mode; the heading stays on the phone
  // (decisions.md "Compass")
  .concat('accelerometer=(self)', 'gyroscope=(self)', 'magnetometer=(self)')
  .join(', ');

const headers = `${base}/*
  Content-Security-Policy: ${csp.replace(/&#39;/g, "'").replace(/&quot;/g, '"')}; frame-ancestors 'none'
  X-Content-Type-Options: nosniff
  Referrer-Policy: no-referrer
  Permissions-Policy: ${permissions}
  X-Frame-Options: DENY
  Cross-Origin-Opener-Policy: same-origin
  Strict-Transport-Security: max-age=31536000; includeSubDomains
  X-Robots-Tag: noindex, nofollow

${base}/_app/immutable/*
  Cache-Control: public, max-age=31536000, immutable

${base}/audio/*
  Cache-Control: public, max-age=31536000, immutable

${base}/food-img/*.webp
  Cache-Control: public, max-age=31536000, immutable

${base}/room/pack/*.pak
  Cache-Control: public, max-age=31536000, immutable
  Content-Type: application/x-protobuf

${base}/room/player/*.pak
  Cache-Control: public, max-age=31536000, immutable
  Content-Type: application/x-protobuf

${base}/room/tex/*
  Cache-Control: public, max-age=31536000, immutable

${base}/room/basis/*
  Cache-Control: public, max-age=31536000, immutable

${base}/*.glb
  Cache-Control: public, max-age=31536000, immutable
  Content-Type: application/x-protobuf
`;
writeFileSync(join(root, '_headers'), headers);
console.log(`build-pages/_headers: ${headers.split('\n').length} lines`);
