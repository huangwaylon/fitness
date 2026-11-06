// Writes build-pages/_headers, the response headers Cloudflare Pages serves the site with (docs/ops/runbook.md §1). `npm run build` runs it after `vite build`.
// - The Content-Security-Policy is the one SvelteKit wrote into index.html's <meta> (vite.config.ts `csp`: the relay's
//   origins, data:/blob: images and media, the hash of its inline bootstrap script, inline styles), plus what a <meta>
//   can't carry: frame-ancestors 'none'. The <meta> stays (the same policy; both apply).
// - The Permissions-Policy turns every powerful feature off but geolocation, which only our origin may ask for (the
//   trip map's locate button).
// - Hashed files (`_app/immutable/`) are cached for a year, and so is the audio (`audio/`): every audio URL the app
//   fetches carries its file's content hash (`?v=`, lib/sound/manifest.ts); everything else keeps Pages' default
//   (revalidated).
// - index.html (the SPA shell every route opens with) preloads the island's page too: Kit's fallback page preloads
//   only the root layout's chunks, so the island page's chunk and its own imports were asked for only once the
//   layout's had run (the startup review). Its chunk and its static imports, transitively, as modulepreload; its
//   stylesheets as preload, crossorigin as Vite asks for them (else the preload goes unused and they come twice).
//   (Before 404.html is copied from it: `npm run build`.)
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = join(import.meta.dirname, '..', 'build-pages');
const base = (process.env.BASE_PATH ?? '').replace(/\/$/, '');
let html = readFileSync(join(root, 'index.html'), 'utf8');

{
  // the island page's node (Kit's generated nodes: the one whose component is src/routes/+page.svelte)
  const nodes = join(import.meta.dirname, '..', '.svelte-kit', 'generated', 'build', 'client-optimized', 'nodes');
  const node = readdirSync(nodes).find((f) => /from "(\.\.\/)+src\/routes\/\+page\.svelte"/.test(readFileSync(join(nodes, f), 'utf8')));
  if (!node) throw new Error('headers: no node for src/routes/+page.svelte');
  type Chunk = { file: string; imports?: string[]; css?: string[] };
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
  const has = (f: string) => html.includes(`"${base}/${f}"`);
  const links = [...[...js].filter((f) => !has(f)).map((f) => `<link href="${base}/${f}" rel="modulepreload">`), ...[...css].filter((f) => !has(f)).map((f) => `<link href="${base}/${f}" rel="preload" as="style" crossorigin>`)];
  const at = html.lastIndexOf('rel="modulepreload">');
  if (at < 0) throw new Error('headers: no modulepreload in build-pages/index.html');
  const end = at + 'rel="modulepreload">'.length;
  if (!html.includes('data-island-preload')) {
    html = `${html.slice(0, end)}\n\t\t<!-- data-island-preload: the island page's chunks (scripts/headers.ts) -->\n\t\t${links.join('\n\t\t')}${html.slice(end)}`;
    writeFileSync(join(root, 'index.html'), html);
  }
  console.log(`build-pages/index.html: the island page's ${links.length} preloads`);
}
const csp = /<meta http-equiv="content-security-policy" content="([^"]+)"/.exec(html)?.[1];
if (!csp) throw new Error('headers: no content-security-policy <meta> in build-pages/index.html');

const permissions = ['camera', 'microphone', 'payment', 'usb', 'serial', 'bluetooth', 'hid', 'midi', 'accelerometer', 'gyroscope', 'magnetometer', 'display-capture', 'browsing-topics']
  .map((f) => `${f}=()`)
  // the trip map's location dot (docs/travel.md "Maps"): our own origin only, asked when its button is tapped
  .concat('geolocation=(self)')
  .join(', ');

const headers = `${base}/*
  Content-Security-Policy: ${csp.replace(/&#39;/g, "'").replace(/&quot;/g, '"')}; frame-ancestors 'none'
  X-Content-Type-Options: nosniff
  Referrer-Policy: no-referrer
  Permissions-Policy: ${permissions}
  X-Frame-Options: DENY
  Cross-Origin-Opener-Policy: same-origin
  Strict-Transport-Security: max-age=31536000; includeSubDomains

${base}/_app/immutable/*
  Cache-Control: public, max-age=31536000, immutable

${base}/audio/*
  Cache-Control: public, max-age=31536000, immutable
`;
writeFileSync(join(root, '_headers'), headers);
console.log(`build-pages/_headers: ${headers.split('\n').length} lines`);
