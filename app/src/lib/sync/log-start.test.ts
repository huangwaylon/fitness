// The phone's log's lifecycle (sync/log.ts startLog): the open, the island's ready, the frames sample and its display
// rate from the median gap, a page error, hidden (the keepalive flush) and shown again, and the stop. A browser's
// globals stubbed; the timers, Date and performance faked.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { configureLog, flushLog, log, markLeaving, setDrawnFps, startLog } from './log.ts';
import type { LogBatch } from '#lib/contract/log.ts';

const KEY = '3f9a'.repeat(16);

class Mem {
  m = new Map<string, string>();
  getItem(k: string) { return this.m.get(k) ?? null; }
  setItem(k: string, v: string) { this.m.set(k, v); }
  removeItem(k: string) { this.m.delete(k); }
}

let sent: { body: LogBatch; keepalive: boolean }[];
let win: EventTarget, doc: EventTarget & { hidden: boolean };
let ready: boolean;
/** The display's frame gap (ms) the stubbed rAF runs at. */
let gap: number;

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Date', 'performance'], now: Date.parse('2026-11-05T03:00:00Z') });
  sent = [];
  ready = false;
  gap = 1000 / 60;
  win = new EventTarget();
  doc = Object.assign(new EventTarget(), { hidden: false });
  const kv = new Mem();
  vi.stubGlobal('window', win);
  vi.stubGlobal('document', doc);
  vi.stubGlobal('location', { search: '' });
  vi.stubGlobal('navigator', { webdriver: false, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X)' });
  vi.stubGlobal('sessionStorage', new Mem());
  vi.stubGlobal('localStorage', new Mem());
  vi.stubGlobal('matchMedia', () => ({ matches: true }));
  vi.stubGlobal('innerWidth', 393);
  vi.stubGlobal('innerHeight', 852);
  vi.stubGlobal('devicePixelRatio', 3);
  vi.stubGlobal('addEventListener', win.addEventListener.bind(win));
  vi.stubGlobal('removeEventListener', win.removeEventListener.bind(win));
  vi.stubGlobal('requestAnimationFrame', (cb: (t: number) => void) => setTimeout(() => cb(performance.now()), gap));
  configureLog({
    reset: true, on: false, kv, key: () => KEY, now: () => Date.now(), rand: () => 0.5,
    fetch: (async (_u: RequestInfo | URL, init?: RequestInit) => {
      sent.push({ body: JSON.parse(String(init?.body)) as LogBatch, keepalive: !!init?.keepalive });
      return new Response(JSON.stringify({ ok: true }));
    }) as typeof fetch
  });
});
afterEach(() => {
  configureLog({ reset: true, on: false });
  setDrawnFps(null);
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

const start = () => startLog({ build: 'b1', url: 'https://relay/log', demo: false, route: () => '/', ready: () => ready, queue: () => ({ n: 2, ageMs: 4000 }) });
const evs = () => sent.flatMap((s) => s.body.es);
const named = (e: string) => evs().filter((x) => x.e === e);

describe('the log started on a phone', () => {
  it('logs the open, then the ready once the island is up, then 5 s of frames 10 s later: 60 Hz from the median gap', async () => {
    const stop = start();
    ready = true;
    await vi.advanceTimersByTimeAsync(500);
    setDrawnFps(() => 30);
    await vi.advanceTimersByTimeAsync(16_000);
    await flushLog();
    expect(named('app.open')[0].d).toMatchObject({ route: '/', w: 393, dpr: 3, pwa: true, crashed: false, q: 2, qAgeS: 4 });
    expect(named('app.ready')).toHaveLength(1);
    const f = named('perf.frames')[0]?.d;
    expect(f).toMatchObject({ hz: 60, when: 'ready', mode: '3d', drawFps: 30, long: 0 });
    expect(Number(f?.fps)).toBeGreaterThan(55);
    expect(sent[0].body).toMatchObject({ build: 'b1', os: 'ios18.1' });
    stop();
  });

  it('a 120 Hz display reads 120: the median gap under 12 ms', async () => {
    gap = 1000 / 120;
    const stop = start();
    ready = true;
    await vi.advanceTimersByTimeAsync(16_000);
    await flushLog();
    expect(named('perf.frames')[0]?.d).toMatchObject({ hz: 120, mode: 'none', drawFps: -1 });
    stop();
  });

  it('a chunk not fetched is a chunk.fail, but not once the page is leaving (the app\'s own reload cut its imports off): an error then is a warning', async () => {
    const stop = start();
    win.dispatchEvent(new Event('vite:preloadError'));
    markLeaving();
    win.dispatchEvent(new Event('vite:preloadError'));
    win.dispatchEvent(Object.assign(new Event('error'), { error: new TypeError('Importing a module script failed.') }));
    await flushLog();
    expect(named('chunk.fail')).toHaveLength(1);
    expect(named('js.error')[0]).toMatchObject({ l: 2, d: { leaving: true } });
    stop();
  });

  it('a page error is a js.error; hidden sends what it has with keepalive; shown again is app.show; stopped, nothing more', async () => {
    const stop = start();
    win.dispatchEvent(Object.assign(new Event('error'), { error: new Error('boom'), filename: 'https://x/_app/a.js', lineno: 3 }));
    doc.hidden = true;
    doc.dispatchEvent(new Event('visibilitychange'));
    await vi.advanceTimersByTimeAsync(0);
    expect(sent.at(-1)?.keepalive).toBe(true);
    expect(named('js.error')[0].d).toMatchObject({ msg: 'Error: boom', src: 'a.js:3' });
    await vi.advanceTimersByTimeAsync(5_000);
    doc.hidden = false;
    doc.dispatchEvent(new Event('visibilitychange'));
    await vi.advanceTimersByTimeAsync(0);
    await flushLog();
    expect(named('app.show')[0].d).toMatchObject({ awayS: 5 });
    stop();
    const n = evs().length;
    win.dispatchEvent(Object.assign(new Event('error'), { error: new Error('after') }));
    await flushLog();
    expect(evs().length).toBe(n);
  });

  it('shown again sends nothing at once: the show joins the next batch, FLUSH_MS on (no radio wake of its own: network F9)', async () => {
    const stop = start();
    log('app.show', { awayS: 0 });
    doc.hidden = true;
    doc.dispatchEvent(new Event('visibilitychange'));
    await vi.advanceTimersByTimeAsync(0);
    expect(sent.at(-1)?.keepalive).toBe(true);
    const n = sent.length;
    await vi.advanceTimersByTimeAsync(60_000);
    doc.hidden = false;
    doc.dispatchEvent(new Event('visibilitychange'));
    await vi.advanceTimersByTimeAsync(29_000);
    expect(sent.length).toBe(n);
    await vi.advanceTimersByTimeAsync(1_000);
    expect(sent.length).toBe(n + 1);
    expect([sent[n].keepalive, sent[n].body.es.map((e) => e.e)]).toEqual([false, ['app.show']]);
    stop();
  });

  it('a fresh load after a hide says how long since (coldS: a background kill); none after a show, nor on a reload', async () => {
    const perf = performance as unknown as { getEntriesByType?: unknown };
    let nav = 'navigate';
    perf.getEntriesByType = () => [{ type: nav }];
    try {
      let stop = start();
      doc.hidden = true;
      doc.dispatchEvent(new Event('visibilitychange'));
      stop();
      // (killed in the background: the next load is a fresh one, 40 s on)
      await vi.advanceTimersByTimeAsync(40_000);
      doc.hidden = false;
      stop = start();
      // shown, then closed while shown (no hide): no coldS next time
      stop();
      stop = start();
      stop();
      // hidden, and the next load one of ours (a reload)
      doc.hidden = true;
      doc.dispatchEvent(new Event('visibilitychange'));
      stop = start();
      doc.hidden = true;
      doc.dispatchEvent(new Event('visibilitychange'));
      stop();
      nav = 'reload';
      doc.hidden = false;
      stop = start();
      await vi.advanceTimersByTimeAsync(60_000);
      await flushLog();
      stop();
      // (each batch once: a resent one is the same batch id, which the relay takes once)
      const opens = [...new Map(sent.map((x) => [x.body.b, x.body])).values()].flatMap((b) => b.es).filter((e) => e.e === 'app.open');
      expect(opens.map((e) => e.d?.coldS ?? null)).toEqual([null, 40, null, null, null]);
    } finally {
      delete perf.getEntriesByType;
    }
  });

  it('nothing in the demo or under automation', () => {
    expect(startLog({ build: 'b1', url: 'u', demo: true, route: () => '/', ready: () => true, queue: () => ({ n: 0, ageMs: 0 }) })()).toBeUndefined();
    vi.stubGlobal('navigator', { webdriver: true, userAgent: '' });
    start()();
    expect(sent).toEqual([]);
  });
});
