// The service worker's cost on the island's load (docs/backend.md "Service worker"): two builds, A and B (B a deploy of
// A: a changed chunk and a changed static file; /tmp builds, each with its own GITHUB_SHA so its version differs), served
// like Cloudflare Pages (an ETag and 304s, max-age=0 but for the hashed files) over a shaped link: 10 Mbps shared by
// every response and 70 ms before each (HTTP/1.1, 6 connections a host: Pages' HTTP/2 shares one, so the requests'
// count weighs more here than there). Playwright WebKit as an iPhone 15, and Chromium as an iPhone 13 at 4× CPU
// (WebKit has no CPU throttle), the service worker allowed. Per browser, the median of --runs:
//   first visit (A, nothing cached): the island's first frame and loaded() (Island3D's window.__world3d), the worker
//     in control; requests and bytes to then;
//   an open right after a deploy (A installed, opened once more and idle, the server switched to B, the app opened again: A's cached
//     shell, B's worker installing alongside): first frame, loaded(), B's worker in control; the requests and bytes
//     the server saw from the switch till B was in (the page's own come from A's caches: they're the install's).
//   node scripts/sw-measure.ts <dirA> <dirB> [--runs 3] [--browser webkit|chromium]
import { createServer, type ServerResponse } from 'node:http';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { chromium, devices, webkit, type Browser, type BrowserContext, type Page } from '@playwright/test';

const args = process.argv.slice(2);
const flag = (n: string) => (args.includes(n) ? args[args.indexOf(n) + 1] : undefined);
const [dirA, dirB] = args.filter((a, i) => !a.startsWith('--') && !args[i - 1]?.startsWith('--'));
if (!dirA || !dirB) throw new Error('usage: node scripts/sw-measure.ts <dirA> <dirB> [--runs 3] [--browser webkit|chromium]');
const RUNS = Number(flag('--runs') ?? 3);
const BROWSERS = flag('--browser') ? [flag('--browser')!] : ['webkit', 'chromium'];
const BYTES_PER_MS = 10e6 / 8 / 1000;
const LATENCY_MS = 70;

const TYPES: Record<string, string> = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.glb': 'model/gltf-binary', '.bin': 'application/octet-stream', '.pak': 'application/octet-stream', '.wasm': 'application/wasm' };

let root = dirA;
const log: { t: number; bytes: number; status: number; path: string }[] = [];
const etags = new Map<string, string>();
let freeAt = 0;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** The body through the shaped link: 16 KB slices, each in the next free slot of the one 10 Mbps pipe. */
async function shaped(res: ServerResponse, body: Buffer) {
  for (let off = 0; off < body.length; off += 16384) {
    const slice = body.subarray(off, off + 16384), now = performance.now();
    freeAt = Math.max(now, freeAt) + slice.length / BYTES_PER_MS;
    await sleep(freeAt - now);
    res.write(slice);
  }
  res.end();
}
async function file(path: string): Promise<string | undefined> {
  try {
    const s = await stat(path);
    if (s.isFile()) return path;
    if (s.isDirectory()) return file(join(path, 'index.html'));
  } catch {
    /* missing */
  }
  return undefined;
}
function headersOf(dir: string, path: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const block of readFileSync(join(dir, '_headers'), 'utf8').split(/\n(?=\S)/)) {
    const [head, ...lines] = block.trim().split('\n');
    if (!head || !new RegExp(`^${head.trim().replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/:\w+/g, '[^/]+')}$`).test(path)) continue;
    for (const l of lines) {
      const [k, v] = l.trim().split(/:\s*(.*)/s);
      if (k) out[k.toLowerCase()] = v;
    }
  }
  return out;
}

const server = createServer((req, res) => {
  void (async () => {
    const path = decodeURIComponent(new URL(req.url ?? '/', 'http://x').pathname);
    await sleep(LATENCY_MS);
    const hit = await file(join(root, normalize(path).replace(/^(\.\.[/\\])+/, '')));
    const served = hit ?? join(root, '404.html');
    const body = await readFile(served);
    const key = `${root}|${served}`;
    let etag = etags.get(key);
    if (!etag) etags.set(key, (etag = `"${createHash('sha1').update(body).digest('hex').slice(0, 16)}"`));
    const headers = { 'content-type': TYPES[extname(served)] ?? 'application/octet-stream', 'cache-control': 'public, max-age=0, must-revalidate', ...headersOf(root, path), etag };
    if (hit && req.headers['if-none-match'] === etag) {
      log.push({ t: performance.now(), bytes: 0, status: 304, path });
      res.writeHead(304, headers).end();
      return;
    }
    log.push({ t: performance.now(), bytes: body.length, status: hit ? 200 : 404, path });
    res.writeHead(hit ? 200 : 404, { ...headers, 'content-length': String(body.length) });
    await shaped(res, body);
  })().catch(() => res.destroy());
});
await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
const URL_ = `http://127.0.0.1:${(server.address() as { port: number }).port}/?demo&critter=none&visitor=none`;

const versionOf = (dir: string) => (JSON.parse(readFileSync(join(dir, '_app', 'version.json'), 'utf8')) as { version: string }).version;

async function contextFor(browser: Browser, name: string): Promise<BrowserContext> {
  const ctx = await browser.newContext({ ...(name === 'webkit' ? devices['iPhone 15'] : devices['iPhone 13']), serviceWorkers: 'allow', locale: 'ja-JP', timezoneId: 'Asia/Tokyo' });
  // (performance.now() at each: the island's first frame, loaded(), the worker taking the page)
  await ctx.addInitScript(() => {
    type W = Window & { __m?: Record<string, number>; __world3d?: { stats(): { frames: number }; loaded(): boolean } };
    const w = window as W, m: Record<string, number> = (w.__m = {});
    localStorage.setItem('island.fps', '60');
    navigator.serviceWorker?.addEventListener('controllerchange', () => (m.sw ??= performance.now()));
    const tick = () => {
      const s = w.__world3d;
      if (s && s.stats().frames > 0) m.frame ??= performance.now();
      if (s?.loaded()) m.loaded ??= performance.now();
      if (!m.loaded) setTimeout(tick, 20);
    };
    tick();
  });
  return ctx;
}
async function cpu(page: Page, name: string) {
  if (name !== 'chromium') return;
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
}
const marks = (page: Page) => page.evaluate(() => (window as Window & { __m?: Record<string, number> }).__m ?? {});
async function until(page: Page, what: (m: Record<string, number>) => boolean, ms = 120_000) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    if (what(await marks(page).catch(() => ({})))) return;
    await sleep(100);
  }
  throw new Error('timed out');
}
/** No request for `ms`. */
async function quiet(ms = 2500) {
  for (;;) {
    const last = log.at(-1)?.t ?? 0;
    if (performance.now() - last > ms) return;
    await sleep(250);
  }
}
const since = (t: number, to = Infinity) => {
  const xs = log.filter((r) => r.t >= t && r.t <= to);
  return { requests: xs.length, r304: xs.filter((r) => r.status === 304).length, kb: Math.round(xs.reduce((a, r) => a + r.bytes, 0) / 1024) };
};

type Row = Record<string, number>;
const median = (rows: Row[]) => Object.fromEntries(Object.keys(rows[0]).map((k) => [k, rows.map((r) => r[k]).sort((a, b) => a - b)[rows.length >> 1]]));

const vA = versionOf(dirA), vB = versionOf(dirB);
for (const name of BROWSERS) {
  const browser = await (name === 'webkit' ? webkit : chromium).launch({
    ...(name === 'chromium' ? { channel: 'chrome', args: ['--mute-audio', '--disable-audio-output', '--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE 127.0.0.1, EXCLUDE localhost'] } : {})
  });
  const first: Row[] = [], open: Row[] = [];
  for (let i = 0; i < RUNS; i++) {
    // first visit
    root = dirA;
    await quiet(500);
    let ctx = await contextFor(browser, name);
    let page = await ctx.newPage();
    await cpu(page, name);
    let t0 = performance.now();
    await page.goto(URL_);
    await until(page, (m) => !!m.loaded && !!m.sw);
    const m1 = await marks(page);
    await quiet();
    const loadedAt = since(t0, t0 + m1.loaded);
    first.push({ frame: Math.round(m1.frame), loaded: Math.round(m1.loaded), sw: Math.round(m1.sw), reqToLoaded: loadedAt.requests, kbToLoaded: loadedAt.kb, ...Object.fromEntries(Object.entries(since(t0)).map(([k, v]) => [`all_${k}`, v])) });
    await ctx.close();

    // an open right after a deploy: A installed (a first visit, then idle), B served
    ctx = await contextFor(browser, name);
    page = await ctx.newPage();
    await page.goto(URL_);
    await until(page, (m) => !!m.loaded && !!m.sw);
    // (once more under the worker: the island's models into its room cache, as on a phone that has opened it before)
    await page.reload();
    await until(page, (m) => !!m.loaded);
    await quiet();
    await cpu(page, name);
    root = dirB;
    t0 = performance.now();
    await page.goto(URL_);
    await until(page, (m) => !!m.loaded);
    // B's worker in: its shell cache made and the page claimed
    await page.waitForFunction(async (v) => (await caches.keys()).includes(`island-shell-${v}`) && !!navigator.serviceWorker.controller, vB, { timeout: 120_000, polling: 100 });
    await until(page, (m) => !!m.sw);
    const m2 = await marks(page);
    await quiet();
    const u = since(t0);
    if (process.env.SWM_DUMP) writeFileSync(`${process.env.SWM_DUMP}-${name}-${i}.json`, JSON.stringify(log.filter((r) => r.t >= t0).map((r) => `${r.status} ${r.bytes} ${r.path}`), null, 1));
    open.push({ frame: Math.round(m2.frame), loaded: Math.round(m2.loaded), sw: Math.round(m2.sw), requests: u.requests, r304: u.r304, kb: u.kb });
    await ctx.close();
    console.error(`${name} run ${i + 1}: first ${JSON.stringify(first.at(-1))} open ${JSON.stringify(open.at(-1))}`);
  }
  await browser.close();
  console.log(`${name} (${vA} → ${vB}, median of ${RUNS}, ms from navigation start)`);
  console.log(`  first visit:        ${JSON.stringify(median(first))}`);
  console.log(`  open after deploy:  ${JSON.stringify(median(open))}`);
}
process.exit(0);
