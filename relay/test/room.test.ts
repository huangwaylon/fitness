import { beforeEach, describe, expect, it } from 'vitest';
import { CLOSE, HB_PING, HB_PONG, parseServer, type ServerMsg, type Wx } from '../../app/src/lib/contract/live-protocol.ts';
import { HELLO_MS, MAX_PENDING, RING_MAX, RoomCore, SILENT_MS, type Held, type Meta, type RoomIO } from '../src/room.ts';

const KEY_A = 'a1'.repeat(16);
const KEY_B = 'b2'.repeat(16);
const KEY_C = 'c3'.repeat(16);

class FakeSock {
  /** What it heard, a `replay`'s changes each in its place (`raw`: as sent). */
  sent: ServerMsg[] = [];
  raw: ServerMsg[] = [];
  closed: { code?: number; reason?: string } | null = null;
  meta: Meta | null = null;
  send(d: string) {
    if (this.closed) throw new Error('closed');
    const m = JSON.parse(d) as ServerMsg;
    this.raw.push(m);
    if (m.kind === 'replay') this.sent.push(...(m.es as ServerMsg[]));
    else this.sent.push(m);
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
    keys: { KEY_A, KEY_B, KEY_C },
    now: () => now,
    save: (r) => void saved.push(structuredClone(r)),
    hold: (h) => void (held = structuredClone(h))
  };
}

function join(key?: string, since?: number): FakeSock {
  const s = new FakeSock();
  socks.push(s);
  room.open(s);
  if (key) room.message(s, JSON.stringify({ v: 3, kind: 'hello', key, ...(since !== undefined ? { since } : {}) }));
  return s;
}

const say = (s: FakeSock, m: object) => room.message(s, JSON.stringify({ v: 3, ...m }));
const bye = (s: FakeSock) => {
  s.close();
  room.close(s);
};

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
    expect(a.sent).toEqual([{ v: 3, kind: 'welcome', me: 'A', peer: false, t: now, here: [], hb: true }]);
    const b = join(KEY_B);
    expect(b.sent[0]).toMatchObject({ kind: 'welcome', me: 'B', peer: true, here: ['A'] });
    expect(a.sent.at(-1)).toEqual({ v: 3, kind: 'presence', who: 'B', on: true, t: now });
  });

  it('closes an unknown key, and anything before hello', () => {
    const x = join('d4'.repeat(16));
    expect(x.closed?.code).toBe(CLOSE.unauthorized);
    const y = join();
    say(y, { kind: 'act', act: 'tap' });
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
    say(a, { kind: 'act', act: 'rock', who: 'B', t: 1 });
    expect(b.sent).toEqual([{ v: 3, kind: 'act', act: 'rock', who: 'A', t: now }]);
    expect(a.sent).toEqual([]);
  });

  it('drops a malformed intent from a known person without closing', () => {
    const a = join(KEY_A);
    const b = join(KEY_B);
    b.sent = [];
    say(a, { kind: 'act', act: 'explode' });
    say(a, { kind: 'emote', emote: 'glee' }); // (gone with v1)
    expect(b.sent).toEqual([]);
    expect(a.closed).toBeNull();
  });

  it('refuses a malformed numbered intent with its ack (ok: false), so the phone lets it go rather than resending it all day', () => {
    // 2026-11-05 client review: dropped silently, the phone resent it on every reconnect until midnight
    const a = join(KEY_A);
    const b = join(KEY_B);
    a.sent = [];
    b.sent = [];
    say(a, { kind: 'act', act: 'explode', c: 7 });
    say(a, { kind: 'walk', to: 'no such node!!', c: 8 });
    expect(a.sent).toEqual([
      { v: 3, kind: 'ack', c: 7, t: expect.any(Number), ok: false },
      { v: 3, kind: 'ack', c: 8, t: expect.any(Number), ok: false }
    ]);
    expect(b.sent).toEqual([]);
    // a number that isn't one, or no number: nothing to ack
    say(a, { kind: 'act', act: 'explode', c: -1 });
    say(a, { kind: 'act', act: 'explode' });
    room.message(a, '{"kind":');
    expect(a.sent).toHaveLength(2);
    expect(a.closed).toBeNull();
  });

  it('closes an unknown version before or after the hello with a reason that says so', () => {
    const x = new FakeSock();
    socks.push(x);
    room.open(x);
    room.message(x, JSON.stringify({ v: 4, kind: 'hello', key: KEY_A }));
    expect(x.closed).toEqual({ code: CLOSE.version, reason: 'protocol version 4 unsupported (relay speaks 3)' });
    // v1 and v2 too (2026-11-05: every phone speaks v3)
    for (const v of [1, 2]) {
      const old = join();
      room.message(old, JSON.stringify({ v, kind: 'hello', key: KEY_B }));
      expect(old.closed?.code, `v${v}`).toBe(CLOSE.version);
    }
    const a = join(KEY_A);
    room.message(a, JSON.stringify({ v: 2, kind: 'act', act: 'tap' }));
    expect(a.closed?.code).toBe(CLOSE.version);
  });

  it('answers the heartbeat with its fixed answer, as the runtime’s auto-response does: any socket, never the bucket', () => {
    const raw: string[] = [];
    const x = join();
    x.send = (d: string) => void raw.push(d);
    room.message(x, HB_PING);
    expect(raw).toEqual([HB_PONG]);
    expect(x.closed).toBeNull(); // (before its hello too)
    const a = join(KEY_A), b = join(KEY_B);
    const got: string[] = [];
    a.send = (d: string) => void got.push(d);
    for (let i = 0; i < 30; i++) room.message(a, HB_PING);
    expect(got).toEqual(Array(30).fill(HB_PONG));
    b.sent = [];
    say(a, { kind: 'act', act: 'rock' }); // the bucket untouched by them
    expect(b.kinds()).toEqual(['act']);
    // a lookalike isn't it (the runtime matches exactly): a malformed intent, dropped
    got.length = 0;
    room.message(a, '{"kind":"hb","v":3}');
    expect(got).toEqual([]);
    expect(parseServer(HB_PONG)).toEqual({ v: 3, kind: 'hb', t: 0 });
  });

  it('answers a ping with the relay time, to the sender only', () => {
    const a = join(KEY_A);
    const b = join(KEY_B);
    b.sent = [];
    say(a, { kind: 'ping', c: 42 });
    expect(a.sent.at(-1)).toEqual({ v: 3, kind: 'pong', c: 42, t: now });
    expect(b.sent).toEqual([]);
  });

  it('is a no-op when the partner is away (world events are still kept)', () => {
    const a = join(KEY_A);
    say(a, { kind: 'act', act: 'tap' });
    say(a, { kind: 'world', op: 'watered', id: 'fl3' });
    expect(a.kinds()).toEqual(['welcome']);
    expect(saved).toHaveLength(1);
  });

  it('rate-limits a connection to a burst of 20 and drops the rest', () => {
    const a = join(KEY_A);
    const b = join(KEY_B);
    b.sent = [];
    for (let i = 0; i < 40; i++) say(a, { kind: 'act', act: 'tap' });
    expect(b.sent).toHaveLength(19); // the hello spent one token
    now += 1000;
    for (let i = 0; i < 40; i++) say(a, { kind: 'act', act: 'tap' });
    expect(b.sent).toHaveLength(39);
    expect(a.closed).toBeNull();
  });

  it('a numbered intent over the limit hears `busy {c}` (never kept, relayed or acked); a ping and a got never wait', () => {
    // 2026-11-05 review: a numbered intent dropped by the bucket was silent: its phone waited for an ack until the next
    // reconnect. `busy` is its own kind, so a phone that doesn't know it ignores it and keeps the intent as before.
    const a = join(KEY_A, 0);
    const b = join(KEY_B, 0);
    for (let i = 0; i < 19; i++) say(a, { kind: 'act', act: 'tap' });
    a.sent = [];
    b.sent = [];
    say(a, { kind: 'world', op: 'watered', id: 'fl1', c: 5 });
    say(a, { kind: 'act', act: 'tap' }); // unnumbered: dropped, as before
    expect(a.sent).toEqual([{ v: 3, kind: 'busy', c: 5, t: now }]);
    expect(parseServer(JSON.stringify(a.raw.at(-1)))).toEqual({ v: 3, kind: 'busy', c: 5, t: now });
    expect(b.sent).toEqual([]);
    expect(saved).toEqual([]);
    say(a, { kind: 'ping', c: now - 3 });
    expect(a.sent.at(-1)).toEqual({ v: 3, kind: 'pong', c: now - 3, t: now });
    // its resend once the bucket has room is taken
    now += 100;
    say(a, { kind: 'world', op: 'watered', id: 'fl1', c: 5 });
    expect(a.sent.at(-1)).toMatchObject({ kind: 'ack', c: 5, ok: true });
  });

  it('replays the day’s world after `since` to a reconnecting phone, in order, mine too', () => {
    const a = join(KEY_A);
    const b = join(KEY_B);
    say(a, { kind: 'world', op: 'watered', id: 'fl1' });
    const t1 = (b.sent.at(-1) as { t: number }).t;
    say(a, { kind: 'world', op: 'wished', id: '2026-11-01' }); // same ms: still a later t
    say(b, { kind: 'world', op: 'watered', id: 'fl2' });
    say(a, { kind: 'act', act: 'tap' }); // presence only: not kept
    bye(b);
    const b2 = join(KEY_B, t1);
    expect(b2.raw.map((m) => m.kind)).toEqual(['welcome', 'replay']);
    expect(b2.sent.slice(1)).toMatchObject([{ op: 'wished', who: 'A' }, { op: 'watered', id: 'fl2', who: 'B' }]);
    expect((b2.sent[1] as { t: number }).t).toBeGreaterThan(t1);
    const b3 = join(KEY_B); // no since: nothing replayed
    expect(b3.kinds()).toEqual(['welcome']);
  });

  it('keeps today’s last 400 world events (Tokyo’s day), across a restart', () => {
    const a = join(KEY_A);
    for (let i = 0; i < RING_MAX + 10; i++) {
      now += 100;
      say(a, { kind: 'world', op: 'watered', id: `w${i}` });
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
    say(b, { kind: 'act', act: 'tap' });
    expect(a2.sent.at(-1)).toMatchObject({ kind: 'act', who: 'B' });
  });

  it('tells the partner when the last socket of a person closes', () => {
    const a = join(KEY_A);
    const b = join(KEY_B);
    a.sent = [];
    bye(b);
    expect(a.sent).toEqual([{ v: 3, kind: 'presence', who: 'B', on: false, t: now }]);
    room.close(b); // a repeated close says nothing more
    expect(a.sent).toHaveLength(1);
  });

  it('keeps when each person left, for the welcome: the partner gone, my own last socket; back, forgotten', () => {
    const gone: unknown[] = [];
    room = new RoomCore({ ...io(), saveGone: (g) => void gone.push(structuredClone(g)) });
    const a = join(KEY_A);
    expect(a.sent[0]).not.toHaveProperty('gone');
    const b = join(KEY_B);
    const left = now;
    bye(b);
    expect(a.sent.at(-1)).toEqual({ v: 3, kind: 'presence', who: 'B', on: false, t: left });
    expect(gone.at(-1)).toEqual({ B: left });
    now += 60_000;
    bye(a);
    now += 60_000;
    // a phone opening later hears when B left; A's own phone, when its last socket did
    const a2 = join(KEY_A);
    expect(a2.sent[0]).toMatchObject({ kind: 'welcome', here: [], gone: { A: left + 60_000, B: left } });
    expect(gone.at(-1)).toEqual({ B: left });
    // the Durable Object woke again: the same
    room = new RoomCore(io(), [], null, {}, gone.at(-1) as never);
    socks = [];
    const b2 = join(KEY_B);
    expect(b2.sent[0]).toMatchObject({ kind: 'welcome', gone: { B: left } });
    const a3 = join(KEY_A);
    expect(a3.sent[0]).toMatchObject({ kind: 'welcome', here: ['B'] });
    expect(a3.sent[0]).not.toHaveProperty('gone');
  });

  it('a slow phone (a 5 s round trip, a long task at boot) still gets in: its hello is waited for 12 s', () => {
    // 2026-11-05 client review: at 3 s, a 3.2 s RTT never connected (every hello closed 4003)
    const s = join();
    now += 5000;
    expect(room.sweep()).not.toBeNull();
    expect(s.closed).toBeNull();
    say(s, { kind: 'hello', key: KEY_A });
    expect(s.sent[0]).toMatchObject({ kind: 'welcome', me: 'A' });
  });

  it('closes sockets that never say hello within 12 s and says when to look again', () => {
    const quiet = join();
    now += 1000;
    const later = join();
    const a = join(KEY_A);
    expect(HELLO_MS).toBe(12_000);
    expect(room.sweep()).toBe(now - 1000 + HELLO_MS);
    now += HELLO_MS - 1000;
    expect(room.sweep()).toBe(now + 1000);
    expect(quiet.closed?.code).toBe(CLOSE.timeout);
    expect(later.closed).toBeNull();
    now += 1000;
    expect(room.sweep()).toBeNull();
    expect(later.closed?.code).toBe(CLOSE.timeout);
    expect(a.closed).toBeNull();
  });

  it('relays a saved nudge to the partner only', () => {
    const a = join(KEY_A);
    const b = join(KEY_B);
    a.sent = [];
    say(b, { kind: 'saved' });
    expect(a.sent).toEqual([{ v: 3, kind: 'saved', who: 'B', t: now }]);
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
    const m = { v: 3, kind: 'changed', ...n, t: now };
    expect(a.sent).toEqual([m]);
    expect(b.sent).toEqual([m]);
    expect(quiet.sent).toEqual([]);
    bye(a);
    bye(b);
    expect(room.notify(n)).toBe(0); // nobody there: a no-op
  });

  it('never tells the guest of a member’s からだ-only ingest: events’, activity ingests’ and a new epoch’s notices, and its welcome’s mark is theirs', () => {
    // 2026-11-05 client review: `changed {what: 'ingest', who, at}` told the guest when each Shortcut ran, and its
    // snapshot (no からだ rows) could never reach the ingest's mark
    const a = join(KEY_A), g = join(KEY_C);
    a.sent = [];
    g.sent = [];
    const ing = { what: 'ingest', who: 'B', at: '2026-11-01T01:02:03.456Z', rev: 'e1' } as const;
    const ev = { what: 'event', who: 'A', at: '2026-11-01T01:00:00.000Z', rev: 'e1' } as const;
    room.notify(ev);
    room.notify(ing);
    expect(a.kinds()).toEqual(['changed', 'changed']);
    expect(g.sent).toEqual([{ v: 3, kind: 'changed', ...ev, t: now }]);
    // an ingest that brought activity rows (the trees, today's ベル: the guest's too), the record says so
    room.notify({ ...ing, at: '2026-11-01T01:30:00.000Z' }, true);
    expect(g.sent.at(-1)).toMatchObject({ kind: 'changed', what: 'ingest', at: '2026-11-01T01:30:00.000Z' });
    // a new epoch (the admin's, sent as `ingest`) it hears
    room.notify({ ...ing, at: '2026-11-01T02:00:00.000Z', rev: 'e2' });
    expect(g.sent.at(-1)).toMatchObject({ kind: 'changed', rev: 'e2' });
    // the welcomes: a member's mark is the record's last change, the guest's the last it may hear of
    bye(g);
    room.notify({ ...ing, at: '2026-11-01T03:00:00.000Z', rev: 'e2' });
    expect(join(KEY_B).sent[0]).toMatchObject({ kind: 'welcome', rec: { at: '2026-11-01T03:00:00.000Z', rev: 'e2' } });
    expect(join(KEY_C).sent[0]).toMatchObject({ kind: 'welcome', rec: { at: '2026-11-01T02:00:00.000Z', rev: 'e2' } });
  });

  it('a welcome carries the record’s last change it heard of (kept across restarts), so a phone that has it needn’t fetch', () => {
    const marks: unknown[] = [];
    room = new RoomCore({ ...io(), saveRec: (r) => void marks.push(r) });
    expect(join(KEY_A).sent[0]).not.toHaveProperty('rec');
    room.notify({ what: 'ingest', who: 'A', at: '2026-11-01T01:02:03.456Z', rev: 'e1' });
    room.notify({ what: 'event', who: 'B', at: '2026-11-01T01:00:00.000Z', rev: 'e1' }); // an older copy, late
    expect(marks).toEqual([{ at: '2026-11-01T01:02:03.456Z', rev: 'e1' }]);
    expect(join(KEY_B).sent[0]).toEqual({ v: 3, kind: 'welcome', me: 'B', peer: true, t: now, rec: { at: '2026-11-01T01:02:03.456Z', rev: 'e1' }, here: ['A'], hb: true });
    room = new RoomCore(io(), [], { at: '2026-11-01T01:02:03.456Z', rev: 'e1' });
    socks = [];
    expect(join(KEY_A).sent[0]).toMatchObject({ kind: 'welcome', rec: { at: '2026-11-01T01:02:03.456Z', rev: 'e1' } });
  });

  it('a ticketed socket (its key proved at the Worker) is never let go to make room, and its hello must be its person’s', () => {
    const t = new FakeSock();
    socks.push(t);
    room.open(t, 'A');
    for (let i = 0; i < 8; i++) {
      now += 10;
      room.makeRoom();
      join();
    }
    expect(t.closed).toBeNull();
    say(t, { kind: 'hello', key: KEY_A });
    expect(t.sent[0]).toMatchObject({ kind: 'welcome', me: 'A' });
    // another's key on a ticket's socket: refused
    const u = new FakeSock();
    socks.push(u);
    room.open(u, 'B');
    say(u, { kind: 'hello', key: KEY_A });
    expect(u.closed).toEqual({ code: CLOSE.unauthorized, reason: "not the ticket's" });
    // it still says hello in time like any
    const late = new FakeSock();
    socks.push(late);
    room.open(late, 'G');
    now += HELLO_MS;
    room.sweep();
    expect(late.closed?.code).toBe(CLOSE.timeout);
  });

  it('silent sockets never lock the phones out: at most 4 wait for their hello, the oldest let go for a new one', () => {
    // 2026-11-05 review: 8 sockets that never said hello filled the room (MAX 8 counted them) and both phones got 503
    const enter = (key?: string) => {
      room.makeRoom();
      return join(key);
    };
    const silent: FakeSock[] = [];
    for (let i = 0; i < 8; i++) {
      now += 10;
      silent.push(enter());
    }
    expect(silent.filter((s) => !s.closed)).toHaveLength(MAX_PENDING);
    expect(silent.slice(0, 4).every((s) => s.closed?.code === CLOSE.timeout)).toBe(true);
    // a hello on a socket already let go (it was closing) is no welcome
    silent[0].closed = null;
    say(silent[0], { kind: 'hello', key: KEY_A });
    expect(silent[0].sent).toEqual([]);
    silent[0].closed = { code: CLOSE.timeout };
    const a = enter(KEY_A), b = enter(KEY_B), g = enter(KEY_C);
    expect(a.sent[0]).toMatchObject({ kind: 'welcome', me: 'A' });
    expect(b.sent[0]).toMatchObject({ kind: 'welcome', me: 'B', peer: true });
    expect(g.sent[0]).toMatchObject({ kind: 'welcome', me: 'G' });
    // more silent ones push out only silent ones, never a welcomed socket
    for (let i = 0; i < 6; i++) enter();
    expect([a, b, g].every((s) => s.closed === null)).toBe(true);
    expect(socks.filter((s) => !s.closed && !s.meta?.who)).toHaveLength(MAX_PENDING);
  });

  it('a phrase (`say`) goes live to the partner, cleaned, at most one a second, and is never kept', () => {
    const a = join(KEY_A);
    const b = join(KEY_B);
    b.sent = [];
    say(a, { kind: 'say', text: '  が\nんば‮ろう\u0000！ ', extra: '<b>' });
    expect(b.sent).toEqual([{ v: 3, kind: 'say', text: 'が んばろう！', who: 'A', t: expect.any(Number) }]);
    now += 500;
    say(a, { kind: 'say', text: 'too soon' });
    say(a, { kind: 'say', text: 'x'.repeat(40) });
    expect(b.sent).toHaveLength(1);
    now += 600;
    say(a, { kind: 'say', text: 'x'.repeat(40) });
    expect(b.sent.at(-1)).toMatchObject({ kind: 'say', text: 'x'.repeat(20) });
    say(a, { kind: 'say', text: ' \n ' }); // nothing left: dropped
    now += 1000;
    say(a, { kind: 'say', text: '​' });
    expect(b.sent).toHaveLength(2);
    // where it was said (a home's room), passed on for the phones to show it only in the same place
    now += 1000;
    say(a, { kind: 'say', text: 'おじゃまします', sc: 'u' });
    expect(b.sent.at(-1)).toEqual({ v: 3, kind: 'say', text: 'おじゃまします', sc: 'u', who: 'A', t: expect.any(Number) });
    now += 1000;
    say(a, { kind: 'say', text: 'どこ？', sc: 'island' }); // an unknown place: dropped
    expect(b.sent).toHaveLength(3);
    expect(saved).toEqual([]);
    expect(a.closed).toBeNull();
    // a phone opening later hears none of it
    expect(join(KEY_B, 0).kinds()).not.toContain('say');
  });

  it('a quiz op (`quiz`, ききみみ) goes live to everyone else here, the guest’s too; never kept, acked or replayed', () => {
    const a = join(KEY_A), b = join(KEY_B), g = join(KEY_C);
    for (const s of [a, b, g]) s.sent = [];
    const T = 1_793_527_259_353;
    say(a, { kind: 'quiz', g: 'k3x9a2', op: 'open', seed: 12345, lv: 2, same: true, extra: 1 });
    say(g, { kind: 'quiz', g: 'k3x9a2', op: 'join' });
    say(a, { kind: 'quiz', g: 'k3x9a2', op: 'go', at: T });
    say(g, { kind: 'quiz', g: 'k3x9a2', op: 'a', i: 0, k: 2, rp: false, s: 130 });
    say(b, { kind: 'quiz', g: 'k3x9a2', op: 'a', i: 0, k: 9, rp: false, s: 0 }); // no such choice: dropped
    say(a, { kind: 'quiz', g: 'k3x9a2', op: 'skip', i: 1, at: T + 30_000 });
    expect(b.sent).toEqual([
      { v: 3, kind: 'quiz', g: 'k3x9a2', op: 'open', seed: 12345, lv: 2, same: true, who: 'A', t: expect.any(Number) },
      { v: 3, kind: 'quiz', g: 'k3x9a2', op: 'join', who: 'G', t: expect.any(Number) },
      { v: 3, kind: 'quiz', g: 'k3x9a2', op: 'go', at: T, who: 'A', t: expect.any(Number) },
      { v: 3, kind: 'quiz', g: 'k3x9a2', op: 'a', i: 0, k: 2, rp: false, s: 130, who: 'G', t: expect.any(Number) },
      { v: 3, kind: 'quiz', g: 'k3x9a2', op: 'skip', i: 1, at: T + 30_000, who: 'A', t: expect.any(Number) }
    ]);
    expect(a.sent.map((m) => [m.kind, (m as { who?: string }).who])).toEqual([['quiz', 'G'], ['quiz', 'G']]);
    expect(g.sent.map((m) => [(m as { op?: string }).op, (m as { who?: string }).who])).toEqual([['open', 'A'], ['go', 'A'], ['skip', 'A']]);
    expect(saved).toEqual([]);
    for (const s of [a, b, g]) expect(s.closed).toBeNull();
    // a phone opening later hears none of it
    expect(join(KEY_B, 0).kinds()).not.toContain('quiz');
  });

  it('a game op (`play`, ききみみ’s games) goes live to everyone else here, the guest’s too; never kept, acked or replayed; an unknown game passes, an oversize one is dropped', () => {
    const a = join(KEY_A), b = join(KEY_B), g = join(KEY_C);
    for (const s of [a, b, g]) s.sent = [];
    const T = 1_793_527_259_353;
    const P = { kind: 'play', g: 'k3x9a2', gm: 'tile' };
    say(a, { ...P, op: 'open', cv: '0a1b2c', seed: 12345, f: 1, o: [3], u: 'u03-kawa', extra: 1 });
    say(g, { ...P, op: 'join', tr: 2 });
    say(a, { ...P, op: 'go', at: T, pl: 5 });
    say(g, { ...P, op: 'a', i: 0, k: [1, 5, 9], rp: 1, s: 130 });
    say(b, { ...P, op: 'a', i: 0, k: [64], rp: 0, s: 0 }); // no such tile: dropped
    say(b, { ...P, gm: 'zzgame9', op: 'join' }); // a game the relay has never heard of: passed on
    say(b, { ...P, op: 'ev', i: 0, e: 1, pad: 'x'.repeat(300) }); // over MAX_BYTES: dropped unread
    say(a, { ...P, op: 'skip', i: 1, at: T + 30_000 });
    expect(b.sent).toEqual([
      { v: 3, ...P, op: 'open', cv: '0a1b2c', seed: 12345, f: 1, o: [3], u: 'u03-kawa', who: 'A', t: expect.any(Number) },
      { v: 3, ...P, op: 'join', tr: 2, who: 'G', t: expect.any(Number) },
      { v: 3, ...P, op: 'go', at: T, pl: 5, who: 'A', t: expect.any(Number) },
      { v: 3, ...P, op: 'a', i: 0, k: [1, 5, 9], rp: 1, s: 130, who: 'G', t: expect.any(Number) },
      { v: 3, ...P, op: 'skip', i: 1, at: T + 30_000, who: 'A', t: expect.any(Number) }
    ]);
    expect(a.sent.map((m) => [(m as { op?: string }).op, (m as { gm?: string }).gm, (m as { who?: string }).who]))
      .toEqual([['join', 'tile', 'G'], ['a', 'tile', 'G'], ['join', 'zzgame9', 'B']]);
    expect(g.sent.map((m) => [(m as { op?: string }).op, (m as { who?: string }).who])).toEqual([['open', 'A'], ['go', 'A'], ['join', 'B'], ['skip', 'A']]);
    // nobody hears an ack (none was numbered) or anything of their own
    for (const s of [a, b, g]) expect(s.sent.map((m) => m.kind)).not.toContain('ack');
    expect(saved).toEqual([]);
    for (const s of [a, b, g]) expect(s.closed).toBeNull();
    // a phone opening later hears none of it
    expect(join(KEY_B, 0).kinds()).not.toContain('play');
  });

  it('relays walks only to points within the world plan', () => {
    const a = join(KEY_A);
    const b = join(KEY_B);
    b.sent = [];
    say(a, { kind: 'walk', to: [-230, 2500] });
    say(a, { kind: 'walk', to: 'bridgeStoneN' });
    say(a, { kind: 'walk', to: [621, 0] });
    say(a, { kind: 'walk', to: [0, -461] });
    say(a, { kind: 'walk', to: [1.5, 2] });
    expect(b.sent.map((m) => (m as { to: unknown }).to)).toEqual([[-230, 2500], 'bridgeStoneN']);
    expect(a.closed).toBeNull();
  });
});

describe('ghosts (a phone gone without closing its socket: relay review O2)', () => {
  /** When the runtime last answered each socket's heartbeat (the auto-response: the room never hears it). */
  let beats: Map<FakeSock, number>;
  beforeEach(() => {
    beats = new Map();
    room = new RoomCore({ ...io(), heardAt: (s) => beats.get(s) ?? null });
  });
  /** A phone whose hello says `beat` (it sends something whenever it has sent nothing for 20 s). */
  const beating = (key: string) => {
    const s = new FakeSock();
    socks.push(s);
    room.open(s);
    room.message(s, JSON.stringify({ v: 3, kind: 'hello', key, beat: true }));
    return s;
  };

  it('a beating phone silent a minute (no message, no heartbeat) is closed and gone; one that beats stays; nothing is sent to ask', () => {
    const a = beating(KEY_A), b = beating(KEY_B);
    expect(room.sweepSilent()).toBe(now + SILENT_MS);
    a.sent = [];
    b.sent = [];
    for (let i = 0; i < 3; i++) {
      now += 20_000;
      beats.set(a, now); // A's heartbeats, answered by the runtime
      room.sweepSilent();
    }
    expect(a.closed).toBeNull();
    expect(b.closed).toEqual({ code: CLOSE.timeout, reason: 'silent' });
    expect(a.sent).toEqual([{ v: 3, kind: 'presence', who: 'B', on: false, t: now }]); // no probe, only B gone
    expect(join(KEY_C).sent[0]).toMatchObject({ kind: 'welcome', here: ['A'] });
  });

  it('a phone from before `beat`, only listening to the partner for 3 minutes (so never pinging), is never closed', () => {
    // the lead's check (2026-11-05): such a phone pings only when it heard nothing for 20 s
    const a = join(KEY_A), b = beating(KEY_B);
    for (let i = 0; i < 18; i++) {
      now += 10_000;
      say(b, { kind: 'act', act: 'rock' }); // B taps away; A only hears
      room.sweepSilent();
    }
    expect(a.closed).toBeNull();
    expect(a.kinds().filter((k) => k === 'welcome')).toHaveLength(1);
    expect(a.kinds().filter((k) => k === 'act')).toHaveLength(18);
    expect(b.closed).toBeNull();
  });

  it('a hello sweeps the ghosts first: the newcomer never hears a ghost is here', () => {
    const b = beating(KEY_B);
    now += SILENT_MS;
    const a = join(KEY_A);
    expect(b.closed?.reason).toBe('silent');
    expect(a.sent[0]).toMatchObject({ kind: 'welcome', peer: false, here: [] });
  });

  it('none beating: nothing to watch', () => {
    join(KEY_A);
    expect(room.sweepSilent()).toBeNull();
    const x = join();
    expect(room.sweepSilent()).toBeNull(); // (a socket before its hello is the hello sweep's)
    expect(x.closed).toBeNull();
  });
});

describe('the shared world (docs/backend.md#shared-world)', () => {
  // 2026-11-01 12:00 Tokyo
  beforeEach(() => {
    now = Date.UTC(2026, 10, 1, 3);
    room = new RoomCore(io());
  });

  it('the first claim of a critter or a thing wins; a later one of the same id goes nowhere and isn’t kept', () => {
    const a = join(KEY_A);
    const b = join(KEY_B);
    a.sent = [];
    b.sent = [];
    say(a, { kind: 'catch', what: 'sea-bass', id: 'fish:4321', at: [120, -40], how: 'rod' });
    say(b, { kind: 'catch', what: 'sea-bass', id: 'fish:4321', at: [120, -40], how: 'rod' }); // lost the race
    expect(b.sent).toEqual([{ v: 3, kind: 'catch', what: 'sea-bass', id: 'fish:4321', at: [120, -40], how: 'rod', who: 'A', t: now }]);
    expect(a.sent).toEqual([]);
    say(b, { kind: 'pick', id: 's4560', what: 'shell:conch', at: [150, 40] });
    say(a, { kind: 'pick', id: 's4560', what: 'shell:conch', at: [150, 40] });
    expect(a.sent.map((m) => m.kind)).toEqual(['pick']);
    expect(b.sent).toHaveLength(1);
    // a put and a pick of the same id are different claims (a present lands, then it's opened)
    say(a, { kind: 'put', id: 'p1', what: 'present', at: [200, 300] });
    say(b, { kind: 'pick', id: 'p1', what: 'present:item:froggy-chair', at: [200, 300] });
    expect(b.sent.at(-1)).toMatchObject({ kind: 'put', id: 'p1' });
    expect(a.sent.at(-1)).toMatchObject({ kind: 'pick', id: 'p1' });
    expect((saved.at(-1) as unknown[]).length).toBe(4);
  });

  it('keeps the world while the partner is away, and replays it to a phone that opens later', () => {
    const a = join(KEY_A);
    say(a, { kind: 'catch', what: 'tarantula', id: 'bug:77', at: [60, 300], how: 'net' });
    say(a, { kind: 'shake', tree: 'oak-p1', drop: 'branch' });
    say(a, { kind: 'walk', to: [100, 500] });
    say(a, { kind: 'walk', to: [195, 900] }); // replaces the last
    say(a, { kind: 'act', act: 'tap' }); // not the world's
    say(a, { kind: 'catch', what: 'koi' }); // no id: nothing to claim, not kept
    const b = join(KEY_B, 0);
    expect(b.kinds()).toEqual(['welcome', 'catch', 'shake', 'walk']);
    expect(b.sent.at(-1)).toMatchObject({ kind: 'walk', to: [195, 900], who: 'A' });
    bye(b);
    const tb = (b.sent.at(-1) as { t: number }).t;
    say(a, { kind: 'pick', id: 'w3', what: 'weed' });
    const b2 = join(KEY_B, tb); // since: only what came after
    expect(b2.kinds()).toEqual(['welcome', 'pick']);
  });

  it('relays and keeps a decoration\'s set and removal, replaying them to a phone that opens later', () => {
    const T = 1_793_000_000_000;
    const a = join(KEY_A);
    say(a, { kind: 'decor', id: 'dmh1abc2a', at: T, item: 'tanuki', x: 120, z: 480, f: 1, p: T });
    say(a, { kind: 'decor', id: 'dmh1abc2a', at: T + 5, item: 'tanuki', x: 144, z: 480, f: 1, p: T });
    say(a, { kind: 'decor', id: 'dmh1abc2b', at: T + 9, rm: true });
    const b = join(KEY_B, 0);
    expect(b.sent.filter((m) => m.kind === 'decor')).toEqual([
      expect.objectContaining({ id: 'dmh1abc2a', x: 120, who: 'A' }), expect.objectContaining({ id: 'dmh1abc2a', x: 144 }), expect.objectContaining({ id: 'dmh1abc2b', rm: true })
    ]);
  });

  it('the tent: its decor ops are kept with their scope; a drag and a villager inside are relayed live, never kept', () => {
    const T = 1_793_000_000_000;
    const a = join(KEY_A), b = join(KEY_B);
    b.sent = [];
    say(a, { kind: 'drag', id: 'dmh1abc2a', x: -12, z: 30, f: 0 });
    say(a, { kind: 'drag', id: 'dmh1abc2a', x: -2, z: 28, f: 0, end: true });
    say(a, { kind: 'tent', in: true, to: [-7, 22] });
    say(a, { kind: 'decor', sc: 't', id: 'dmh1abc2a', at: T, item: 'f4041', x: 3, z: 5, f: 0, p: T });
    expect(b.kinds()).toEqual(['drag', 'drag', 'tent', 'decor']);
    expect(b.sent[1]).toEqual(expect.objectContaining({ kind: 'drag', x: -2, end: true, who: 'A' }));
    // a phone opening later hears the drop, not the drag
    const b2 = join(KEY_B, 0);
    expect(b2.sent.filter((m) => m.kind !== 'welcome' && m.kind !== 'presence')).toEqual([expect.objectContaining({ kind: 'decor', sc: 't', x: 3, z: 5 })]);
  });

  it('acks an intent with its `c` (the room\'s time; refused: ok false), a resend is the same intent, a stale walk is refused', () => {
    const a = join(KEY_A), b = join(KEY_B);
    a.sent = [];
    b.sent = [];
    say(a, { kind: 'pick', id: 'sh1', what: 'find:shell:cowrie', c: 5 });
    expect(b.kinds()).toEqual(['pick']);
    const t = (b.sent[0] as { t: number }).t;
    expect(a.sent).toEqual([{ v: 3, kind: 'ack', c: 5, t, ok: true }]);
    expect(b.sent[0]).not.toHaveProperty('c');
    // the same again (a reconnect resent it): acked again, the partner hears it once
    now += 1000;
    say(a, { kind: 'pick', id: 'sh1', what: 'find:shell:cowrie', c: 5 });
    expect(a.sent.at(-1)).toEqual({ v: 3, kind: 'ack', c: 5, t, ok: true });
    expect(b.kinds()).toEqual(['pick']);
    // B's claim of it: refused
    say(b, { kind: 'pick', id: 'sh1', what: 'find:shell:cowrie', c: 9 });
    expect(b.sent.at(-1)).toMatchObject({ kind: 'ack', c: 9, ok: false });
    // walks: a later one replaces the kept one; an older one resent after it is refused
    say(a, { kind: 'walk', to: [100, 300], c: 7 });
    say(a, { kind: 'walk', to: [120, 300], c: 6 });
    expect(a.sent.at(-1)).toMatchObject({ kind: 'ack', c: 6, ok: false });
    expect(b.sent.filter((m) => m.kind === 'walk')).toHaveLength(1);
    // an act without c: no ack
    a.sent = [];
    say(a, { kind: 'act', act: 'rock' });
    expect(a.sent).toEqual([]);
  });

  it('a walk’s number is compared on its own socket only: another device of the same person (another clock) walks on', () => {
    const b = join(KEY_B);
    // A's iPad, its clock an hour fast: its walk numbered by it
    const pad = join(KEY_A);
    say(pad, { kind: 'walk', to: [100, 300], s: now, ms: 1000, c: now + 3600_000 });
    expect(pad.sent.at(-1)).toMatchObject({ kind: 'ack', ok: true });
    // A's phone, on the right clock: its hello replaces the iPad's socket, and its walk is taken
    now += 60_000;
    const phone = join(KEY_A);
    say(phone, { kind: 'walk', to: [120, 300], s: now, ms: 1000, c: now });
    expect(phone.sent.at(-1)).toMatchObject({ kind: 'ack', ok: true });
    expect(b.sent.filter((m) => m.kind === 'walk').map((m) => (m as unknown as { to: number[] }).to)).toEqual([[100, 300], [120, 300]]);
    // on one socket the order still holds: an older number after a newer one is a late resend
    say(phone, { kind: 'walk', to: [140, 300], s: now, ms: 1000, c: now - 5 });
    expect(phone.sent.at(-1)).toMatchObject({ kind: 'ack', ok: false });
    // and a walk from another socket that set off well before the kept one (an old resend after a reconnect) too
    now += 60_000;
    const again = join(KEY_A);
    say(again, { kind: 'walk', to: [160, 300], s: now - 120_000, ms: 1000, c: now + 7200_000 });
    expect(again.sent.at(-1)).toMatchObject({ kind: 'ack', ok: false });
    say(again, { kind: 'walk', to: [180, 300], s: now - 61_000 - 2000, ms: 1000, c: 5 });
    expect(again.sent.at(-1)).toMatchObject({ kind: 'ack', ok: true });
    // the kept walk goes out as it came: no socket id, no number
    const late = join(KEY_B, 0);
    const kept = late.sent.find((m) => m.kind === 'walk' && m.who === 'A');
    expect(kept).toMatchObject({ to: [180, 300] });
    expect(kept).not.toHaveProperty('sk');
    expect(kept).not.toHaveProperty('c');
  });

  it('a numbered layout op (an editor’s save) is acked, relayed once, never kept; over the rate limit it hears `busy`', () => {
    const a = join(KEY_A), b = join(KEY_B);
    a.sent = [];
    b.sent = [];
    const op = (i: number) => ({ kind: 'decor', sc: 'o', id: `palm${i}`, at: 1_793_000_000_000 + i, k: 'palm', x: 10, z: 10 + i, f: 0, c: 100 + i });
    for (let i = 0; i < 25; i++) say(a, op(i));
    // (the hello took one of the burst of 20)
    expect(b.sent.filter((m) => m.kind === 'decor')).toHaveLength(19);
    expect(a.sent.filter((m) => m.kind === 'ack').map((m) => (m as { c: number }).c)).toEqual(Array.from({ length: 19 }, (_, i) => 100 + i));
    expect(a.sent.filter((m) => m.kind === 'busy').map((m) => (m as { c: number }).c)).toEqual([119, 120, 121, 122, 123, 124]);
    // a second later the rest go again, and one already relayed (its ack lost) is acked again, not relayed twice
    now += 1000;
    for (let i = 18; i < 25; i++) say(a, op(i));
    expect(b.sent.filter((m) => m.kind === 'decor').map((m) => (m as unknown as { id: string }).id)).toEqual(Array.from({ length: 25 }, (_, i) => `palm${i}`));
    expect(a.sent.filter((m) => m.kind === 'ack')).toHaveLength(26);
    // never in the day's world
    expect(join(KEY_B, 0).sent.some((m) => m.kind === 'decor')).toBe(false);
  });

  it('relays to the partner before it keeps (a send after a storage write waits for it)', () => {
    const order: string[] = [];
    const base = io();
    room = new RoomCore({ ...base, save: (r) => void (order.push('saved'), saved.push(r)) });
    const a = join(KEY_A), b = join(KEY_B);
    const send = b.send.bind(b);
    b.send = (d: string) => void (order.push('sent'), send(d));
    say(a, { kind: 'catch', what: 'koi', id: 'fish:1', how: 'rod' });
    expect(order).toEqual(['sent', 'saved']);
  });

  it('a walk carries the very walk: where from, the way, when it set off and how long', () => {
    const a = join(KEY_A), b = join(KEY_B);
    say(a, { kind: 'walk', to: [195, 900], from: [132, 214], via: [[160, 400], [190, 700]], s: now - 30, ms: 2400, f: 'home' });
    expect(b.sent.at(-1)).toMatchObject({ kind: 'walk', to: [195, 900], from: [132, 214], via: [[160, 400], [190, 700]], s: now - 30, ms: 2400, f: 'home', who: 'A' });
    const n = b.sent.length;
    say(a, { kind: 'walk', to: [195, 900], via: Array.from({ length: 13 }, () => [1, 1]) });
    say(a, { kind: 'walk', to: [195, 900], ms: 60_001 });
    expect(b.sent.length).toBe(n);
  });

  it('a hello gets the day in replay messages (mine too, in order, within REPLAY_BYTES each)', () => {
    const a = join(KEY_A);
    for (let i = 0; i < 300; i++) {
      say(a, { kind: 'pick', id: `p${i}`, what: 'find:shell:cowrie', at: [150, 40], c: i + 1 });
      now += 60;
    }
    const b = join(KEY_B);
    say(b, { kind: 'walk', to: [262, 300] });
    bye(b);
    const b2 = join(KEY_B, 0);
    const replays = b2.raw.filter((m) => m.kind === 'replay') as unknown as { es: { kind: string; who: string; c?: number }[] }[];
    expect(replays.length).toBeGreaterThan(1);
    const es = replays.flatMap((r) => r.es);
    expect(es).toHaveLength(301);
    expect(es.at(-1)).toMatchObject({ kind: 'walk', who: 'B' });
    expect(es.some((e) => e.c !== undefined)).toBe(false);
    for (const r of replays) expect(JSON.stringify(r).length).toBeLessThanOrEqual(16_000);
    expect(b2.raw[0].kind).toBe('welcome');
  });

  it('at most one nest per tree per hour', () => {
    const a = join(KEY_A);
    const b = join(KEY_B);
    say(a, { kind: 'shake', tree: 'oak-k1', drop: 'nest' });
    now += 30 * 60_000;
    say(b, { kind: 'shake', tree: 'oak-k1', drop: 'nest' }); // half an hour on: refused
    say(b, { kind: 'shake', tree: 'cedar-k1', drop: 'nest' }); // another tree: fine
    now += 30 * 60_000;
    say(b, { kind: 'shake', tree: 'oak-k1', drop: 'nest' }); // the hour is up
    expect(a.sent.filter((m) => m.kind === 'shake').map((m) => (m as { tree: string }).tree)).toEqual(['cedar-k1', 'oak-k1']);
    // the rule survives a restart
    room = new RoomCore(io(), saved.at(-1) as never);
    const a2 = join(KEY_A);
    const b2 = join(KEY_B);
    a2.sent = [];
    now += 10 * 60_000;
    say(b2, { kind: 'shake', tree: 'oak-k1', drop: 'nest' });
    say(b2, { kind: 'shake', tree: 'oak-k1', drop: 'branch' });
    expect(a2.sent.map((m) => (m as { drop: string }).drop)).toEqual(['branch']);
  });

  it('a new Tokyo day forgets yesterday’s claims, and keeps each person’s last walk (stamped into today)', () => {
    const a = join(KEY_A);
    const b = join(KEY_B);
    say(a, { kind: 'pick', id: 'f1', what: 'fossil:amber' });
    say(a, { kind: 'walk', to: [100, 500] });
    say(a, { kind: 'walk', to: [120, 520] });
    say(b, { kind: 'walk', to: [300, 700] });
    now = Date.UTC(2026, 10, 1, 15); // 2026-11-02 00:00 Tokyo
    b.sent = [];
    say(a, { kind: 'pick', id: 'f1', what: 'fossil:ammonite' }); // today's f1 is another dig spot
    expect(b.sent.map((m) => m.kind)).toEqual(['pick']);
    // a phone opening today (from Tokyo midnight) hears where each villager was left, however long ago (carried in as
    // the day's first changes)
    const b2 = join(KEY_B, now - 1);
    expect(b2.kinds()).toEqual(['welcome', 'walk', 'walk', 'pick']);
    const walks = b2.sent.filter((m) => m.kind === 'walk') as { who: string; to: unknown; t: number }[];
    expect(walks.map((m) => [m.who, m.to]).sort()).toEqual([['A', [120, 520]], ['B', [300, 700]]]);
    expect(walks.every((m) => m.t >= now)).toBe(true);
    // days later, after a restart, still there (and a walk of today's replaces it as ever)
    room = new RoomCore(io(), saved.at(-1) as never);
    now += 3 * 86_400_000;
    const a2 = join(KEY_A, now - 1);
    expect(a2.sent.filter((m) => m.kind === 'walk' && (m as { who: string }).who === 'B').map((m) => (m as { to: unknown }).to)).toEqual([[300, 700]]);
    say(a2, { kind: 'walk', to: [140, 540] });
    const b3 = join(KEY_B, now - 1);
    expect(b3.sent.filter((m) => m.kind === 'walk' && (m as { who: string }).who === 'A').map((m) => (m as { to: unknown }).to)).toEqual([[140, 540]]);
  });

  it('a walk outlasts a busy day: past RING_MAX the oldest other change goes, never a walk', () => {
    const a = join(KEY_A);
    say(a, { kind: 'walk', to: [100, 500] });
    for (let i = 0; i < RING_MAX + 10; i++) {
      now += 100;
      say(a, { kind: 'world', op: 'watered', id: `w${i}` });
    }
    const ring = saved.at(-1) as { kind: string; id?: string }[];
    expect(ring).toHaveLength(RING_MAX);
    expect(ring[0].kind).toBe('walk');
    expect(ring[1].id).toBe('w11');
  });

  it('a claim outlives the ring: one pick, 400 more changes and a restart, and a second pick of it is refused', () => {
    // 2026-11-05 review: past RING_MAX the pick was trimmed, and claims were rebuilt from the ring alone after a wake
    let day: unknown = null;
    room = new RoomCore({ ...io(), saveDay: (d) => void (day = structuredClone(d)) });
    const a = join(KEY_A);
    say(a, { kind: 'pick', id: 's4560', what: 'shell:conch', at: [150, 40], c: 1 });
    for (let i = 0; i < RING_MAX; i++) {
      now += 100;
      say(a, { kind: 'world', op: 'watered', id: `w${i}` });
    }
    say(a, { kind: 'shake', tree: 'oak-p1', drop: 'nest', c: 2 });
    for (let i = 0; i < RING_MAX; i++) {
      now += 100;
      say(a, { kind: 'world', op: 'wished', id: `x${i}` });
    }
    // the hibernation wake: the ring as saved, and the day's claims and nests
    socks = [];
    room = new RoomCore({ ...io(), saveDay: (d) => void (day = structuredClone(d)) }, saved.at(-1) as never, null, {}, {}, null, day as never);
    const b = join(KEY_B, 0);
    b.sent = [];
    say(b, { kind: 'pick', id: 's4560', what: 'shell:conch', at: [150, 40], c: 9 });
    expect(b.sent).toEqual([{ v: 3, kind: 'ack', c: 9, t: expect.any(Number), ok: false }]);
    say(b, { kind: 'shake', tree: 'oak-p1', drop: 'nest', c: 10 });
    expect(b.sent.at(-1)).toMatchObject({ kind: 'ack', c: 10, ok: false });
    // its sender's resend of the very pick (an ack lost with the socket) is still acked, never relayed again
    const a2 = join(KEY_A);
    b.sent = [];
    say(a2, { kind: 'pick', id: 's4560', what: 'shell:conch', at: [150, 40], c: 1 });
    expect(a2.sent.at(-1)).toMatchObject({ kind: 'ack', c: 1, ok: true });
    expect(b.sent).toEqual([]);
    // the next Tokyo day forgets them
    now = Date.UTC(2026, 10, 1, 15, 1);
    say(b, { kind: 'pick', id: 's4560', what: 'shell:conch', at: [150, 40], c: 11 });
    expect(b.sent.at(-1)).toMatchObject({ kind: 'ack', c: 11, ok: true });
  });

  it('past RING_MAX the oldest change that claims nothing goes first', () => {
    const a = join(KEY_A);
    say(a, { kind: 'catch', what: 'tarantula', id: 'bug:77', at: [60, 300], how: 'net' });
    for (let i = 0; i < RING_MAX; i++) {
      now += 100;
      say(a, { kind: 'world', op: 'watered', id: `w${i}` });
    }
    const ring = saved.at(-1) as { kind: string; id?: string }[];
    expect(ring).toHaveLength(RING_MAX);
    expect(ring[0]).toMatchObject({ kind: 'catch', id: 'bug:77' });
    expect(ring[1].id).toBe('w1');
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
      const out = JSON.stringify({ v: 3, ...m });
      expect(out.length, out).toBeLessThanOrEqual(100);
      expect(JSON.stringify({ v: 3, ...m, who: 'A', t }).length).toBeLessThanOrEqual(140);
    }
  });
});

describe('high-fives (the relay only, never the record)', () => {
  const fives = (s: FakeSock) => s.sent.filter((m) => m.kind === 'highfive');
  beforeEach(() => {
    now = Date.UTC(2026, 10, 1, 3);
    room = new RoomCore(io());
  });

  it('goes live to the partner (acked to the sender), and nothing is held or kept', () => {
    const a = join(KEY_A, 0), b = join(KEY_B, 0);
    a.sent = [];
    say(a, { kind: 'highfive', at: now - 20, c: 7 });
    expect(fives(b)).toEqual([{ v: 3, kind: 'highfive', at: now - 20, who: 'A', t: now }]);
    expect(a.sent).toEqual([{ v: 3, kind: 'ack', c: 7, t: now, ok: true }]);
    expect(held).toEqual({});
    expect(saved).toEqual([]);
  });

  it('with the partner away, the last one is held for them, handed over at each hello until their phone says got', () => {
    const a = join(KEY_A, 0);
    say(a, { kind: 'highfive', at: now - 5000, c: 1 });
    now += 60_000;
    say(a, { kind: 'highfive', at: now - 10, c: 2 }); // a newer one replaces it
    expect(held).toEqual({ 'A>B': { from: 'A', to: 'B', at: now - 10, t: now } });
    const at = now - 10;
    now += 3600_000;
    const b = join(KEY_B, 0);
    expect(b.kinds()).toEqual(['welcome', 'highfive']);
    expect(fives(b)).toEqual([{ v: 3, kind: 'highfive', at, who: 'A', t: at + 10, to: 'B' }]);
    bye(b);
    const b2 = join(KEY_B, 0); // never said got: again
    expect(fives(b2)).toHaveLength(1);
    say(b2, { kind: 'got', at: at - 1 }); // not this one
    expect(held['A>B']).toBeDefined();
    say(b2, { kind: 'got', at });
    expect(held).toEqual({});
    bye(b2);
    expect(fives(join(KEY_B, 0))).toEqual([]);
    expect(fives(a)).toEqual([]); // never back to its sender
  });

  it('survives a restart and is let go after a day', () => {
    const a = join(KEY_A, 0);
    say(a, { kind: 'highfive', at: now });
    expect(held['A>B']?.at).toBe(now);
    room = new RoomCore(io(), [], null, held); // the Durable Object woke again
    expect(fives(join(KEY_B, 0))).toHaveLength(1);
    socks = [];
    room = new RoomCore(io(), [], null, held);
    now += 24 * 3600_000 + 1;
    expect(fives(join(KEY_B, 0))).toEqual([]);
    expect(held).toEqual({});
  });

  it('a resend of the same numbered high-five (its ack lost with the socket) is acked again, never delivered twice', () => {
    // 2026-11-05 review: a high-five is acked but not kept, so the resend check (the ring's) never knew it
    const a = join(KEY_A, 0), b = join(KEY_B, 0);
    say(a, { kind: 'highfive', at: now - 20, c: 7 });
    const t = now;
    bye(a);
    now += 2000;
    const a2 = join(KEY_A, 0);
    say(a2, { kind: 'highfive', at: t - 20, c: 7 });
    expect(fives(b)).toHaveLength(1);
    expect(a2.sent.at(-1)).toEqual({ v: 3, kind: 'ack', c: 7, t, ok: true });
    // another one with the same number but another tap (another phone of mine) is its own
    say(a2, { kind: 'highfive', at: now, c: 7 });
    expect(fives(b)).toHaveLength(2);
  });

  it('remembers what it acked across a restart (a wake), so the resend after it is still acked, not delivered twice', () => {
    // 2026-11-05 relay review R2: the memory was the object's, gone with a hibernation's wake
    let kept: unknown = null;
    room = new RoomCore({ ...io(), saveAcked: (x) => void (kept = structuredClone(x)) });
    const a = join(KEY_A, 0);
    join(KEY_B, 0);
    say(a, { kind: 'highfive', at: now - 20, c: 7 });
    const t = now;
    // the room wakes from hibernation: a new object with what it saved
    now += 2000;
    room = new RoomCore(io(), [], null, {}, {}, null, null, null, kept as never);
    socks = [];
    const b2 = join(KEY_B, 0), a2 = join(KEY_A, 0);
    say(a2, { kind: 'highfive', at: t - 20, c: 7 });
    expect(fives(b2)).toEqual([]);
    expect(a2.sent.at(-1)).toEqual({ v: 3, kind: 'ack', c: 7, t, ok: true });
  });

  it('refuses a bad time', () => {
    const a = join(KEY_A, 0), b = join(KEY_B, 0);
    b.sent = [];
    say(a, { kind: 'highfive', at: -1 });
    expect(fives(b)).toEqual([]);
  });
});

describe('the real weather (wx)', () => {
  const H = 3600_000;
  const at = 1_793_786_400_000; // 2026-11-04 10:00 UTC
  const wx: Wx = { h0: at / H, s: 'rrrooc', fx: [3], at: at - 60_000, src: 'om', rev: 4 };

  it('goes after the welcome, then to every phone when it changes', () => {
    now = at + 5 * 60_000;
    const hellos: unknown[][] = [];
    room = new RoomCore({ ...io(), onHello: (...a) => void hellos.push(a) }, [], null, {}, {}, wx);
    const a = join(KEY_A);
    expect(a.kinds().slice(0, 2)).toEqual(['welcome', 'wx']);
    expect(a.sent[1]).toEqual({ v: 3, kind: 'wx', ...wx, t: now });
    expect(parseServer(JSON.stringify(a.sent[1]))).toEqual({ v: 3, kind: 'wx', ...wx, t: now });
    // whose, the version and the build (none here), for the log's ws.hello
    expect(hellos).toEqual([['A', 3, undefined]]);
    const next: Wx = { ...wx, s: 'rrhhhh', rev: 5 };
    expect([room.setWx(next, false), a.kinds().filter((k) => k === 'wx').length]).toEqual([0, 1]); // kept, not sent
    const b = join(KEY_B);
    expect(room.setWx(next, true)).toBe(2);
    expect(a.sent.at(-1)).toMatchObject({ kind: 'wx', s: 'rrhhhh', rev: 5 });
    expect(b.sent.at(-1)).toMatchObject({ kind: 'wx', s: 'rrhhhh', rev: 5 });
    // a phone opening later gets the newest
    expect(join(KEY_A).sent[1]).toMatchObject({ kind: 'wx', rev: 5 });
  });

  it('says whose hello it welcomed, in which version and from which build', () => {
    const hellos: unknown[][] = [];
    room = new RoomCore({ ...io(), onHello: (...a) => void hellos.push(a) });
    const s = join();
    room.message(s, JSON.stringify({ v: 3, kind: 'hello', key: KEY_B, build: '2026-11-05.ef93d8b' }));
    expect(hellos).toEqual([['B', 3, '2026-11-05.ef93d8b']]);
    // an unknown key is never welcomed: nothing said
    join('f'.repeat(32));
    expect(hellos).toHaveLength(1);
  });

  it('a timeline that no longer covers the hour, or 36 hours old, is never sent', () => {
    room = new RoomCore(io(), [], null, {}, {}, wx);
    now = at + 6 * H; // past its six hours
    expect(join(KEY_A).kinds()).toEqual(['welcome']);
    expect(room.setWx(wx, true)).toBe(0);
    room = new RoomCore(io(), [], null, {}, {}, { ...wx, s: 'c'.repeat(36), at: at - 37 * H, h0: at / H - 37 });
    now = at;
    expect(join(KEY_B).kinds()).toEqual(['welcome']);
  });
});
