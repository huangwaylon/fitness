// The runtime player (src/lib/components/player3d) drawn in headless Chrome off the app's own modules (type-stripped)
// and the converted parts (static/room/player): A and B in their states, faces and a swap, as PNGs in /tmp/player3d/.
// A look at it before the phone (rendering is judged on the iOS Simulator; this is the quick one).
// Usage (from app/): node design/avatar/player3d/check.ts
import { chromium } from '@playwright/test';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire, stripTypeScriptTypes } from 'node:module';
import { dirname, extname, join, resolve, sep } from 'node:path';

const APP = join(import.meta.dirname, '..', '..', '..');
const OUT = '/tmp/player3d';
mkdirSync(OUT, { recursive: true });
const three = join(dirname(createRequire(import.meta.url).resolve('three')), '..');
const MIME: Record<string, string> = { '.js': 'text/javascript', '.webp': 'image/webp', '.glb': 'model/gltf-binary', '.json': 'application/json' };
const browser = await chromium.launch({ channel: 'chrome', args: ['--enable-gpu', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 900, height: 900 } });
page.on('pageerror', (e) => console.error('[page]', e.message));
page.on('console', (m) => console.log('[page]', m.text()));
await page.route('http://p3.local/**', (route) => {
  const u = decodeURIComponent(new URL(route.request().url()).pathname);
  const within = (root: string, rel: string) => { const f = resolve(root, rel); return f.startsWith(root + sep) ? f : null; };
  if (u === '/') return route.fulfill({ contentType: 'text/html', body: '<!doctype html><style>body{margin:0}</style><script type="importmap">{"imports":{"three":"/three/build/three.module.js","three/examples/jsm/":"/three/examples/jsm/","#lib/":"/lib/"}}</script><script type="module" src="/page.js"></script>' });
  const f = u === '/page.js' ? join(import.meta.dirname, 'check-page.js') : u.startsWith('/three/') ? within(three, u.slice(7))
    : u.startsWith('/lib/') ? within(join(APP, 'src', 'lib'), u.slice(5)) : u.startsWith('/room/') ? within(join(APP, 'static', 'room'), u.slice(6)) : null;
  if (!f || !existsSync(f)) return route.fulfill({ status: 404, body: '' });
  if (f.endsWith('.ts')) return route.fulfill({ contentType: 'text/javascript', body: stripTypeScriptTypes(readFileSync(f, 'utf8')) });
  return route.fulfill({ body: readFileSync(f), contentType: MIME[extname(f)] ?? 'application/octet-stream' });
});
await page.goto('http://p3.local/');
await page.waitForFunction(() => (window as unknown as { ready?: boolean }).ready, null, { timeout: 60000 });
const shots = await page.evaluate(() => (window as unknown as { run: () => Promise<Record<string, string>> }).run());
for (const [k, v] of Object.entries(shots)) {
  writeFileSync(join(OUT, `${k}.png`), Buffer.from(v.split(',')[1], 'base64'));
  console.log('wrote', join(OUT, `${k}.png`));
}
await browser.close();
