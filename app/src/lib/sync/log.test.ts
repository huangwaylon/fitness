// The phone's log (sync/log.ts): the ring's priorities and caps, persistence across a reload, batching, the ack by
// batch id, backoff, the capped day, and that nothing but the key field carries the key (and no health value goes out).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LIVE } from './storage.ts';
import {
  clearLog, configureLog, count, DAY_MAX, flushLog, leaving, log, logError, osOf, persistLog, PIN, restoreLog, RING_MAX, SESSION_ERRORS, SESSION_MAX, sheetShown
} from './log.ts';
import type { LogBatch } from '#lib/contract/log.ts';
import { caught, quiet, swallowed } from '#lib/quiet.ts';
import { keyed } from '#lib/keyed.ts';

const KEY = '3f9a'.repeat(16);
const T0 = Date.parse('2026-11-05T03:00:00.000Z');

class Mem {
  m = new Map<string, string>();
  quota = Infinity;
  getItem(k: string) { return this.m.get(k) ?? null; }
  setItem(k: string, v: string) {
    if (v.length > this.quota) throw Object.assign(new Error('full'), { name: 'QuotaExceededError' });
    this.m.set(k, v);
  }
  removeItem(k: string) { this.m.delete(k); }
}

let kv: Mem;
let sent: { body: LogBatch; keepalive: boolean }[];
let reply: (b: LogBatch) => object | null;
let now: number;

beforeEach(() => {
  vi.useFakeTimers();
  now = T0;
  kv = new Mem();
  sent = [];
  reply = () => ({ ok: true, kept: 1, dropped: 0 });
  configureLog({
    reset: true, on: true, kv, url: 'https://relay/log', key: () => KEY, now: () => now, rand: () => 0.5,
    fetch: (async (_u: RequestInfo | URL, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body)) as LogBatch;
      sent.push({ body, keepalive: !!init?.keepalive });
      const r = reply(body);
      if (!r) throw new TypeError('Load failed');
      return new Response(JSON.stringify(r));
    }) as typeof fetch
  });
});
afterEach(() => {
  configureLog({ reset: true, on: false });
  vi.useRealTimers();
});

const evs = () => sent.flatMap((s) => s.body.es);

describe('the ring', () => {
  it('keeps errors and the trail before them; the lowest level goes first; drops are counted and sent', async () => {
    log('app.show', {}, 0); // a debug: the first to go
    for (let i = 0; i < 20; i++) log('app.show', { awayS: i });
    logError('error', new Error('boom'));
    for (let i = 0; i < RING_MAX; i++) log('api.ok', { ms: i }, 1);
    await flushLog();
    while (await flushLog() === false && sent.length < 20) { /* (the rest) */ }
    const got = evs();
    const bad: string[] = [];
    if (!got.some((e) => e.e === 'js.error')) bad.push('the error was evicted');
    // the PIN events before the error stay
    const trail = got.filter((e) => e.e === 'app.show').map((e) => e.d?.awayS);
    if (trail.length !== PIN || trail[0] !== 20 - PIN) bad.push(`trail ${trail.join(',')}`);
    if (got.some((e) => e.l === 0)) bad.push('the debug survived');
    const drop = got.find((e) => e.e === 'log.drop');
    if (!drop || Number(drop.d?.n) < 1 || drop.d?.why !== 'full') bad.push(`drop ${JSON.stringify(drop)}`);
    expect(bad).toEqual([]);
  });

  it('caps a session (errors apart, one message folded) and a day on the phone', async () => {
    for (let i = 0; i < SESSION_MAX + 5; i++) log('app.show');
    for (let i = 0; i < 3; i++) logError('error', new Error('same'));
    for (let i = 0; i < SESSION_ERRORS + 3; i++) logError('error', new Error(`e${'x'.repeat(i)}`));
    const counts = { show: 0, err: 0, folded: 0 };
    for (let i = 0; i < 40 && (await flushLog()) === false; i++) { /* drain */ }
    while (await flushLog() === false) { /* drain */ }
    for (const e of evs()) {
      if (e.e === 'app.show') counts.show++;
      if (e.e === 'js.error') counts.err++;
      if (e.e === 'js.error' && e.d?.n === 3) counts.folded++;
    }
    // (the ring holds RING_MAX: the oldest infos were evicted, counted as `full`)
    expect([counts.err, counts.folded, evs().filter((e) => e.e === 'log.drop').map((e) => e.d?.why).sort()]).toEqual([SESSION_ERRORS, 1, ['cap', 'full']]);
    configureLog({ reset: true, on: true });
    kv.setItem(LIVE.log, JSON.stringify({ v: 1, s: 'old0000001', build: 'b', os: 'o', ring: [], pending: [], day: { d: '2026-11-05', n: DAY_MAX } }));
    restoreLog();
    log('app.show');
    logError('error', new Error('still'));
    sent = [];
    await flushLog();
    expect(evs().map((e) => e.e)).toEqual(['js.error', 'log.drop']);
  });

  it('a day on the phone is Tokyo’s: the cap reopens at 00:00 JST, not 09:00', async () => {
    const capped = (at: string) => {
      configureLog({ reset: true, on: true });
      now = Date.parse(at);
      kv.setItem(LIVE.log, JSON.stringify({ v: 1, s: 'old0000001', build: 'b', os: 'o', ring: [], pending: [], day: { d: '2026-11-05', n: DAY_MAX } }));
      restoreLog();
      log('app.show');
    };
    capped('2026-11-05T14:30:00Z'); // 23:30 on the 5th
    await flushLog();
    expect(evs().map((e) => e.e)).toEqual(['log.drop']);
    sent = [];
    capped('2026-11-05T15:30:00Z'); // 00:30 on the 6th (still the 5th in UTC)
    await flushLog();
    expect(evs().map((e) => e.e)).toEqual(['app.show']);
  });

  it('a usage counter is summed into one event a flush; sampling keeps a share', async () => {
    count('sheet:island.food');
    count('sheet:island.food');
    count('act:tally');
    log('api.ok', { ms: 1 }, 1, { sample: 0.4 }); // rand 0.5: not kept
    log('api.ok', { ms: 2 }, 1, { sample: 0.6 });
    await flushLog();
    expect(evs().map((e) => [e.e, e.d])).toEqual([['api.ok', { ms: 2 }], ['use', { 'sheet:island.food': 2, 'act:tally': 1 }]]);
  });

  it('a swallowed failure (quiet.ts) is a `swallow:` counter, the caller given its fallback', async () => {
    expect(await quiet(Promise.reject(new Error('offline')), 'food.verify', null)).toBe(null);
    expect(await quiet(Promise.resolve(3), 'food.verify', null)).toBe(3);
    swallowed('tex.idb');
    swallowed('tex.idb');
    await flushLog();
    expect(evs().map((e) => [e.e, e.d])).toEqual([['use', { 'swallow:food.verify': 1, 'swallow:tex.idb': 2 }]]);
  });
});

describe('where and how often', () => {
  it('a failure says the topmost timed sheet; a caught bug is a js.error from its tag, one of them at most 5 a session', async () => {
    const offHealth = sheetShown('health'), offFarm = sheetShown('farm');
    log('api.fail', { action: 'events', err: 'busy' }, 2);
    offFarm();
    caught(new TypeError('x is undefined'), 'world');
    log('perf.sheet', { sheet: 'food' });
    offHealth();
    log('sync.fail', { err: 'busy' }, 2);
    await flushLog();
    expect(evs().map((e) => [e.e, e.d?.sheet, e.d?.src])).toEqual([
      ['api.fail', 'farm', undefined], ['js.error', 'health', 'world'], ['perf.sheet', 'food', undefined], ['sync.fail', undefined, undefined]
    ]);
    sent = [];
    for (let i = 0; i < 8; i++) {
      caught(new Error('again'), 'bus.fruit');
      await flushLog();
    }
    expect(evs().filter((e) => e.e === 'js.error')).toHaveLength(5);
    expect(evs().find((e) => e.e === 'log.drop')?.d).toEqual({ n: 1, why: 'cap' });
  });

  it('a members-only call that failed is one keyed.fail an incident by endpoint and kind; none unpaired', async () => {
    const was = globalThis.fetch;
    globalThis.fetch = (async () => new Response('', { status: 503 })) as typeof fetch;
    try {
      for (let i = 0; i < 3; i++) await keyed('https://relay/gym/config', KEY);
      await keyed('https://relay/stt', KEY);
      await keyed('https://relay/stt', null);
    } finally {
      globalThis.fetch = was;
    }
    await flushLog();
    expect(evs().filter((e) => e.e === 'keyed.fail').map((e) => [e.l, e.d])).toEqual([
      [2, { ep: 'gym', why: 'failed', http: 503, n: 3 }], [2, { ep: 'stt', why: 'failed', http: 503, n: 1 }]
    ]);
  });

  it('leaving sends every unacked batch at once (one at a time left an update reload\'s sessions behind); a restore past three counts the events it drops', async () => {
    const batch = (s: string) => ({ b: `b${s}00000`, s: `s${s}00000`, build: 'b1', os: 'ios18.7', es: [{ t: T0, l: 1, e: 'app.show', q: 1 }, { t: T0, l: 1, e: 'app.show', q: 2 }] });
    const saved = (p: string[]) => kv.setItem(LIVE.log, JSON.stringify({ v: 1, s: 'old0000001', build: 'b1', os: 'o', ring: [], pending: p.map(batch), day: { d: '2026-11-05', n: 10 } }));
    saved(['a', 'b']);
    restoreLog();
    reply = () => null; // the page dies before the replies
    log('app.show');
    leaving();
    await vi.advanceTimersByTimeAsync(0);
    expect(sent.map((x) => [x.body.s, x.keepalive])).toEqual([['sa00000', true], ['sb00000', true], [expect.any(String), true]]);
    // five kept: the oldest two's events counted (were let go uncounted)
    configureLog({ reset: true, on: true });
    saved(['a', 'b', 'c', 'd', 'e']);
    restoreLog();
    reply = () => ({ ok: true });
    sent = [];
    while (!(await flushLog())) now += 120_000;
    expect(sent.map((x) => x.body.s).slice(0, 3)).toEqual(['sc00000', 'sd00000', 'se00000']);
    expect(evs().find((e) => e.e === 'log.drop')?.d).toEqual({ n: 4, why: 'pending' });
  });
});

describe('sending', () => {
  it('a batch ≤ 50 events and ≤ 32 KB, the session and build on it, flushed 30 s after an info and 5 s after an error', async () => {
    log('app.show');
    await vi.advanceTimersByTimeAsync(29_000);
    expect(sent.length).toBe(0);
    await vi.advanceTimersByTimeAsync(1_500);
    expect(sent.length).toBe(1);
    logError('error', new Error('x'));
    await vi.advanceTimersByTimeAsync(5_500);
    expect(sent.length).toBe(2);
    for (let i = 0; i < 120; i++) log('js.error', { msg: 'm'.repeat(400), stack: '' }, 2);
    await vi.advanceTimersByTimeAsync(10);
    while (await flushLog() === false) { /* drain */ }
    const sizes = sent.map((s) => [s.body.es.length, JSON.stringify(s.body).length]);
    expect(sizes.every(([n, b]) => n <= 50 && b <= 32_500)).toBe(true);
    expect(sent.every((s) => s.body.v === 1 && /^[0-9a-z]{10}$/.test(s.body.s) && s.body.key === KEY)).toBe(true);
  });

  it('a batch stays until acked: a failure backs off and sends the same id again; dup is an ack', async () => {
    let fail = true;
    reply = (b) => (fail ? null : { ok: true, dup: sent.filter((s) => s.body.b === b.b).length > 1 });
    log('app.show');
    expect(await flushLog()).toBe(false);
    const b = sent[0].body.b;
    expect(await flushLog()).toBe(false); // (within the backoff: not sent)
    expect(sent.length).toBe(1);
    fail = false;
    now += 6_000;
    expect(await flushLog()).toBe(true);
    expect(sent.map((s) => s.body.b)).toEqual([b, b]);
    expect(await flushLog()).toBe(true);
    expect(sent.length).toBe(2);
  });

  it('offline, past three unacked batches the newest takes more (else the ring waits): none of their events dropped', async () => {
    reply = () => null;
    for (let i = 0; i < 6; i++) {
      log('app.show', { awayS: i });
      await flushLog();
      now += 120_000;
    }
    reply = () => ({ ok: true });
    sent = [];
    while (!(await flushLog())) now += 120_000;
    const shown = evs().filter((e) => e.e === 'app.show').map((e) => (e.d as { awayS: number }).awayS);
    expect(shown).toEqual([0, 1, 2, 3, 4, 5]);
    expect(evs().some((e) => e.e === 'log.drop')).toBe(false);
  });

  it('persists when leaving and sends with keepalive; a reload sends what was left, as its old session', async () => {
    reply = () => null; // the page dies before the reply
    log('app.show', { awayS: 1 });
    logError('rejection', new Error('kaput'));
    leaving();
    await vi.advanceTimersByTimeAsync(0);
    expect(sent.map((s) => s.keepalive)).toEqual([true]);
    const sid = sent[0].body.s;
    expect(JSON.parse(kv.getItem(LIVE.log)!).pending.length).toBe(1);
    // the next load
    configureLog({ reset: true, on: true });
    restoreLog();
    reply = () => ({ ok: true });
    now += 60_000;
    sent = [];
    await flushLog();
    expect([sent[0].body.s, sent[0].body.es.map((e) => e.e)]).toEqual([sid, ['app.show', 'js.error']]);
  });

  it('a capped day sends only errors until it opens; an unauthorized batch is dropped; pairing as someone else clears it', async () => {
    reply = () => ({ ok: true, kept: 0, closed: now + 3_600_000 });
    log('app.show');
    await flushLog();
    reply = () => ({ ok: true });
    log('app.show');
    logError('error', new Error('x'));
    await flushLog();
    expect(sent.at(-1)!.body.es.map((e) => e.e)).toEqual(['js.error']);
    reply = () => ({ ok: false, error: 'unauthorized' });
    log('js.error', {}, 3);
    expect(await flushLog()).toBe(true);
    log('app.show');
    clearLog();
    sent = [];
    await flushLog();
    expect(sent).toEqual([]);
  });

  it('storage full: the log is dropped quietly (never the user’s data, never a throw)', () => {
    kv.setItem('island.queue', '[1]');
    kv.quota = 100;
    for (let i = 0; i < 10; i++) log('app.show');
    expect(() => persistLog()).not.toThrow();
    expect([kv.getItem(LIVE.log), kv.getItem('island.queue')]).toEqual([null, '[1]']);
    kv.quota = Infinity;
    for (let i = 0; i < RING_MAX; i++) logError('error', new Error(`e${i}`.padEnd(200, 'x')));
    persistLog();
    expect(kv.getItem(LIVE.log)!.length).toBeLessThanOrEqual(24_000);
  });
});

describe('privacy', () => {
  it('the key goes only in the key field; health values, food names and URLs in an error never leave', async () => {
    logError('error', new Error(`bad ${KEY} weight 68.4 鮭の塩焼き https://island-fund.pages.dev/pair#key=${KEY}`), { file: `https://x/pair#key=${KEY}`, line: 3 });
    log('api.fail', { action: 'events', err: 'busy', key: KEY, weight: 68.4, note: 'Chicken salad' }, 2, { r: KEY });
    log('use', { [`sheet:${KEY}`]: 1, 'sheet:鮭': 1 });
    await flushLog();
    const { key, ...rest } = sent[0].body;
    const out = JSON.stringify(rest);
    expect([key, out.includes(KEY), out.includes(KEY.slice(0, 16)), /68\.4|鮭|Chicken|island-fund\.pages|#key/.test(out)]).toEqual([KEY, false, false, false]);
  });
});

it('the device in a word', () => {
  expect([
    osOf('Mozilla/5.0 (iPhone; CPU iPhone OS 27_1 like Mac OS X) AppleWebKit/605.1.15'),
    osOf('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'), osOf('Mozilla/5.0 (Linux; Android 14)'), osOf('x')
  ]).toEqual(['ios27.1', 'macos', 'android', 'other']);
});
