// The launch's timeline (LAUNCH_PERF=1 only: a measure, not a gate; docs/ops/perf.md): a paired phone's cold launch with
// its service worker and caches warm, under four networks (e2e/launch.ts: offline, slow 400 ms / 400 kbps, lie-fi, good),
// marked on the wall clock from the navigation asked: the shell's first paint, the HUD shown, the menu opened by a tap,
// the island's first frame and its models in, and each sheet's cached data (ごはん, 旅行, 登山, 地図, やること) with its
// taps made as soon as the HUD shows; the requests the launch made (the origin's and the relay's) beside them.
// Cold as a killed app's: the browser closed after the visits before and opened again on its profile (a cold network
// process and worker). The relay is the e2e's record (record.ts) behind the browser's proxy: nothing leaves this
// machine (launch.ts). One JSON line a launch to LAUNCH_OUT (a file), and the test's attachment.
//   LAUNCH_PERF=1 [LAUNCH_OUT=<file>] npx playwright test launch-timeline --project webkit --workers 2
import { appendFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, test, type BrowserContext, type BrowserType, type Page } from './fixtures.ts';
import { markLaunch, marksFrom, PROFILES, relayProxy, relayRoutes, shapedOrigin, SHEETS, type Profile, type Req, type Sheet } from './launch.ts';
import { newRecord } from './record.ts';
import { routePlaces } from './places.ts';
import { RELAY } from './relay.ts';

test.describe.configure({ mode: 'parallel' });
// (the hermetic watch off: the browser's own proxy refuses every host but the stand-in relay)
test.use({ network: 'any' });

type W = Window & { __world3d?: { loaded(): boolean; boot?: () => Record<string, unknown> | null } };
type Script = [unknown, unknown];

/** Phone A: its record (a to-do list on it, the saved places beside), the relay behind the browser's proxy, its
 *  browser opened on its own profile (`open`, again after a `close`: a cold launch). */
async function phoneA(type: BrowserType, use: Record<string, unknown>, net: () => Profile, reqs: Req[], sheet: Sheet | null) {
  const rec = newRecord(), scripts: Script[] = [];
  const routes = relayRoutes(async (s, a) => void scripts.push([s, a]));
  const proxy = await relayProxy(RELAY, routes.answer, net, reqs);
  await rec.pair(routes.context, 'A');
  const at = rec.now();
  rec.event('A', 'todo', { id: 'dshop001', at, title: 'かいもの', ord: 0 });
  ['たまご', 'ぎゅうにゅう', 'パン'].forEach((text, i) => rec.event('A', 'todo', { id: `dshop001i${i}`, at: at + 1 + i, list: 'dshop001', text, ord: i, done: 0 }));
  await routePlaces(routes.context as unknown as Page);
  const dir = mkdtempSync(join(tmpdir(), 'launch-'));
  const { userAgent, deviceScaleFactor, isMobile, hasTouch } = use as Record<string, never>;
  let context: BrowserContext | null = null;
  return {
    async open() {
      context = await type.launchPersistentContext(dir, {
        userAgent, deviceScaleFactor, isMobile, hasTouch, viewport: { width: 393, height: 852 }, locale: 'ja-JP', timezoneId: 'Asia/Tokyo',
        serviceWorkers: 'allow', ignoreHTTPSErrors: true, proxy: { server: proxy.server, bypass: '127.0.0.1,localhost' }
      });
      // (the hooks; no ambient life, as fixtures.ts's contexts; the record's device clock and key: record.ts pair)
      await context.addInitScript(() => (localStorage.setItem('e2e', '1'), localStorage.setItem('e2e.ambient', 'off')));
      for (const [s, a] of scripts) await context.addInitScript(s as () => void, a);
      await markLaunch(context, sheet);
      return context;
    },
    close: async () => void (await context?.close(), (context = null)),
    async end() {
      await context?.close();
      await proxy.close();
      rmSync(dir, { recursive: true, force: true });
    }
  };
}

/** Till nothing has gone to the origin for `ms`. */
const quiet = async (reqs: Req[], ms = 1500) => {
  for (let n = -1; n !== reqs.length; ) ((n = reqs.length), await new Promise((ok) => setTimeout(ok, ms)));
};

/** The visits before: online, the island up twice (the first load's files kept by the worker: ui-state/swLate.ts), the
 *  worker in control and installed, the sheet opened (its chunk and data cached), the network quiet; the origin's
 *  cache entries a phone's; then FRESH_KEY dropped (a launch past FRESH_MS races the network, as most cold opens do). */
async function warm(page: Page, origin: string, sheet: Sheet | null, reqs: Req[]) {
  await page.goto(`${origin}/`);
  await page.waitForFunction(() => !!navigator.serviceWorker.controller && !!(window as W).__world3d?.loaded(), null, { timeout: 60_000 });
  await page.evaluate(async () => void ((window as unknown as { __reg: ServiceWorkerRegistration }).__reg = await navigator.serviceWorker.ready));
  await page.waitForFunction(() => ((r) => !r.installing && !r.waiting)((window as unknown as { __reg: ServiceWorkerRegistration }).__reg), null, { timeout: 60_000 });
  await quiet(reqs);
  await page.reload();
  await page.waitForFunction(() => !!(window as W).__world3d?.loaded(), null, { timeout: 60_000 });
  if (sheet) await page.waitForFunction((sel) => !!document.querySelector(sel), SHEETS[sheet].data, { timeout: 30_000 }).catch(async (e: Error) => {
    throw new Error(`${e.message}: ${await page.evaluate(() => document.querySelector('dialog[open]')?.textContent?.slice(0, 300) ?? 'no sheet')}`);
  });
  await quiet(reqs);
  // (a phone's origin holds ~3,300 cache entries, perf.boot `ents`, and a cold worker's first match costs by the
  // origin's count (L1's measure, 2026-11-23): LAUNCH_ENTS tiny entries more here, default 3,300; 0: none)
  await page.evaluate(async (n) => {
    const c = await caches.open('launch-ballast');
    for (let i = 0; i < n; i += 100) await Promise.all(Array.from({ length: Math.min(100, n - i) }, (_, j) => c.put(`/__ballast/${i + j}`, new Response('x'))));
  }, Number(process.env.LAUNCH_ENTS ?? 3300));
  await page.evaluate(async () => {
    for (const k of await caches.keys()) if (k.startsWith('island-shell-')) {
      const c = await caches.open(k);
      for (const r of await c.keys()) if (r.url.endsWith('__fresh')) await c.delete(r);
    }
  });
}

const DONE = (m: Record<string, number>, sheet: Sheet | null) => m.loaded !== undefined && m.menu !== undefined && (sheet ? m.data !== undefined : m.island !== undefined);

// (the networks interleaved, each sheet's four in a row: a machine's load drifting over a run spreads over all four)
// (declared only under LAUNCH_PERF: else one skipped stand-in, so the gate's plan and timings see one test, not 24)
if (!process.env.LAUNCH_PERF) test('the launch timeline (LAUNCH_PERF=1)', () => test.skip(true, 'a measure: LAUNCH_PERF=1'));
else for (const sheet of [null, ...(Object.keys(SHEETS) as Sheet[])])
  for (const net of PROFILES)
    test(`${net} · ${sheet ?? 'core'}`, async ({ browserName, playwright }, info) => {
      test.setTimeout(150_000); // (two visits and a launch, a browser started twice: a measure, outside the gate)
      let now: Profile = 'good';
      const reqs: Req[] = [];
      const origin = await shapedOrigin(String(info.project.use.baseURL).replace(/\/$/, ''), () => now);
      const phone = await phoneA(playwright[browserName], info.project.use as Record<string, unknown>, () => now, reqs, sheet);
      try {
        const before = await phone.open();
        await warm(before.pages()[0] ?? (await before.newPage()), origin.origin, sheet, origin.reqs);
        await phone.close();

        // the cold launch
        now = net;
        const context = await phone.open();
        if (net === 'offline') await context.setOffline(true);
        const page = context.pages()[0] ?? (await context.newPage());
        const seen = origin.reqs.length, seenR = reqs.length, t0 = Date.now();
        await page.goto(`${origin.origin}/`, { waitUntil: 'commit', timeout: 30_000 });
        await expect.poll(async () => DONE(await marksFrom(page, t0), sheet), { timeout: 30_000, intervals: [100] }).toBe(true).catch(() => {});
        const marks = await marksFrom(page, t0);
        const boot = sheet ? null : await page.waitForFunction(() => (window as W).__world3d?.boot?.() ?? null, null, { timeout: 5_000 }).then((h) => h.jsonValue()).catch(() => null);
        const waterfall = [...origin.reqs.slice(seen), ...reqs.slice(seenR)].map((r) => ({ ...r, start: r.start - t0, end: r.end === undefined ? null : r.end - t0 })).sort((a, b) => a.start - b.start);
        const row = { net, sheet: sheet ?? 'core', browser: browserName, marks, boot, waterfall };
        if (process.env.LAUNCH_OUT) appendFileSync(process.env.LAUNCH_OUT, `${JSON.stringify(row)}\n`);
        await info.attach('launch.json', { body: JSON.stringify(row, null, 1), contentType: 'application/json' });
        console.log(`${net} ${sheet ?? 'core'}: ${JSON.stringify(marks)}`);
        // (a measure first: the marks it got are what it reports; the HUD at least, whatever the network)
        expect(marks.hud, 'the HUD shown').toBeDefined();
      } finally {
        await phone.end();
        await origin.close();
      }
    });
