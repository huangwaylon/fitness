import { beforeEach, describe, expect, it } from 'vitest';
import { CLOSE, type ServerMsg } from '../../app/src/lib/sync/live-protocol.ts';
import { HELLO_MS, MAX_SOCKETS, RING_AGE_MS, RING_MAX, RoomCore, type Meta, type RoomIO } from '../src/room.ts';

const KEY_A = 'a1'.repeat(16);
const KEY_B = 'b2'.repeat(16);

class FakeSock {
  sent: ServerMsg[] = [];
  closed: { code?: number; reason?: string } | null = null;
  meta: Meta | null = null;
  send(d: string) {
    if (this.closed) throw new Error('closed');
    this.sent.push(JSON.parse(d));
  }
  close(code?: number, reason?: string) {
    this.closed = { code, reason };
  }
  kinds() {
    return this.sent.map((m) => m.kind);
  }
}

let now = 1_000_000;
let socks: FakeSock[];
let saved: unknown[];
let room: RoomCore<FakeSock>;

function io(): RoomIO<FakeSock> {
  return {
    sockets: () => socks.filter((s) => !s.closed),
    meta: (s) => s.meta,
    setMeta: (s, m) => void (s.meta = m),
    keys: { KEY_A, KEY_B },
    now: () => now,
    save: (r) => void saved.push(structuredClone(r))
  };
}

function join(key?: string, since?: number): FakeSock {
  const s = new FakeSock();
  socks.push(s);
  room.open(s);
  if (key) room.message(s, JSON.stringify({ v: 1, kind: 'hello', key, ...(since !== undefined ? { since } : {}) }));
  return s;
}

const say = (s: FakeSock, m: object) => room.message(s, JSON.stringify({ v: 1, ...m }));

beforeEach(() => {
  now = 1_000_000;
  socks = [];
  saved = [];
  room = new RoomCore(io());
});

describe('the island room', () => {
  it('welcomes a known key, says whether the partner is here and tells the partner', () => {
    const a = join(KEY_A);
    expect(a.sent).toEqual([{ v: 1, kind: 'welcome', me: 'A', peer: false, t: now }]);
    const b = join(KEY_B);
    expect(b.sent[0]).toMatchObject({ kind: 'welcome', me: 'B', peer: true });
    expect(a.sent.at(-1)).toEqual({ v: 1, kind: 'presence', who: 'B', on: true, t: now });
  });

  it('closes an unknown key, and anything before hello', () => {
    const x = join('c3'.repeat(16));
    expect(x.closed?.code).toBe(CLOSE.unauthorized);
    const y = join();
    say(y, { kind: 'emote', emote: 'glee' });
    expect(y.closed?.code).toBe(CLOSE.unauthorized);
    const z = join();
    room.message(z, 'not json');
    expect(z.closed?.code).toBe(CLOSE.unauthorized);
  });

  it('relays an intent to the other person only, stamped with who and the relay clock', () => {
    const a = join(KEY_A);
    const b = join(KEY_B);
    a.sent = [];
    b.sent = [];
    now += 5;
    say(a, { kind: 'walk', to: [120, 340], who: 'B', t: 1 });
    expect(b.sent).toEqual([{ v: 1, kind: 'walk', to: [120, 340], who: 'A', t: now }]);
    expect(a.sent).toEqual([]);
  });

  it('drops a malformed intent from a known person without closing', () => {
    const a = join(KEY_A);
    const b = join(KEY_B);
    b.sent = [];
    say(a, { kind: 'act', act: 'explode' });
    expect(b.sent).toEqual([]);
    expect(a.closed).toBeNull();
  });

  it('closes a client speaking a protocol version it doesn’t know', () => {
    const a = join(KEY_A);
    room.message(a, JSON.stringify({ v: 3, kind: 'walk', to: 'x' }));
    expect(a.closed?.code).toBe(CLOSE.version);
  });

  it('answers a ping with the relay time, to the sender only', () => {
    const a = join(KEY_A);
    const b = join(KEY_B);
    b.sent = [];
    say(a, { kind: 'ping', c: 42 });
    expect(a.sent.at(-1)).toEqual({ v: 1, kind: 'pong', c: 42, t: now });
    expect(b.sent).toEqual([]);
  });

  it('is a no-op when the partner is away (world events are still kept)', () => {
    const a = join(KEY_A);
    say(a, { kind: 'emote', emote: 'glee' });
    say(a, { kind: 'world', op: 'weed-pulled', id: 'w3' });
    expect(a.sent.map((m) => m.kind)).toEqual(['welcome']);
    expect(saved).toHaveLength(1);
  });

  it('rate-limits a connection to a burst of 20 and drops the rest', () => {
    const a = join(KEY_A);
    const b = join(KEY_B);
    b.sent = [];
    for (let i = 0; i < 40; i++) say(a, { kind: 'emote', emote: 'glee' });
    expect(b.sent).toHaveLength(19); // the hello spent one token
    now += 1000;
    for (let i = 0; i < 40; i++) say(a, { kind: 'emote', emote: 'glee' });
    expect(b.sent).toHaveLength(39);
    expect(a.closed).toBeNull();
  });

  it('replays the partner\'s world events after `since` to a reconnecting phone, in order, never its own', () => {
    const a = join(KEY_A);
    const b = join(KEY_B);
    say(a, { kind: 'world', op: 'weed-pulled', id: 'w1' });
    const t1 = (b.sent.at(-1) as { t: number }).t;
    say(a, { kind: 'world', op: 'dug', id: 'd2' }); // same ms: still a later t
    say(b, { kind: 'world', op: 'fruit-collected', id: 'f1' });
    say(a, { kind: 'walk', to: 'shoreC' }); // not a world event: not kept
    b.close();
    room.close(b);
    const b2 = join(KEY_B, t1);
    expect(b2.sent.map((m) => m.kind)).toEqual(['welcome', 'world']);
    expect(b2.sent[1]).toMatchObject({ op: 'dug', id: 'd2', who: 'A' });
    expect((b2.sent[1] as { t: number }).t).toBeGreaterThan(t1);
    const b3 = join(KEY_B); // no since: nothing replayed
    expect(b3.kinds()).toEqual(['welcome']);
  });

  it('keeps the last 50 world events, none older than 6 h, across a restart', () => {
    const a = join(KEY_A);
    for (let i = 0; i < 60; i++) {
      now += 100;
      say(a, { kind: 'world', op: 'weed-pulled', id: `w${i}` });
    }
    const ring = saved.at(-1) as { id: string; t: number }[];
    expect(ring).toHaveLength(RING_MAX);
    expect(ring[0].id).toBe('w10');
    // a hibernation wake rebuilds the room from storage
    room = new RoomCore(io(), saved.at(-1) as never);
    now = ring[0].t + RING_AGE_MS;
    const b = join(KEY_B, 0);
    expect(b.sent.filter((m) => m.kind === 'world')).toHaveLength(50);
    now = ring.at(-1)!.t + RING_AGE_MS + 1;
    const b2 = join(KEY_B, 0);
    expect(b2.sent.filter((m) => m.kind === 'world')).toHaveLength(0);
  });

  it('a second connection of the same person replaces the first, without a presence flicker', () => {
    const a = join(KEY_A);
    const b = join(KEY_B);
    b.sent = [];
    const a2 = join(KEY_A);
    expect(a.closed?.code).toBe(CLOSE.replaced);
    room.close(a); // its close event arrives later
    expect(b.sent).toEqual([]);
    expect(a2.sent[0]).toMatchObject({ kind: 'welcome', me: 'A', peer: true });
    say(b, { kind: 'emote', emote: 'glee' });
    expect(a2.sent.at(-1)).toMatchObject({ kind: 'emote', who: 'B' });
  });

  it('tells the partner when the last socket of a person closes', () => {
    const a = join(KEY_A);
    const b = join(KEY_B);
    a.sent = [];
    b.close();
    room.close(b);
    expect(a.sent).toEqual([{ v: 1, kind: 'presence', who: 'B', on: false, t: now }]);
    room.close(b); // a repeated close says nothing more
    expect(a.sent).toHaveLength(1);
  });

  it('closes sockets that never say hello within 10 s and says when to look again', () => {
    const quiet = join();
    now += 4000;
    const later = join();
    const a = join(KEY_A);
    expect(room.sweep()).toBe(now - 4000 + HELLO_MS);
    now += HELLO_MS - 4000;
    expect(room.sweep()).toBe(now + 4000);
    expect(quiet.closed?.code).toBe(CLOSE.timeout);
    expect(later.closed).toBeNull();
    now += 4000;
    expect(room.sweep()).toBeNull();
    expect(later.closed?.code).toBe(CLOSE.timeout);
    expect(a.closed).toBeNull();
  });

  it('relays a saved nudge to the partner only', () => {
    const a = join(KEY_A);
    const b = join(KEY_B);
    a.sent = [];
    say(b, { kind: 'saved' });
    expect(a.sent).toEqual([{ v: 1, kind: 'saved', who: 'B', t: now }]);
    expect(b.kinds()).toEqual(['welcome']);
  });

  it('passes a sheet change to every connected person, the writer too, never to a socket before its hello', () => {
    const a = join(KEY_A);
    const b = join(KEY_B);
    const quiet = join();
    a.sent = [];
    b.sent = [];
    const n = { what: 'ingest', who: 'A', at: '2026-11-01T01:02:03.456Z', rev: 'r1' } as const;
    expect(room.notify(n)).toBe(2);
    const m = { v: 1, kind: 'changed', ...n, t: now };
    expect(a.sent).toEqual([m]);
    expect(b.sent).toEqual([m]);
    expect(quiet.sent).toEqual([]);
    a.close();
    room.close(a);
    b.close();
    room.close(b);
    expect(room.notify(n)).toBe(0); // nobody there: a no-op
  });

  it('holds at most 8 sockets', () => {
    for (let i = 0; i < MAX_SOCKETS; i++) join();
    expect(room.roomFor()).toBe(false);
    now += HELLO_MS;
    expect(room.roomFor()).toBe(true); // the silent ones were swept
  });
});

describe('two protocol versions (v2: the rolling-log world)', () => {
  const join2 = (key: string) => {
    const s = new FakeSock();
    socks.push(s);
    room.open(s);
    room.message(s, JSON.stringify({ v: 2, kind: 'hello', key }));
    return s;
  };
  const say2 = (s: FakeSock, m: object) => room.message(s, JSON.stringify({ v: 2, ...m }));

  it('answers each phone in its own version', () => {
    const a = join2(KEY_A);
    expect(a.sent).toEqual([{ v: 2, kind: 'welcome', me: 'A', peer: false, t: now }]);
    const b = join(KEY_B);
    expect(b.sent[0]).toMatchObject({ v: 1, kind: 'welcome', peer: true });
    expect(a.sent.at(-1)).toEqual({ v: 2, kind: 'presence', who: 'B', on: true, t: now });
    expect(room.notify({ what: 'event', who: 'B', at: '2026-11-01T00:00:00.000Z', rev: 'r1' })).toBe(2);
    expect(a.sent.at(-1)).toMatchObject({ v: 2, kind: 'changed' });
    expect(b.sent.at(-1)).toMatchObject({ v: 1, kind: 'changed' });
  });

  it('a walk (world units in v2, stage units in v1) reaches only the same version; everything else crosses', () => {
    const a = join2(KEY_A);
    const b1 = join(KEY_B);
    a.sent = [];
    b1.sent = [];
    say2(a, { kind: 'walk', to: [195, 900] });
    expect(b1.sent).toEqual([]);
    say2(a, { kind: 'emote', emote: 'glee' });
    expect(b1.sent).toEqual([{ v: 1, kind: 'emote', emote: 'glee', who: 'A', t: expect.any(Number) }]);
    say(b1, { kind: 'walk', to: [120, 340] });
    expect(a.sent).toEqual([]);
    const b2 = join2(KEY_B); // the partner's phone reloads into v2 (replacing its v1 socket)
    a.sent = [];
    say2(b2, { kind: 'walk', to: [195, 900] });
    expect(a.sent).toEqual([{ v: 2, kind: 'walk', to: [195, 900], who: 'B', t: expect.any(Number) }]);
  });

  it('closes an unknown version before or after the hello with a reason that says so, and a switch mid-socket', () => {
    const x = new FakeSock();
    socks.push(x);
    room.open(x);
    room.message(x, JSON.stringify({ v: 3, kind: 'hello', key: KEY_A }));
    expect(x.closed).toEqual({ code: CLOSE.version, reason: 'protocol version 3 unsupported (relay speaks 1, 2)' });
    const a = join(KEY_A);
    say(a, { kind: 'emote', emote: 'glee', v: 2 }); // spoke v1 in its hello
    expect(a.closed?.code).toBe(CLOSE.version);
    const b = join2(KEY_B);
    room.message(b, JSON.stringify({ v: 1, kind: 'hello', key: KEY_B }));
    expect(b.closed?.code).toBe(CLOSE.version);
  });

  it('relays v2 walks only to points within the world plan', () => {
    const a = join2(KEY_A);
    const b = join2(KEY_B);
    b.sent = [];
    say2(a, { kind: 'walk', to: [-230, 2500] });
    say2(a, { kind: 'walk', to: 'bridgeStoneN' });
    say2(a, { kind: 'walk', to: [621, 0] });
    say2(a, { kind: 'walk', to: [0, -401] });
    say2(a, { kind: 'walk', to: [1.5, 2] });
    expect(b.sent.map((m) => (m as { to: unknown }).to)).toEqual([[-230, 2500], 'bridgeStoneN']);
    expect(a.closed).toBeNull();
  });
});
