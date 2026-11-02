import { describe, expect, it } from 'vitest';
import { RoomCore, type Meta } from '../../../../relay/src/room.ts';
import { dayStart, parseServer, tokyoDay, type Intent, type Relayed, type Who } from './live-protocol.ts';
import { apply, applyRow, canonical, emptyDay, hash, lying, rowOf, taken, takenIds, caught, wishesFor, type DayEvent, type WorldDay } from './world-day.ts';

const KEY_A = 'a1'.repeat(16);
const KEY_B = 'b2'.repeat(16);
const T0 = Date.UTC(2026, 10, 1, 3); // 2026-11-01 12:00 Tokyo
const DAY = tokyoDay(T0);

/** A socket of the simulated room: what the relay sends it lands in its phone's inbox. */
class Sock {
  meta: Meta | null = null;
  inbox: Relayed[] = [];
  closed = false;
  send(d: string) {
    const m = parseServer(d);
    if (m?.kind === 'replay') this.inbox.push(...m.es);
    else if (m && 'who' in m && m.kind !== 'presence' && m.kind !== 'changed') this.inbox.push(m as Relayed);
  }
  close() {
    this.closed = true;
  }
}

/** The real room (relay/src/room.ts) on a fake clock, two phones folding their own changes and the partner's. */
function island() {
  let clock = T0;
  const socks: Sock[] = [];
  const room = new RoomCore<Sock>({
    sockets: () => socks.filter((s) => !s.closed),
    meta: (s) => s.meta,
    setMeta: (s, m) => void (s.meta = m),
    keys: { KEY_A, KEY_B },
    now: () => clock,
    save: () => {},
    hold: () => {}
  });
  class Phone {
    day: WorldDay = emptyDay(DAY);
    mine: DayEvent[] = [];
    sock: Sock | null = null;
    lost: string[] = [];
    /** What I sent, numbered (a resend is the same), and what waits for the socket. */
    sent: { c: number; i: Intent }[] = [];
    waiting: { c: number; i: Intent }[] = [];
    seq = 0;
    constructor(public who: Who) {}
    open(since = dayStart(DAY), batch = false) {
      const s = new Sock();
      socks.push(s);
      room.open(s);
      room.message(s, JSON.stringify({ v: 2, kind: 'hello', key: this.who === 'A' ? KEY_A : KEY_B, since, ...(batch ? { batch } : {}) }));
      this.sock = s;
      this.drain();
      for (const w of this.waiting.splice(0)) this.send(w);
    }
    send(w: { c: number; i: Intent }) {
      if (!this.sock) return void this.waiting.push(w);
      room.message(this.sock, JSON.stringify({ v: 2, c: w.c, ...w.i }));
      this.sent.push(w);
    }
    /** The last `k` sent again, as after a reconnect that missed their acks. */
    resendLast(k: number) {
      for (const w of this.sent.slice(-k)) if (this.sock) room.message(this.sock, JSON.stringify({ v: 2, c: w.c, ...w.i }));
    }
    close() {
      if (!this.sock) return;
      this.sock.closed = true;
      room.close(this.sock);
      this.sock = null;
    }
    /** A change of mine: folded at once (my clock), then sent. */
    act(i: Intent): boolean {
      const e = { ...i, who: this.who, t: clock } as DayEvent;
      const a = apply(this.day, e, this.who);
      if (!a.fresh) return false;
      this.mine.push(e);
      this.send({ c: ++this.seq, i });
      return true;
    }
    /** Fold what the relay sent me (in its order). */
    drain() {
      for (const m of this.sock?.inbox.splice(0) ?? []) {
        const { v: _v, ...e } = m;
        const a = apply(this.day, e as DayEvent, this.who);
        if (a.beat) this.lost.push(`${m.kind}:${(m as { id?: string }).id}`);
      }
    }
  }
  return { A: new Phone('A'), B: new Phone('B'), tick: (ms = 1) => (clock += ms) };
}

/** A day without its claims' and puts' times (two phones stamp their own changes slightly apart). */
const shape = (d: WorldDay) => ({
  claims: Object.fromEntries(Object.entries(d.claims).map(([k, c]) => [k, { who: c.who, what: c.what, how: c.how }])),
  puts: Object.keys(d.puts).sort(),
  shakes: d.shakes.map((s) => [s.tree, s.drop, s.who]),
  watered: d.watered,
  wishes: d.wishes,
  walks: Object.fromEntries(Object.entries(d.walks).map(([w, x]) => [w, x?.to]))
});

describe('the shared day: two phones on the relay', () => {
  it('fold the same island from interleaved changes', () => {
    const { A, B, tick } = island();
    A.open();
    B.open();
    A.act({ kind: 'pick', id: 's1000', what: 'shell:conch', at: [150, 40] });
    tick();
    B.act({ kind: 'catch', what: 'sea-bass', id: 'sea:100', at: [120, -40], how: 'rod' });
    tick();
    B.act({ kind: 'shake', tree: 'oak-p1', drop: 'branch' });
    A.act({ kind: 'world', op: 'watered', id: '0-1' });
    tick();
    A.act({ kind: 'put', id: 'p1', what: 'present', at: [200, 300] });
    B.act({ kind: 'walk', to: [195, 900] });
    tick();
    A.act({ kind: 'walk', to: [100, 500] });
    A.act({ kind: 'world', op: 'wished', id: '2026-11-02' });
    // A has not heard B's yet, nor B A's: then the relay's messages arrive
    A.drain();
    B.drain();
    expect(shape(A.day)).toEqual(shape(B.day));
    expect(takenIds(A.day)).toEqual(new Set(['s1000']));
    expect(caught(B.day, 'sea:100')?.who).toBe('B');
    expect(lying(B.day).map((p) => p.id)).toEqual(['p1']);
    expect(wishesFor(B.day, '2026-11-02')).toBe(1);
    expect(A.day.walks).toMatchObject({ A: { to: [100, 500] }, B: { to: [195, 900] } });
  });

  it('two people tapping the same bug: the relay’s first wins, the other phone sees it caught by them', () => {
    const { A, B, tick } = island();
    A.open();
    B.open();
    // both tap it before either hears the other: B's reaches the relay first
    expect(B.act({ kind: 'catch', what: 'tarantula', id: 'bug:777', at: [60, 300], how: 'net' })).toBe(true);
    expect(A.act({ kind: 'catch', what: 'tarantula', id: 'bug:777', at: [60, 300], how: 'net' })).toBe(true);
    tick();
    A.drain();
    B.drain();
    expect(caught(A.day, 'bug:777')?.who).toBe('B');
    expect(caught(B.day, 'bug:777')?.who).toBe('B');
    expect(A.lost).toEqual(['catch:bug:777']);
    expect(B.lost).toEqual([]);
    // the same with a shell: A's first this time
    A.act({ kind: 'pick', id: 's2000', what: 'shell:cowrie' });
    B.act({ kind: 'pick', id: 's2000', what: 'shell:cowrie' });
    A.drain();
    B.drain();
    expect(taken(A.day, 's2000')?.who).toBe('A');
    expect(taken(B.day, 's2000')?.who).toBe('A');
    expect(B.lost).toEqual(['pick:s2000']);
    // once it's theirs, a tap of mine claims nothing
    expect(B.act({ kind: 'pick', id: 's2000', what: 'shell:cowrie' })).toBe(false);
  });

  it('a scripted session of every kind (conflicts, a dropped socket and its resends, a late join in one replay): the same canonical day on every phone', () => {
    const { A, B, tick } = island();
    A.open();
    B.open();
    const both = () => (A.drain(), B.drain());
    for (let i = 0; i < 40; i++) {
      tick(700);
      const p = i % 3 ? A : B, q = p === A ? B : A;
      const at = T0 + i * 700;
      switch (i % 8) {
        case 0: p.act({ kind: 'catch', what: 'sea-bass', id: `sea:${i}`, at: [120, -60], how: 'rod' }); break;
        case 1: p.act({ kind: 'pick', id: `s${i}`, what: 'find:shell:cowrie', at: [150, 40] }); break;
        case 2: p.act({ kind: 'put', id: `p${p.who.toLowerCase()}${i}`, what: 'present', at: [200, 400] }); break;
        case 3: p.act({ kind: 'shake', tree: `oak-${i}`, drop: 'branch', at }); break;
        case 4: p.act({ kind: 'world', op: 'watered', id: `fl:${i}:500` }); break;
        case 5: p.act({ kind: 'walk', to: [100 + i, 500], from: [132, 214], s: at, ms: 900 }); break;
        case 6: p.act({ kind: 'world', op: 'woke', id: 'gulliver' }); break;
        default: p.act({ kind: 'world', op: 'wished', id: '2026-11-02' });
      }
      // now and then both tap the same thing at once (the relay's first wins)
      if (i % 5 === 0) {
        p.act({ kind: 'pick', id: `both${i}`, what: 'weed' });
        q.act({ kind: 'pick', id: `both${i}`, what: 'weed' });
      }
      if (i % 2) both();
      // B's socket drops for a stretch: what it does meanwhile goes after it's back (a resend of one the relay has is
      // acked, not kept twice)
      if (i === 20) B.close();
      if (i === 26) {
        B.open(T0);
        B.resendLast(4);
      }
    }
    both();
    const C = new (Object.getPrototypeOf(B).constructor)('B') as typeof B;
    C.open(dayStart(DAY), true);
    const hashes = [A, B, C].map((p) => hash(canonical(p.day)));
    expect(new Set(hashes).size).toBe(1);
    expect(Object.keys(A.day.claims).length).toBeGreaterThan(10);
    expect(A.day.woke.gulliver).toBeDefined();
  });

  it('a phone opening later puts today’s island back together from the relay (and its own changes)', () => {
    const { A, B, tick } = island();
    A.open();
    B.open();
    for (let i = 0; i < 30; i++) {
      tick(1000);
      const p = i % 2 ? A : B;
      p.act({ kind: 'pick', id: `w${i}`, what: 'weed' });
      if (i % 5 === 0) p.act({ kind: 'shake', tree: `oak-${i}`, drop: i % 10 ? 'branch' : 'nest' });
      if (i % 7 === 0) p.act({ kind: 'walk', to: [100 + i, 500] });
    }
    A.drain();
    B.drain();
    // B's phone reloads with nothing but its own kept changes; the relay replays A's
    const B2 = new (Object.getPrototypeOf(B).constructor)('B') as typeof B;
    for (const e of B.mine) apply(B2.day, e, 'B');
    B.close();
    B2.open();
    expect(shape(B2.day)).toEqual(shape(A.day));
    // and with the relay gone (both apps were closed, the relay had an outage): the sheet's two day rows
    const fresh = emptyDay(DAY);
    applyRow(fresh, rowOf(A.day, 'A'), 'A', T0 + 60_000, 'B');
    applyRow(fresh, rowOf(B.day, 'B'), 'B', T0 + 60_000, 'B');
    expect(takenIds(fresh)).toEqual(takenIds(A.day));
    expect(fresh.shakes.map((s) => [s.tree, s.drop, s.who])).toEqual(A.day.shakes.map((s) => [s.tree, s.drop, s.who]));
    expect(fresh.walks.A?.to).toEqual(A.day.walks.A?.to);
  });

  it('the relay refuses a second nest from a tree within the hour, so the phones agree on it', () => {
    const { A, B, tick } = island();
    A.open();
    B.open();
    A.act({ kind: 'shake', tree: 'oak-k1', drop: 'nest' });
    tick(10 * 60_000);
    B.drain();
    B.act({ kind: 'shake', tree: 'cedar-k1', drop: 'nest' });
    A.drain();
    expect(A.day.shakes.map((s) => s.tree)).toEqual(['oak-k1', 'cedar-k1']);
    expect(shape(A.day)).toEqual(shape(B.day));
  });

  it('a phone opening later folds a row written before its writer lost a race, then the relay’s winner: the winner’s', () => {
    // A and B grab the same weed at once; the relay keeps B's. A's row went to the sheet before A heard it lost.
    const staleA = { taken: ['w1'], puts: [], shakes: [], watered: [], wishes: {} };
    for (const me of ['A', 'B'] as const) {
      const d = emptyDay(DAY);
      applyRow(d, staleA, 'A', T0 + 500, me);
      expect(apply(d, { kind: 'pick', id: 'w1', what: 'weed', who: 'B', t: T0 }, me).fresh).toBe(true);
      expect(taken(d, 'w1')?.who, me).toBe('B');
      // the replay again changes nothing
      expect(apply(d, { kind: 'pick', id: 'w1', what: 'weed', who: 'B', t: T0 }, me).fresh).toBe(false);
    }
  });

  it('ignores another day’s changes, and repeats', () => {
    const d = emptyDay(DAY);
    expect(apply(d, { kind: 'pick', id: 'w1', what: 'weed', who: 'A', t: dayStart(DAY) - 1 }, 'B').fresh).toBe(false);
    const e: DayEvent = { kind: 'pick', id: 'w1', what: 'weed', who: 'A', t: T0 };
    expect(apply(d, e, 'B').fresh).toBe(true);
    expect(apply(d, e, 'B').fresh).toBe(false);
    expect(apply(d, { kind: 'walk', to: [1, 2], who: 'A', t: T0 }, 'B').fresh).toBe(true);
    expect(apply(d, { kind: 'walk', to: [3, 4], who: 'A', t: T0 - 5 }, 'B').fresh).toBe(false); // an older one
  });

  it('a sleeping visitor woken by either of us is up on both phones, once (by whoever woke him first)', () => {
    const { A, B, tick } = island();
    A.open();
    B.open();
    expect(A.act({ kind: 'world', op: 'woke', id: 'gulliver' })).toBe(true);
    tick();
    B.drain();
    expect(B.act({ kind: 'world', op: 'woke', id: 'gulliver' })).toBe(false);
    expect(A.day.woke).toEqual({ gulliver: 'A' });
    expect(B.day.woke).toEqual({ gulliver: 'A' });
  });
});
