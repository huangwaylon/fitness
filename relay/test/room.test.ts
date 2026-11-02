import { beforeEach, describe, expect, it } from 'vitest';
import { CLOSE, type ServerMsg } from '../../app/src/lib/sync/live-protocol.ts';
import { HELLO_MS, MAX_SOCKETS, RING_MAX, RoomCore, type Held, type Meta, type RoomIO } from '../src/room.ts';

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
let held: Held = {};
let room: RoomCore<FakeSock>;

function io(): RoomIO<FakeSock> {
  return {
    sockets: () => socks.filter((s) => !s.closed),
    meta: (s) => s.meta,
    setMeta: (s, m) => void (s.meta = m),
    keys: { KEY_A, KEY_B },
    now: () => now,
    save: (r) => void saved.push(structuredClone(r)),
    hold: (h) => void (held = structuredClone(h))
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
  held = {};
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
    say(a, { kind: 'walk', to: 'shoreC' }); // a v1 walk (stage units): not kept
    b.close();
    room.close(b);
    const b2 = join(KEY_B, t1);
    expect(b2.sent.map((m) => m.kind)).toEqual(['welcome', 'world']);
    expect(b2.sent[1]).toMatchObject({ op: 'dug', id: 'd2', who: 'A' });
    expect((b2.sent[1] as { t: number }).t).toBeGreaterThan(t1);
    const b3 = join(KEY_B); // no since: nothing replayed
    expect(b3.kinds()).toEqual(['welcome']);
  });

  it('keeps today’s last 400 world events (Tokyo’s day), across a restart', () => {
    const a = join(KEY_A);
    for (let i = 0; i < RING_MAX + 10; i++) {
      now += 100;
      say(a, { kind: 'world', op: 'weed-pulled', id: `w${i}` });
    }
    const ring = saved.at(-1) as { id: string; t: number }[];
    expect(ring).toHaveLength(RING_MAX);
    expect(ring[0].id).toBe('w10');
    // a hibernation wake rebuilds the room from storage
    room = new RoomCore(io(), saved.at(-1) as never);
    const b = join(KEY_B, 0);
    expect(b.sent.filter((m) => m.kind === 'world')).toHaveLength(RING_MAX);
    // Tokyo midnight: a new day's world starts empty (1970-01-01 15:00 UTC)
    now = 15 * 3600_000;
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

  it('keeps when each person left, for the welcome (v3): the partner gone, my own last socket; back, forgotten', () => {
    const gone: unknown[] = [];
    room = new RoomCore({ ...io(), saveGone: (g) => void gone.push(structuredClone(g)) });
    const join3 = (key: string) => {
      const s = new FakeSock();
      socks.push(s);
      room.open(s);
      room.message(s, JSON.stringify({ v: 3, kind: 'hello', key }));
      return s;
    };
    const a = join3(KEY_A);
    expect(a.sent[0]).not.toHaveProperty('gone');
    const b = join3(KEY_B);
    const left = now;
    b.close();
    room.close(b);
    expect(a.sent.at(-1)).toEqual({ v: 3, kind: 'presence', who: 'B', on: false, t: left });
    expect(gone.at(-1)).toEqual({ B: left });
    now += 60_000;
    a.close();
    room.close(a);
    now += 60_000;
    // a phone opening later hears when B left; A's own phone, when its last socket did
    const a2 = join3(KEY_A);
    expect(a2.sent[0]).toMatchObject({ kind: 'welcome', here: [], gone: { A: left + 60_000, B: left } });
    expect(gone.at(-1)).toEqual({ B: left });
    // the Durable Object woke again: the same
    room = new RoomCore(io(), [], null, {}, gone.at(-1) as never);
    socks = [];
    const b2 = join3(KEY_B);
    expect(b2.sent[0]).toMatchObject({ kind: 'welcome', gone: { B: left } });
    const a3 = join3(KEY_A);
    expect(a3.sent[0]).toMatchObject({ kind: 'welcome', here: ['B'] });
    expect(a3.sent[0]).not.toHaveProperty('gone');
    // a v1 or v2 phone hears no `gone`
    b2.close();
    room.close(b2);
    const a1 = join(KEY_A);
    expect(a1.sent[0]).not.toHaveProperty('gone');
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

  it('a welcome carries the record’s last change it heard of (kept across restarts), so a phone that has it needn’t fetch', () => {
    const marks: unknown[] = [];
    room = new RoomCore({ ...io(), saveRec: (r) => void marks.push(r) });
    expect(join(KEY_A).sent[0]).not.toHaveProperty('rec');
    room.notify({ what: 'ingest', who: 'A', at: '2026-11-01T01:02:03.456Z', rev: 'e1' });
    room.notify({ what: 'event', who: 'B', at: '2026-11-01T01:00:00.000Z', rev: 'e1' }); // an older copy, late
    expect(marks).toEqual([{ at: '2026-11-01T01:02:03.456Z', rev: 'e1' }]);
    expect(join(KEY_B).sent[0]).toEqual({ v: 1, kind: 'welcome', me: 'B', peer: true, t: now, rec: { at: '2026-11-01T01:02:03.456Z', rev: 'e1' } });
    room = new RoomCore(io(), [], { at: '2026-11-01T01:02:03.456Z', rev: 'e1' });
    socks = [];
    expect(join(KEY_A).sent[0]).toMatchObject({ kind: 'welcome', rec: { at: '2026-11-01T01:02:03.456Z', rev: 'e1' } });
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
    room.message(x, JSON.stringify({ v: 4, kind: 'hello', key: KEY_A }));
    expect(x.closed).toEqual({ code: CLOSE.version, reason: 'protocol version 4 unsupported (relay speaks 1, 2, 3)' });
    const a = join(KEY_A);
    say(a, { kind: 'emote', emote: 'glee', v: 2 }); // spoke v1 in its hello
    expect(a.closed?.code).toBe(CLOSE.version);
    const b = join2(KEY_B);
    room.message(b, JSON.stringify({ v: 1, kind: 'hello', key: KEY_B }));
    expect(b.closed?.code).toBe(CLOSE.version);
  });

  it('a phrase (`say`) goes live to a v2 partner only, cleaned, at most one a second, and is never kept', () => {
    const a = join2(KEY_A);
    const b1 = join(KEY_B);
    a.sent = [];
    say2(a, { kind: 'say', text: 'やっほー！' });
    expect(b1.sent.map((m) => m.kind)).not.toContain('say'); // a v1 phone never hears one
    say(b1, { kind: 'say', text: 'hi' }); // nor sends one
    expect(a.sent).toEqual([]);
    const b2 = join2(KEY_B);
    b2.sent = [];
    now += 1000;
    say2(a, { kind: 'say', text: '  が\nんば\u202Eろう\u0000！ ', extra: '<b>' });
    expect(b2.sent).toEqual([{ v: 2, kind: 'say', text: 'が んばろう！', who: 'A', t: expect.any(Number) }]);
    now += 500;
    say2(a, { kind: 'say', text: 'too soon' });
    say2(a, { kind: 'say', text: 'x'.repeat(40) });
    expect(b2.sent).toHaveLength(1);
    now += 600;
    say2(a, { kind: 'say', text: 'x'.repeat(40) });
    expect(b2.sent.at(-1)).toMatchObject({ kind: 'say', text: 'x'.repeat(20) });
    say2(a, { kind: 'say', text: ' \n ' }); // nothing left: dropped
    now += 1000;
    say2(a, { kind: 'say', text: '\u200B' });
    expect(b2.sent).toHaveLength(2);
    // where it was said (a home's room), passed on for the phones to show it only in the same place
    now += 1000;
    say2(a, { kind: 'say', text: 'おじゃまします', sc: 'u' });
    expect(b2.sent.at(-1)).toEqual({ v: 2, kind: 'say', text: 'おじゃまします', sc: 'u', who: 'A', t: expect.any(Number) });
    now += 1000;
    say2(a, { kind: 'say', text: 'どこ？', sc: 'island' }); // an unknown place: dropped
    expect(b2.sent).toHaveLength(3);
    expect(saved).toEqual([]);
    expect(a.closed).toBeNull();
    // a phone opening later hears none of it
    const b3 = new FakeSock();
    socks.push(b3);
    room.open(b3);
    room.message(b3, JSON.stringify({ v: 2, kind: 'hello', key: KEY_B, since: 0, batch: true }));
    expect(b3.sent.flatMap((m) => (m.kind === 'replay' ? m.es : [m])).map((m) => m.kind)).not.toContain('say');
  });

  it('relays v2 walks only to points within the world plan', () => {
    const a = join2(KEY_A);
    const b = join2(KEY_B);
    b.sent = [];
    say2(a, { kind: 'walk', to: [-230, 2500] });
    say2(a, { kind: 'walk', to: 'bridgeStoneN' });
    say2(a, { kind: 'walk', to: [621, 0] });
    say2(a, { kind: 'walk', to: [0, -461] });
    say2(a, { kind: 'walk', to: [1.5, 2] });
    expect(b.sent.map((m) => (m as { to: unknown }).to)).toEqual([[-230, 2500], 'bridgeStoneN']);
    expect(a.closed).toBeNull();
  });
});

describe('the shared world (v2, docs/backend.md#shared-world)', () => {
  const join2 = (key: string, since?: number) => {
    const s = new FakeSock();
    socks.push(s);
    room.open(s);
    room.message(s, JSON.stringify({ v: 2, kind: 'hello', key, ...(since !== undefined ? { since } : {}) }));
    return s;
  };
  const say2 = (s: FakeSock, m: object) => room.message(s, JSON.stringify({ v: 2, ...m }));
  const bye = (s: FakeSock) => {
    s.close();
    room.close(s);
  };
  // 2026-11-01 12:00 Tokyo
  beforeEach(() => {
    now = Date.UTC(2026, 10, 1, 3);
    room = new RoomCore(io());
  });

  it('the first claim of a critter or a thing wins; a later one of the same id goes nowhere and isn’t kept', () => {
    const a = join2(KEY_A);
    const b = join2(KEY_B);
    a.sent = [];
    b.sent = [];
    say2(a, { kind: 'catch', what: 'sea-bass', id: 'fish:4321', at: [120, -40], how: 'rod' });
    say2(b, { kind: 'catch', what: 'sea-bass', id: 'fish:4321', at: [120, -40], how: 'rod' }); // lost the race
    expect(b.sent).toEqual([{ v: 2, kind: 'catch', what: 'sea-bass', id: 'fish:4321', at: [120, -40], how: 'rod', who: 'A', t: now }]);
    expect(a.sent).toEqual([]);
    say2(b, { kind: 'pick', id: 's4560', what: 'shell:conch', at: [150, 40] });
    say2(a, { kind: 'pick', id: 's4560', what: 'shell:conch', at: [150, 40] });
    expect(a.sent.map((m) => m.kind)).toEqual(['pick']);
    expect(b.sent).toHaveLength(1);
    // a put and a pick of the same id are different claims (a present lands, then it's opened)
    say2(a, { kind: 'put', id: 'p1', what: 'present', at: [200, 300] });
    say2(b, { kind: 'pick', id: 'p1', what: 'present:item:froggy-chair', at: [200, 300] });
    expect(b.sent.at(-1)).toMatchObject({ kind: 'put', id: 'p1' });
    expect(a.sent.at(-1)).toMatchObject({ kind: 'pick', id: 'p1' });
    expect((saved.at(-1) as unknown[]).length).toBe(4);
  });

  it('keeps the world while the partner is away, and replays it (theirs, not my own) to a phone that opens later', () => {
    const a = join2(KEY_A);
    say2(a, { kind: 'catch', what: 'tarantula', id: 'bug:77', at: [60, 300], how: 'net' });
    say2(a, { kind: 'shake', tree: 'oak-p1', drop: 'branch' });
    say2(a, { kind: 'walk', to: [100, 500] });
    say2(a, { kind: 'walk', to: [195, 900] }); // replaces the last
    say2(a, { kind: 'emote', emote: 'glee' }); // not the world's
    say2(a, { kind: 'catch', what: 'koi' }); // no id: nothing to claim, not kept
    const b = join2(KEY_B, 0);
    expect(b.sent.map((m) => m.kind)).toEqual(['welcome', 'catch', 'shake', 'walk']);
    expect(b.sent.at(-1)).toMatchObject({ kind: 'walk', to: [195, 900], who: 'A' });
    const a2 = join2(KEY_A, 0); // my own phone again: nothing of mine
    expect(a2.kinds()).toEqual(['welcome']);
    bye(b);
    const tb = (b.sent.at(-1) as { t: number }).t;
    say2(a2, { kind: 'pick', id: 'w3', what: 'weed' });
    const b2 = join2(KEY_B, tb); // since: only what came after
    expect(b2.kinds()).toEqual(['welcome', 'pick']);
  });

  it('relays and keeps a decoration\'s set and removal, replaying them to a phone that opens later', () => {
    const T = 1_793_000_000_000;
    const a = join2(KEY_A);
    say2(a, { kind: 'decor', id: 'dmh1abc2a', at: T, item: 'tanuki', x: 120, z: 480, f: 1, p: T });
    say2(a, { kind: 'decor', id: 'dmh1abc2a', at: T + 5, item: 'tanuki', x: 144, z: 480, f: 1, p: T });
    say2(a, { kind: 'decor', id: 'dmh1abc2b', at: T + 9, rm: true });
    const b = join2(KEY_B, 0);
    expect(b.sent.filter((m) => m.kind === 'decor')).toEqual([
      expect.objectContaining({ id: 'dmh1abc2a', x: 120, who: 'A' }), expect.objectContaining({ id: 'dmh1abc2a', x: 144 }), expect.objectContaining({ id: 'dmh1abc2b', rm: true })
    ]);
  });

  it('the tent: its decor ops are kept with their scope; a drag and a villager inside are relayed live, never kept', () => {
    const T = 1_793_000_000_000;
    const a = join2(KEY_A), b = join2(KEY_B);
    b.sent = [];
    say2(a, { kind: 'drag', id: 'dmh1abc2a', x: -12, z: 30, f: 0 });
    say2(a, { kind: 'drag', id: 'dmh1abc2a', x: -2, z: 28, f: 0, end: true });
    say2(a, { kind: 'tent', in: true, to: [-7, 22] });
    say2(a, { kind: 'decor', sc: 't', id: 'dmh1abc2a', at: T, item: 'f4041', x: 3, z: 5, f: 0, p: T });
    expect(b.kinds()).toEqual(['drag', 'drag', 'tent', 'decor']);
    expect(b.sent[1]).toEqual(expect.objectContaining({ kind: 'drag', x: -2, end: true, who: 'A' }));
    // a phone opening later hears the drop, not the drag
    const b2 = join2(KEY_B, 0);
    expect(b2.sent.filter((m) => m.kind !== 'welcome' && m.kind !== 'presence')).toEqual([expect.objectContaining({ kind: 'decor', sc: 't', x: 3, z: 5 })]);
  });

  it('acks an intent with its `c` (the room\'s time; refused: ok false), a resend is the same intent, a stale walk is refused', () => {
    const a = join2(KEY_A), b = join2(KEY_B);
    a.sent = [];
    b.sent = [];
    say2(a, { kind: 'pick', id: 'sh1', what: 'find:shell:cowrie', c: 5 });
    expect(b.kinds()).toEqual(['pick']);
    const t = (b.sent[0] as { t: number }).t;
    expect(a.sent).toEqual([{ v: 2, kind: 'ack', c: 5, t, ok: true }]);
    expect(b.sent[0]).not.toHaveProperty('c');
    // the same again (a reconnect resent it): acked again, the partner hears it once
    now += 1000;
    say2(a, { kind: 'pick', id: 'sh1', what: 'find:shell:cowrie', c: 5 });
    expect(a.sent.at(-1)).toEqual({ v: 2, kind: 'ack', c: 5, t, ok: true });
    expect(b.kinds()).toEqual(['pick']);
    // B's claim of it: refused
    say2(b, { kind: 'pick', id: 'sh1', what: 'find:shell:cowrie', c: 9 });
    expect(b.sent.at(-1)).toMatchObject({ kind: 'ack', c: 9, ok: false });
    // walks: a later one replaces the kept one; an older one resent after it is refused
    say2(a, { kind: 'walk', to: [100, 300], c: 7 });
    say2(a, { kind: 'walk', to: [120, 300], c: 6 });
    expect(a.sent.at(-1)).toMatchObject({ kind: 'ack', c: 6, ok: false });
    expect(b.sent.filter((m) => m.kind === 'walk')).toHaveLength(1);
    // an act without c: no ack
    a.sent = [];
    say2(a, { kind: 'act', act: 'rock' });
    expect(a.sent).toEqual([]);
  });

  it('relays to the partner before it keeps (a send after a storage write waits for it)', () => {
    const order: string[] = [];
    const base = io();
    room = new RoomCore({ ...base, save: (r) => void (order.push('saved'), saved.push(r)) });
    const a = join2(KEY_A), b = join2(KEY_B);
    const send = b.send.bind(b);
    b.send = (d: string) => void (order.push('sent'), send(d));
    say2(a, { kind: 'catch', what: 'koi', id: 'fish:1', how: 'rod' });
    expect(order).toEqual(['sent', 'saved']);
  });

  it('a walk carries the very walk: where from, the way, when it set off and how long', () => {
    const a = join2(KEY_A), b = join2(KEY_B);
    say2(a, { kind: 'walk', to: [195, 900], from: [132, 214], via: [[160, 400], [190, 700]], s: now - 30, ms: 2400, f: 'home' });
    expect(b.sent.at(-1)).toMatchObject({ kind: 'walk', to: [195, 900], from: [132, 214], via: [[160, 400], [190, 700]], s: now - 30, ms: 2400, f: 'home', who: 'A' });
    const n = b.sent.length;
    say2(a, { kind: 'walk', to: [195, 900], via: Array.from({ length: 13 }, () => [1, 1]) });
    say2(a, { kind: 'walk', to: [195, 900], ms: 60_001 });
    expect(b.sent.length).toBe(n);
  });

  it('a batch hello gets the day in replay messages (mine too, in order, within REPLAY_BYTES each)', () => {
    const a = join2(KEY_A);
    for (let i = 0; i < 300; i++) {
      say2(a, { kind: 'pick', id: `p${i}`, what: 'find:shell:cowrie', at: [150, 40], c: i + 1 });
      now += 60;
    }
    const b = join2(KEY_B);
    say2(b, { kind: 'walk', to: [262, 300] });
    bye(b);
    const b2 = new FakeSock();
    socks.push(b2);
    room.open(b2);
    room.message(b2, JSON.stringify({ v: 2, kind: 'hello', key: KEY_B, since: 0, batch: true }));
    const replays = b2.sent.filter((m) => m.kind === 'replay') as unknown as { es: { kind: string; who: string; c?: number }[] }[];
    expect(replays.length).toBeGreaterThan(1);
    const es = replays.flatMap((r) => r.es);
    expect(es).toHaveLength(301);
    expect(es.at(-1)).toMatchObject({ kind: 'walk', who: 'B' });
    expect(es.some((e) => e.c !== undefined)).toBe(false);
    for (const r of replays) expect(JSON.stringify(r).length).toBeLessThanOrEqual(16_000);
    expect(b2.kinds()[0]).toBe('welcome');
  });

  it('at most one nest per tree per hour', () => {
    const a = join2(KEY_A);
    const b = join2(KEY_B);
    say2(a, { kind: 'shake', tree: 'oak-k1', drop: 'nest' });
    now += 30 * 60_000;
    say2(b, { kind: 'shake', tree: 'oak-k1', drop: 'nest' }); // half an hour on: refused
    say2(b, { kind: 'shake', tree: 'cedar-k1', drop: 'nest' }); // another tree: fine
    now += 30 * 60_000;
    say2(b, { kind: 'shake', tree: 'oak-k1', drop: 'nest' }); // the hour is up
    expect(a.sent.filter((m) => m.kind === 'shake').map((m) => (m as { tree: string }).tree)).toEqual(['cedar-k1', 'oak-k1']);
    // the rule survives a restart
    room = new RoomCore(io(), saved.at(-1) as never);
    const a2 = join2(KEY_A);
    const b2 = join2(KEY_B);
    a2.sent = [];
    now += 10 * 60_000;
    say2(b2, { kind: 'shake', tree: 'oak-k1', drop: 'nest' });
    say2(b2, { kind: 'shake', tree: 'oak-k1', drop: 'branch' });
    expect(a2.sent.map((m) => (m as { drop: string }).drop)).toEqual(['branch']);
  });

  it('a new Tokyo day forgets yesterday’s claims and walks', () => {
    const a = join2(KEY_A);
    const b = join2(KEY_B);
    say2(a, { kind: 'pick', id: 'f1', what: 'fossil:amber' });
    say2(a, { kind: 'walk', to: [100, 500] });
    now = Date.UTC(2026, 10, 1, 15); // 2026-11-02 00:00 Tokyo
    b.sent = [];
    say2(a, { kind: 'pick', id: 'f1', what: 'fossil:ammonite' }); // today's f1 is another dig spot
    expect(b.sent.map((m) => m.kind)).toEqual(['pick']);
    const b2 = join2(KEY_B, 0);
    expect(b2.kinds()).toEqual(['welcome', 'pick']);
  });

  it('the shared world’s kinds are v2 only, and a v1 phone never gets a v2 walk replayed', () => {
    const a = join(KEY_A);
    say(a, { kind: 'pick', id: 'w1', what: 'weed' });
    say(a, { kind: 'catch', what: 'koi', id: 'x', how: 'rod' });
    expect(saved).toHaveLength(0);
    bye(a);
    const a2 = join2(KEY_A);
    say2(a2, { kind: 'walk', to: [100, 500] });
    say2(a2, { kind: 'pick', id: 'w1', what: 'weed' });
    const b1 = join(KEY_B, 0);
    expect(b1.kinds()).toEqual(['welcome', 'pick']);
  });

  it('keeps each shared intent within the size budget (≤ 100 bytes sent, ≤ 140 relayed)', () => {
    const t = Date.UTC(2026, 10, 1, 3);
    for (const m of [
      { kind: 'catch', what: 'giant-trevally', id: 'fish:4294967295', at: [-230, 2500], how: 'flee' },
      { kind: 'pick', id: 's86399999', what: 'fossil:left-quetzal-wing', at: [-230, 2500] },
      { kind: 'put', id: 'bug:fh:86399999', what: 'bug:emperor-butterfly', at: [-230, 2500] },
      { kind: 'shake', tree: 'cedar-t4', drop: 'bagworm', at: 1_793_527_259_353 },
      { kind: 'act', act: 'cast', id: 'fish:4294967295', pt: [-230, 2500] }
    ]) {
      const out = JSON.stringify({ v: 2, ...m });
      expect(out.length, out).toBeLessThanOrEqual(100);
      expect(JSON.stringify({ v: 2, ...m, who: 'A', t }).length).toBeLessThanOrEqual(140);
    }
  });
});

describe('high-fives (v2: the relay only, never the sheet)', () => {
  const join2 = (key: string) => {
    const s = new FakeSock();
    socks.push(s);
    room.open(s);
    room.message(s, JSON.stringify({ v: 2, kind: 'hello', key, since: 0, batch: true }));
    return s;
  };
  const say2 = (s: FakeSock, m: object) => room.message(s, JSON.stringify({ v: 2, ...m }));
  const bye = (s: FakeSock) => {
    s.close();
    room.close(s);
  };
  const fives = (s: FakeSock) => s.sent.filter((m) => m.kind === 'highfive');
  beforeEach(() => {
    now = Date.UTC(2026, 10, 1, 3);
    room = new RoomCore(io());
  });

  it('goes live to the partner (acked to the sender), and nothing is held or kept', () => {
    const a = join2(KEY_A), b = join2(KEY_B);
    a.sent = [];
    say2(a, { kind: 'highfive', at: now - 20, c: 7 });
    expect(fives(b)).toEqual([{ v: 2, kind: 'highfive', at: now - 20, who: 'A', t: now }]);
    expect(a.sent).toEqual([{ v: 2, kind: 'ack', c: 7, t: now, ok: true }]);
    expect(held).toEqual({});
    expect(saved).toEqual([]);
  });

  it('with the partner away, the last one is held for them, handed over at each hello until their phone says got', () => {
    const a = join2(KEY_A);
    say2(a, { kind: 'highfive', at: now - 5000, c: 1 });
    now += 60_000;
    say2(a, { kind: 'highfive', at: now - 10, c: 2 }); // a newer one replaces it
    expect(held).toEqual({ 'A>B': { from: 'A', to: 'B', at: now - 10, t: now } });
    const at = now - 10;
    now += 3600_000;
    const b = join2(KEY_B);
    expect(b.kinds()).toEqual(['welcome', 'highfive']);
    expect(fives(b)).toEqual([{ v: 2, kind: 'highfive', at, who: 'A', t: at + 10 }]);
    bye(b);
    const b2 = join2(KEY_B); // never said got: again
    expect(fives(b2)).toHaveLength(1);
    say2(b2, { kind: 'got', at: at - 1 }); // not this one
    expect(held['A>B']).toBeDefined();
    say2(b2, { kind: 'got', at });
    expect(held).toEqual({});
    bye(b2);
    expect(fives(join2(KEY_B))).toEqual([]);
    expect(fives(a)).toEqual([]); // never back to its sender
  });

  it('survives a restart, is let go after a day, and only an older phone there counts as away (it never hears one)', () => {
    const a = join2(KEY_A);
    const b1 = new FakeSock();
    socks.push(b1);
    room.open(b1);
    room.message(b1, JSON.stringify({ v: 1, kind: 'hello', key: KEY_B }));
    say2(a, { kind: 'highfive', at: now });
    expect(fives(b1)).toEqual([]);
    expect(held['A>B']?.at).toBe(now);
    bye(b1);
    room = new RoomCore(io(), [], null, held); // the Durable Object woke again
    expect(fives(join2(KEY_B))).toHaveLength(1);
    socks = [];
    room = new RoomCore(io(), [], null, held);
    now += 24 * 3600_000 + 1;
    expect(fives(join2(KEY_B))).toEqual([]);
    expect(held).toEqual({});
  });

  it('refuses a v1 high-five or got, and a bad time', () => {
    const a = join2(KEY_A), b = join2(KEY_B);
    b.sent = [];
    say(a, { kind: 'highfive', at: now }); // (a v1 message after a v2 hello closes it: tried on its own socket)
    const a1 = join(KEY_A);
    say(a1, { kind: 'highfive', at: now });
    say(a1, { kind: 'got', at: now });
    say2(join2(KEY_A), { kind: 'highfive', at: -1 });
    expect(fives(b)).toEqual([]);
  });
});
