// A contact sheet of the island's converted NH models (docs/world3d-assets.md "Validation"): every model of
// src/lib/components/world3d/assets.json at its world scale beside an 80u villager card, at the island's 30° pitch,
// a close-up in each cell's corner, one sheet per kind, to /tmp/world3d-assets/sheet-<kind>-<n>.png.
//
// Usage (from app/): node scripts/world3d-sheet.ts [-- --only=bug,fish] [-- --dir=<GLB folder> --s=5.4] [-- --night]
// Needs Google Chrome (Playwright's channel 'chrome'). Reads only the repo's own files.
import { chromium } from '@playwright/test';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, extname, join, resolve, sep } from 'node:path';

const APP = join(import.meta.dirname, '..');
const W3D = join(APP, 'static', 'room', 'world3d');
const OUT = '/tmp/world3d-assets';
const arg = (k: string) => process.argv.find((a) => a.startsWith(`--${k}=`))?.slice(k.length + 3);
const only = (arg('only') ?? '').split(',').filter(Boolean);
const night = process.argv.includes('--night');
const PER = 30;

interface Item { url: string; label: string; s: number; anchor?: string; night?: boolean }
const groups = new Map<string, Item[]>();
const roots: [string, string][] = [];
const route = (prefix: string, root: string) => roots.push([prefix, root]);
const dir = arg('dir');
if (dir) {
  const root = resolve(dir);
  const walk = (d: string): string[] => readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(d, e.name)) : e.name.endsWith('.glb') ? [join(d, e.name)] : []));
  groups.set('probe', walk(root).map((f) => ({ url: `/probe/${f.slice(root.length + 1)}`, label: f.slice(root.length + 1), s: Number(arg('s') ?? 3), anchor: arg('anchor'), night })));
  route('/probe/', root);
} else {
  const A = JSON.parse(readFileSync(join(APP, 'src', 'lib', 'components', 'world3d', 'assets.json'), 'utf8')) as {
    models: Record<string, { kb: number }>; keys: Record<string, { m: string; cat: string; s: number; anchor: string; lit?: number }>;
  };
  const seen = new Set<string>();
  for (const [key, k] of Object.entries(A.keys)) {
    if (only.length && !only.includes(k.cat)) continue;
    // one cell a model (a flower's colours: one cell each, they're separate models)
    const id = `${k.m}|${k.s}`;
    if (seen.has(id)) continue;
    seen.add(id);
    const list = groups.get(k.cat) ?? groups.set(k.cat, []).get(k.cat)!;
    list.push({ url: `/w3d/${k.m}.glb`, label: `${key.replace(/^[a-z]+\//, '')} ${A.models[k.m]?.kb ?? '?'}KB`, s: k.s, anchor: k.anchor, night: night || undefined });
  }
  route('/w3d/', W3D);
}

const three = join(dirname(createRequire(import.meta.url).resolve('three')), '..');
const PAGE = join(import.meta.dirname, 'world3d-sheet-page.js');
const MIME: Record<string, string> = { '.js': 'text/javascript', '.glb': 'model/gltf-binary', '.webp': 'image/webp' };
const browser = await chromium.launch({ channel: 'chrome', args: ['--enable-gpu', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 400, height: 400 } });
page.on('pageerror', (e) => console.error('[page]', e.message));
page.on('console', (m) => { if (m.type() === 'error') console.error('[console]', m.text()); });
await page.route('http://sheet.local/**', (r) => {
  const u = decodeURIComponent(new URL(r.request().url()).pathname);
  const within = (root: string, rel: string) => {
    const f = resolve(root, rel);
    return f.startsWith(root + sep) ? f : null;
  };
  if (u === '/') return r.fulfill({ contentType: 'text/html', body: '<!doctype html><script type="importmap">{"imports":{"three":"/three/build/three.module.js","three/addons/":"/three/examples/jsm/"}}</script><script type="module" src="/page.js"></script>' });
  const hit = roots.find(([p]) => u.startsWith(p));
  const f = u === '/page.js' ? PAGE : u === '/villager.webp' ? join(APP, 'static', 'art', 'villagers', 'raymond.webp')
    : u.startsWith('/three/') ? within(three, u.slice(7)) : hit ? within(hit[1], u.slice(hit[0].length)) : null;
  if (!f || !existsSync(f)) return r.fulfill({ status: 404, body: '' });
  return r.fulfill({ body: readFileSync(f), contentType: MIME[extname(f)] ?? 'application/octet-stream' });
});
await page.goto('http://sheet.local/');
await page.waitForFunction(() => (window as unknown as { ready?: boolean }).ready);
mkdirSync(OUT, { recursive: true });
for (const [cat, items] of groups) {
  for (let p = 0; p * PER < items.length; p++) {
    const part = items.slice(p * PER, (p + 1) * PER);
    const url = await page.evaluate((o) => (window as unknown as { sheet: (o: unknown) => Promise<string> }).sheet(o), {
      items: part, villager: '/villager.webp', cols: 6, title: `${cat} ${p + 1}/${Math.ceil(items.length / PER)} — each beside an 80u villager card, at world scale (inset: close-up)`
    });
    const file = join(OUT, `sheet-${cat}${night ? '-night' : ''}-${p + 1}.png`);
    writeFileSync(file, Buffer.from(url.split(',')[1], 'base64'));
    console.log(file);
  }
}
await browser.close();
