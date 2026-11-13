import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LIVE_URL, backoff, bestOffset, createLive, deviceId, type KeptOut, type Live, type LiveEnv, type LiveStatus, type OutboxStore, type SinceStore } from './live.ts';
import { dayStart, LIVE_V, tokyoDay, type Relayed } from '../contract/live-protocol.ts';
import { configureStorage, LIVE, type KV } from './storage.ts';
import { ROOM_PROTOCOL, ticketOwner } from '../contract/ticket.ts';
import { log } from './log.ts';

// the phone's log, watched (ws.close: why a socket ended)
vi.mock('./log.ts', async (orig) => ({ ...(await orig<typeof import('./log.ts')>()), log: vi.fn() }));
const closes = () => vi.mocked(log).mock.calls.filter((c) => c[0] === 'ws.close').map((c) => c[1]);

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
  constructor(public url: string, public protocols?: string[]) {
    FakeWS.all.push(this);
  }
  /** Answer each ping at once (a live relay). */
  pongs = false;
  /** Keep `bufferedAmount` as a browser does: a send's bytes at once, drained a task later. */
  grows = false;
  send(d: string) {
    const m = JSON.parse(d) as Record<string, unknown>;
    this.sent.push(m);
    if (this.grows) {
      this.bufferedAmount += d.length;
      setTimeout(() => (this.bufferedAmount -= d.length), 0);
    }
    if (this.pongs && m.kind === 'ping') this.recv({ kind: 'pong', c: m.c, t: Date.now() });
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
  it('connects while visible, says hello with the key, and reports the welcome', () => {
    const seen: LiveStatus[] = [];
    live.onStatus((s) => seen.push(s));
    live.start();
    expect(FakeWS.all).toHaveLength(1);
    last().open();
    // a page's first hello asks for today's whole shared world (from Tokyo midnight)
    expect(last().sent[0]).toEqual({ v: 3, kind: 'hello', key: KEY, since: dayStart(tokyoDay(Date.now())), beat: true });
    last().recv({ kind: 'welcome', me: 'A', peer: false, t: Date.now() });
    expect(live.status()).toEqual({ connected: true, me: 'A', peer: false, here: [], gone: {}, mine: false });
    expect(seen.at(-1)).toEqual({ connected: true, me: 'A', peer: false, here: [], gone: {}, mine: false });
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

  it('on the guest’s phone: either member is its peer, and it sends what a member does (a home only its own)', () => {
    live.start();
    last().open();
    last().recv({ kind: 'welcome', me: 'G', peer: true, here: ['A'], t: Date.now() });
    expect(live.status()).toMatchObject({ me: 'G', peer: true, here: ['A'] });
    const n = last().sent.length;
    expect(live.send({ kind: 'world', op: 'watered', id: 'fl:1:2' })).toBe(true);
    expect(live.send({ kind: 'decor', id: 'dabc1234', at: 1e12, item: 'tanuki', x: 1, z: 1, f: 0, p: 1e12 })).toBe(true);
    expect(live.send({ kind: 'decor', sc: 'o', id: 'oak1', at: 1e12, k: 'oak', x: 3, z: 4, f: 0 })).toBe(true);
    expect(live.send({ kind: 'saved' })).toBe(true);
    expect(live.send({ kind: 'say', text: 'やあ' })).toBe(true);
    // another's home: its owner's alone (the room would refuse it from anyone)
    expect(live.send({ kind: 'decor', sc: 'h', id: 'hA', at: 1e12, m: 'house' })).toBe(false);
    expect(last().sent.length).toBe(n + 5);
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
    expect(live.send({ kind: 'act', act: 'tap' })).toBe(false);
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
    expect(live.send({ kind: 'act', act: 'tap' })).toBe(false); // not connected
    last().welcome(false);
    expect(live.send({ kind: 'act', act: 'tap' })).toBe(false); // partner away
    expect(live.send({ kind: 'walk', to: [10, 20] })).toBe(true); // kept: where my villager stands
    expect(live.send({ kind: 'world', op: 'watered', id: 'w1' })).toBe(true); // kept for their reconnect
    expect(live.send({ kind: 'pick', id: 's1', what: 'shell:conch' })).toBe(true);
    expect(live.send({ kind: 'catch', what: 'koi' })).toBe(false); // no id: nothing the room keeps
    last().recv({ kind: 'presence', who: 'B', on: true, t: Date.now() });
    expect(live.status().peer).toBe(true);
    expect(live.send({ kind: 'act', act: 'tap' })).toBe(true);
    // the kept ones numbered (their acks), in order
    const out = last().sent.slice(1);
    expect(out.map(({ c: _c, ...m }) => m)).toEqual([
      { v: 3, kind: 'walk', to: [10, 20] },
      { v: 3, kind: 'world', op: 'watered', id: 'w1' },
      { v: 3, kind: 'pick', id: 's1', what: 'shell:conch' },
      { v: 3, kind: 'act', act: 'tap' }
    ]);
    const cs = out.map((m) => m.c as number | undefined);
    expect(cs[3]).toBeUndefined();
    expect(cs[0]! < cs[1]! && cs[1]! < cs[2]!).toBe(true);
    last().recv({ kind: 'presence', who: 'B', on: false, t: Date.now() });
    expect(live.send({ kind: 'act', act: 'tap' })).toBe(false);
  });

  it('the hello\'s `dev`: the device\'s id and the tab\'s, so a second tab of one browser is another device; a reload keeps it', () => {
    const mem = (): KV & { m: Map<string, string> } => {
      const m = new Map<string, string>();
      return { m, getItem: (k) => m.get(k) ?? null, setItem: (k, v) => void m.set(k, v), removeItem: (k) => void m.delete(k) };
    };
    const local = mem(), tab1 = mem(), tab2 = mem();
    configureStorage({ local, session: tab1 });
    const a = deviceId()!;
    expect(a).toMatch(/^[0-9a-z]{14}$/);
    expect(deviceId()).toBe(a);
    configureStorage({ session: tab2 });
    const b = deviceId()!;
    expect([b === a, b.slice(0, 10) === a.slice(0, 10)]).toEqual([false, true]);
    // a device id from before the tab's (10 of [0-9a-z]) is kept; no sessionStorage: the device's alone
    local.m.set(LIVE.device, JSON.stringify('was0000000'));
    configureStorage({ session: null });
    expect(deviceId()).toBe('was0000000');
    configureStorage({ local: null, session: null });
  });

  it('my other device (one device, one socket: the hello\'s `dev`): its decor ops are heard, my layout ops go to it', () => {
    live = createLive({ url: 'wss://x', key: () => KEY, dev: () => 'phone12345', WebSocket: FakeWS as never, env });
    live.start();
    last().open();
    expect(last().sent[0]).toMatchObject({ kind: 'hello', dev: 'phone12345' });
    last().recv({ kind: 'welcome', me: 'A', peer: false, t: Date.now(), mine: true });
    expect(live.status().mine).toBe(true);
    const op = { kind: 'decor', sc: 'o', id: 'o1', at: Date.now(), k: 'bench', x: 3, z: 4, f: 0 } as const;
    // nobody else here, but my Mac is: the layout op goes, numbered (its ack); a presence-only intent doesn't
    expect(live.send(op)).toBe(true);
    expect(last().sent.at(-1)).toMatchObject({ kind: 'decor', id: 'o1', c: expect.any(Number) });
    expect(live.send({ kind: 'act', act: 'tap' })).toBe(false);
    const heard: Relayed[] = [];
    live.on((m) => heard.push(m));
    last().recv({ ...op, id: 'o2', who: 'A', t: Date.now() });
    last().recv({ kind: 'act', act: 'tap', who: 'A', t: Date.now() });
    expect(heard.map((m) => m.kind)).toEqual(['decor']);
    // my Mac gone: my presence says so, and the partner's list is untouched
    last().recv({ kind: 'presence', who: 'A', on: false, t: Date.now() });
    expect(live.status()).toMatchObject({ mine: false, here: [] });
    expect(live.send({ ...op, id: 'o3' })).toBe(false);
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
    expect(live.send({ kind: 'act', act: 'tap' })).toBe(false);
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
    last().recv({ kind: 'world', op: 'wished', id: 'd1', who: 'B', t: 1_790_000_000_500 });
    last().recv({ kind: 'pick', id: 'w1', what: 'weed', who: 'B', t: 1_790_000_000_600 });
    last().recv({ kind: 'emote', emote: 'glee', who: 'B', t: 1_790_000_000_700 }); // not the world's
    last().drop();
    vi.advanceTimersByTime(2000);
    last().open();
    expect(last().sent[0]).toEqual({ v: 3, kind: 'hello', key: KEY, since: 1_790_000_000_600, beat: true });
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
      vi.advanceTimersByTime(5000); // past the backoff (1 s ± 25 %): a new socket
      last().welcome();
    }
    expect(FakeWS.all).toHaveLength(101);
    expect(vi.getTimerCount()).toBeLessThanOrEqual(timers);
  });

  it('a second welcome on one socket keeps one quiet-socket ping (every 20 s)', () => {
    live.start();
    last().welcome();
    last().pongs = true;
    last().recv({ kind: 'welcome', me: 'A', peer: true, t: Date.now() });
    vi.advanceTimersByTime(30_000);
    const pings = () => last().sent.filter((m) => m.kind === 'ping').length;
    const before = pings();
    vi.advanceTimersByTime(60_000);
    expect(pings() - before).toBe(3);
    expect(FakeWS.all).toHaveLength(1);
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
    // then whenever the socket was quiet for 20 s
    ws.pongs = true;
    const before = ws.sent.length;
    vi.advanceTimersByTime(60_000);
    expect(ws.sent.length).toBe(before + 3);
  });

  it('a reconnect keeps the measured clock (a game’s never jumps by the welcome’s trip), unless the device’s clock moved', () => {
    live.start();
    let ws = last();
    ws.welcome(true, Date.now() + 3000);
    vi.advanceTimersByTime(0);
    const p = ws.sent.at(-1)!;
    vi.advanceTimersByTime(40);
    ws.recv({ kind: 'pong', c: p.c, t: (p.c as number) + 20 + 3010 });
    expect(live.serverNow() - Date.now()).toBe(3010);
    // the socket drops; the next one's welcome took 60 ms to come: its guess (2950) is no measure, the pings' holds
    ws.drop();
    vi.advanceTimersByTime(1300);
    ws = last();
    expect(FakeWS.all).toHaveLength(2);
    ws.welcome(true, Date.now() + 2950);
    expect(live.serverNow() - Date.now()).toBe(3010);
    // the device's clock set 10 s back while away: the welcome says so, and the pings measure again
    ws.drop();
    vi.advanceTimersByTime(1300);
    last().welcome(true, Date.now() + 13_010);
    expect(live.serverNow() - Date.now()).toBe(13_010);
  });

  it('points at the relay\'s room by default', () => {
    expect(LIVE_URL).toMatch(/^wss:\/\/.+\/room$/);
  });

  it('backoff and offset helpers', () => {
    expect(backoff(0, 0.5)).toBe(1000);
    expect(backoff(3, 0.5)).toBe(8000);
    expect(backoff(20, 0.5)).toBe(15_000); // (on screen only: a game waits at most this for a link back)
    expect(backoff(0, 0)).toBe(750);
    expect(backoff(0, 0.999)).toBe(1250);
    expect(bestOffset([])).toBe(0);
    expect(bestOffset([{ rtt: 90, off: 1 }, { rtt: 30, off: 2 }, { rtt: 60, off: 3 }])).toBe(2);
  });
});

describe('live: the heartbeat (a room that answers it without waking)', () => {
  /** A relay that answers the heartbeat (its fixed reply) and pings. */
  const hbRelay = (ws: FakeWS) => {
    ws.pongs = true;
    const send = ws.send.bind(ws);
    ws.send = (d: string) => {
      send(d);
      if (d === '{"v":3,"kind":"hb"}') ws.onmessage?.({ data: '{"v":3,"kind":"hb","t":0}' });
    };
  };

  it('a quiet socket asks with the heartbeat when the welcome says the room has it; the clock’s timed ping every 5 minutes', async () => {
    live.start();
    const ws = last();
    hbRelay(ws);
    ws.open();
    ws.recv({ kind: 'welcome', me: 'A', peer: true, t: Date.now(), hb: true });
    await vi.advanceTimersByTimeAsync(2100);
    const kinds = () => ws.sent.map((m) => m.kind).filter((k) => k === 'ping' || k === 'hb');
    const k0 = kinds().length;
    await vi.advanceTimersByTimeAsync(10 * 60_000);
    const k = kinds().slice(k0);
    expect(k.filter((x) => x === 'hb').length).toBeGreaterThanOrEqual(25);
    expect(k.filter((x) => x === 'ping')).toHaveLength(2);
    expect(FakeWS.all).toHaveLength(1); // alive all along on the heartbeat's answers
    expect(live.status().connected).toBe(true);
  });

  it('an unanswered heartbeat gives the socket up as a ping would; a room that doesn’t say `hb` gets pings', async () => {
    live.start();
    const ws = last();
    ws.open();
    ws.recv({ kind: 'welcome', me: 'A', peer: true, t: Date.now(), hb: true });
    vi.advanceTimersByTime(2100);
    vi.advanceTimersByTime(20_000);
    expect(ws.sent.at(-1)?.kind).toBe('hb');
    vi.advanceTimersByTime(10_000);
    expect(ws.closed?.code).toBe(4000);
    const ws2 = last();
    ws2.pongs = true;
    ws2.welcome();
    await vi.advanceTimersByTimeAsync(60_000);
    expect(ws2.sent.some((m) => m.kind === 'hb')).toBe(false);
  });
});

describe('live: liveness (a socket open but carrying nothing)', () => {
  const pings = (ws: FakeWS) => ws.sent.filter((m) => m.kind === 'ping').length;

  it('a quiet socket is pinged every 20 s, one only hearing things too; one hearing and sending isn’t', async () => {
    live.start();
    const ws = last();
    ws.welcome();
    ws.pongs = true;
    await vi.advanceTimersByTimeAsync(2100);
    const p0 = pings(ws);
    await vi.advanceTimersByTimeAsync(60_000);
    expect(pings(ws) - p0).toBe(3);
    // the partner walking every 5 s and this phone saying nothing: still asked every 20 s (the room's ghost watch hears
    // a beating phone at least that often); this phone walking every 5 s too: no ping needed
    const p1 = pings(ws);
    for (let i = 0; i < 12; i++) {
      ws.recv({ kind: 'walk', to: [1, 2], who: 'B', t: Date.now() });
      await vi.advanceTimersByTimeAsync(5000);
    }
    expect(pings(ws) - p1).toBe(3);
    const p2 = pings(ws);
    for (let i = 0; i < 12; i++) {
      ws.recv({ kind: 'walk', to: [1, 2], who: 'B', t: Date.now() });
      live.send({ kind: 'walk', to: [3, i] });
      await vi.advanceTimersByTimeAsync(5000);
    }
    expect(pings(ws) - p2).toBe(0);
  });

  it('an idle hour on screen: 3 pings and 3 pongs a minute (was 1 and 1)', async () => {
    live.start();
    const ws = last();
    ws.welcome();
    ws.pongs = true;
    await vi.advanceTimersByTimeAsync(2100);
    const m0 = live.metrics!();
    await vi.advanceTimersByTimeAsync(60 * 60_000);
    const m1 = live.metrics!();
    expect((m1.sent - m0.sent) / 60).toBe(3);
    expect((m1.recv - m0.recv) / 60).toBe(3);
    expect(FakeWS.all).toHaveLength(1);
  });

  it('a ping unanswered for 10 s: the socket is given up (4000) and a new one opened at once, the outbox sent again', () => {
    live.start();
    const ws = last();
    ws.welcome();
    vi.advanceTimersByTime(2100);
    vi.advanceTimersByTime(20_000); // the quiet socket's ping
    expect(FakeWS.all).toHaveLength(1);
    vi.advanceTimersByTime(10_000); // no pong
    expect(ws.closed?.code).toBe(4000);
    expect(FakeWS.all).toHaveLength(2);
    expect(live.status().connected).toBe(false);
    expect(live.metrics!().closed).toBe(4000);
    last().welcome();
    expect(live.status().connected).toBe(true);
  });

  it('a kept intent unacked for 5 s with nothing heard since: the socket is asked, no answer in 5 s more and it is dead, a new one sends it again', () => {
    live.start();
    const ws = last();
    ws.welcome();
    vi.advanceTimersByTime(2100);
    expect(live.send({ kind: 'world', op: 'watered', id: 'fl:1:2' })).toBe(true);
    const c = (ws.sent.at(-1) as { c: number }).c;
    vi.advanceTimersByTime(4900);
    expect(FakeWS.all).toHaveLength(1);
    const n = ws.sent.length;
    vi.advanceTimersByTime(200);
    // overdue: a probe, not a new socket
    expect(ws.sent.length).toBe(n + 1);
    expect(ws.closed).toBeNull();
    vi.advanceTimersByTime(4900);
    expect(ws.closed?.code).toBe(4000);
    const ws2 = last();
    expect(ws2).not.toBe(ws);
    ws2.welcome();
    expect(ws2.sent.find((m) => m.kind === 'world')).toMatchObject({ c });
    ws2.recv({ kind: 'ack', c, t: Date.now(), ok: true });
    expect(live.metrics!().pending).toBe(0);
    ws2.pongs = true;
    vi.advanceTimersByTime(60_000);
    expect(FakeWS.all).toHaveLength(2);
  });

  it('a socket alive but no ack (an older relay dropped it over its limit): sent again on it, 5 s then 10 s', () => {
    live.start();
    const ws = last();
    ws.welcome();
    ws.pongs = true;
    vi.advanceTimersByTime(2100);
    live.send({ kind: 'world', op: 'watered', id: 'fl:1:2' });
    const c = (ws.sent.at(-1) as { c: number }).c;
    const copies = () => ws.sent.filter((m) => m.kind === 'world').length;
    ws.recv({ kind: 'walk', to: [1, 2], who: 'B', t: Date.now() }); // (the socket hears things)
    vi.advanceTimersByTime(5000);
    expect(copies()).toBe(2);
    ws.recv({ kind: 'walk', to: [1, 3], who: 'B', t: Date.now() });
    vi.advanceTimersByTime(9900);
    expect(copies()).toBe(2);
    vi.advanceTimersByTime(200);
    expect(copies()).toBe(3);
    ws.recv({ kind: 'ack', c, t: Date.now(), ok: true });
    vi.advanceTimersByTime(60_000);
    expect(copies()).toBe(3);
    expect(FakeWS.all).toHaveLength(1);
    expect(live.metrics!()).toMatchObject({ pending: 0, resent: 2 });
  });

  it('`busy {c}`: the room turned it away; sent again on the socket after a backoff, kept till acked', () => {
    live.start();
    const ws = last();
    ws.welcome();
    vi.advanceTimersByTime(2100);
    live.send({ kind: 'pick', id: 's9', what: 'shell:conch' });
    const c = (ws.sent.at(-1) as { c: number }).c;
    ws.recv({ kind: 'busy', c, t: Date.now() });
    expect(live.metrics!()).toMatchObject({ busy: 1, pending: 1 });
    vi.advanceTimersByTime(1300); // backoff(0): 750–1250 ms
    expect(ws.sent.filter((m) => m.kind === 'pick')).toHaveLength(2);
    ws.recv({ kind: 'ack', c, t: Date.now(), ok: true });
    expect(live.metrics!().pending).toBe(0);
    expect(FakeWS.all).toHaveLength(1);
  });

  it('back in front (pageshow, focus): a socket that looks open is pinged, and replaced when it doesn’t answer', () => {
    let wake = () => {};
    live = createLive({ url: 'wss://relay.test/room', key: () => key, WebSocket: FakeWS as never, env: { ...env, wake: (fn) => ((wake = fn), () => (wake = () => {})) }, since });
    live.start();
    const ws = last();
    ws.welcome();
    vi.advanceTimersByTime(2100);
    const p = pings(ws);
    wake();
    expect(pings(ws)).toBe(p + 1);
    vi.advanceTimersByTime(10_000);
    expect(ws.closed?.code).toBe(4000);
    expect(FakeWS.all).toHaveLength(2);
    // shown and answering: nothing changes
    const ws2 = last();
    ws2.welcome();
    ws2.pongs = true;
    wake();
    vi.advanceTimersByTime(10_000);
    expect(FakeWS.all).toHaveLength(2);
    live.stop();
  });
});

describe('live: the outbox kept across a kill', () => {
  /** The test's own outbox store (as localStorage would keep it), by key. */
  let disk: Record<string, KeptOut[]>;
  const outbox: OutboxStore = { get: (k) => structuredClone(disk[k ?? ''] ?? []), set: (k, es) => void (disk[k ?? ''] = structuredClone([...es])) };
  const boot = () => createLive({ url: 'wss://relay.test/room', key: () => key, WebSocket: FakeWS as never, env, since, outbox });
  beforeEach(() => {
    disk = {};
  });

  it('an intent made offline survives the app being killed, goes after the next welcome with its number, and leaves once acked', async () => {
    const a = boot();
    a.start();
    online = false;
    fire();
    expect(a.send({ kind: 'world', op: 'watered', id: 'fl:1:2' })).toBe(false);
    expect(a.send({ kind: 'walk', to: [3, 4] })).toBe(false);
    await Promise.resolve();
    expect(disk[KEY].map((e) => (e.m as { kind: string }).kind)).toEqual(['world', 'walk']);
    const c = disk[KEY][0].c;
    // killed: nothing more runs; opened again, online
    a.stop();
    online = true;
    const b = boot();
    expect(b.metrics!().pending).toBe(2);
    b.start();
    last().welcome();
    const sent = last().sent.filter((m) => m.kind === 'world' || m.kind === 'walk') as { c: number }[];
    expect(sent.map((m) => m.c)).toEqual(disk[KEY].map((e) => e.c));
    expect(sent[0].c).toBe(c);
    // a new intent's number comes after the kept ones'
    b.send({ kind: 'world', op: 'watered', id: 'fl:5:6' });
    expect((last().sent.at(-1) as { c: number }).c).toBeGreaterThan(Math.max(...sent.map((m) => m.c)));
    for (const m of last().sent.filter((m) => 'c' in m && m.kind !== 'ping')) last().recv({ kind: 'ack', c: m.c, t: Date.now(), ok: true });
    await Promise.resolve();
    expect(b.metrics!().pending).toBe(0);
    expect(disk[KEY]).toEqual([]);
  });

  it('paired again as someone else (the same page: the backend stops and starts the socket): the last person’s outbox is neither sent nor kept as the new one’s', async () => {
    const a = boot();
    online = false;
    a.start();
    a.send({ kind: 'world', op: 'watered', id: 'fl:1:2' });
    await Promise.resolve();
    a.stop();
    key = 'cd'.repeat(32);
    online = true;
    a.start();
    last().welcome();
    expect(last().sent.some((m) => m.kind === 'world')).toBe(false);
    expect(a.metrics!().pending).toBe(0);
    a.send({ kind: 'world', op: 'watered', id: 'fl:3:4' });
    await Promise.resolve();
    expect(disk[KEY].map((e) => (e.m as { id: string }).id)).toEqual(['fl:1:2']);
    expect(disk[key].map((e) => (e.m as { id: string }).id)).toEqual(['fl:3:4']);
    a.stop();
  });

  it('another key’s outbox (paired as someone else) and another day’s are dropped; at most 120 kept', async () => {
    disk = { [KEY]: [{ c: 5, d: tokyoDay(Date.now()) - 1, m: { v: 3, c: 5, kind: 'world', op: 'watered', id: 'fl:1:1' } }] };
    disk['cd'.repeat(32)] = [{ c: 6, d: tokyoDay(Date.now()), m: { v: 3, c: 6, kind: 'world', op: 'watered', id: 'fl:1:3' } }];
    const a = boot();
    expect(a.metrics!().pending).toBe(1);
    a.start();
    last().welcome();
    expect(last().sent.some((m) => m.kind === 'world')).toBe(false);
    expect(a.metrics!().pending).toBe(0);
    for (let i = 0; i < 130; i++) a.send({ kind: 'world', op: 'watered', id: `fl:${i}:0` });
    await Promise.resolve();
    expect(disk[KEY]).toHaveLength(120);
  });

  it('in localStorage: under the key’s hash (never the key), read back only for that key', async () => {
    const m = new Map<string, string>();
    const kv: KV = { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => void m.set(k, v), removeItem: (k) => void m.delete(k) };
    configureStorage({ local: kv });
    const make = () => createLive({ url: 'wss://relay.test/room', key: () => key, WebSocket: FakeWS as never, env, since });
    online = false;
    make().send({ kind: 'world', op: 'watered', id: 'fl:1:2' });
    await Promise.resolve();
    const raw = m.get('island.liveOutbox')!;
    expect(raw).not.toContain(KEY);
    expect(JSON.parse(raw).es).toHaveLength(1);
    expect(make().metrics!().pending).toBe(1);
    key = 'cd'.repeat(32);
    expect(make().metrics!().pending).toBe(0);
    configureStorage({ local: null });
  });
});

describe('live: the relay clock kept across reloads', () => {
  it('a reload starts from the offset last measured: what it stamps before the welcome is on the relay’s clock', () => {
    const m = new Map<string, string>();
    configureStorage({ local: { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => void m.set(k, v), removeItem: (k) => void m.delete(k) } });
    const a = createLive({ url: 'wss://relay.test/room', key: () => key, WebSocket: FakeWS as never, env, since });
    expect(a.serverNow() - Date.now()).toBe(0);
    a.start();
    // this phone's clock runs an hour fast: the relay's is an hour behind it
    last().welcome(true, Date.now() - 3_600_000);
    expect(a.serverNow() - Date.now()).toBe(-3_600_000);
    a.stop();
    // opened again, offline: before any welcome, the relay's clock as last measured
    online = false;
    const b = createLive({ url: 'wss://relay.test/room', key: () => key, WebSocket: FakeWS as never, env, since });
    expect(b.serverNow() - Date.now()).toBe(-3_600_000);
    // nonsense kept (more than a day): none
    m.set('island.liveOffset', JSON.stringify({ off: 9e12 }));
    expect(createLive({ url: 'wss://relay.test/room', key: () => key, WebSocket: FakeWS as never, env, since }).serverNow() - Date.now()).toBe(0);
    configureStorage({ local: null });
  });
});


describe('live: the socket’s buffer (an editor’s big save in one go)', () => {
  const op = (i: number) => ({ kind: 'decor', sc: 'o', id: `o${i}abcdef`, at: 1_790_000_000_000 + i, k: 'flower-tulip', x: 10 + (i % 20), z: 20, f: 0 }) as never;

  it('what the buffer turned away goes as it drains, in order, never taken for a dead socket', () => {
    live.start();
    const ws = last();
    ws.grows = true;
    ws.pongs = true;
    ws.welcome();
    vi.advanceTimersByTime(2100);
    const n0 = ws.sent.length;
    const went = Array.from({ length: 40 }, (_, i) => live.send(op(i)));
    expect(went.every(Boolean)).toBe(true);
    // (a browser's buffer grows inside send(): past 4 KB in the loop, the rest wait)
    const first = ws.sent.length - n0;
    expect(first).toBeLessThan(40);
    expect(live.metrics!().held).toBe(40 - first);
    vi.advanceTimersByTime(1000);
    const ops = ws.sent.slice(n0).filter((m) => m.kind === 'decor') as { id: string; c: number }[];
    expect(ops.map((m) => m.id)).toEqual(Array.from({ length: 40 }, (_, i) => `o${i}abcdef`));
    expect(live.metrics!().held).toBe(0);
    for (const m of ops) ws.recv({ kind: 'ack', c: m.c, t: Date.now(), ok: true });
    expect(live.metrics!().pending).toBe(0);
    vi.advanceTimersByTime(60_000);
    expect(FakeWS.all).toHaveLength(1);
  });

  it('a catch made while the save waits goes after it, and a full outbox lets layout ops go before a catch', async () => {
    live.start();
    const ws = last();
    ws.grows = true;
    ws.welcome();
    vi.advanceTimersByTime(2100);
    const n0 = ws.sent.length;
    for (let i = 0; i < 40; i++) live.send(op(i));
    live.send({ kind: 'catch', what: 'koi', id: 'k1', how: 'rod' });
    vi.advanceTimersByTime(500);
    expect((ws.sent.slice(n0).at(-1) as { kind: string }).kind).toBe('catch');
    // a save of 130 more with the catch unacked: the catch stays
    for (let i = 40; i < 170; i++) live.send(op(i));
    expect(live.metrics!().pending).toBe(120);
    vi.advanceTimersByTime(2000);
    const c = (ws.sent.find((m) => m.kind === 'catch') as { c: number }).c;
    ws.recv({ kind: 'ack', c, t: Date.now(), ok: true });
    expect(live.metrics!().pending).toBe(119);
  });
});

describe('live: an intent never acked (a relay that drops it without a word)', () => {
  it('on a socket that answers: sent again on it, the wait doubling, then dropped after 4 tries (`ws.unacked`); never a reconnect loop', () => {
    live.start();
    const ws = last();
    ws.welcome();
    ws.pongs = true;
    vi.advanceTimersByTime(2100);
    live.send({ kind: 'world', op: 'watered', id: 'fl:1:2' });
    vi.advanceTimersByTime(5 * 60_000);
    expect(FakeWS.all).toHaveLength(1);
    expect(ws.sent.filter((m) => m.kind === 'world')).toHaveLength(4);
    expect(live.metrics!()).toMatchObject({ pending: 0, unacked: 1, closed: 0 });
  });

  it('its tries are kept across a reload: one tried 3 times before goes once more, then it is dropped', async () => {
    let disk: KeptOut[] = [{ c: 5, d: tokyoDay(Date.now()), n: 3, m: { v: 3, c: 5, kind: 'world', op: 'watered', id: 'fl:1:1' } }];
    const outbox: OutboxStore = { get: () => structuredClone(disk), set: (_k, es) => void (disk = structuredClone([...es])) };
    const a = createLive({ url: 'wss://relay.test/room', key: () => key, WebSocket: FakeWS as never, env, since, outbox });
    a.start();
    last().welcome();
    last().pongs = true;
    vi.advanceTimersByTime(6000);
    await Promise.resolve();
    expect(last().sent.filter((m) => m.kind === 'world')).toHaveLength(1);
    expect(a.metrics!()).toMatchObject({ pending: 0, unacked: 1 });
    expect(disk).toEqual([]);
    a.stop();
  });

  it('a refused one (`ack ok:false`: a claim already made) is told with the intent as sent', () => {
    const refused: unknown[] = [];
    live.onAck!((i, ok) => !ok && refused.push(i));
    live.start();
    last().welcome();
    live.send({ kind: 'catch', what: 'koi', id: 'k9', how: 'rod' });
    const c = (last().sent.at(-1) as { c: number }).c;
    last().recv({ kind: 'ack', c, t: Date.now(), ok: false });
    expect(refused).toEqual([expect.objectContaining({ kind: 'catch', id: 'k9', c })]);
    expect(live.metrics!().pending).toBe(0);
  });
});

describe('live: a socket whose welcome never comes', () => {
  it('dropped 10 s after it was made and another opened after the backoff; one stuck opening is replaced when the app is back', () => {
    let wake = () => {};
    live = createLive({ url: 'wss://relay.test/room', key: () => key, WebSocket: FakeWS as never, env: { ...env, wake: (fn) => ((wake = fn), () => (wake = () => {})) }, since });
    live.start();
    const ws = last();
    ws.open(); // its hello goes, nothing comes back
    vi.advanceTimersByTime(9900);
    expect(FakeWS.all).toHaveLength(1);
    vi.advanceTimersByTime(200);
    expect(ws.closed?.code).toBe(4010);
    expect(live.metrics!().closed).toBe(4010);
    vi.advanceTimersByTime(1300);
    expect(FakeWS.all).toHaveLength(2);
    // this one never even opens (frozen in the background); back in front 5 s on: a new one at once
    vi.advanceTimersByTime(5000);
    wake();
    expect(FakeWS.all).toHaveLength(3);
    expect(FakeWS.all[1].closed?.code).toBe(4010);
    last().welcome();
    expect(live.status().connected).toBe(true);
    last().pongs = true;
    vi.advanceTimersByTime(60_000);
    expect(FakeWS.all).toHaveLength(3);
  });
});

describe('live: two tabs, one stored outbox', () => {
  let disk: KeptOut[];
  /** One tab's view of the stored outbox: another tab's write is told to it a task later (the `storage` event). */
  const tabs = new Set<() => void>();
  const store = (events: boolean): OutboxStore => {
    let mine: (() => void) | null = null;
    return {
      get: () => structuredClone(disk),
      set: (_k, es) => {
        disk = structuredClone([...es]);
        for (const f of tabs) if (f !== mine) setTimeout(f, 0);
      },
      ...(events ? { watch: (fn: () => void) => (tabs.add((mine = fn)), () => void tabs.delete(fn)) } : {})
    };
  };
  const boot = (s: OutboxStore) => createLive({ url: 'wss://relay.test/room', key: () => key, WebSocket: FakeWS as never, env, since, outbox: s });
  beforeEach(() => {
    disk = [];
    tabs.clear();
  });

  it('neither tab’s write drops the other’s entries (no event heard between them)', async () => {
    online = false;
    const a = boot(store(false)), b = boot(store(false));
    a.start();
    b.start();
    a.send({ kind: 'world', op: 'watered', id: 'fl:1:1' });
    await Promise.resolve();
    vi.advanceTimersByTime(1); // (another ms: two tabs number by the clock)
    b.send({ kind: 'world', op: 'watered', id: 'fl:2:2' });
    await Promise.resolve();
    expect(disk.map((e) => (e.m as { id: string }).id).sort()).toEqual(['fl:1:1', 'fl:2:2']);
    a.stop();
    b.stop();
  });

  it('what one tab kept, the other sends on its socket; acked there, it leaves the first tab too', async () => {
    online = false;
    const a = boot(store(true)), b = boot(store(true));
    a.start();
    b.start();
    a.send({ kind: 'world', op: 'watered', id: 'fl:1:1' });
    await vi.advanceTimersByTimeAsync(10);
    expect(b.metrics!().pending).toBe(1);
    // b comes online (a's socket was replaced by b's: a stays as it is, hearing nothing of the network)
    online = true;
    fire();
    last().welcome();
    const w = last().sent.find((m) => m.kind === 'world') as { c: number; id: string };
    expect(w.id).toBe('fl:1:1');
    last().recv({ kind: 'ack', c: w.c, t: Date.now(), ok: true });
    await vi.advanceTimersByTimeAsync(10);
    expect(disk).toEqual([]);
    expect(a.metrics!().pending).toBe(0);
    a.stop();
    b.stop();
  });
});

describe('live: the kept relay clock goes stale', () => {
  it('trusted for 6 hours after it was measured, and never once the device’s clock went back past it', () => {
    const m = new Map<string, string>();
    configureStorage({ local: { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => void m.set(k, v), removeItem: (k) => void m.delete(k) } });
    const make = () => createLive({ url: 'wss://relay.test/room', key: () => key, WebSocket: FakeWS as never, env, since });
    const a = make();
    a.start();
    last().welcome(true, Date.now() - 3_600_000);
    a.stop();
    online = false;
    vi.setSystemTime(Date.now() + 5 * 3_600_000);
    expect(make().serverNow() - Date.now()).toBe(-3_600_000);
    vi.setSystemTime(Date.now() + 2 * 3_600_000);
    expect(make().serverNow() - Date.now()).toBe(0);
    // measured "in the future" (the clock was set back since): not trusted
    m.set('island.liveOffset', JSON.stringify({ off: -3_600_000, at: Date.now() + 60_000 }));
    expect(make().serverNow() - Date.now()).toBe(0);
    configureStorage({ local: null });
  });
});

describe('live: the room’s admission ticket', () => {
  let m: Map<string, string>;
  beforeEach(() => {
    m = new Map();
    configureStorage({ local: { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => void m.set(k, v), removeItem: (k) => void m.delete(k) } });
  });
  afterEach(() => configureStorage({ local: null }));
  const ticketed = () => createLive({ url: 'wss://relay.test/room', key: () => key, me: () => 'A', WebSocket: FakeWS as never, env, since });
  const made = async (n: number) => vi.waitFor(() => expect(FakeWS.all).toHaveLength(n));

  it('each socket offers a fresh ticket the relay’s check takes (the person’s, on the relay’s clock), its hello the same key', async () => {
    const a = ticketed();
    a.start();
    await made(1);
    const [proto, t] = last().protocols!;
    expect(proto).toBe(ROOM_PROTOCOL);
    expect(await ticketOwner(t, { KEY_A: KEY }, Date.now())).toBe('A');
    expect(await ticketOwner(t, { KEY_A: 'cd'.repeat(32) }, Date.now())).toBeNull();
    last().open();
    expect(last().sent[0]).toMatchObject({ kind: 'hello', key: KEY, beat: true });
    last().recv({ kind: 'welcome', me: 'A', peer: false, t: Date.now() });
    last().drop(1012);
    await vi.advanceTimersByTimeAsync(1300);
    await made(2);
    expect(last().protocols![1]).not.toBe(t);
    a.stop();
  });

  it('two ticketed handshakes failing (a relay that can’t take one): the next goes without, for 6 hours, a reload too', async () => {
    const a = ticketed();
    a.start();
    await made(1);
    last().drop(1006); // refused before it opened
    await vi.advanceTimersByTimeAsync(1300);
    await made(2);
    expect(last().protocols).toHaveLength(2);
    last().drop(1006);
    await vi.advanceTimersByTimeAsync(2600);
    await made(3);
    expect(last().protocols).toBeUndefined();
    last().welcome();
    expect(a.status().connected).toBe(true);
    a.stop();
    const b = ticketed();
    b.start();
    await made(4);
    expect(last().protocols).toBeUndefined();
    b.stop();
    // past the 6 hours: tickets again
    vi.setSystemTime(Date.now() + 6 * 3_600_000 + 1);
    const c = ticketed();
    c.start();
    await made(5);
    expect(last().protocols).toHaveLength(2);
    c.stop();
  });

  it('none without knowing whose key it is (the demo’s test relays)', () => {
    live.start();
    expect(last().protocols).toBeUndefined();
  });
});

describe('live: why a socket ended (the log’s ws.close)', () => {
  beforeEach(() => vi.mocked(log).mockClear());

  it('hidden, closed from the other end, found dead: once each, with how long it heard nothing and its best round trip', () => {
    live.start();
    let ws = last();
    ws.welcome();
    vi.advanceTimersByTime(0);
    const p = ws.sent.at(-1)!;
    vi.advanceTimersByTime(80);
    ws.recv({ kind: 'pong', c: p.c, t: Date.now() });
    vi.advanceTimersByTime(1000);
    visible = false;
    fire();
    // (the welcome said here, not as a ws.open of its own: a first try's; its protocol, ms and tries)
    expect(closes()).toEqual([{ code: 1000, secs: 1, welcomed: true, why: 'hidden', quiet: 1, rtt: 80, v: LIVE_V, openMs: 0, retries: 0 }]);
    expect(vi.mocked(log).mock.calls.filter((c) => c[0] === 'ws.open')).toEqual([]);
    // shown again; the network drops it
    visible = true;
    fire();
    ws = last();
    ws.welcome();
    ws.drop(1006);
    expect(closes().at(-1)).toMatchObject({ code: 1006, welcomed: true, why: 'closed' });
    // a socket that stops answering: given up on (4000), logged once
    vi.advanceTimersByTime(1300);
    last().welcome();
    vi.advanceTimersByTime(2100 + 20_000 + 10_000);
    expect(closes().filter((c) => c?.why === 'stale')).toEqual([expect.objectContaining({ code: 4000, welcomed: true })]);
    expect(closes()).toHaveLength(3);
  });
});
