import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LIVE_URL, backoff, bestOffset, createLive, type Live, type LiveEnv, type LiveStatus } from './live.ts';
import type { Relayed } from './live-protocol.ts';

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
    this.onmessage?.({ data: JSON.stringify({ v: 2, ...m }) });
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

function make(url = 'wss://relay.test/room'): Live {
  return createLive({ url, key: () => key, WebSocket: FakeWS as never, env });
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(1_790_000_000_000);
  FakeWS.all = [];
  visible = true;
  online = true;
  key = KEY;
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
    expect(last().sent[0]).toEqual({ v: 2, kind: 'hello', key: KEY });
    last().recv({ kind: 'welcome', me: 'A', peer: false, t: Date.now() });
    expect(live.status()).toEqual({ connected: true, me: 'A', peer: false });
    expect(seen.at(-1)).toEqual({ connected: true, me: 'A', peer: false });
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
  it('sends intents only while the partner is there, world ops whenever connected', () => {
    live.start();
    expect(live.send({ kind: 'emote', emote: 'glee' })).toBe(false); // not connected
    last().welcome(false);
    expect(live.send({ kind: 'walk', to: [10, 20] })).toBe(false); // partner away
    expect(live.send({ kind: 'world', op: 'weed-pulled', id: 'w1' })).toBe(true); // kept for their reconnect
    last().recv({ kind: 'presence', who: 'B', on: true, t: Date.now() });
    expect(live.status().peer).toBe(true);
    expect(live.send({ kind: 'walk', to: [10, 20] })).toBe(true);
    expect(last().sent.slice(1)).toEqual([
      { v: 2, kind: 'world', op: 'weed-pulled', id: 'w1' },
      { v: 2, kind: 'walk', to: [10, 20] }
    ]);
    last().recv({ kind: 'presence', who: 'B', on: false, t: Date.now() });
    expect(live.send({ kind: 'walk', to: [10, 20] })).toBe(false);
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
    expect(got).toEqual([{ v: 2, kind: 'act', act: 'shake', id: 't2', who: 'B', t: 5 }]);
    expect(err).toHaveBeenCalled();
    off();
    last().recv({ kind: 'emote', emote: 'glee', who: 'B', t: 8 });
    expect(got).toHaveLength(1);
  });

  it('asks for the world ops it missed since the last one it saw', () => {
    live.start();
    last().welcome();
    last().recv({ kind: 'world', op: 'dug', id: 'd1', who: 'B', t: 1_790_000_000_500 });
    last().drop();
    vi.advanceTimersByTime(2000);
    last().open();
    expect(last().sent[0]).toEqual({ v: 2, kind: 'hello', key: KEY, since: 1_790_000_000_500 });
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
    expect(last().sent.at(-1)).toEqual({ v: 2, kind: 'saved' });
    off();
    last().recv({ kind: 'changed', ...n, t: 8 });
    expect(changes).toHaveLength(2);
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
