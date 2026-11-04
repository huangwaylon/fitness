// The memory-leak probe (docs/ops/testing.md "Memory"): N cycles of a flow in Chromium as an iPhone 13 (or WebKit as
// an iPhone 15: --webkit, no CDP: no GC, no heap), after each a forced GC and the JS heap, DOM nodes, JS listeners, the
// WebGL contexts still alive (WeakRefs), intervals, the window's/document's listeners and the island's renderer.info.
//   npm run leak -- <flow> [cycles] [--snap] [--path=<name>]     (the build served at E2E_PORT, default 4693)
// flows: shop tent home museum editor (the island ⇄ there), all (the four rooms), food health zukan settings bells
// sheets (open, close), picker (いえを かえる; Q='&as=B'), vis (hidden ⇄ visible), sim (LOGIC=1: the page's clock
// 10 sim minutes a cycle from SIM_AT, default 23:00: the island's day running and rolling over), idle (IDLE_MS of real time).
// --snap: heap snapshots at cycle SNAP_AT (default 3) and the end, diffed by constructor; --path=<name>: the retainer
// paths of the first PATHS nodes so named. Read handles: the probe never keeps one (a JSHandle holds what it points at).
import { chromium, webkit, devices, type Page, type CDPSession } from '@playwright/test';
import { writeFileSync } from 'node:fs';

const PORT = Number(process.env.E2E_PORT ?? 4693);
const BASE = `http://127.0.0.1:${PORT}/fitness/`;
const flow = process.argv[2] ?? 'shop';
const N = Number(process.argv[3] ?? 6);
const SNAP = process.argv.includes('--snap');
const WK = process.argv.includes('--webkit');
const Q = `?demo&date=2026-11-04T12:00${process.env.Q ?? ''}`;

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
  W.__probe = () => ({ gl: gls.filter((r) => r.deref()).length, ivs: ivs.size, ls: Object.fromEntries([...net].filter(([, n]) => n > 0)) });
});
const page = await ctx.newPage();
page.on('pageerror', (e) => console.log('pageerror', e.message));
const cdp: CDPSession | null = WK ? null : await ctx.newCDPSession(page);
if (cdp) await cdp.send('Performance.enable');

const gc = async () => {
  if (cdp) for (let i = 0; i < 3; i++) await cdp.send('HeapProfiler.collectGarbage');
  else for (let i = 0; i < 3; i++) await page.evaluate(() => (window as unknown as { gc?: () => void }).gc?.());
  await page.waitForTimeout(300);
};
async function measure(label: string) {
  await gc();
  const p = await page.evaluate(() => (window as unknown as { __probe(): { gl: number; ivs: number; ls: Record<string, number> } }).__probe());
  let m: Record<string, number> = {};
  if (cdp) m = Object.fromEntries(((await cdp.send('Performance.getMetrics')).metrics as { name: string; value: number }[]).map((x) => [x.name, x.value]));
  const r3 = await page.evaluate(() => {
    const W = window as unknown as Record<string, { stats?(): Record<string, number> } | undefined>;
    const st = W.__world3d?.stats?.();
    return [st?.textures, st?.geometries, st?.fx, document.querySelectorAll('*').length].join('/');
  }).catch(() => null);
  const row = { label, heapMB: +((m.JSHeapUsedSize ?? 0) / 1e6).toFixed(2), nodes: m.Nodes, listeners: m.JSEventListeners, docs: m.Documents, gl: p.gl, ivs: p.ivs, ls: Object.values(p.ls).reduce((a, b) => a + b, 0), r3 };
  console.log(JSON.stringify(row));
  return { row, ls: p.ls };
}
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
    if (ntypes[s.nodes[n * nf + ti]] === 'string' || !String(s.strings[s.nodes[n * nf + ni]]).includes(needle)) continue;
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
const sel = (s: string) => page.waitForFunction((q) => !!document.querySelector(q), s, { timeout: 30_000 });

const ROOMS: Record<string, [string, () => Promise<unknown>]> = {
  shop: [`/fitness/shop${Q}`, () => sel('[data-shop]')],
  tent: [`/fitness/tent${Q}`, tentUp],
  home: [`/fitness/tent${Q}&home=B`, tentUp],
  museum: [`/fitness/museum${Q}`, () => page.waitForFunction(() => ((window as unknown as { __museum?: { stats(): { frames: number } } }).__museum?.stats()?.frames ?? 0) > 2, null, { timeout: 30_000 })],
  editor: [`/fitness/editor/${Q}`, () => page.waitForFunction(() => !!(window as unknown as { __editor?: unknown }).__editor, null, { timeout: 30_000 })]
};
const SHEETS: Record<string, () => Promise<void>> = {
  food: async () => { await page.getByRole('button', { name: 'ごはん', exact: true }).click(); },
  health: async () => { await page.getByRole('button', { name: 'けんこう', exact: true }).click(); },
  zukan: async () => { await menu(); await page.locator('[data-hud-zukan]').click(); },
  settings: async () => { await menu(); await page.locator('[data-hud-settings]').click(); },
  bells: async () => { await menu(); await page.locator('[data-hud-bells]').click(); }
};
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

const SIM = flow === 'sim';
if (SIM) await page.clock.install({ time: Date.now() });
await page.goto(`${BASE}${SIM ? `?demo&date=${process.env.SIM_AT ?? '2026-11-04T23:00'}` : Q}`);
if (SIM) { for (let k = 0; k < 60; k++) { await page.clock.runFor(500); if (await page.evaluate(() => (window as any).__world3d?.loaded())) break; } }
else { await islandUp(); await page.waitForTimeout(3000); }
const rows = [];
let snap0: Map<string, [number, number]> | null = null;
const cycle = async () => {
  if (flow in ROOMS) {
    const [p, up] = ROOMS[flow];
    await nav(p); await up(); await page.waitForTimeout(1500);
    await nav(`/fitness/${Q}`); await islandUp(); await page.waitForTimeout(1500);
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
    if (!(await page.evaluate(() => location.pathname.includes('tent')))) { await nav(`/fitness/tent${Q}&as=B&home=B`); await tentUp(); await page.waitForTimeout(1500); }
    await page.locator('[data-home-look]').click(); await sel('[data-home-picker]'); await page.waitForTimeout(800);
    const ms = await page.locator('[data-home-picker] [data-model]').count();
    for (let k = 0; k < Math.min(ms, 4); k++) { await page.locator('[data-home-picker] [data-model]').nth(k).click(); await page.waitForTimeout(700); }
    await page.keyboard.press('Escape'); await page.waitForFunction(() => !document.querySelector('[data-home-picker]'), null, { timeout: 10_000 }); await page.waitForTimeout(500);
  } else if (SIM) {
    for (let k = 0; k < 10; k++) await page.clock.runFor(60_000);
  } else if (flow === 'idle') {
    await page.waitForTimeout(Number(process.env.IDLE_MS ?? 20_000));
  } else if (flow === 'all') {
    for (const k of ['shop', 'tent', 'home', 'museum']) {
      const [p, up] = ROOMS[k];
      await nav(p); await up(); await page.waitForTimeout(1200);
      await nav(`/fitness/${Q}`); await islandUp(); await page.waitForTimeout(1200);
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
console.log('listeners grown', JSON.stringify(Object.fromEntries(Object.entries(lastLs).filter(([k, n]) => n !== (w0.ls[k] ?? 0)).map(([k, n]) => [k, n - (w0.ls[k] ?? 0)]))));
if (SNAP && snap0) {
  const d = diff(snap0, await snapshot());
  console.log('heap diff (count, bytes) warm → end');
  for (const [k, n, sz] of d) console.log(`${String(n).padStart(7)} ${String(sz).padStart(10)}  ${k.slice(0, 120)}`);
}
writeFileSync(`/tmp/leak-${flow}${WK ? '-wk' : ''}.json`, JSON.stringify(rows));
await browser.close();
