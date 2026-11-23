// A slow phone network in the specs, the same in WebKit and Chromium (no CDP: WebKit has none): every request from the
// page waits a round trip, and its bytes (gzipped) share one link of `kbps` with every transfer under way, each an equal
// share, so a big chunk slows what comes beside it as on a real 3G link; a hashed file once in,
// served at once after: the browser's year-long cache). The app's own files are fetched from
// the preview then held; the rest (the routed tiles, the relay's mocks) wait their round trip and an estimated size,
// then go on to the spec's own routes (route.fallback). `drop`: that share of the tile requests fail (a flaky signal),
// from a seeded sequence (hermetic). Registered last, so asked first. The map perf spec's and the slow-network guard's;
// and the guard's WebGL draw count at rest.
import { gzipSync } from 'node:zlib';
import { expect, type Page, type Route } from './fixtures.ts';
import { precachable } from '../src/service-worker/caches.ts';

export interface Net { rtt: number; kbps: number; drop?: number }
/** ~3G on a ridge or a crowded train: 400 ms round trips, 400 kbit/s. */
export const SLOW: Net = { rtt: 400, kbps: 400 };
/** The same with one tile request in ten failing. */
export const FLAKY: Net = { rtt: 400, kbps: 400, drop: 0.1 };

/** What the throttle saw: each request's URL, its start and end (epoch ms) and its bytes on the wire. */
export interface Seen { url: string; t0: number; t1: number; bytes: number }

const TILE = /tiles\.openfreemap\.org\/planet\/|basemap\.nationalmap\.gov|cyberjapandata\.gsi\.go\.jp/;
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** `bytes`: a routed answer's size on the wire when known (the places' list), else the estimate below. */
export async function slow(page: Page, net: Net, bytesOf: (url: string) => number | undefined = () => undefined, o: { installed?: boolean } = {}, origin = 'http://127.0.0.1'): Promise<{ seen: Seen[]; warm(): void }> {
  const seen: Seen[] = [];
  /** After warm(): what was fetched before answered at once (a service worker's copy: the shell, MapLibre, the tiles seen). */
  let kept: Set<string> | null = null;
  const bps = (net.kbps * 1000) / 8;
  let seed = 7;
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  // the link: every transfer under way gets an equal share of it, 20 ms at a time
  const flowing = new Set<{ left: number; done: () => void }>();
  let tick: ReturnType<typeof setInterval> | null = null;
  const send = (bytes: number) => new Promise<void>((done) => {
    flowing.add({ left: bytes, done });
    tick ??= setInterval(() => {
      const share = (bps * 0.02) / flowing.size;
      for (const f of flowing) if ((f.left -= share) <= 0) (flowing.delete(f), f.done());
      if (!flowing.size) (clearInterval(tick!), (tick = null));
    }, 20);
  });
  /** A round trip, then `bytes` down the shared link. */
  const link = async (bytes: number) => (await wait(net.rtt), await send(bytes));
  /** The app's hashed files once fetched (a year's immutable cache: the browser's, the service worker's). */
  const immutable = new Set<string>();
  await page.route('**/*', async (route: Route) => {
    const req = route.request(), url = req.url(), t0 = Date.now();
    if (url.startsWith('data:') || url.startsWith('blob:')) return route.fallback();
    if ((immutable.has(url) || kept?.has(url)) && req.method() === 'GET') {
      seen.push({ url, t0, t1: t0, bytes: 0 });
      return route.fallback();
    }
    // (an installed app: what the service worker precached, and the island's own art and models, kept on first use, at once;
    // `cold` off: a first visit, nothing kept)
    const path = url.startsWith(origin) ? new URL(url).pathname : '';
    if (path && o.installed !== false && (precachable(path) || /^\/(room|art|audio)\//.test(path))) {
      seen.push({ url, t0, t1: t0, bytes: 0 });
      return route.fallback();
    }
    if (url.startsWith(origin)) {
      const res = await route.fetch().catch(() => null);
      if (!res) return route.abort();
      const body = await res.body();
      const bytes = /\.(js|css|json|html|svg|webmanifest)(\?|$)/.test(url) ? gzipSync(body).length : body.length;
      await link(bytes + 300);
      seen.push({ url, t0, t1: Date.now(), bytes });
      if (path.includes('/_app/immutable/')) immutable.add(url);
      return route.fulfill({ response: res, body }).catch(() => {});
    }
    const tile = TILE.test(url);
    if (tile && net.drop && rand() < net.drop) {
      await wait(net.rtt);
      seen.push({ url, t0, t1: Date.now(), bytes: 0 });
      return route.abort('connectionreset').catch(() => {});
    }
    // (an estimate: a vector tile ~25 KB, a raster one ~15 KB, a relay answer ~2 KB; the places' list is the spec's own)
    const bytes = bytesOf(url) ?? (tile ? (url.includes('.pbf') ? 25_000 : 15_000) : 2_000);
    await link(bytes);
    seen.push({ url, t0, t1: Date.now(), bytes });
    return route.fallback();
  });
  return { seen, warm: () => void (kept = new Set(seen.filter((x) => x.bytes > 0 && !/\/places(\?|$)/.test(x.url)).map((x) => x.url))) };
}

/** Before the goto: the page's WebGL draw calls counted (window.__draws). */
export const countDraws = (page: Page) => page.addInitScript(() => {
  const w = window as unknown as { __draws: number };
  w.__draws = 0;
  for (const C of [WebGLRenderingContext, WebGL2RenderingContext])
    for (const k of ['drawElements', 'drawArrays'] as const) {
      const f = C.prototype[k] as (...a: unknown[]) => unknown;
      (C.prototype as unknown as Record<string, unknown>)[k] = function (this: unknown, ...a: unknown[]) { w.__draws++; return f.apply(this, a); };
    }
});

/** A drawn map at rest (after countDraws): 30 frames with no draw call come (a fade or the last tile's frame may still
 *  run as it settles; a frame loop never stops). */
export const still = (page: Page) => expect.poll(() => page.evaluate(async () => {
  const w = window as unknown as { __draws: number }, d0 = w.__draws;
  for (let i = 0; i < 30; i++) await new Promise(requestAnimationFrame);
  return w.__draws - d0;
}), { timeout: 15_000, intervals: [0] }).toBe(0);
