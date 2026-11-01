import { describe, expect, it } from 'vitest';
import { RoomCore, type Meta } from '../../../../relay/src/room.ts';
import { dayStart, parseServer, tokyoDay, type Intent, type Relayed, type Who } from './live-protocol.ts';
import { apply, applyRow, emptyDay, lying, rowOf, taken, takenIds, caught, wishesFor, type DayEvent, type WorldDay } from './world-day.ts';

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
    if (m && 'who' in m && m.kind !== 'presence' && m.kind !== 'changed') this.inbox.push(m as Relayed);
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
    save: () => {}
  });
  class Phone {
    day: WorldDay = emptyDay(DAY);
    mine: DayEvent[] = [];
    sock: Sock | null = null;
    lost: string[] = [];
    constructor(public who: Who) {}
    open(since = dayStart(DAY)) {
      const s = new Sock();
      socks.push(s);
      room.open(s);
      room.message(s, JSON.stringify({ v: 2, kind: 'hello', key: this.who === 'A' ? KEY_A : KEY_B, since }));
      this.sock = s;
      this.drain();
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
      if (this.sock) room.message(this.sock, JSON.stringify({ v: 2, ...i }));
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

  it('ignores another day’s changes, and repeats', () => {
    const d = emptyDay(DAY);
    expect(apply(d, { kind: 'pick', id: 'w1', what: 'weed', who: 'A', t: dayStart(DAY) - 1 }, 'B').fresh).toBe(false);
    const e: DayEvent = { kind: 'pick', id: 'w1', what: 'weed', who: 'A', t: T0 };
    expect(apply(d, e, 'B').fresh).toBe(true);
    expect(apply(d, e, 'B').fresh).toBe(false);
    expect(apply(d, { kind: 'walk', to: [1, 2], who: 'A', t: T0 }, 'B').fresh).toBe(true);
    expect(apply(d, { kind: 'walk', to: [3, 4], who: 'A', t: T0 - 5 }, 'B').fresh).toBe(false); // an older one
  });
});
