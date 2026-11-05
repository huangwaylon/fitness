import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LIVE_URL, backoff, bestOffset, createLive, type Live, type LiveEnv, type LiveStatus, type SinceStore } from './live.ts';
import { dayStart, tokyoDay, type Relayed } from '../contract/live-protocol.ts';

const KEY = 'ab'.repeat(32);

class FakeWS {
  static all: FakeWS[] = [];
  readyState = 0;
  bufferedAmount = 0;
  sent: Record<string, unknown>[] = [];
  closed: { code?: number } | null = null;
  onopen: (() => void) | null = null;
  onmessage: ((e: { data: string }) => void) | null = null;
  onclose: ((e: { code: number }) => void) | null = null;
  onerror: (() => void) | null = null;
  constructor(public url: string) {
    FakeWS.all.push(this);
  }
  send(d: string) {
    this.sent.push(JSON.parse(d));
  }
  close(code?: number) {
    this.closed = { code };
    this.readyState = 3;
  }
  // the relay's side
  open() {
    this.readyState = 1;
    this.onopen?.();
  }
  recv(m: object) {
    this.onmessage?.({ data: JSON.stringify({ v: 3, ...m }) });
  }
  drop(code = 1006) {
    this.readyState = 3;
    this.onclose?.({ code });
  }
  welcome(peer = true, t = Date.now()) {
    this.open();
    this.recv({ kind: 'welcome', me: 'A', peer, t });
  }
}

const last = () => FakeWS.all.at(-1)!;

let visible: boolean;
let online: boolean;
let fire: () => void;
const env: LiveEnv = {
  visible: () => visible,
  online: () => online,
  watch(fn) {
    fire = fn;
    return () => (fire = () => {});
  }
};

let key: string | null;
let live: Live;
/** The `since` kept across reloads (the test's own store). */
let kept: { day: number; t: number } | null;
const since: SinceStore = {
  get: (now) => (kept && kept.day === tokyoDay(now) ? kept.t : dayStart(tokyoDay(now))),
  set: (t) => void (kept = { day: tokyoDay(t), t })
};

function make(url = 'wss://relay.test/room'): Live {
  return createLive({ url, key: () => key, WebSocket: FakeWS as never, env, since });
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(1_790_000_000_000);
  FakeWS.all = [];
  visible = true;
  online = true;
  key = KEY;
  kept = null;
  live = make();
});

afterEach(() => {
  live.stop();
  vi.useRealTimers();
});

describe('live: connecting', () => {
  it('says its build in the hello when it has one', () => {
    live.stop();
    live = createLive({ url: 'wss://x', key: () => KEY, build: () => '2026-11-05.ef93d8b', WebSocket: FakeWS as never, env });
    live.start();
    last().open();
    expect(last().sent[0]).toMatchObject({ v: 3, kind: 'hello', key: KEY, batch: true, build: '2026-11-05.ef93d8b' });
  });

  it('connects while visible, says hello with the key, and reports the welcome', () => {
    const seen: LiveStatus[] = [];
    live.onStatus((s) => seen.push(s));
    live.start();
    expect(FakeWS.all).toHaveLength(1);
    last().open();
    // a page's first hello asks for today's whole shared world (from Tokyo midnight)
    expect(last().sent[0]).toEqual({ v: 3, kind: 'hello', key: KEY, since: dayStart(tokyoDay(Date.now())), batch: true });
    last().recv({ kind: 'welcome', me: 'A', peer: false, t: Date.now() });
    expect(live.status()).toEqual({ connected: true, me: 'A', peer: false, here: [], gone: {} });
    expect(seen.at(-1)).toEqual({ connected: true, me: 'A', peer: false, here: [], gone: {} });
    // the guest (v3) comes and goes: it is here, but it isn't the partner
    last().recv({ kind: 'presence', who: 'G', on: true, t: Date.now() });
    expect(live.status()).toMatchObject({ peer: false, here: ['G'] });
    last().recv({ kind: 'presence', who: 'B', on: true, t: Date.now() });
    expect(live.status()).toMatchObject({ peer: true, here: ['B', 'G'] });
    last().recv({ kind: 'presence', who: 'G', on: false, t: 1_800_000_000_000 });
    expect(live.status()).toMatchObject({ peer: true, here: ['B'] });
    // when they left, on the relay's clock (store/where.svelte.ts: one gone quiet inside); back, forgotten
    expect(live.status().gone).toEqual({ G: 1_800_000_000_000 });
    last().recv({ kind: 'presence', who: 'G', on: true, t: Date.now() });
    expect(live.status().gone).toEqual({});
  });

  it('the welcome’s `gone`: when those not here left, and my own last socket', () => {
    live.start();
    last().open();
    last().recv({ kind: 'welcome', me: 'A', peer: false, here: [], gone: { A: 1_800_000_000_000, B: 1_799_000_000_000 }, t: Date.now() });
    expect(live.status().gone).toEqual({ A: 1_800_000_000_000, B: 1_799_000_000_000 });
    last().recv({ kind: 'presence', who: 'B', on: true, t: Date.now() });
    expect(live.status().gone).toEqual({ A: 1_800_000_000_000 });
  });

  it('on the guest’s phone: either member is its peer, and it sends only what the guest may', () => {
    live.start();
    last().open();
    last().recv({ kind: 'welcome', me: 'G', peer: true, here: ['A'], t: Date.now() });
    expect(live.status()).toMatchObject({ me: 'G', peer: true, here: ['A'] });
    const n = last().sent.length;
    expect(live.send({ kind: 'world', op: 'watered', id: 'fl:1:2' })).toBe(false);
    expect(live.send({ kind: 'decor', id: 'dabc1234', at: 1e12, item: 'tanuki', x: 1, z: 1, f: 0, p: 1e12 })).toBe(false);
    expect(live.send({ kind: 'saved' })).toBe(false);
    expect(live.send({ kind: 'say', text: 'やあ' })).toBe(true);
    expect(last().sent.length).toBe(n + 1);
  });

  it('does nothing hidden, offline, without a key or without a URL', () => {
    visible = false;
    live.start();
    online = false;
    visible = true;
    fire();
    key = null;
    online = true;
    fire();
    expect(FakeWS.all).toHaveLength(0);
    live.stop();
    key = KEY;
    live = make('');
    live.start();
    expect(FakeWS.all).toHaveLength(0);
    expect(live.send({ kind: 'emote', emote: 'glee' })).toBe(false);
  });

  it('closes when hidden (zero cost) and reconnects when shown', () => {
    live.start();
    last().welcome();
    visible = false;
    fire();
    expect(FakeWS.all[0].closed).toEqual({ code: 1000 });
    expect(live.status().connected).toBe(false);
    vi.advanceTimersByTime(120_000);
    expect(FakeWS.all).toHaveLength(1); // no retries, no pings while hidden
    visible = true;
    fire();
    expect(FakeWS.all).toHaveLength(2);
  });

  it('closes offline and reconnects online', () => {
    live.start();
    last().welcome();
    online = false;
    fire();
    expect(FakeWS.all[0].closed).not.toBeNull();
    online = true;
    fire();
    expect(FakeWS.all).toHaveLength(2);
  });

  it('reconnects with doubling backoff after a drop, reset by a welcome', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5); // no jitter
    live.start();
    last().drop();
    vi.advanceTimersByTime(999);
    expect(FakeWS.all).toHaveLength(1);
    vi.advanceTimersByTime(1);
    expect(FakeWS.all).toHaveLength(2);
    last().drop();
    vi.advanceTimersByTime(1999);
    expect(FakeWS.all).toHaveLength(2);
    vi.advanceTimersByTime(1);
    expect(FakeWS.all).toHaveLength(3);
    last().welcome();
    last().drop();
    vi.advanceTimersByTime(1000);
    expect(FakeWS.all).toHaveLength(4);
  });

  it('stays parked after a refused key, a replacement or a version change, until shown again', () => {
    for (const code of [4001, 4002, 4004]) {
      live.stop();
      FakeWS.all = [];
      live = make();
      live.start();
      last().open();
      last().drop(code);
      vi.advanceTimersByTime(300_000);
      expect(FakeWS.all, String(code)).toHaveLength(1);
      visible = false;
      fire();
      visible = true;
      fire();
      expect(FakeWS.all).toHaveLength(2);
    }
  });

  it('never throws when the socket cannot be made', () => {
    const Broken = class {
      constructor() {
        throw new Error('blocked');
      }
    };
    live = createLive({ url: 'wss://x', key: () => KEY, WebSocket: Broken as never, env });
    expect(() => live.start()).not.toThrow();
  });
});

describe('live: messages', () => {
  it('sends intents only while the partner is there, the shared world (and walks) whenever connected', () => {
    live.start();
    expect(live.send({ kind: 'emote', emote: 'glee' })).toBe(false); // not connected
    last().welcome(false);
    expect(live.send({ kind: 'emote', emote: 'glee' })).toBe(false); // partner away
    expect(live.send({ kind: 'walk', to: [10, 20] })).toBe(true); // kept: where my villager stands
    expect(live.send({ kind: 'world', op: 'weed-pulled', id: 'w1' })).toBe(true); // kept for their reconnect
    expect(live.send({ kind: 'pick', id: 's1', what: 'shell:conch' })).toBe(true);
    expect(live.send({ kind: 'catch', what: 'koi' })).toBe(false); // no id: nothing the room keeps
    last().recv({ kind: 'presence', who: 'B', on: true, t: Date.now() });
    expect(live.status().peer).toBe(true);
    expect(live.send({ kind: 'emote', emote: 'glee' })).toBe(true);
    // the kept ones numbered (their acks), in order
    const out = last().sent.slice(1);
    expect(out.map(({ c: _c, ...m }) => m)).toEqual([
      { v: 3, kind: 'walk', to: [10, 20] },
      { v: 3, kind: 'world', op: 'weed-pulled', id: 'w1' },
      { v: 3, kind: 'pick', id: 's1', what: 'shell:conch' },
      { v: 3, kind: 'emote', emote: 'glee' }
    ]);
    const cs = out.map((m) => m.c as number | undefined);
    expect(cs[3]).toBeUndefined();
    expect(cs[0]! < cs[1]! && cs[1]! < cs[2]!).toBe(true);
    last().recv({ kind: 'presence', who: 'B', on: false, t: Date.now() });
    expect(live.send({ kind: 'emote', emote: 'glee' })).toBe(false);
  });

  it('a high-five goes numbered with the partner away (the room holds it), and one heard is answered `got`', () => {
    live.start();
    last().welcome(false);
    expect(live.send({ kind: 'highfive', at: 1_790_000_000_000 })).toBe(true);
    const [hf] = last().sent.slice(1) as { kind: string; c?: number }[];
    expect(hf).toMatchObject({ v: 3, kind: 'highfive', at: 1_790_000_000_000 });
    expect(hf.c).toBeGreaterThan(0);
    const heard: Relayed[] = [];
    live.on((m) => heard.push(m));
    last().recv({ kind: 'highfive', at: 1_789_999_000_000, who: 'B', t: 1_789_999_000_010 });
    expect(heard.map((m) => m.kind)).toEqual(['highfive']);
    expect(last().sent.at(-1)).toEqual({ v: 3, kind: 'got', at: 1_789_999_000_000 });
  });

  it('keeps a kept intent until its ack: one sent offline or never acked goes again after the next welcome (the last walk only)', () => {
    live.start();
    last().welcome(false);
    live.send({ kind: 'pick', id: 's1', what: 'shell:conch' });
    live.send({ kind: 'walk', to: [10, 20] });
    const [p1, w1] = last().sent.slice(1) as { c: number }[];
    last().recv({ kind: 'ack', c: p1.c, t: Date.now(), ok: true });
    expect(live.metrics?.().pending).toBe(1);
    last().drop();
    // offline: kept, sent at the welcome
    expect(live.send({ kind: 'walk', to: [30, 40] })).toBe(false);
    expect(live.send({ kind: 'world', op: 'watered', id: 'fl:1:2' })).toBe(false);
    vi.advanceTimersByTime(2000);
    last().welcome(false);
    const again = last().sent.slice(1) as { kind: string; c: number; to?: number[] }[];
    expect(again.map((m) => m.kind)).toEqual(['walk', 'world']);
    expect(again[0].to).toEqual([30, 40]);
    expect(again[0].c).not.toBe(w1.c);
    expect(live.metrics?.()).toMatchObject({ resent: 2, pending: 2 });
    for (const m of again) last().recv({ kind: 'ack', c: m.c, t: Date.now(), ok: true });
    expect(live.metrics?.().pending).toBe(0);
    expect(live.metrics?.().ackMs).toHaveLength(3);
  });

  it('hears the day as replay messages: each change in order, mine included, `since` moved on', () => {
    const got: Relayed[] = [];
    live.on((m) => got.push(m));
    live.start();
    last().welcome();
    last().recv({ kind: 'replay', t: 1_790_000_001_000, es: [
      { v: 3, kind: 'pick', id: 'w1', what: 'weed', who: 'B', t: 1_790_000_000_500 },
      { v: 3, kind: 'walk', to: [10, 20], who: 'A', t: 1_790_000_000_600 },
      { v: 3, kind: 'pick', id: 'w2', what: 'weed', who: 'Q', t: 1_790_000_000_700 }
    ] });
    expect(got.map((m) => [m.kind, m.who])).toEqual([['pick', 'B'], ['walk', 'A']]);
    last().drop();
    vi.advanceTimersByTime(2000);
    last().open();
    expect(last().sent[0]).toMatchObject({ kind: 'hello', since: 1_790_000_000_600 });
  });

  it('refuses a malformed or oversized intent, and a stalled socket', () => {
    live.start();
    last().welcome();
    expect(live.send({ kind: 'act', act: 'explode' } as never)).toBe(false);
    expect(live.send({ kind: 'catch', what: 'x'.repeat(300) })).toBe(false);
    last().bufferedAmount = 10_000;
    expect(live.send({ kind: 'emote', emote: 'glee' })).toBe(false);
  });

  it('delivers the partner\'s intents, ignores junk and my own echoes, and survives a throwing listener', () => {
    const got: Relayed[] = [];
    live.on(() => {
      throw new Error('listener bug');
    });
    const off = live.on((m) => got.push(m));
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    live.start();
    last().welcome();
    last().recv({ kind: 'act', act: 'shake', id: 't2', who: 'B', t: 5 });
    last().recv({ kind: 'act', act: 'shake', id: 't2', who: 'A', t: 6 });
    last().recv({ kind: 'act', act: 'explode', who: 'B', t: 7 });
    last().onmessage?.({ data: 'garbage' });
    expect(got).toEqual([{ v: 3, kind: 'act', act: 'shake', id: 't2', who: 'B', t: 5 }]);
    expect(err).toHaveBeenCalled();
    off();
    last().recv({ kind: 'emote', emote: 'glee', who: 'B', t: 8 });
    expect(got).toHaveLength(1);
  });

  it('asks for the shared world it missed since the last change it heard, across a reload too', () => {
    live.start();
    last().welcome();
    last().recv({ kind: 'world', op: 'dug', id: 'd1', who: 'B', t: 1_790_000_000_500 });
    last().recv({ kind: 'pick', id: 'w1', what: 'weed', who: 'B', t: 1_790_000_000_600 });
    last().recv({ kind: 'emote', emote: 'glee', who: 'B', t: 1_790_000_000_700 }); // not the world's
    last().drop();
    vi.advanceTimersByTime(2000);
    last().open();
    expect(last().sent[0]).toEqual({ v: 3, kind: 'hello', key: KEY, since: 1_790_000_000_600, batch: true });
    // the page reloads: the kept since
    live.stop();
    live = make();
    live.start();
    last().open();
    expect(last().sent[0]).toMatchObject({ kind: 'hello', since: 1_790_000_000_600 });
    // the next Tokyo day: from its midnight
    live.stop();
    vi.setSystemTime(dayStart(tokyoDay(Date.now()) + 1) + 5000);
    live = make();
    live.start();
    last().open();
    expect(last().sent[0]).toMatchObject({ kind: 'hello', since: dayStart(tokyoDay(Date.now())) });
  });

  it('reports sheet changes: the push (mine too) and the partner\'s nudge, never as intents', () => {
    const changes: unknown[] = [];
    const intents: Relayed[] = [];
    const off = live.onChange((c) => changes.push(c));
    live.on((m) => intents.push(m));
    live.start();
    last().welcome();
    const n = { what: 'ingest', who: 'A', at: '2026-11-01T01:02:03.456Z', rev: 'r1' };
    last().recv({ kind: 'changed', ...n, t: 5 });
    last().recv({ kind: 'saved', who: 'B', t: 6 });
    last().recv({ kind: 'saved', who: 'A', t: 7 }); // my own echo
    expect(changes).toEqual([n, { who: 'B', what: 'event' }]);
    expect(intents).toEqual([]);
    expect(live.send({ kind: 'saved' })).toBe(true);
    expect(last().sent.at(-1)).toEqual({ v: 3, kind: 'saved' });
    off();
    last().recv({ kind: 'changed', ...n, t: 8 });
    expect(changes).toHaveLength(2);
  });
});

describe('live: days open (nothing piles up)', () => {
  it('a hundred reconnects leave the timers of one socket (pings, the reconnect)', () => {
    live.start();
    last().welcome();
    const timers = vi.getTimerCount();
    for (let i = 0; i < 100; i++) {
      last().drop();
      vi.advanceTimersByTime(30_000); // past the backoff: a new socket
      last().welcome();
    }
    expect(FakeWS.all).toHaveLength(101);
    expect(vi.getTimerCount()).toBeLessThanOrEqual(timers);
  });

  it('a second welcome on one socket keeps one ping a minute', () => {
    live.start();
    last().welcome();
    last().recv({ kind: 'welcome', me: 'A', peer: true, t: Date.now() });
    vi.advanceTimersByTime(30_000);
    const pings = () => last().sent.filter((m) => m.kind === 'ping').length;
    const before = pings();
    vi.advanceTimersByTime(60_000);
    expect(pings() - before).toBe(1);
  });
});

describe('live: the relay clock', () => {
  it('pings after the welcome, 2 s later and every minute, and takes the shortest round trip\'s offset', () => {
    live.start();
    const ws = last();
    ws.welcome(true, Date.now() + 5000); // first guess from the welcome
    expect(live.serverNow() - Date.now()).toBe(5000);
    vi.advanceTimersByTime(0);
    const p1 = ws.sent.at(-1)!;
    expect(p1.kind).toBe('ping');
    vi.advanceTimersByTime(200); // 200 ms round trip; the relay is 3000 ms ahead
    ws.recv({ kind: 'pong', c: p1.c, t: (p1.c as number) + 100 + 3000 });
    expect(live.serverNow() - Date.now()).toBe(3000);
    vi.advanceTimersByTime(1800);
    const p2 = ws.sent.at(-1)!;
    expect(p2.c).toBe((p1.c as number) + 2000);
    vi.advanceTimersByTime(40); // a quicker trip wins: 3010 ahead
    ws.recv({ kind: 'pong', c: p2.c, t: (p2.c as number) + 20 + 3010 });
    expect(live.serverNow() - Date.now()).toBe(3010);
    ws.recv({ kind: 'pong', c: 12345, t: 1 }); // not mine: ignored
    expect(live.serverNow() - Date.now()).toBe(3010);
    const before = ws.sent.length;
    vi.advanceTimersByTime(60_000);
    expect(ws.sent.length).toBe(before + 1);
  });

  it('points at the relay\'s room by default', () => {
    expect(LIVE_URL).toMatch(/^wss:\/\/.+\/room$/);
  });

  it('backoff and offset helpers', () => {
    expect(backoff(0, 0.5)).toBe(1000);
    expect(backoff(3, 0.5)).toBe(8000);
    expect(backoff(20, 0.5)).toBe(60_000);
    expect(backoff(0, 0)).toBe(750);
    expect(backoff(0, 0.999)).toBe(1250);
    expect(bestOffset([])).toBe(0);
    expect(bestOffset([{ rtt: 90, off: 1 }, { rtt: 30, off: 2 }, { rtt: 60, off: 3 }])).toBe(2);
  });
});
