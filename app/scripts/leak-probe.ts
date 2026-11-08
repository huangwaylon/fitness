// The memory-leak probe (docs/ops/testing.md "Memory"): N cycles of a flow in Chromium as an iPhone 13 (or WebKit as
// an iPhone 15: --webkit, no CDP: no GC, no heap), after each a forced GC and the JS heap, DOM nodes, JS listeners, the
// WebGL contexts still alive (WeakRefs), intervals, document.fonts' faces, rAF callbacks a second, the window's/document's listeners and the
// island's renderer.info.
//   npm run leak -- <flow> [cycles] [--snap] [--path=<name>]     (the build served at E2E_PORT, default 4693)
// flows: shop tent home museum fpv (the museum in first person) editor (the island ⇄ there), all (the four rooms), abort
// (the island's mount left 30-250 ms in, for the shop), food
// health zukan settings bells sheets (open, close), trips okinawa wedding trails info (the info sheets, their maps drawn on
// fixture tiles: NZ's pages, Okinawa's 地図, a task and メモ, three trails; info: all four), look (すがた: a villager's look, then いつもの), clothes (すがた: four
// tops and their colours worn, then いつもの; the island's and the room's textures must not grow), picker (いえを かえる; Q='&as=B'), vis (hidden ⇄ visible), sim (the
// page's clock 10 sim minutes a cycle from SIM_AT, default 23:00: the island's day running and rolling over; LOGIC=1:
// not drawn), days (DAY_H sim hours a cycle, fast-forwarded: the visitors coming and going), idle (IDLE_MS of real
// time; DWELL: ms in a room, default 1500), dressrace (すがた closed while a top it was tapped for still loads), stereo (the tent's jukebox list scrolled, closed: blob URLs), lookidle (すがた open at rest: its rAFs), fish (10 casts and reels; Q='&critter=fish'), sell (the shop's うる, 5 sells). Inside the museum: eye (the eye
// button on, off), bench (sit on a bench, a tap on the floor), curator (IDLE_MS there), hours (the aquarium's hour on x3), rebuild (a find kept off
// and let back x2: the aquarium rebuilt as a new find rebuilds it).
// FILL=1 (a room flow): the room furnished with the starter set first. --snap: heap snapshots at cycle SNAP_AT (default 3; 0: none, the end's whole heap) and the end, diffed by constructor; --path=<name>: the retainer
// paths of the first PATHS nodes so named (=<name>: exactly) new since the first snapshot. Read handles: the probe never keeps one (a JSHandle holds what it points at).
import { chromium, webkit, devices, type CDPSession } from '@playwright/test';
import { writeFileSync } from 'node:fs';
import { BUG_IDS, FISH_IDS } from '../src/lib/components/museum/species.ts';

const PORT = Number(process.env.E2E_PORT ?? 4693);
// the build's base path (BASE_PATH, as serve-build.ts: '' at the root, the default)
const PATH = process.env.BASE_PATH ?? '';
const BASE = `http://127.0.0.1:${PORT}${PATH}/`;
const flow = process.argv[2] ?? 'shop';
const N = Number(process.argv[3] ?? 6);
const SNAP = process.argv.includes('--snap');
const WK = process.argv.includes('--webkit');
const Q = `?demo&date=2026-11-04T12:00${flow === 'fpv' ? '&fpv=1' : ''}${process.env.Q ?? ''}`;

const browser = WK ? await webkit.launch() : await chromium.launch({ channel: 'chrome', args: ['--enable-unsafe-swiftshader', '--js-flags=--expose-gc'] });
const ctx = await browser.newContext({ ...(WK ? devices['iPhone 15'] : devices['iPhone 13']), locale: 'ja-JP', timezoneId: 'Asia/Tokyo', serviceWorkers: 'block' });
if (process.env.LOGIC) await ctx.addInitScript(() => localStorage.setItem('e2e.render', 'none'));
await ctx.addInitScript(() => {
  const W = window as unknown as Record<string, unknown>;
  const gls: WeakRef<object>[] = [];
  const gc0 = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, ...a: unknown[]) {
    const c = (gc0 as (...x: unknown[]) => RenderingContext | null).apply(this, a);
    if (c && String(a[0]).startsWith('webgl') && !gls.some((r) => r.deref() === c)) gls.push(new WeakRef(c));
    return c;
  } as typeof gc0;
  // listeners on window/document/visualViewport/matchMedia, net
  const net = new Map<string, number>();
  const key = (t: EventTarget, type: string) => `${t === window ? 'window' : t === document ? 'document' : t === window.visualViewport ? 'vv' : t.constructor.name}:${type}`;
  const add0 = EventTarget.prototype.addEventListener, rem0 = EventTarget.prototype.removeEventListener;
  const seen = new WeakMap<object, Set<string>>();
  EventTarget.prototype.addEventListener = function (this: EventTarget, type: string, f: unknown, o?: unknown) {
    if (f && (this === window || this === document || this === window.visualViewport || this instanceof MediaQueryList || this instanceof BroadcastChannel || this instanceof WebSocket)) {
      const cap = typeof o === 'boolean' ? o : !!(o as { capture?: boolean })?.capture;
      const s = seen.get(f as object) ?? new Set();
      const k = key(this, type) + (cap ? '!' : '');
      if (!s.has(k)) { s.add(k); seen.set(f as object, s); net.set(k, (net.get(k) ?? 0) + 1); }
    }
    return add0.call(this, type, f as EventListener, o as AddEventListenerOptions);
  };
  EventTarget.prototype.removeEventListener = function (this: EventTarget, type: string, f: unknown, o?: unknown) {
    const cap = typeof o === 'boolean' ? o : !!(o as { capture?: boolean })?.capture;
    const k = key(this, type) + (cap ? '!' : '');
    const s = f ? seen.get(f as object) : null;
    if (s?.has(k)) { s.delete(k); net.set(k, (net.get(k) ?? 0) - 1); }
    return rem0.call(this, type, f as EventListener, o as EventListenerOptions);
  };
  const ivs = new Set<number>();
  const si = setInterval, ci = clearInterval;
  W.setInterval = (...a: Parameters<typeof setInterval>) => { const id = si(...a) as unknown as number; ivs.add(id); return id; };
  W.clearInterval = (id: number) => { ivs.delete(id); ci(id); };
  // rAF callbacks asked for (a loop left running: more a second, cycle after cycle)
  let rafs = 0;
  const raf0 = requestAnimationFrame;
  W.requestAnimationFrame = (f: FrameRequestCallback) => (rafs++, raf0(f));
  W.__rafs = () => rafs;
  // each context's live textures (the clothes flow: the すがた stage's, the newest)
  const texN = new WeakMap<object, number>();
  for (const P of [WebGLRenderingContext.prototype, WebGL2RenderingContext.prototype] as unknown as Record<string, (...a: unknown[]) => unknown>[]) {
    const c0 = P.createTexture, d0 = P.deleteTexture;
    P.createTexture = function (this: object, ...a: unknown[]) { texN.set(this, (texN.get(this) ?? 0) + 1); return c0.apply(this, a); };
    P.deleteTexture = function (this: object, ...a: unknown[]) { if (a[0]) texN.set(this, (texN.get(this) ?? 0) - 1); return d0.apply(this, a); };
  }
  W.__newestTex = () => { const c = gls.map((r) => r.deref()).filter(Boolean).at(-1); return c ? texN.get(c) ?? 0 : 0; };
  // blob URLs alive (the music's files: sound/engine.ts #blobs)
  const blobs = new Set<string>(), cu0 = URL.createObjectURL, ru0 = URL.revokeObjectURL;
  URL.createObjectURL = (o: Blob | MediaSource) => { const u = cu0(o); blobs.add(u); return u; };
  URL.revokeObjectURL = (u: string) => { blobs.delete(u); ru0(u); };
  W.__blobs = () => blobs.size;
  W.__probe = () => ({ gl: gls.filter((r) => r.deref()).length, ivs: ivs.size, fonts: document.fonts.size, ls: Object.fromEntries([...net].filter(([, n]) => n > 0)) });
});
const page = await ctx.newPage();
page.on('pageerror', (e) => console.log('pageerror', e.message));
const cdp: CDPSession | null = WK ? null : await ctx.newCDPSession(page);
if (cdp) await cdp.send('Performance.enable');

const gc = async () => {
  if (cdp) for (let i = 0; i < 3; i++) await cdp.send('HeapProfiler.collectGarbage');
  // (WebKit: no GC to call; garbage made until JSC runs a full collection: ~1.5 GB churned, in pieces)
  else for (let i = 0; i < 6; i++) await page.evaluate(() => { let keep: unknown[] = []; for (let k = 0; k < 60; k++) { keep.push(new Array(1 << 20).fill(k)); if (keep.length > 8) keep = []; } });
  await page.waitForTimeout(300);
};
async function measure(label: string) {
  await gc();
  const p = await page.evaluate(() => (window as unknown as { __probe(): { gl: number; ivs: number; fonts: number; ls: Record<string, number> } }).__probe());
  let m: Record<string, number> = {};
  if (cdp) m = Object.fromEntries(((await cdp.send('Performance.getMetrics')).metrics as { name: string; value: number }[]).map((x) => [x.name, x.value]));
  const r3 = await page.evaluate(() => {
    const W = window as unknown as Record<string, { stats?(): Record<string, number> } | undefined>;
    const st = W.__world3d?.stats?.();
    // (a room's renderer.info: geometries/textures/programs)
    const room = (W.__museum ?? W.__tent) as { stats?(): { mem?: number[] } } | undefined;
    const ms = (room?.stats?.() as { models?: Record<string, number> } | undefined)?.models;
    return [st?.textures, st?.geometries, st?.fx, document.querySelectorAll('*').length].join('/') + (room?.stats?.()?.mem ? ` room ${room.stats().mem!.join('/')}` : '') + (ms ? ` models ${ms.loaded}/${ms.used}/${ms.idle}` : '');
  }).catch(() => null);
  // (rAF a second, over a real second: none under the sim's clock)
  const rafs = SIM ? 0 : await page.evaluate(() => new Promise<number>((ok) => { const W = window as unknown as { __rafs(): number }, r0 = W.__rafs(); setTimeout(() => ok(W.__rafs() - r0), 1000); }));
  const row = { label, rafs, heapMB: +((m.JSHeapUsedSize ?? 0) / 1e6).toFixed(2), nodes: m.Nodes, listeners: m.JSEventListeners, docs: m.Documents, gl: p.gl, ivs: p.ivs, fonts: p.fonts, ls: Object.values(p.ls).reduce((a, b) => a + b, 0), r3 };
  console.log(JSON.stringify(row));
  return { row, ls: p.ls };
}
let seenIds: Set<number> | null = null;
async function snapshot(): Promise<Map<string, [number, number]>> {
  if (!cdp) return new Map();
  await gc();
  const chunks: string[] = [];
  const on = (e: { chunk: string }) => chunks.push(e.chunk);
  cdp.on('HeapProfiler.addHeapSnapshotChunk', on);
  await cdp.send('HeapProfiler.takeHeapSnapshot', { reportProgress: false });
  cdp.off('HeapProfiler.addHeapSnapshotChunk', on);
  const s = JSON.parse(chunks.join(''));
  const f = s.snapshot.meta.node_fields as string[], nf = f.length;
  const ti = f.indexOf('type'), ni = f.indexOf('name'), si = f.indexOf('self_size');
  const types = s.snapshot.meta.node_types[0] as string[];
  const PATH = process.argv.find((a) => a.startsWith('--path='))?.slice(7);
  if (PATH) retainers(s, PATH);
  // (each node's id, stable across a session's snapshots: --path's nodes only those new since the first)
  const idi = f.indexOf('id');
  if (!seenIds) { seenIds = new Set(); for (let i = 0; i < s.nodes.length; i += nf) seenIds.add(s.nodes[i + idi]); }
  const out = new Map<string, [number, number]>();
  for (let i = 0; i < s.nodes.length; i += nf) {
    const t = types[s.nodes[i + ti]];
    const tn = `[${t}]`, to = out.get(tn) ?? [0, 0];
    to[0]++; to[1] += s.nodes[i + si]; out.set(tn, to);
    if (t !== 'object' && t !== 'closure' && t !== 'native') continue;
    const name = (t === 'closure' ? 'ƒ ' : '') + s.strings[s.nodes[i + ni]];
    const o = out.get(name) ?? [0, 0];
    o[0]++; o[1] += s.nodes[i + si];
    out.set(name, o);
  }
  return out;
}
function retainers(s: any, needle: string) {
  const f = s.snapshot.meta.node_fields as string[], nf = f.length, ef = s.snapshot.meta.edge_fields as string[], enf = ef.length;
  const ni = f.indexOf('name'), ti = f.indexOf('type'), eci = f.indexOf('edge_count');
  const etypes = s.snapshot.meta.edge_types[0] as string[], ntypes = s.snapshot.meta.node_types[0] as string[];
  const eti = ef.indexOf('type'), eni = ef.indexOf('name_or_index'), eto = ef.indexOf('to_node');
  const N = s.nodes.length / nf;
  const first = new Uint32Array(N + 1);
  for (let i = 0, e = 0; i < N; i++) { first[i] = e; e += s.nodes[i * nf + eci] * enf; first[N] = e; }
  const par = new Int32Array(N).fill(-1), pe = new Int32Array(N).fill(-1);
  par[0] = 0; const q = [0];
  for (let h = 0; h < q.length; h++) {
    const n = q[h];
    for (let e = first[n]; e < first[n + 1]; e += enf) {
      const et = etypes[s.edges[e + eti]];
      if (et === 'weak' || et === 'shortcut') continue;
      const to = s.edges[e + eto] / nf;
      if (par[to] !== -1) continue;
      par[to] = n; pe[to] = e; q.push(to);
    }
  }
  const nm = (n: number) => `${ntypes[s.nodes[n * nf + ti]]}:${String(s.strings[s.nodes[n * nf + ni]]).slice(0, 90)}`;
  let shown = 0;
  for (let n = 0; n < N && shown < Number(process.env.PATHS ?? 3); n++) {
    // (=name: that name exactly; a code or a string never)
    const t = ntypes[s.nodes[n * nf + ti]], name = String(s.strings[s.nodes[n * nf + ni]]);
    if (seenIds?.has(s.nodes[n * nf + f.indexOf('id')])) continue;
    if (t === 'string' || t === 'code' || !(needle.startsWith('=') ? name === needle.slice(1) : name.includes(needle))) continue;
    shown++;
    console.log('--- retainer path of', nm(n), par[n] === -1 ? '(unreachable)' : '');
    const chain: string[] = [];
    for (let c = n, k = 0; c !== 0 && par[c] !== -1 && k < 40; c = par[c], k++) {
      const e = pe[c], et = etypes[s.edges[e + eti]], en = et === 'element' || et === 'hidden' ? s.edges[e + eni] : s.strings[s.edges[e + eni]];
      chain.push(`  ${nm(par[c])} --[${et} ${String(en).slice(0, 40)}]-->`);
    }
    console.log(chain.reverse().join('\n'));
  }
}
const diff = (a: Map<string, [number, number]>, b: Map<string, [number, number]>) =>
  [...b].map(([k, [n, sz]]) => [k, n - (a.get(k)?.[0] ?? 0), sz - (a.get(k)?.[1] ?? 0)] as const).filter((x) => x[1] > 0).sort((x, y) => y[2] - x[2]).slice(0, 40);

const nav = (path: string) => page.evaluate((h) => { const a = document.createElement('a'); a.href = h; document.body.append(a); a.click(); a.remove(); }, path);
const islandUp = () => page.waitForFunction(() => (window as unknown as { __world3d?: { loaded(): boolean } }).__world3d?.loaded(), null, { timeout: 30_000 });
const tentUp = () => page.waitForFunction(() => ((window as unknown as { __tent?: { stats(): { frames: number } } }).__tent?.stats()?.frames ?? 0) > 2, null, { timeout: 30_000 });
const museumUp = () => page.waitForFunction(() => ((window as unknown as { __museum?: { stats(): { frames: number } } }).__museum?.stats()?.frames ?? 0) > 2, null, { timeout: 30_000 });
/** The museum's e2e hooks (MuseumRoom.svelte hooks()): a call's value, never a handle. */
const mu = <T>(js: string) => page.evaluate(`window.__museum?.${js}`) as Promise<T>;
const until = async (js: string, ms = 20_000) => { for (const t0 = Date.now(); Date.now() - t0 < ms; await page.waitForTimeout(100)) if (await page.evaluate(js)) return; throw new Error(`timed out: ${js}`); };
async function inMuseum() {
  if (await page.evaluate(() => location.pathname.includes('museum'))) return;
  await nav(`${PATH}/museum${Q}`); await museumUp(); await page.waitForTimeout(1500);
}
const sel = (s: string) => page.waitForFunction((q) => !!document.querySelector(q), s, { timeout: 30_000 });

const ROOMS: Record<string, [string, () => Promise<unknown>]> = {
  shop: [`${PATH}/shop${Q}`, () => sel('[data-shop]')],
  tent: [`${PATH}/tent${Q}`, tentUp],
  home: [`${PATH}/tent${Q}&home=B`, tentUp],
  museum: [`${PATH}/museum${Q}`, () => museumUp()],
  fpv: [`${PATH}/museum${Q}`, async () => { await museumUp(); await until('(f => f && f.inside && !f.busy)(window.__museum.fpv())'); }],
  editor: [`${PATH}/editor/${Q}`, () => page.waitForFunction(() => !!(window as unknown as { __editor?: unknown }).__editor, null, { timeout: 30_000 })]
};
const SHEETS: Record<string, () => Promise<void>> = {
  // (健康 and ごはん: one sheet from the dumbbell, a tab each; e2e/hud.ts openKenkou)
  food: async () => { await kenkou('food'); },
  health: async () => { await kenkou('health'); },
  // (ずかん: 設定's last row; e2e/hud.ts fromMenu)
  zukan: async () => { await menu(); await page.locator('[data-hud-settings]').click(); await sel('dialog[open] [data-settings-zukan]'); await page.locator('dialog[open] [data-settings-zukan]').click(); await sel('dialog[open] [data-zukan-sheet]'); },
  settings: async () => { await menu(); await page.locator('[data-hud-settings]').click(); },
  bells: async () => { await menu(); await page.locator('[data-hud-bells]').click(); }
};
async function kenkou(tab: 'health' | 'food') {
  await page.getByRole('button', { name: 'けんこう', exact: true }).click();
  await page.locator(`dialog[open] [data-kenkou-tab=${tab}]`).click();
}
async function menu() {
  const m = page.locator('[data-hud-menu]');
  if ((await m.getAttribute('aria-expanded')) !== 'true') await m.click();
  await page.waitForTimeout(300);
}
async function vis(state: 'hidden' | 'visible') {
  await page.evaluate((st) => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => st });
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => st === 'hidden' });
    document.dispatchEvent(new Event('visibilitychange'));
    window.dispatchEvent(new PageTransitionEvent(st === 'hidden' ? 'pagehide' : 'pageshow', { persisted: true }));
  }, state);
}

// the info sheets (りょこう, けっこんしき, トレイル: docs/design.md "Unified kit"), drawn: the maps on OpenFreeMap's fixture
// tiles (e2e/fixtures/travel) and a blank topo tile, never the network
const pill = async (k: string) => { await menu(); await page.locator(`[data-hud-${k}]`).click(); await sel(`dialog[open] [data-${k}]`); await page.waitForTimeout(600); };
const closeAll = async () => {
  for (let k = 0; k < 4 && (await page.locator('dialog[open]').count()); k++) { await page.keyboard.press('Escape'); await page.waitForTimeout(250); }
  await page.waitForFunction(() => !document.querySelector('dialog[open]'), null, { timeout: 10_000 }); await page.waitForTimeout(600);
};
const tapIn = async (q: string) => { await sel(q); await page.locator(q).first().click(); await page.waitForTimeout(500); };
const mapUp = (h: '__travelMap' | '__trailMap') => until(`(window.${h}?.state().mode ?? '') === 'ready'`, 30_000).catch(() => console.log(`${h} not ready`));
const INFO: Record<string, () => Promise<void>> = {
  // りょこう: the list, NZ, each tab (the map drawn), back, ✕
  trips: async () => {
    await pill('travel'); await tapIn('dialog[open] [data-trip="nz"]');
    for (const t of ['days', 'map', 'pack', 'days']) { await tapIn(`dialog[open] [data-trip-tab="${t}"]`); if (t === 'map') await mapUp('__travelMap'); }
    await tapIn('dialog[open] .navbar .back'); await closeAll();
  },
  // Okinawa: 地図 (the map drawn, its campsites on, a camp's card), キャンプ場, 日程, back, ✕
  okinawa: async () => {
    await pill('travel'); await tapIn('dialog[open] [data-trip="okinawa"]');
    await tapIn('dialog[open] [data-trip-tab="map"]'); await mapUp('__travelMap');
    await tapIn('dialog[open] [data-map-layers]'); await tapIn('dialog[open] [data-map-layer="camp"]');
    await tapIn('dialog[open] [data-trip-tab="camps"]'); await tapIn('dialog[open] [data-camp]'); await page.keyboard.press('Escape'); await page.waitForTimeout(400);
    await tapIn('dialog[open] [data-trip-tab="days"]'); await tapIn('dialog[open] .navbar .back'); await closeAll();
  },
  // けっこんしき: a task opened, メモ, ✕
  wedding: async () => {
    await pill('wedding'); await tapIn('dialog[open] [data-wed-task] .head');
    await tapIn('dialog[open] [data-wed-tab="notes"]'); await page.waitForTimeout(500);
    await tapIn('dialog[open] [data-wed-tab="plan"]'); await tapIn('dialog[open] [data-wed-task] .head'); await closeAll();
  },
  // トレイル: three trails (each its map drawn), back between, ✕
  trails: async () => {
    await pill('hiking');
    for (const k of [0, 1, 2]) {
      await sel('dialog[open] [data-trail-list]'); await page.locator('dialog[open] [data-trail]').nth(k).click();
      await sel('dialog[open] [data-trail-view]'); await mapUp('__trailMap'); await page.waitForTimeout(500);
      await page.locator('dialog[open] [data-trail-view] .nav.back').click(); await page.waitForTimeout(500);
    }
    await closeAll();
  }
};
if (flow in INFO || flow === 'info') {
  const FIX = new URL('../e2e/fixtures/travel/', import.meta.url).pathname;
  const { readFileSync: rf, existsSync: ex } = await import('node:fs');
  const cors = { 'access-control-allow-origin': '*' };
  await page.route('https://tiles.openfreemap.org/**', (r) => {
    const u = new URL(r.request().url());
    if (u.pathname === '/planet') return r.fulfill({ contentType: 'application/json', body: rf(`${FIX}tilejson.json`), headers: cors });
    const m = /^\/planet\/fixture\/(\d+)\/(\d+)\/(\d+)\.pbf$/.exec(u.pathname), f = m && `${FIX}tiles/${m[1]}/${m[2]}/${m[3]}.pbf`;
    return f && ex(f) ? r.fulfill({ contentType: 'application/x-protobuf', body: rf(f), headers: cors }) : r.fulfill({ status: 204, headers: cors });
  });
  const TILE = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==', 'base64');
  await page.route(/^https:\/\/(basemap\.nationalmap\.gov|cyberjapandata\.gsi\.go\.jp)\//, (r) => r.fulfill({ contentType: 'image/png', body: TILE, headers: cors }));
}
const SIM = flow === 'sim' || flow === 'days';
if (SIM) await page.clock.install({ time: Date.now() });
// the demo's events (as a catch writes them): sell's pocket; hours' and curator's museum full (every fish and bug found)
const seeds: [string, object][] = flow === 'sell' ? [['tally', { date: '2026-11-04', counts: { 'fish:sea-bass': 999 } }]]
  : flow === 'hours' || flow === 'curator' || flow === 'rebuild' ? [...FISH_IDS.map((id) => ['find', { kind: 'fish', id }] as [string, object]), ...BUG_IDS.map((id) => ['find', { kind: 'bug', id }] as [string, object])] : [];
if (seeds.length) await page.addInitScript((list) => {
  if (localStorage.getItem('island-demo.events')) return;
  const at = Date.parse('2026-11-04T09:00:00+09:00');
  const events = list.map(([type, data], i) => ({ id: `seed-${i}`, type, data, queuedAt: at + i, tries: 0, nextAt: 0, ackedAt: at + i, person: 'A' }));
  localStorage.setItem('island-demo.events', JSON.stringify({ day: '2026-11-04', events }));
}, seeds);
await page.goto(`${BASE}${SIM ? `?demo&date=${process.env.SIM_AT ?? '2026-11-04T23:00'}${process.env.Q ?? ''}` : Q}`);
if (SIM) { for (let k = 0; k < 60; k++) { await page.clock.runFor(500); if (await page.evaluate(() => (window as any).__world3d?.loaded())) break; } }
else { await islandUp(); await page.waitForTimeout(3000); }
const rows = [];
/** The fish flow's taps, by what each did (__fish.why()). */
const fished: Record<string, number> = {};
let fishAt: [number, number] | null = null;
/** The clothes flow's stage textures, a cycle's after each top. */
const stageTex: number[][] = [];
/** The look flow's turn (its villager by turns). */
let looks = 0;
/** The dressrace flow's turn (its top), and the players' texture holds after each (player3d.ts texStats refs). */
let races = 0;
const playerRefs: number[] = [];
/** The stereo flow's blob URLs alive after each cycle. */
const blobsBy: number[] = [];
let stereoTurn = 0;
/** The lookidle flow's rAF callbacks over 3 s at rest in すがた. */
const idleRafs: number[] = [];
if (flow === 'dressrace') await page.route(/\/room\/player\/(mesh|tex)\//, async (r) => { await new Promise((ok) => setTimeout(ok, 600)); await r.continue(); });
let snap0: Map<string, [number, number]> | null = SNAP && process.env.SNAP_AT === '0' ? new Map() : null;
let aborts = 0;
const cycle = async () => {
  if (flow === 'abort') {
    // the island's mount cut short: to the shop, back to the island and away again 30-250 ms into its mount, then back
    // for good (the cycle's measure is the island whole, as the shop flow's)
    const shop = ROOMS.shop;
    await nav(shop[0]); await shop[1]();
    await nav(`${PATH}/${Q}`); await page.waitForTimeout([30, 80, 150, 250][aborts++ % 4]);
    await nav(shop[0]); await shop[1](); await page.waitForTimeout(800);
    await nav(`${PATH}/${Q}`); await islandUp(); await page.waitForTimeout(1500);
  } else if (flow in ROOMS) {
    const [p, up] = ROOMS[flow];
    await nav(p); await up();
    // (FILL=1: the room furnished with the starter set first, kept: its models come back from the page-wide cache)
    if (process.env.FILL) await page.evaluate(() => { const t = (window as any).__tent; if (t && t.pieces().length < 10) t.fill(t.starter()); });
    await page.waitForTimeout(Number(process.env.DWELL ?? 1500));
    await nav(`${PATH}/${Q}`); await islandUp(); await page.waitForTimeout(1500);
  } else if (flow in SHEETS) {
    await SHEETS[flow](); await sel('dialog[open]'); await page.waitForTimeout(1200);
    await page.keyboard.press('Escape'); await page.waitForFunction(() => !document.querySelector('dialog[open]'), null, { timeout: 10_000 }); await page.waitForTimeout(800);
  } else if (flow === 'sheets') {
    for (const f of Object.values(SHEETS)) {
      await f(); await sel('dialog[open]'); await page.waitForTimeout(800);
      await page.keyboard.press('Escape'); await page.waitForFunction(() => !document.querySelector('dialog[open]'), null, { timeout: 10_000 }); await page.waitForTimeout(500);
    }
  } else if (flow === 'vis') {
    await vis('hidden'); await page.waitForTimeout(500); await vis('visible'); await page.waitForTimeout(1500);
  } else if (flow === 'picker') {
    if (!(await page.evaluate(() => location.pathname.includes('tent')))) { await nav(`${PATH}/tent${Q}&as=B&home=B`); await tentUp(); await page.waitForTimeout(1500); }
    await page.locator('[data-home-look]').click(); await sel('[data-home-picker]'); await page.waitForTimeout(800);
    const ms = await page.locator('[data-home-picker] [data-model]').count();
    for (let k = 0; k < Math.min(ms, 4); k++) { await page.locator('[data-home-picker] [data-model]').nth(k).click(); await page.waitForTimeout(700); }
    await page.keyboard.press('Escape'); await page.waitForFunction(() => !document.querySelector('[data-home-picker]'), null, { timeout: 10_000 }); await page.waitForTimeout(500);
  } else if (flow === 'look') {
    // せってい → すがた: a villager's look (two, by turns), then いつもの (the human player): each a model swapped on the
    // island where it stands (person3d), the old one let go of
    const sheet = page.locator('dialog[open]').first(), name = ++looks % 2 ? 'ジョッキー' : 'ニコバン';
    const visit = async (wear: () => Promise<void>) => {
      await SHEETS.settings(); await sel('[data-push=look]'); await sheet.locator('[data-push=look]').click(); await sel('[data-look-page]');
      if (!process.env.LOOK_NOOP) await wear();
      await sheet.locator('.titlebar .back').click(); await page.waitForTimeout(300);
      await page.keyboard.press('Escape'); await page.waitForFunction(() => !document.querySelector('dialog[open]'), null, { timeout: 10_000 }); await page.waitForTimeout(2000);
    };
    await visit(async () => {
      await sheet.locator('[data-look-tab=villager]').click(); await sheet.getByRole('searchbox').fill(name);
      await sheet.getByRole('radio', { name }).click(); await page.waitForTimeout(300);
    });
    await visit(async () => { await sheet.locator('[data-look-tab=coord]').click(); await sheet.locator('[data-look-chip="usual"]').click(); });
  } else if (flow === 'clothes') {
    // せってい → すがた: four tops, each in two of its colours, on the stage (its renderer's textures and the island's
    // player's), then いつもの; out, the island's player dressed back in its own
    const sheet = page.locator('dialog[open]').first();
    await SHEETS.settings(); await sel('[data-push=look]'); await sheet.locator('[data-push=look]').click(); await sel('[data-look-page]');
    await sheet.locator('[data-look-tab=wear]').click();
    const tiles = sheet.locator('[data-closet=top] [data-item]:not([data-item=none])');
    const stage: number[] = [];
    for (let k = 1; k <= 4; k++) {
      await tiles.nth(k).click(); await page.waitForTimeout(500);
      const cs = sheet.locator('[data-colours] [data-part]');
      await cs.nth(Math.min(1, (await cs.count()) - 1)).click(); await page.waitForTimeout(500);
      stage.push(await page.evaluate(() => (window as unknown as { __newestTex(): number }).__newestTex()));
    }
    // (the stage's live textures: each top's let go of as the next goes on)
    stageTex.push(stage);
    await sheet.locator('[data-look-tab=coord]').click();
    await sheet.locator('[data-look-chip="usual"]').click(); await page.waitForTimeout(500);
    await sheet.locator('.titlebar .back').click(); await page.waitForTimeout(300);
    await page.keyboard.press('Escape'); await page.waitForFunction(() => !document.querySelector('dialog[open]'), null, { timeout: 10_000 }); await page.waitForTimeout(2000);
  } else if (flow === 'dressrace') {
    // せってい → すがた: a top not worn yet tapped and the page closed at once, while its mesh and texture still load
    // (held back 600 ms): the preview's queued dress must keep nothing once it lands (player3d.ts gone)
    const sheet = page.locator('dialog[open]').first();
    await SHEETS.settings(); await sel('[data-push=look]'); await sheet.locator('[data-push=look]').click(); await sel('[data-look-page]');
    await sheet.locator('[data-look-tab=wear]').click();
    await sel('[data-look-preview][data-look-3d=on]');
    await sheet.locator('[data-closet=top] [data-item]:not([data-item=none])').nth(1 + (races++ % 6)).click();
    await sheet.locator('.titlebar .back').click(); await page.waitForTimeout(300);
    await page.keyboard.press('Escape'); await page.waitForFunction(() => !document.querySelector('dialog[open]'), null, { timeout: 10_000 });
    await page.waitForTimeout(Number(process.env.RACE_WAIT ?? 2500));
    const st = await page.evaluate(() => (window as unknown as { __player3d: { texs(): { refs: number } } }).__player3d.texs());
    console.log('player3d', JSON.stringify(st));
    playerRefs.push(st.refs);
  } else if (flow === 'lookidle') {
    // すがた open and left alone: the rAF callbacks asked for over 3 s at rest (the island's own, under the sheet, too)
    const sheet = page.locator('dialog[open]').first();
    await SHEETS.settings(); await sel('[data-push=look]'); await sheet.locator('[data-push=look]').click();
    await sel('[data-look-preview][data-look-3d=on]'); await page.waitForTimeout(2000);
    idleRafs.push(await page.evaluate(() => new Promise<number>((ok) => { const W = window as unknown as { __rafs(): number }, r0 = W.__rafs(); setTimeout(() => ok(W.__rafs() - r0), 3000); })));
    await sheet.locator('.titlebar .back').click(); await page.waitForTimeout(300);
    await page.keyboard.press('Escape'); await page.waitForFunction(() => !document.querySelector('dialog[open]'), null, { timeout: 10_000 }); await page.waitForTimeout(1000);
  } else if (flow === 'stereo') {
    // the tent's jukebox: its song list opened, scrolled (10 songs pressed by the finger a scroll starts on, as iOS
    // gives it: a pointerdown, its pointercancel as the list scrolls), closed with ✕; the blob URLs alive after each
    // (the music's files: a press had fetched its song)
    if (!(await page.evaluate(() => location.pathname.includes('tent')))) {
      // (ミュージック on, the tent loaded afresh with it)
      await page.evaluate(() => localStorage.setItem('island.sound', JSON.stringify({ music: true, sfx: true, volume: 0.8 })));
      await page.goto(`${BASE}tent${Q}`); await tentUp();
      await page.evaluate(() => (window as any).__tent.fill(['f791']));
      await page.waitForFunction(() => (window as any).__tent.loading() === 0, null, { timeout: 30_000 });
    }
    const p = (await page.evaluate(() => (window as any).__tent.pieces()))[0] as { x: number; z: number };
    const [x, y] = (await page.evaluate(([x, z]) => (window as any).__tent.tile(x, z), [p.x, p.z])) as [number, number];
    await page.mouse.click(x, y); await sel('[data-stereo-picker] [data-song]:not([data-song=any])');
    await page.evaluate((from) => {
      const songs = [...document.querySelectorAll('[data-stereo-picker] [data-song]:not([data-song=any])')].slice(from, from + 10);
      for (const b of songs) {
        const o = { bubbles: true, pointerId: 7, pointerType: 'touch', clientX: 100, clientY: 300 };
        b.dispatchEvent(new PointerEvent('pointerdown', o));
        b.dispatchEvent(new PointerEvent('pointermove', { ...o, clientY: 260 }));
        b.dispatchEvent(new PointerEvent('pointercancel', o));
      }
    }, (stereoTurn++ * 10) % 60);
    await page.waitForTimeout(2500);
    await page.locator('[data-stereo-picker] .close').click(); await page.waitForTimeout(1500);
    blobsBy.push(await page.evaluate(() => (window as unknown as { __blobs(): number }).__blobs()));
  } else if (flow === 'eye') {
    // the eye button inside: first person on (at the eyes) and off (the room's camera)
    await inMuseum();
    for (const on of [true, false]) {
      await page.locator('[data-fpv]').click();
      await until(`(f => f && f.on === ${on} && f.inside === ${on} && !f.busy)(window.__museum.fpv())`);
    }
    await page.waitForTimeout(500);
  } else if (flow === 'bench') {
    // a tap on the aquarium's bench sits my villager; a tap on the floor gets it up
    await inMuseum();
    await mu('put(150, 10)');
    await until('window.__museum.still()');
    const [bx, by] = await mu<[number, number]>('benchPx("dmbench1", 0)');
    await page.mouse.click(bx, by);
    await until('!!window.__museum.seat() && window.__museum.still()');
    const [fx, fy] = await mu<[number, number]>('px(150, 15)');
    await page.mouse.click(fx, fy);
    await until('!window.__museum.seat() && window.__museum.still()');
  } else if (flow === 'curator') {
    // the museum left running (the curator's moods, the fish, the bugs): IDLE_MS of real time a cycle
    await inMuseum();
    await page.waitForTimeout(Number(process.env.IDLE_MS ?? 20_000));
  } else if (flow === 'hours') {
    // the aquarium's hour on, three times a cycle: its pick fading out and in (aquarium.ts pick)
    await inMuseum();
    // (in front of the river tank: its fish fade)
    await mu('put(160, 80)');
    for (let k = 0; k < 3; k++) { await mu('nextHour()'); await page.waitForTimeout(2500); await until('!window.__museum.stats().loading'); }
  } else if (flow === 'rebuild') {
    // a find kept off show and let back, twice a cycle: the aquarium rebuilt each time (the old wing kept till the new
    // one's programs are compiled, then disposed)
    await inMuseum();
    await mu('put(160, 80)');
    for (const id of ['koi', null, 'carp', null]) {
      await mu(`withhold(${JSON.stringify(id)})`);
      await page.waitForTimeout(800);
      await until('((s) => !s.warming && !s.loading)(window.__museum.stats())');
    }
  } else if (flow === 'fish') {
    // ten casts and reels by the sea's shadow (Q='&critter=fish'): my villager put on the bank within a cast of it, the
    // camera on it (e2e/island.ts toTheWater), once; a tap on the water by the shadow (else by my villager) casts, a
    // tap reels in (a bite or not)
    if (!fishAt) fishAt = await page.evaluate(() => {
      type H = { __fish: { fish(): { water: string; x: number; z: number }[] }; __world3d: { go(z: number, k?: number, x?: number): void; client(x: number, z: number): [number, number]; view(): { camZ: number } }; __world: { free(x: number, z: number, away?: number): boolean; put(x: number, z: number): void } };
      const h = window as unknown as H, f = h.__fish.fish().find((f) => f.water === 'sea');
      if (!f) return null;
      let best: [number, number] | null = null;
      for (let z = f.z - 700; z <= f.z + 100; z += 25) {
        h.__world3d.go(z, 1, f.x);
        const d = Math.abs(h.__world3d.client(f.x, f.z)[1] - innerHeight * 0.58);
        if (!best || d < best[1]) best = [h.__world3d.view().camZ, d];
      }
      h.__world3d.go(best![0], 1, f.x);
      for (const behind of [true, false]) for (let r = 40; r <= 160; r += 8) for (let a = 0; a < 24; a++) {
        const x = Math.round(f.x + Math.cos((a / 24) * Math.PI * 2) * r), z = Math.round(f.z + Math.sin((a / 24) * Math.PI * 2) * r);
        if (behind && z < f.z + 20) continue;
        if (h.__world.free(x, z, 0)) return (h.__world.put(x, z), [x, z]);
      }
      return null;
    });
    if (!fishAt) throw new Error('no shadow in the sea, or no bank by it');
    await page.waitForTimeout(1500);
    for (let k = 0; k < 10; k++) {
      const pt = await page.evaluate(() => {
        type H = { __fish: { fish(): { water: string; x: number; z: number }[] }; __world3d: { ground(x: number, y: number): { x: number; z: number } | null }; __world: { ground(x: number, z: number): { surface: string }; at(x: number, z: number): [number, number]; mine(): [number, number] } };
        const h = window as unknown as H, f = h.__fish.fish().find((f) => f.water === 'sea');
        const [cx, cy] = f ? h.__world.at(f.x, f.z) : h.__world.at(...h.__world.mine());
        const TAPS = 'button, a, [role="button"], [data-bush], [data-tree], [data-flower], [data-sit], [data-fixture], [data-campfire], [data-building], [data-decor], [data-actor], [data-visitor], [data-fx="talk"]';
        // (by my villager: off its own tap area)
        for (let r = f ? 0 : 70; r <= 200; r += 6) for (let a = 0, n = r ? 16 : 1; a < n; a++) {
          const x = cx + Math.cos((a / n) * Math.PI * 2) * r, y = cy + Math.sin((a / n) * Math.PI * 2) * r;
          const g = h.__world3d.ground(x, y), s = g && h.__world.ground(g.x, g.z).surface;
          if ((s === 'water' || s === 'sea') && !document.elementFromPoint(x, y)?.closest(TAPS)) return [x, y];
        }
        return null;
      });
      if (!pt) throw new Error('no water to tap');
      const tally = async () => { const w = String(await page.evaluate('window.__fish.why()')); fished[w] = (fished[w] ?? 0) + 1; };
      await page.touchscreen.tap(pt[0], pt[1]);
      await until('(l => !l || l.landed)(window.__fish.line())', 8000).catch(() => {});
      await page.waitForTimeout(300);
      await tally();
      // (a while out: the shadow may come and nibble)
      await page.waitForTimeout(1500);
      if (await page.evaluate('!!window.__fish.line()')) {
        await page.touchscreen.tap(pt[0], pt[1]);
        await until('!window.__fish.line()', 8000).catch(() => {});
        await tally();
      }
      await page.waitForTimeout(800);
    }
  } else if (flow === 'sell') {
    // the shop's うる: one catch picked and sold, five times a cycle (the demo's pocket seeded with 999 sea bass)
    if (!(await page.evaluate(() => location.pathname.includes('shop')))) { await nav(`${PATH}/shop${Q}`); await sel('[data-shop-pocket] [data-shop-catch]'); await page.waitForTimeout(1500); }
    for (let k = 0; k < 5; k++) {
      const n0 = await page.locator('[data-shop]').getAttribute('data-shells');
      await page.locator('[data-shop-catch="fish:sea-bass"]').click();
      await page.locator('[data-shop-sell]').click();
      await until(`document.querySelector('[data-shop]').dataset.shells !== ${JSON.stringify(n0)}`);
      await page.waitForTimeout(400);
    }
  } else if (flow === 'days') {
    // the island's clock DAY_H hours on a cycle (fast-forwarded: each timer once), then 5 s of it run (the visitors')
    await page.clock.fastForward(Number(process.env.DAY_H ?? 4) * 3_600_000);
    for (let k = 0; k < 10; k++) await page.clock.runFor(500);
  } else if (SIM) {
    for (let k = 0; k < 10; k++) await page.clock.runFor(60_000);
  } else if (flow === 'idle') {
    await page.waitForTimeout(Number(process.env.IDLE_MS ?? 20_000));
  } else if (flow in INFO) {
    await INFO[flow]();
  } else if (flow === 'info') {
    for (const f of Object.values(INFO)) await f();
  } else if (flow === 'all') {
    for (const k of ['shop', 'tent', 'home', 'museum']) {
      const [p, up] = ROOMS[k];
      await nav(p); await up(); await page.waitForTimeout(1200);
      await nav(`${PATH}/${Q}`); await islandUp(); await page.waitForTimeout(1200);
    }
  }
};
await cycle();
const w0 = await measure('warm');
rows.push(w0.row);
let lastLs: Record<string, number> = {};
for (let i = 1; i <= N; i++) {
  await cycle();
  const { row, ls } = await measure(`#${i}`);
  rows.push(row);
  lastLs = ls;
  if (SNAP && i === Number(process.env.SNAP_AT ?? 3)) snap0 = await snapshot();
}
if (flow === 'fish') console.log('taps', JSON.stringify(fished));
console.log('listeners grown', JSON.stringify(Object.fromEntries(Object.entries(lastLs).filter(([k, n]) => n !== (w0.ls[k] ?? 0)).map(([k, n]) => [k, n - (w0.ls[k] ?? 0)]))));
if (SNAP && snap0) {
  const d = diff(snap0, await snapshot());
  console.log('heap diff (count, bytes) warm → end');
  for (const [k, n, sz] of d) console.log(`${String(n).padStart(7)} ${String(sz).padStart(10)}  ${k.slice(0, 120)}`);
}
writeFileSync(`/tmp/leak-${flow}${WK ? '-wk' : ''}.json`, JSON.stringify(rows));
// a look swapped (look, clothes): no WebGL context left (the すがた page's renderer let go of: a texture still holding it
// held the whole page); clothes: the stage's textures no more after the fourth top than after the first (each top's
// let go of; the island's own drift a texture a cycle or so, idle too: not counted)
if (flow === 'look' || flow === 'clothes') {
  const [first, last] = [rows[0], rows[rows.length - 1]];
  const grown = stageTex.slice(1).map((s) => s[s.length - 1] - s[0]); // (the warm cycle's first portraits and the shots' own player made)
  console.log(`WebGL contexts ${first.gl} → ${last.gl}; stage textures by top, each cycle ${JSON.stringify(stageTex)}`);
  if (last.gl > first.gl || grown.some((g) => g > 0)) {
    console.log('LEAK');
    process.exitCode = 1;
  }
}
if (flow === 'lookidle') console.log(`rAF callbacks in 3 s, すがた at rest ${JSON.stringify(idleRafs)}`);
// stereo: the blob URLs no more after the last list than after the first (the track's own and the two fetched ahead)
if (flow === 'stereo') {
  console.log(`blob URLs alive by cycle ${JSON.stringify(blobsBy)}`);
  if (blobsBy.at(-1)! > blobsBy[0] + 2) {
    console.log('LEAK');
    process.exitCode = 1;
  }
}
// dressrace: the island's player alone holds textures after each cycle (its own top's few, one top or another): the
// holds no more at the end than after the first
if (flow === 'dressrace') {
  console.log(`player texture holds by cycle ${JSON.stringify(playerRefs)}`);
  if (playerRefs.at(-1)! > playerRefs[0] + 4) {
    console.log('LEAK');
    process.exitCode = 1;
  }
}
await browser.close();
