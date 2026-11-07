// The island's startup, N runs (a sibling of leak-probe.ts): cold, each run a fresh context (no service worker,
// nothing cached), or warm (WARM=1: one context, the service worker installed and its caches filled by a first load,
// then N reloads, as a launch of the installed app); each run's time to the first contentful paint, to
// window.__world3d, to the island's first frame and to loaded(); over its first 10 s the main thread's gaps (rAF
// intervals over 50 ms, their blocking time past 50 ms, before and after the first frame), Chromium's long tasks, and
// the engine's frames; the launch's own clock (world3d/boot.ts, the log's perf.boot: the island whole on screen, the
// longest frames, the frame it appears in); then the medians. WebKit as an iPhone 15 (default), or Chromium as an
// iPhone 13 (THROTTLE=4: its CPU 4x slower; Apple's GPU under it: ANGLE on Metal, never SwiftShader, docs/perf-plan.md
// §0). The demo without its shader checks (`checks=0`: a sync readback per program). A desktop's numbers, for an A/B
// of two builds (two serve-build ports): the phone's are the iOS Simulator's (npm run ios:check) and the phone's own.
// Never in CI.
//   [WARM=1] npm run perf:start -- <port> [runs] [webkit|chromium]     (the build served: node scripts/serve-build.ts <port>)
import { chromium, devices, webkit, type BrowserContext } from '@playwright/test';

const [port = '4693', runs = '5', eng = 'webkit'] = process.argv.slice(2);
const Q = process.env.Q ?? '?demo&checks=0&date=2026-11-04T12:00';
const warm = process.env.WARM === '1';
const browser = await (eng === 'chromium' ? chromium : webkit).launch(eng === 'chromium' ? { args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] } : {});
type Row = Record<string, number | string | boolean>;
const out: Row[] = [];
const fresh = () => browser.newContext({ ...devices[eng === 'chromium' ? 'iPhone 13' : 'iPhone 15'], serviceWorkers: warm ? 'allow' : 'block' });
const url = `http://127.0.0.1:${port}/${Q}`;
let shared: BrowserContext | null = null;
if (warm) {
  // the first visit: the island up, its service worker registered (after loaded: swLate.ts), controlling, its caches full
  shared = await fresh();
  const page = await shared.newPage();
  await page.goto(url);
  await page.waitForFunction(() => (window as unknown as { __world3d?: { loaded(): boolean } }).__world3d?.loaded(), null, { timeout: 60_000 });
  await page.waitForFunction(() => navigator.serviceWorker?.ready.then(() => true), null, { timeout: 60_000 });
  await page.reload();
  await page.waitForFunction(() => !!navigator.serviceWorker?.controller && (window as unknown as { __world3d?: { loaded(): boolean } }).__world3d?.loaded(), null, { timeout: 60_000 });
  await page.waitForTimeout(3000);
  await page.close();
}
for (let i = 0; i < Number(runs); i++) {
  const ctx = shared ?? (await fresh());
  const page = await ctx.newPage();
  if (eng === 'chromium' && process.env.THROTTLE) await (await ctx.newCDPSession(page)).send('Emulation.setCPUThrottlingRate', { rate: Number(process.env.THROTTLE) });
  await page.addInitScript(() => {
    type W3 = { stats(): { frames: number }; loaded(): boolean };
    const P = { raf: [] as number[], lt: [] as number[], first: 0, loaded: 0, w0: 0, done: false, frames: 0 };
    (window as unknown as { __perf: typeof P }).__perf = P;
    try {
      new PerformanceObserver((l) => l.getEntries().forEach((e) => P.lt.push(e.duration))).observe({ type: 'longtask', buffered: true });
    } catch {
      /* WebKit: no long tasks */
    }
    const loop = (t: number) => {
      P.raf.push(t);
      const w = (window as unknown as { __world3d?: W3 }).__world3d;
      if (w) {
        P.w0 ||= t;
        if (!P.first && w.stats().frames > 0) P.first = t;
        if (!P.loaded && w.loaded()) P.loaded = t;
      }
      if (t < 10_000) requestAnimationFrame(loop);
      else (P.done = true), (P.frames = w?.stats().frames ?? 0);
    };
    requestAnimationFrame(loop);
  });
  await page.goto(url);
  await page.waitForFunction(() => (window as unknown as { __perf: { done: boolean } }).__perf.done, null, { timeout: 60_000 });
  const r = await page.evaluate(() => {
    const P = (window as unknown as { __perf: { raf: number[]; lt: number[]; first: number; loaded: number; w0: number; frames: number } }).__perf;
    const gaps = P.raf.slice(1).map((t, i) => [P.raf[i], t - P.raf[i]]).filter(([, d]) => d > 50);
    const block = (from: number) => Math.round(gaps.filter(([t]) => t >= from).reduce((s, [, d]) => s + d - 50, 0));
    const boot = (window as unknown as { __world3d?: { boot(): Record<string, number | string | boolean> | null } }).__world3d?.boot() ?? {};
    return {
      fcp: Math.round(performance.getEntriesByName('first-contentful-paint')[0]?.startTime ?? 0), world: Math.round(P.w0), first: Math.round(P.first), loaded: Math.round(P.loaded),
      gaps50: gaps.length, maxGap: Math.round(Math.max(0, ...gaps.map(([, d]) => d))), block: block(0), blockAfterFirst: block(P.first),
      longTasks: Math.round(P.lt.reduce((s, d) => s + d, 0)), frames: P.frames,
      ...Object.fromEntries(Object.entries(boot).map(([k, v]) => [`boot.${k}`, v]))
    };
  });
  out.push(r);
  console.log(JSON.stringify(r));
  await page.close();
  if (!shared) await ctx.close();
}
await shared?.close();
await browser.close();
const median = (k: string) => {
  const v = out.map((o) => o[k]);
  if (typeof v[0] !== 'number') return v.join('/');
  return (v as number[]).sort((a, b) => a - b)[out.length >> 1];
};
console.log(`median (${eng}, ${warm ? 'warm' : 'cold'}, ${out.length} runs):`, JSON.stringify(Object.fromEntries(Object.keys(out[0]).map((k) => [k, median(k)]))));
