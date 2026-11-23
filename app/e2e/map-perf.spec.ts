// The maps at real scale, timed (MAP_PERF=1; not in any tier: numbers for the notes, as places-perf.spec.ts): 3,400
// invented places, an 8,000-point track in hike mode with the compass streaming, the trips' biggest days. Each map
// opened cold (nothing in the page) and warm (again; then relaunched with what a service worker would hold served at
// once), on the preview's speed and on a slow phone network (e2e/slownet.ts: 400 ms round trips, 400 kbit/s); Chromium
// also with its CPU 4× slower (CDP, an iPhone 15-class budget's proxy). Logged as `map-perf {json}` lines: each step's
// first time (ms after the tap), the requests (path, bytes on the wire, start/end), the open's longest frame gap and
// long tasks, frames and WebGL draw calls while panning and at rest.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';
import { expect, test, type Page, type TestInfo } from './fixtures.ts';
import { islandUp } from './island.ts';
import { unfoldMenu } from './hud.ts';
import { newRecord } from './record.ts';
import { manyPlaces, routePlaces } from './places.ts';
import { fixtureTiles, mapsDrawn } from './trips.ts';
import { FLAKY, SLOW, slow, type Net, type Seen } from './slownet.ts';
import { measure, watch, watched, type Probe } from './memory.ts';
import { placesPayload, type Place } from '../src/lib/contract/places.ts';

test.use({ viewport: { width: 393, height: 852 } });
test.describe.configure({ mode: 'serial' });
test.setTimeout(240_000);
/** A test only with MAP_PERF=1 (none listed otherwise: the shards' timings and the tiers never see them). */
const perf = (process.env.MAP_PERF ? test : () => {}) as typeof test;

const BUILD = join(import.meta.dirname, '..', 'build-pages');
const gz = new Map<string, number>();
/** A preview file's bytes gzipped (as Pages sends it), or its size. */
function wire(url: string): number {
  const p = new URL(url).pathname;
  if (!gz.has(p)) {
    try {
      const b = readFileSync(join(BUILD, decodeURIComponent(p)));
      gz.set(p, /\.(js|css|json|html|svg)$/.test(p) ? gzipSync(b).length : b.length);
    } catch {
      gz.set(p, 0);
    }
  }
  return gz.get(p)!;
}

/** Every request from now: its path (or host), the time it went (ms after `t0()` was last called) and its bytes. */
function netLog(page: Page) {
  let t0 = Date.now();
  const out: { u: string; at: number; kb: number }[] = [];
  page.on('request', (r) => {
    const url = r.url();
    if (url.startsWith('data:') || url.startsWith('blob:')) return;
    const u = new URL(url);
    out.push({ u: u.hostname === '127.0.0.1' ? u.pathname.replace(/^\/_app\/immutable\//, '') : `${u.hostname}${u.pathname.slice(0, 30)}`, at: Date.now() - t0, kb: u.hostname === '127.0.0.1' ? Math.round(wire(url) / 102.4) / 10 : 0 });
  });
  return { reset: () => ((t0 = Date.now()), (out.length = 0)), get: () => [...out] };
}

/** The requests a map's open made (the island's own left out), its tiles counted, not listed. */
const reqs = (l: { u: string; at: number; kb: number }[]) => {
  const map = l.filter((x) => !/^\/(room|art|audio)\/|workers\.dev|githubusercontent/.test(x.u));
  const tiles = map.filter((x) => /\.pbf|nationalmap|gsi\.go/.test(x.u));
  return { n: map.length, kb: Math.round(map.reduce((s, x) => s + x.kb, 0)), tiles: tiles.length, firstTileAt: tiles[0]?.at, list: map.filter((x) => !tiles.includes(x)).map((x) => `${x.u}@${x.at}:${x.kb}`) };
};

/** The throttled requests since `tap` that took bytes: path, start and end (ms after the tap), KB. */
const wired = (seen: Seen[], tap: number) => seen.filter((x) => x.t0 >= tap - 50 && x.bytes > 0 && !/\/(room|art|audio)\//.test(x.url)).map((x) => `${new URL(x.url).pathname.replace(/^\/_app\/immutable\//, '').slice(0, 40)} ${x.t0 - tap}-${x.t1 - tap} ${Math.round(x.bytes / 1024)}K`);

/** Before the goto: WebGL draw calls counted (window.__draws), long tasks kept (Chromium: window.__long). */
const counters = (page: Page) => page.addInitScript(() => {
  const w = window as unknown as { __draws: number; __long: { at: number; ms: number }[] };
  w.__draws = 0;
  w.__long = [];
  for (const C of [WebGLRenderingContext, typeof WebGL2RenderingContext === 'undefined' ? null : WebGL2RenderingContext]) {
    if (!C) continue;
    for (const k of ['drawElements', 'drawArrays', 'drawElementsInstanced', 'drawArraysInstanced'] as const) {
      const f = (C.prototype as unknown as Record<string, ((...a: unknown[]) => unknown) | undefined>)[k];
      if (f) (C.prototype as unknown as Record<string, unknown>)[k] = function (this: unknown, ...a: unknown[]) { w.__draws++; return f.apply(this, a); };
    }
  }
  try {
    new PerformanceObserver((l) => l.getEntries().forEach((e) => w.__long.push({ at: Math.round(e.startTime), ms: Math.round(e.duration) }))).observe({ type: 'longtask', buffered: false });
  } catch {
    /* WebKit: no longtask */
  }
});

type Kind = 'places' | 'trail' | 'trip';
/** In the page, from the next click: each step's first time (ms), every frame's gap; done once all are in or `ms` on. */
const record = (page: Page, kind: Kind, ms = 60_000) => page.evaluate(([kind, ms]) => {
  const w = window as unknown as Record<string, unknown> & { __tl?: unknown; __long: { at: number; ms: number }[] };
  const q = (s: string) => document.querySelector(s);
  // (read once a frame; the trail's every 4th: its state() projects every track point and queries 8 layers)
  let frame = 0;
  const memo = new Map<string, Record<string, number | string | boolean>>();
  const st = (name: string) => {
    if (!memo.has(name) || (kind !== 'trail' || frame % 4 === 0) && !memo.get(name)!.__f) memo.set(name, { ...((w[name] as { state?: () => Record<string, unknown> } | undefined)?.state?.() ?? {}) as Record<string, number | string | boolean>, __f: true });
    return memo.get(name)!;
  };
  const steps: Record<string, () => boolean> = kind === 'places' ? {
    sheet: () => !!q('dialog[open] [data-places]'),
    controls: () => !!q('dialog[open] [data-places] [data-locate]') || !!q('dialog[open] [data-places] [data-zoom]'),
    list: () => !!q('dialog[open] [data-place-row]'),
    canvas: () => !!q('dialog[open] .maplibregl-canvas'),
    ready: () => st('__placesMap').mode === 'ready',
    tile: () => !q('dialog[open] [data-map-note="loading"]') && st('__placesMap').mode === 'ready' && !!w.__tile,
    pins: () => Number(st('__placesMap').clusters) > 0,
    settled: () => !!st('__placesMap').settled
  } : kind === 'trail' ? {
    sheet: () => !!q('dialog[open] [data-trail-view]'),
    chart: () => !!q('dialog[open] [data-elev]'),
    canvas: () => !!q('dialog[open] .maplibregl-canvas'),
    ready: () => q('dialog[open] [data-trail-map]')?.getAttribute('data-mode') === 'ready',
    route: () => Number(st('__trailMap').track) > 0,
    places: () => Number(q('dialog[open] [data-trail-map]')?.getAttribute('data-places')) > 0,
    settled: () => !!st('__trailMap').settled
  } : {
    sheet: () => !!q('dialog[open] [data-map-pane]'),
    canvas: () => !!q('dialog[open] .maplibregl-canvas'),
    ready: () => st('__travelMap').mode === 'ready',
    pins: () => !!q('dialog[open] [data-map-pane] .maplibregl-marker'),
    route: () => Number(st('__travelMap').legs) > 0,
    places: () => Number(st('__travelMap').places) > 0,
    settled: () => !!st('__travelMap').settled
  };
  const out: Record<string, number> = {};
  const gaps: number[] = [];
  let t0 = 0, last = 0;
  const res = { out, gaps, long: [] as { at: number; ms: number }[], done: false };
  w.__tl = res;
  addEventListener('click', () => ((t0 = last = performance.now()), requestAnimationFrame(tick)), { capture: true, once: true });
  function tick() {
    const t = performance.now();
    gaps.push(Math.round(t - last));
    last = t;
    frame++;
    for (const v of memo.values()) v.__f = false;
    for (const [k, f] of Object.entries(steps)) {
      if (out[k] !== undefined) continue;
      try {
        if (f()) out[k] = Math.round(t - t0);
      } catch {
        /* not yet */
      }
    }
    if (Object.keys(out).length === Object.keys(steps).length || t - t0 > ms) {
      res.long = w.__long.filter((l) => l.at >= t0).map((l) => ({ at: Math.round(l.at - t0), ms: l.ms }));
      return void (res.done = true);
    }
    requestAnimationFrame(tick);
  }
}, [kind, ms] as const);
const recorded = async (page: Page) => {
  await expect.poll(() => page.evaluate(() => (window as unknown as { __tl: { done: boolean } }).__tl.done), { timeout: 90_000, intervals: [250] }).toBe(true);
  return page.evaluate(() => (window as unknown as { __tl: { out: Record<string, number>; gaps: number[]; long: { at: number; ms: number }[] } }).__tl);
};

/** Frames and draw calls over `ms` (at rest: both 0 once the map has stopped). */
const idle = (page: Page, ms = 2000) => page.evaluate(async (ms) => {
  const w = window as unknown as { __draws: number };
  const d0 = w.__draws;
  let frames = 0;
  const t0 = performance.now();
  await new Promise<void>((done) => {
    const f = () => (performance.now() - t0 > ms ? done() : (frames++, requestAnimationFrame(f)));
    requestAnimationFrame(f);
  });
  return { frames, draws: w.__draws - d0 };
}, ms);

/** A finger's drag across the map (mouse events: both engines' MapLibre takes them), each frame's gap and the draws. */
async function pan(page: Page, steps = 40) {
  const box = (await page.locator('dialog[open] .maplibregl-canvas').boundingBox())!;
  const x = box.x + box.width / 2, y = box.y + Math.min(300, box.height / 3), dy = Math.min(4, box.height / 3 / steps);
  await page.evaluate(() => {
    const w = window as unknown as { __pan: { gaps: number[]; d0: number; on: boolean }; __draws: number };
    w.__pan = { gaps: [], d0: w.__draws, on: true };
    let last = performance.now();
    const f = () => {
      const t = performance.now();
      w.__pan.gaps.push(t - last);
      last = t;
      if (w.__pan.on) requestAnimationFrame(f);
    };
    requestAnimationFrame(f);
  });
  await page.mouse.move(x, y);
  await page.mouse.down();
  for (let i = 1; i <= steps; i++) {
    await page.mouse.move(x + Math.sin(i / 6) * 120, y + i * dy);
    await page.evaluate(() => new Promise(requestAnimationFrame));
  }
  await page.mouse.up();
  return page.evaluate(() => {
    const w = window as unknown as { __pan: { gaps: number[]; d0: number; on: boolean }; __draws: number };
    w.__pan.on = false;
    const g = w.__pan.gaps.slice(1).sort((a, b) => a - b);
    return { frames: g.length, p50: Math.round(g[g.length >> 1]), p95: Math.round(g[Math.floor(g.length * 0.95)]), max: Math.round(g.at(-1)!), draws: w.__draws - w.__pan.d0 };
  });
}

const cpu = async (page: Page, rate: number) => {
  if (rate === 1 || page.context().browser()?.browserType().name() !== 'chromium') return;
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate });
};
const summary = (r: { out: Record<string, number>; gaps: number[]; long: { at: number; ms: number }[] }) => {
  const g = [...r.gaps].sort((a, b) => a - b);
  return { ...r.out, maxGap: g.at(-1), p95: g[Math.floor(g.length * 0.95)], long: r.long.length, longMs: r.long.reduce((s, l) => s + l.ms, 0), longMax: Math.max(0, ...r.long.map((l) => l.ms)) };
};
const say = (info: TestInfo, what: string, o: unknown) => console.log(`map-perf ${JSON.stringify({ p: info.project.name, what, ...(o as object) })}`);
const closeAll = async (page: Page) => {
  for (let k = 0; k < 4 && (await page.locator('dialog[open]').count()); k++) await page.keyboard.press('Escape');
  await expect(page.locator('dialog[open]')).toHaveCount(0);
};

/** 3,400 invented places over Okinawa's main island (the fixture tiles' corner drawn; the rest empty tiles). */
const okinawaPlaces = (n = 3400): Place[] => manyPlaces(n).map((p) => ({ ...p, lat: 26.2 + (p.lat - 35.5) * 1.5, lng: 127.65 + (p.lng - 139.4) * 0.7 }));

const PROFILES: { name: string; net: Net | null; cpu: number }[] = [
  { name: 'fast', net: null, cpu: 1 },
  { name: 'slow', net: SLOW, cpu: 1 },
  { name: 'cpu4', net: null, cpu: 4 },
  { name: 'slow+cpu4', net: SLOW, cpu: 4 },
  { name: 'flaky', net: FLAKY, cpu: 1 }
];

for (const prof of PROFILES) {
  perf(`保存した場所, 3,400 places (${prof.name}): opened cold, warm, relaunched warm; a search's keystrokes, a pan, at rest`, async ({ page, context }, info) => {
    test.skip(prof.cpu > 1 && info.project.name.startsWith('webkit'), 'CPU throttling: Chromium only');
    const rows = okinawaPlaces();
    const body = JSON.stringify(placesPayload(rows, { ver: 5, full: true, syncedAt: Date.parse('2026-11-04T10:30:00+09:00'), people: ['A', 'B'] }));
    await counters(page);
    await mapsDrawn(page);
    await fixtureTiles(page);
    await newRecord().pair(context, 'A');
    await routePlaces(page, rows);
    await page.addInitScript(() => localStorage.setItem('island.placesCam', JSON.stringify({ center: [127.9, 26.7], zoom: 10.5 })));
    const thr = prof.net ? await slow(page, prof.net, (u) => (u.includes('/places') && !u.includes('/sync') ? gzipSync(body).length : undefined)) : null;
    const net = netLog(page);
    // (the basemap's first tile seen by the page: MapStatus's loading note is shown only after a delay, so its absence says nothing)
    page.on('requestfinished', (r) => r.url().includes('.pbf') && void page.evaluate(() => ((window as unknown as { __tile: boolean }).__tile = true)).catch(() => {}));
    await page.goto('');
    await islandUp(page, { timeout: 90_000 });
    await cpu(page, prof.cpu);
    for (const step of ['cold', 'warm', 'relaunch'] as const) {
      if (step === 'relaunch') {
        thr?.warm();
        await page.reload();
        await islandUp(page, { timeout: 90_000 });
        await cpu(page, prof.cpu);
      }
      await unfoldMenu(page);
      await record(page, 'places');
      net.reset();
      const tap = Date.now();
      await page.locator('[data-hud-places]').click();
      const r = await recorded(page);
      say(info, `places ${prof.name} ${step}`, { ...summary(r), req: reqs(net.get()), ...(thr ? { wire: wired(thr.seen, tap) } : {}) });
      if (step === 'warm') {
        // a search's keystrokes: input → the next frame (the list and the map's setData queued), each
        const field = page.locator('dialog[open] [data-places-q]');
        const keys = await field.evaluate(async (el: HTMLInputElement) => {
          const out: number[] = [];
          for (const v of ['テ', 'テス', 'テスト', 'テスト1', 'テスト12', 'テスト12番', '', '麺']) {
            const t0 = performance.now();
            el.value = v;
            el.dispatchEvent(new InputEvent('input', { bubbles: true }));
            await new Promise((r) => requestAnimationFrame(() => setTimeout(r)));
            out.push(Math.round((performance.now() - t0) * 10) / 10);
          }
          el.value = '';
          el.dispatchEvent(new InputEvent('input', { bubbles: true }));
          return out;
        });
        // a moveend's browse box: the list recomputed (the view's own hook, as a moveend says it), to the next frame
        const browse = await page.evaluate(async () => {
          const h = (window as unknown as { __placesMap: { bounds(w: number, s: number, e: number, n: number): void } }).__placesMap;
          const out: number[] = [];
          for (let i = 0; i < 6; i++) {
            const t0 = performance.now();
            h.bounds(127.7 + i * 0.03, 26.3, 128.0 + i * 0.03, 26.8);
            await new Promise((r) => requestAnimationFrame(() => setTimeout(r)));
            out.push(Math.round((performance.now() - t0) * 10) / 10);
          }
          return out;
        });
        await expect.poll(async () => (await page.evaluate(() => (window as unknown as { __placesMap: { state(): { settled: boolean } } }).__placesMap.state().settled)), { timeout: 30_000 }).toBe(true);
        const rest0 = await idle(page);
        const p = await pan(page);
        await expect.poll(async () => (await page.evaluate(() => (window as unknown as { __placesMap: { state(): { settled: boolean } } }).__placesMap.state().settled)), { timeout: 30_000 }).toBe(true);
        const rest = await idle(page);
        say(info, `places ${prof.name} interact`, { keys, browse, pan: p, restBefore: rest0, restAfter: rest });
      }
      await closeAll(page);
    }
  });
}

/** A CPU profile (Chromium, CDP) over `run`: the heaviest files and functions by self time. */
async function profiled(page: Page, info: TestInfo, what: string, run: () => Promise<unknown>) {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Profiler.enable');
  await cdp.send('Profiler.setSamplingInterval', { interval: 200 });
  await cdp.send('Profiler.start');
  await run();
  const { profile } = await cdp.send('Profiler.stop');
  const dt = new Map<number, number>();
  profile.samples!.forEach((id, k) => dt.set(id, (dt.get(id) ?? 0) + (profile.timeDeltas![k] ?? 0)));
  const self = new Map<string, number>(), byFile = new Map<string, number>();
  for (const n of profile.nodes) {
    const f = n.callFrame, file = f.url.replace(/^.*\/(chunks|workers|entry|nodes)\//, '') || '(vm)', us = dt.get(n.id) ?? 0;
    const key = `${f.functionName || '(anon)'} ${file}:${f.lineNumber}`;
    self.set(key, (self.get(key) ?? 0) + us);
    byFile.set(file, (byFile.get(file) ?? 0) + us);
  }
  const top = (m: Map<string, number>, n: number) => [...m].sort((a, b) => b[1] - a[1]).slice(0, n).map(([k, v]) => `${k} ${(v / 1000).toFixed(0)}ms`);
  say(info, `profile ${what}`, { files: top(byFile, 12), fns: top(self, 25) });
}

// (MAP_PROFILE=1: CPU profiles at 4× of 保存した場所's relaunched open and a search's keystrokes)
perf('profile: 保存した場所 relaunched, opened and searched at 4×', async ({ page, context }, info) => {
  test.skip(!process.env.MAP_PROFILE || !info.project.name.startsWith('chromium'), 'MAP_PROFILE=1, Chromium');
  await mapsDrawn(page);
  await fixtureTiles(page);
  await newRecord().pair(context, 'A');
  await routePlaces(page, okinawaPlaces());
  await page.addInitScript(() => localStorage.setItem('island.placesCam', JSON.stringify({ center: [127.9, 26.7], zoom: 10.5 })));
  await page.goto('');
  await islandUp(page);
  await unfoldMenu(page);
  await page.locator('[data-hud-places]').click();
  await expect(page.locator('dialog[open] [data-place-row]').first()).toBeVisible();
  await closeAll(page);
  await page.reload();
  await islandUp(page);
  await cpu(page, 4);
  await unfoldMenu(page);
  const settled = () => expect.poll(() => page.evaluate(() => (window as unknown as { __placesMap?: { state(): { settled: boolean } } }).__placesMap?.state().settled ?? false), { timeout: 30_000 }).toBe(true);
  await profiled(page, info, 'places open', async () => {
    await page.locator('[data-hud-places]').click();
    await settled();
  });
  const field = page.locator('dialog[open] [data-places-q]');
  await profiled(page, info, 'places keys', () => field.evaluate(async (el: HTMLInputElement) => {
    for (const v of ['テ', 'テス', 'テスト', 'テスト1', 'テスト12', '', '麺', '']) {
      el.value = v;
      el.dispatchEvent(new InputEvent('input', { bubbles: true }));
      await new Promise((r) => requestAnimationFrame(() => setTimeout(r)));
    }
  }));
});

/** An 8,000-point track (a long day: ~22 km east, winding) about 35.0 N 139.0 E, as a track file. */
function longTrack(n = 8000) {
  const pts = Array.from({ length: n }, (_, i): [number, number, number] =>
    [+(139 + i * 0.00003 + 0.002 * Math.sin(i / 50)).toFixed(5), +(35 + 0.01 * Math.sin(i / 400) + 0.0005 * Math.cos(i / 13)).toFixed(5), +(500 + 800 * Math.sin(i / 2600) ** 2).toFixed(1)]);
  return { v: 1 as const, len: 24_000, pts, wpts: [{ lon: pts[4000][0], lat: pts[4000][1], name: '山頂' }] };
}
/** 3,400 places: 600 within ~1 km of the long track, the rest over Okinawa. */
const trailPlaces = (t: ReturnType<typeof longTrack>): Place[] =>
  okinawaPlaces().map((p, k) => (k < 600 ? { ...p, lng: t.pts[k * 13][0] + ((k % 7) - 3) * 0.002, lat: t.pts[k * 13][1] + ((k % 5) - 2) * 0.003 } : p));

/** The compass and the wake lock faked (hiking.spec's fakePhone, trimmed): `__heading(h)` a reading as iOS sends it. */
const phone = (page: Page) => page.addInitScript(() => {
  const w = window as unknown as Record<string, unknown>;
  const D = (window.DeviceOrientationEvent ?? class extends Event {}) as unknown as Record<string, unknown>;
  if (!window.DeviceOrientationEvent) w.DeviceOrientationEvent = D;
  D.requestPermission = () => Promise.resolve('granted');
  w.__heading = (h: number, acc = 10) => dispatchEvent(Object.assign(new Event('deviceorientation'), { webkitCompassHeading: h, webkitCompassAccuracy: acc }));
  Object.defineProperty(navigator, 'wakeLock', { configurable: true, value: { request: async () => Object.assign(new EventTarget(), { released: false, release: async () => {} }) } });
});
/** Draw calls while the compass streams 15 readings a second for `ms` (`turn`: degrees a reading). */
const compassDraws = (page: Page, turn: number, ms = 2000) => page.evaluate(async ([turn, ms]) => {
  const w = window as unknown as { __draws: number; __heading(h: number, a?: number): void };
  const d0 = w.__draws;
  let h = 100;
  const id = setInterval(() => w.__heading((h += turn)), 66);
  await new Promise((r) => setTimeout(r, ms));
  clearInterval(id);
  return w.__draws - d0;
}, [turn, ms] as const);
const trailSt = (page: Page) => page.evaluate(() => (window as unknown as { __trailMap?: { state(): Record<string, unknown> } }).__trailMap?.state() ?? {});

perf('profile: トレイル (8,000 points) opened again at 4×', async ({ page, context }, info) => {
  test.skip(!process.env.MAP_PROFILE || !info.project.name.startsWith('chromium'), 'MAP_PROFILE=1, Chromium');
  const track = longTrack();
  await page.addInitScript((key) => (localStorage.setItem('e2e.render', 'map'), localStorage.setItem('island.key', key)), (await import('./relay.ts')).KEY_OF.A);
  await page.route('**/hiking/tracks/*.json', (r) => r.fulfill({ json: track }));
  await page.route('**/hiking/net/*.json', (r) => r.fulfill({ status: 404, body: '' }));
  await routePlaces(page, trailPlaces(track));
  await page.goto(`/?demo&date=2026-11-04T12:00`);
  await islandUp(page);
  await unfoldMenu(page);
  await page.locator('[data-hud-hiking]').click();
  const sheet = page.locator('dialog[open] [data-hiking]');
  await sheet.locator('[data-trail="kinpu-odarumi"]').click();
  await expect.poll(async () => Number((await trailSt(page)).track), { timeout: 30_000 }).toBeGreaterThan(0);
  await page.locator('dialog[open] [data-trail-view] .nav.back').click();
  await cpu(page, 4);
  await profiled(page, info, 'trail open', async () => {
    await sheet.locator('[data-trail="kinpu-odarumi"]').click();
    await expect.poll(async () => Number((await trailSt(page)).track), { timeout: 30_000 }).toBeGreaterThan(0);
  });
  void context;
});

for (const prof of PROFILES) {
  perf(`トレイル, an 8,000-point track, 600 of 3,400 places near it (${prof.name}): opened cold and warm; a pan, at rest, following with the compass, hike mode's fixes`, async ({ page, context }, info) => {
    test.skip(prof.cpu > 1 && info.project.name.startsWith('webkit'), 'CPU throttling: Chromium only');
    const track = longTrack(), rows = trailPlaces(track);
    await counters(page);
    await phone(page);
    await context.grantPermissions(['geolocation']);
    await context.setGeolocation({ latitude: track.pts[100][1], longitude: track.pts[100][0], accuracy: 8 });
    await page.addInitScript((key) => (localStorage.setItem('e2e.render', 'map'), localStorage.setItem('island.key', key)), (await import('./relay.ts')).KEY_OF.A);
    await page.route('**/hiking/tracks/*.json', (r) => r.fulfill({ json: track }));
    await page.route('**/hiking/net/*.json', (r) => r.fulfill({ status: 404, body: '' }));
    await routePlaces(page, rows);
    const thr = prof.net ? await slow(page, prof.net, (u) => (/\/hiking\/tracks\//.test(u) ? 60_000 : undefined)) : null;
    const net = netLog(page);
    await page.goto(`/?demo&date=2026-11-04T12:00`);
    await islandUp(page, { timeout: 90_000 });
    await cpu(page, prof.cpu);
    const sheet = page.locator('dialog[open] [data-hiking]');
    await unfoldMenu(page);
    await page.locator('[data-hud-hiking]').click();
    for (const step of ['cold', 'warm'] as const) {
      await record(page, 'trail');
      net.reset();
      const tap = Date.now();
      await sheet.locator('[data-trail="kinpu-odarumi"]').click();
      const r = await recorded(page);
      say(info, `trail ${prof.name} ${step}`, { ...summary(r), req: reqs(net.get()), ...(thr ? { wire: wired(thr.seen, tap) } : {}) });
      if (step === 'cold') {
        await page.locator('dialog[open] [data-trail-view] .nav.back').click();
        await expect(sheet.locator('[data-trail="kinpu-odarumi"]')).toBeVisible();
      }
    }
    const view = sheet.locator('[data-trail-view="kinpu-odarumi"]');
    await expect.poll(async () => (await trailSt(page)).settled, { timeout: 60_000 }).toBe(true);
    const rest = await idle(page);
    const p = await pan(page);
    await expect.poll(async () => (await trailSt(page)).settled, { timeout: 60_000 }).toBe(true);
    const restAfter = await idle(page);
    // following, the compass streaming: held still (the readings the same), then turning 3° a reading
    await view.locator('[data-locate]').click();
    await expect(view.locator('[data-locate]')).toHaveAttribute('data-locate', 'follow');
    await expect.poll(async () => (await trailSt(page)).settled, { timeout: 60_000 }).toBe(true);
    await compassDraws(page, 0, 800);
    const still = await compassDraws(page, 0);
    const turning = await compassDraws(page, 3);
    // hike mode: a fix a second along the track, each frame's gap and the draws
    await view.locator('[data-sheet-grip]').click();
    await view.locator('[data-hike-start]').click();
    await expect(view.locator('[data-hike-strip]')).toBeVisible();
    const fixes = [];
    for (let k = 1; k <= 6; k++) {
      const d0 = await page.evaluate(() => (window as unknown as { __draws: number }).__draws);
      const t0 = Date.now();
      await context.setGeolocation({ latitude: track.pts[100 + k * 20][1], longitude: track.pts[100 + k * 20][0], accuracy: 8 });
      await expect.poll(async () => Number(await view.locator('[data-trail-map]').getAttribute('data-walked'))).toBeGreaterThan(0);
      const gaps = await page.evaluate(async () => {
        const g: number[] = [];
        let last = performance.now();
        for (let i = 0; i < 30; i++) {
          await new Promise(requestAnimationFrame);
          const t = performance.now();
          g.push(t - last);
          last = t;
        }
        return Math.round(Math.max(...g));
      });
      fixes.push({ ms: Date.now() - t0, maxGap: gaps, draws: (await page.evaluate(() => (window as unknown as { __draws: number }).__draws)) - d0 });
    }
    const hikeRest = await idle(page);
    say(info, `trail ${prof.name} interact`, { rest, pan: p, restAfter, compassStill: still, compassTurning: turning, fixes, hikeRest, places: (await trailSt(page)).places });
  });
}

/** 3,400 places over the NZ trip's North Island (each of its days has some within 2 km). */
const nzPlaces = (): Place[] => manyPlaces(3400).map((p, i) => ({ ...p, lat: -39.3 + (((i * 37) % 400) / 400) * 2.6, lng: 174.0 + (((i * 53) % 600) / 600) * 1.2, tz: 'Pacific/Auckland' }));

for (const prof of PROFILES) {
  perf(`りょこう, NZ's map, 3,400 places on its island (${prof.name}): opened cold and warm; each day picked; a pan, at rest`, async ({ page }, info) => {
    test.skip(prof.cpu > 1 && info.project.name.startsWith('webkit'), 'CPU throttling: Chromium only');
    await counters(page);
    await page.addInitScript((key) => (localStorage.setItem('e2e.render', 'map'), localStorage.setItem('island.key', key)), (await import('./relay.ts')).KEY_OF.A);
    await fixtureTiles(page);
    await routePlaces(page, nzPlaces());
    const thr = prof.net ? await slow(page, prof.net) : null;
    const net = netLog(page);
    await page.goto(`/?demo&date=2026-11-04T12:00`);
    await islandUp(page, { timeout: 90_000 });
    await cpu(page, prof.cpu);
    await unfoldMenu(page);
    await page.locator('[data-hud-travel]').click();
    const sheet = page.locator('dialog[open] [data-travel]');
    await sheet.locator('[data-trip="nz"]').click();
    await expect(sheet.locator('[data-trip-view="nz"]')).toBeVisible();
    for (const step of ['cold', 'warm'] as const) {
      await record(page, 'trip');
      net.reset();
      const tap = Date.now();
      await sheet.locator('[data-trip-tab="map"]').click();
      const r = await recorded(page);
      say(info, `trip ${prof.name} ${step}`, { ...summary(r), req: reqs(net.get()), ...(thr ? { wire: wired(thr.seen, tap) } : {}) });
      if (step === 'cold') {
        await sheet.locator('[data-trip-tab="days"]').click();
        await expect(sheet.locator('[data-pane="days"]')).toBeVisible();
      }
    }
    const tm = () => page.evaluate(() => (window as unknown as { __travelMap: { state(): { settled: boolean; places: number } } }).__travelMap.state());
    await expect.poll(async () => (await tm()).settled, { timeout: 60_000 }).toBe(true);
    // each day: the chip's tap to the next frame (nearRoute and the pins), then to settled
    const chips = sheet.locator('[data-map-day]');
    const days = [];
    for (let k = 0; k < (await chips.count()); k++) {
      const t0 = Date.now();
      await chips.nth(k).click();
      const frame = await page.evaluate(() => new Promise<number>((r) => { const t = performance.now(); requestAnimationFrame(() => r(performance.now() - t)); }));
      await expect.poll(async () => (await tm()).settled, { timeout: 60_000 }).toBe(true);
      days.push({ day: k + 1, frame: Math.round(frame), settledMs: Date.now() - t0, places: (await tm()).places });
    }
    const rest = await idle(page);
    const box = await page.locator('dialog[open] .maplibregl-canvas').boundingBox();
    const p = await pan(page);
    await expect.poll(async () => (await tm()).settled, { timeout: 15_000 }).toBe(true).catch(async () => say(info, 'trip unsettled', { box, st: await tm(), moving: await page.evaluate(() => { const m = (window as unknown as { __travelMap: { map?: { isMoving(): boolean; areTilesLoaded(): boolean } } }).__travelMap; return Object.keys(m); }) }));
    const restAfter = await idle(page);
    say(info, `trip ${prof.name} interact`, { days, rest, pan: p, restAfter });
  });
}

// ---------------------------------------------------------------- memory (Chromium: CDP's GC; MAP_PERF too)

const mem = (info: TestInfo, what: string, rounds: number[], a: Probe, b: Probe) =>
  say(info, `mem ${what}`, { liveMaps: rounds, gl: [a.gl, b.gl], map: [a.map, b.map], ls: [a.ls, b.ls], fonts: [a.fonts, b.fonts], nodes: [a.nodes, b.nodes], heap: [a.heap, b.heap], ab: [a.ab, b.ab] });

perf('memory: each map opened and closed 10×, the trip’s days switched 20×, its layers toggled 20×', async ({ page }, info) => {
  test.skip(!info.project.name.startsWith('chromium'), 'CDP');
  test.setTimeout(600_000);
  const track = longTrack();
  await watch(page);
  await counters(page);
  await page.addInitScript((key) => (localStorage.setItem('e2e.render', 'map'), localStorage.setItem('island.key', key)), (await import('./relay.ts')).KEY_OF.A);
  await fixtureTiles(page);
  await page.route('**/hiking/tracks/*.json', (r) => r.fulfill({ json: track }));
  await page.route('**/hiking/net/*.json', (r) => r.fulfill({ status: 404, body: '' }));
  await routePlaces(page, [...trailPlaces(track).slice(0, 1700), ...nzPlaces().slice(0, 1700)]);
  await page.goto(`/?demo&date=2026-11-04T12:00`);
  await islandUp(page, { timeout: 90_000 });
  const placesSt = () => page.evaluate(() => (window as unknown as { __placesMap?: { state(): { mode: string; settled: boolean } } }).__placesMap?.state() ?? null);
  const tm = () => page.evaluate(() => (window as unknown as { __travelMap?: { state(): { mode: string; settled: boolean } } }).__travelMap?.state() ?? null);
  const go = async (pill: string) => (await unfoldMenu(page), await page.locator(pill).click());
  const run = async (what: string, n: number, round: () => Promise<void>) => {
    const live: number[] = [];
    await round();
    live.push((await watched(page)).map);
    const a = await measure(page);
    for (let i = 1; i < n; i++) (await round(), live.push((await watched(page)).map));
    const b = await measure(page);
    mem(info, what, live, a, b);
  };
  await run('保存した場所 ×10', 10, async () => {
    await go('[data-hud-places]');
    await expect.poll(async () => (await placesSt())?.mode, { timeout: 30_000 }).toBe('ready');
    await page.locator('dialog[open] [data-places-q]').fill('テスト1');
    await page.locator('dialog[open] [data-place-row]').first().click();
    await expect(page.locator('dialog[open] [data-place-card]')).toBeVisible();
    await closeAll(page);
  });
  await run('トレイル (8,000 points, its places) ×10', 10, async () => {
    await go('[data-hud-hiking]');
    await page.locator('dialog[open] [data-trail="kinpu-odarumi"]').click();
    await expect.poll(async () => (await trailSt(page)).mode ?? (await page.locator('dialog[open] [data-trail-map]').getAttribute('data-mode')), { timeout: 30_000 }).toBe('ready');
    await expect.poll(async () => Number((await trailSt(page)).track), { timeout: 30_000 }).toBeGreaterThan(0);
    await closeAll(page);
  });
  // (the sheet opens again on the trip and page last shown)
  const nzMap = async () => {
    const view = page.locator('dialog[open] [data-trip-view="nz"]');
    await expect(page.locator('dialog[open] [data-trip="nz"], dialog[open] [data-trip-view="nz"]').first()).toBeVisible();
    if (!(await view.count())) await page.locator('dialog[open] [data-trip="nz"]').click();
    await view.locator('[data-trip-tab="map"]').click();
  };
  await run('the trip map ×10', 10, async () => {
    await go('[data-hud-travel]');
    await nzMap();
    await expect.poll(async () => (await tm())?.mode, { timeout: 30_000 }).toBe('ready');
    await closeAll(page);
  });
  // one map open: its days 20×, then Okinawa's layers 20×
  await go('[data-hud-travel]');
  await nzMap();
  await expect.poll(async () => (await tm())?.mode, { timeout: 30_000 }).toBe('ready');
  const chips = page.locator('dialog[open] [data-map-day]');
  const nDays = await chips.count();
  let k = 0;
  await run('NZ’s days switched ×20', 20, async () => {
    await chips.nth(k++ % nDays).click();
    await expect.poll(async () => (await tm())?.settled, { timeout: 30_000 }).toBe(true);
  });
  await page.locator('dialog[open] .navbar .back').click();
  await page.locator('dialog[open] [data-trip="okinawa"]').click();
  await page.locator('dialog[open] [data-trip-tab="map"]').click();
  await expect.poll(async () => (await tm())?.mode, { timeout: 30_000 }).toBe('ready');
  await page.locator('dialog[open] [data-map-layers]').click();
  let j = 0;
  await run('Okinawa’s layers toggled ×20', 20, async () => {
    await page.locator(`dialog[open] [data-map-layer="${['camp', 'nature', 'food', 'places'][j++ % 4]}"]`).click();
    await expect.poll(async () => (await tm())?.settled, { timeout: 30_000 }).toBe(true);
  });
  await closeAll(page);
});

perf('memory: 保存した場所’s DOM nodes, round by round', async ({ page, context }, info) => {
  test.skip(!info.project.name.startsWith('chromium') || !process.env.MAP_NODES, 'CDP; MAP_NODES=open|card');
  test.setTimeout(300_000);
  await watch(page);
  await mapsDrawn(page);
  await fixtureTiles(page);
  await newRecord().pair(context, 'A');
  await routePlaces(page, okinawaPlaces(1500));
  await page.goto('');
  await islandUp(page);
  const out: number[] = [];
  for (let i = 0; i < 8; i++) {
    await unfoldMenu(page);
    await page.locator('[data-hud-places]').click();
    await expect.poll(() => page.evaluate(() => (window as unknown as { __placesMap?: { state(): { mode: string } } }).__placesMap?.state().mode), { timeout: 30_000 }).toBe('ready');
    if (process.env.MAP_NODES === 'card') {
      await page.locator('dialog[open] [data-places-q]').fill('テスト1');
      await page.locator('dialog[open] [data-place-row]').first().click();
      await expect(page.locator('dialog[open] [data-place-card]')).toBeVisible();
    }
    await closeAll(page);
    out.push((await measure(page)).nodes);
  }
  say(info, `nodes ${process.env.MAP_NODES}`, { out });
});
