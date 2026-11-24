// A phone's synthetic day through the real log (sync/log.ts): what it uploads (batches, bytes, events), held to the
// budget docs/ops/observability.md states. Shaped on phone A's week to 11-24 (3 cold loads and 25 shows, a sheet in
// half of them, perf.rest at a few hides): the events as their call sites send them (sync/live.ts's hide, world3d/
// boot.ts's perf.boot). Before 2026-11-24's batching (info waits for the hide, one line a hide, perf.boot's defaults
// left out) the same day was 56 uploads, 142 events, 27 kB; now 29, 114, 21 kB. Hermetic: a pinned clock, a seeded
// rand, a fake relay answering in 300 ms.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { configureLog, count, flushLog, leaving, log } from './log.ts';
import { bootFields, type LogBatch } from '#lib/contract/log.ts';

const KEY = '3f9a'.repeat(16);
const T0 = Date.parse('2026-11-05T00:00:00.000Z');

let posts: { bytes: number; n: number; keepalive: boolean; b: string; es: string[] }[];
let seed: number;
const rand = () => ((seed = (seed * 1103515245 + 12345) % 2 ** 31), seed / 2 ** 31);

beforeEach(() => {
  vi.useFakeTimers({ now: T0 });
  seed = 7;
  posts = [];
  configureLog({
    reset: true, on: true, kv: null, url: 'https://relay/log', key: () => KEY, now: () => Date.now(), rand,
    fetch: (async (_u: RequestInfo | URL, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body)) as LogBatch;
      const dup = posts.some((p) => p.b === body.b);
      posts.push({ bytes: String(init?.body).length, n: body.es.length, keepalive: !!init?.keepalive, b: body.b, es: body.es.map((e) => e.e) });
      await new Promise((ok) => setTimeout(ok, 300));
      return new Response(JSON.stringify({ ok: true, ...(dup ? { dup: true } : {}) }));
    }) as typeof fetch
  });
});
afterEach(() => {
  configureLog({ reset: true, on: false });
  vi.useRealTimers();
});

const BOOT = { mount: 519, first: 773, loaded: 896, shown: 2002, long: 72, draw: 41, appear: 18, steps: 34, sLink: 5, msLink: 149, sModels: 28, msModels: 933, sCards: 0, msCards: 0, stepMs: 105, progs: 40, fieldsMs: 24, fields: 'cache', late: 14, lastM: 'finds/coral', lateA: 1913, lateF: 1863, tx: 0, txFail: 0, txWebp: 0, txOff: false, data: 390, garden: 'first', farm: 'first', sw: 'ctl', warm: true, net: 0, shell: 'same', raceMs: 12, pre: 174, swCold: true, swNet: 1, swRoom: 0, swKB: 0, swUp: 3, swOwn: 167, swFresh: 170, swAns: 171 };
const WS = { code: 1000, secs: 66, welcomed: true, why: 'hidden', quiet: 13.5, rtt: 18, v: 3, openMs: 511, retries: 0, sent: 4, recv: 9, off: -3, offRtt: 18 };

async function wait(ms: number) {
  await vi.advanceTimersByTimeAsync(ms);
}
/** A cold load: the open, the launch, the ready and the frames sample. */
async function load() {
  log('app.open', { nav: 'navigate', route: '/', pwa: true, w: 393, h: 793, dpr: 3, lt: false, q: 0, qAgeS: 0, coldS: 7352, vis: 'visible' });
  await wait(2_000);
  log('perf.boot', bootFields(BOOT));
  log('app.ready', { ms: 1205, route: '/' });
  await wait(15_000);
  log('perf.frames', { p50: 17, p95: 21, fps: 59.6, long: 0, hz: 60, drawFps: 35, mode: '3d', when: 'ready' });
}
/** A visit: in front for two minutes, a sheet half the time, the record asked a few times, then the hide. */
async function visit(i: number, cold: boolean) {
  if (cold) await load();
  else log('app.show', { awayS: 1800, route: '/', ms: 670 });
  if (i % 2) {
    count('sheet:english');
    count('act:english.phrase.show');
    log('perf.sheet', { sheet: 'english', first: true, kept: false, chunk: 16, content: 44, anim: -1, late: 885, what: 'dialog.pop', long: 60, slow: 1 });
  }
  for (let k = 0; k < 5; k++) log('api.ok', { action: 'events', ms: 35 }, 1, { sample: 0.1 });
  if (i === 7) log('keyed.fail', { ep: 'other', why: 'timeout', n: 1 }, 2);
  await wait(120_000);
  if (i % 5 === 0) log('perf.rest', { s: 4, fps: 19.1, shadows: 3.5, wakes: 28.3, calls: 252, tris: 342677, dpr: 2, camZ: 1249, full: 62, why1: 'nodes', w1: 55, why2: 'crit-bug', w2: 16, nd1: 'float', nw1: 55 });
  // the hide (sync/live.ts's beforeLeaving): the socket's end, and the app's hide
  log('ws.close', { ...WS, visS: 120 });
  leaving();
  await wait(1_800_000);
}

describe('a phone\'s day of logging', () => {
  it('stays within the budget the doc states (batches, bytes, events a day)', async () => {
    const shows = 28, colds = new Set([0, 9, 19]);
    for (let i = 0; i < shows; i++) await visit(i, colds.has(i));
    await flushLog();
    await wait(1_000);
    const firsts = new Map<string, (typeof posts)[number]>();
    for (const p of posts) if (!firsts.has(p.b)) firsts.set(p.b, p);
    const events = [...firsts.values()].reduce((n, p) => n + p.n, 0);
    const bytes = posts.reduce((n, p) => n + p.bytes, 0);
    // one upload a visit (its hide's, with keepalive), the warning's own; ~110 events, ~21 kB
    expect([posts.length <= shows + 2, posts.filter((p) => p.keepalive).length, posts.filter((p) => p.n === 1).length <= 2]).toEqual([true, shows, true]);
    expect(events).toBeGreaterThan(100);
    expect(events).toBeLessThan(130);
    expect(bytes).toBeLessThan(24 * 1024);
  });
});
