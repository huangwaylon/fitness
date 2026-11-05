// The player harness's Node half, as a module (render.ts uses it; the animator's scripts can too): copies the named NH
// model folders (untrusted: their .dae and .png files only, safe names) from the dump into /tmp/avatar-ta/scratch,
// opens headless Chrome on a page that serves three.js, the assembler (player.js), the studio (studio.js), the app's
// villager3d rig.ts and poses.ts (type-stripped) and the copied files, and returns helpers.
//
//   import { openHarness } from '../render/harness.ts';
//   const h = await openHarness({ page: '/abs/path/my-page.js' });   // optional own page module (imports /player.js)
//   const files = h.filesFor(outfit);                                  // copies what the outfit names → its file list
//   const png = await h.call('myFn', outfit, files);                   // a window function of the page
//   h.save('/abs/dir', 'x.png', png); await h.close();
import { chromium, type Page } from '@playwright/test';
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { createRequire, stripTypeScriptTypes } from 'node:module';
import { dirname, extname, join, resolve, sep } from 'node:path';

const HERE = import.meta.dirname;
export const APP = join(HERE, '..', '..', '..');
const V3D = join(APP, 'src', 'lib', 'components', 'villager3d');
export const SCRATCH = '/tmp/avatar-ta/scratch';
export const F = (n: string) => `${n}.Nin_NX_NVN`;
const SAFE = /^[A-Za-z0-9_]+$/;

export interface Harness {
  page: Page;
  /** One model folder copied (once) into the scratch dir → its file names. */
  copy(folder: string, skip?: RegExp): string[];
  /** Every folder an outfit (or any JSON) names, with PlayerBody, copied → { '<Folder>.Nin_NX_NVN': files } for loadPlayer. */
  filesFor(o: unknown): Record<string, string[]>;
  call<T>(fn: string, ...a: unknown[]): Promise<T>;
  save(dir: string, name: string, dataUrl: string): string;
  close(): Promise<void>;
}

/** Every model folder a JSON names (string values that look like NH folder names, anywhere in it). */
export function foldersOf(o: unknown): string[] {
  const out = new Set<string>(['PlayerBody']);
  const walk = (v: unknown) => {
    if (typeof v === 'string' && /^(Player|Tops|Bottoms|Shoes|Socks|Accessory|Cap|Bag|Marine|Helmet)[A-Za-z0-9_]*$/.test(v)) out.add(v);
    else if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === 'object') Object.values(v).forEach(walk);
  };
  walk(o);
  return [...out];
}

export async function openHarness(opts: { page?: string; size?: number } = {}): Promise<Harness> {
  const MODELS = process.env.NH_MODELS?.replace(/^~(?=\/)/, process.env.HOME ?? '~') ?? join(process.env.HOME ?? '', 'Downloads', 'Model');
  if (!existsSync(MODELS)) throw new Error(`no model folder at ${MODELS} (set NH_MODELS)`);
  mkdirSync(SCRATCH, { recursive: true });
  const copy = (folder: string, skip?: RegExp): string[] => {
    if (!SAFE.test(folder)) throw new Error(`unsafe folder name ${folder}`);
    const src = join(MODELS, F(folder));
    if (!existsSync(src)) throw new Error(`not in the dump: ${folder}`);
    const dst = join(SCRATCH, F(folder));
    if (!existsSync(dst)) {
      mkdirSync(dst);
      for (const n of readdirSync(src)) if (/^[A-Za-z0-9_]+(\.[0-9]+)?\.(dae|png)$/.test(n) && !skip?.test(n) && statSync(join(src, n)).isFile()) cpSync(join(src, n), join(dst, n));
    }
    return readdirSync(dst);
  };
  const three = join(dirname(createRequire(import.meta.url).resolve('three')), '..');
  const MIME: Record<string, string> = { '.js': 'text/javascript', '.ts': 'text/javascript', '.png': 'image/png', '.dae': 'model/vnd.collada+xml' };
  const size = opts.size ?? 1024;
  const browser = await chromium.launch({ channel: 'chrome', args: ['--enable-gpu', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: size, height: size } });
  page.on('pageerror', (e) => console.error('[page]', e.message));
  page.on('console', (m) => { if ((m.type() === 'error' && !/404/.test(m.text())) || m.text().startsWith('[a]')) console.log('[page]', m.text()); });
  const own = opts.page ?? join(HERE, 'page.js');
  await page.route('http://avatar.local/**', (route) => {
    const u = decodeURIComponent(new URL(route.request().url()).pathname);
    const within = (root: string, rel: string) => {
      const f = resolve(root, rel);
      return f.startsWith(root + sep) ? f : null;
    };
    if (u === '/') return route.fulfill({ contentType: 'text/html', body: '<!doctype html><style>html,body{margin:0;background:#fff}</style><script type="importmap">{"imports":{"three":"/three/build/three.module.js","three/addons/":"/three/examples/jsm/"}}</script><script type="module" src="/page.js"></script>' });
    const f = u === '/page.js' ? own : u === '/player.js' || u === '/studio.js' ? join(HERE, u.slice(1)) : u.startsWith('/three/') ? within(three, u.slice(7)) : u.startsWith('/v3d/') ? within(V3D, u.slice(5)) : u.startsWith('/src/') ? within(SCRATCH, u.slice(5)) : null;
    if (!f || !existsSync(f)) return route.fulfill({ status: 404, body: '' });
    // the app's rig and poses (TypeScript) as plain modules
    if (f.endsWith('.ts')) return route.fulfill({ contentType: 'text/javascript', body: stripTypeScriptTypes(readFileSync(f, 'utf8')) });
    return route.fulfill({ body: readFileSync(f), contentType: MIME[extname(f)] ?? 'application/octet-stream' });
  });
  await page.goto('http://avatar.local/');
  await page.waitForFunction(() => (window as unknown as { ready?: boolean }).ready);
  type W = Record<string, (...a: unknown[]) => Promise<unknown>>;
  return {
    page,
    copy,
    filesFor(o) {
      const files: Record<string, string[]> = {};
      for (const f of foldersOf(o)) files[F(f)] = copy(f);
      return files;
    },
    call: <T>(fn: string, ...a: unknown[]) => page.evaluate(([fn, a]) => (window as unknown as W)[fn as string](...(a as unknown[])), [fn, a] as const) as Promise<T>,
    save(dir, name, dataUrl) {
      mkdirSync(dir, { recursive: true });
      const f = join(dir, name);
      writeFileSync(f, Buffer.from(dataUrl.split(',')[1], 'base64'));
      console.log('wrote', f.startsWith(APP) ? f.slice(APP.length + 1) : f);
      return f;
    },
    close: () => browser.close()
  };
}
