// The field's writes (store/farm.svelte.ts): a farm op joins the held batch (its queued event's data replaced: one send
// a batch) within its hold, up to FARM.batchMax; a dig's 取り消す takes it back out; the pick is this phone's, the
// demo's apart.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { configureStorage, type KV } from '#lib/sync/storage.ts';
import { FARM, type FarmOp } from '#lib/contract/farm.ts';

/** A send as the queue holds it: kept until `at + holdMs`, its undo false from then on (sent). */
interface Held { type: string; data: { ops: FarmOp[] }; holdMs: number; at: number; undone: boolean; replaced: number }
const fake = vi.hoisted(() => ({ week: { demo: false as false | 'plain', model: {} as object | null, send: (() => ({ ok: false })) as (...a: never[]) => unknown } }));
vi.mock('./week.svelte.ts', () => fake);
const { dig, digMany, harvestMany, pickSeed, plant, plantMany, seed, water } = await import('./farm.svelte.ts');

class Mem implements KV {
  m = new Map<string, string>();
  getItem(k: string) { return this.m.get(k) ?? null; }
  setItem(k: string, v: string) { this.m.set(k, v); }
  removeItem(k: string) { this.m.delete(k); }
}

const T0 = Date.UTC(2026, 10, 4, 3); // 2026-11-04 12:00 Tokyo
let sends: Held[], hour = 0;
/** The events the record gets: those held to the end, not taken back. */
const sent = () => sends.filter((s) => !s.undone && Date.now() >= s.at + s.holdMs).map((s) => s.data);
const p = (i: number) => `fd:field-A.${i % 10}.${Math.floor(i / 10)}`;

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(T0 + hour++ * 3_600_000); // the module's held batch from the test before long sent
  sends = [];
  fake.week.demo = false;
  fake.week.send = ((type: string, data: Held['data'], opts: { holdMs?: number }) => {
    const s: Held = { type, data, holdMs: opts.holdMs ?? 0, at: Date.now(), undone: false, replaced: 0 };
    sends.push(s);
    const held = () => !s.undone && Date.now() < s.at + s.holdMs;
    return {
      ok: true,
      undo: () => (held() ? (s.undone = true) : false),
      // (live.ts: as long as allowed, 2 min, or `ms` from now)
      hold: (ms: number | null) => (held() ? ((s.holdMs = Date.now() - s.at + (ms ?? 120_000)), ms ?? 120_000) : 0),
      replace: (data: Held['data'], ms: number) => held() && ((s.data = data), (s.holdMs = Date.now() - s.at + ms), ++s.replaced > 0)
    };
  }) as never;
});
afterEach(() => vi.useRealTimers());

describe('the farm batch', () => {
  it('taps within 2 s of each other are one event; one after the hold starts the next', () => {
    plant(p(0), 'tomato', 'start');
    vi.advanceTimersByTime(1500);
    plant(p(1), 'tomato', 'start');
    vi.advanceTimersByTime(1900);
    harvestMany([{ p: p(2), n: 3 }]);
    // the second held 2 s from its own tap: the third (3.4 s on) joins it; one queued event, its data replaced
    expect(sends.map((s) => [s.undone, s.replaced, s.holdMs])).toEqual([[false, 2, 5400]]);
    vi.advanceTimersByTime(2000);
    harvestMany([{ p: p(3), n: 1 }]);
    vi.advanceTimersByTime(2000);
    expect(sent()).toEqual([
      { ops: [{ o: 'plant', p: p(0), c: 'tomato', src: 'start' }, { o: 'plant', p: p(1), c: 'tomato', src: 'start' }, { o: 'harvest', p: p(2), n: 3 }] },
      { ops: [{ o: 'harvest', p: p(3), n: 1 }] }
    ]);
  });

  it('a harvest tap’s 3 × 3 is one replace of the held batch, its ops in order; the first tap its one send', () => {
    harvestMany([{ p: p(0), n: 3 }, { p: p(1), n: 2 }, { p: p(2), n: 1 }]);
    expect(sends.map((s) => s.replaced)).toEqual([0]);
    vi.advanceTimersByTime(500);
    harvestMany([{ p: p(10), n: 3 }, { p: p(11), n: 3 }]);
    expect(sends.map((s) => s.replaced)).toEqual([1]);
    vi.advanceTimersByTime(2000);
    expect(sent()).toEqual([{ ops: [0, 1, 2, 10, 11].map((i, k) => ({ o: 'harvest', p: p(i), n: [3, 2, 1, 3, 3][k] })) }]);
  });

  it(`holds at most FARM.batchMax (${FARM.batchMax}) ops: the next starts its own`, () => {
    for (let i = 0; i <= FARM.batchMax; i++) plant(p(i), 'tomato', 'start');
    vi.advanceTimersByTime(2000);
    expect(sent().map((e) => e.ops.length)).toEqual([FARM.batchMax, 1]);
  });

  it('a dig is held 4 s (UNDO_MS); its 取り消す sends the rest again, held what was left of theirs', () => {
    plant(p(0), 'tomato', 'start');
    vi.advanceTimersByTime(500);
    const r = dig(p(1));
    expect(r.ok).toBe(true);
    vi.advanceTimersByTime(500);
    expect(r.undo!()).toBe(true);
    const again = sends.at(-1)!;
    expect(again.data.ops).toEqual([{ o: 'plant', p: p(0), c: 'tomato', src: 'start' }]);
    expect([sends.length, again.holdMs]).toEqual([1, 4500]); // the one event, still the dig's 4 s from 500 ms on
    // the batch goes on: a tap joins the one sent again
    plant(p(2), 'tomato', 'start');
    vi.advanceTimersByTime(5000);
    expect(sent()).toEqual([{ ops: [{ o: 'plant', p: p(0), c: 'tomato', src: 'start' }, { o: 'plant', p: p(2), c: 'tomato', src: 'start' }] }]);
  });

  it('a dig alone, taken back: nothing sent', () => {
    const r = dig(p(0));
    expect(r.undo!()).toBe(true);
    vi.advanceTimersByTime(5000);
    expect(sent()).toEqual([]);
  });

  it('a dig’s 取り消す fails once it was sent, and the dig stays', () => {
    const r = dig(p(0));
    vi.advanceTimersByTime(5000);
    expect(r.undo!()).toBe(false);
    expect(sent()).toEqual([{ ops: [{ o: 'dig', p: p(0) }] }]);
  });
});

describe('the batches held for 取り消す (a plot’s 3 × 3 planted, a dig, the shop’s 苗に戻す)', () => {
  const plants = (ks: number[]) => ks.map((k) => ({ o: 'plant', p: p(k), c: 'tomato', src: 'start' }));
  it('join a tap’s held batch; their 取り消す takes back only theirs, the tap’s goes', () => {
    plant(p(0), 'tomato', 'start');
    const r = plantMany([p(1), p(2)], 'tomato', 'start');
    expect(sends.at(-1)!.data.ops).toHaveLength(3);
    expect(sends.at(-1)!.holdMs).toBe(4000);
    expect(r.undo!()).toBe(true);
    vi.advanceTimersByTime(5000);
    expect(sent()).toEqual([{ ops: plants([0]) }]);
  });
  it('a batch past the held one’s room is its own event; the plan’s 40 plants one, taken back whole', () => {
    plant(p(0), 'tomato', 'start');
    const r = plantMany(Array.from({ length: FARM.batchMax }, (_, k) => p(k + 1)), 'tomato', 'start');
    expect(sends.at(-1)!.data.ops).toHaveLength(FARM.batchMax);
    expect(r.undo!()).toBe(true);
    vi.advanceTimersByTime(5000);
    expect(sent()).toEqual([{ ops: plants([0]) }]);
  });
  it('a 取り消す takes its own back while their event is held, after a later batch started its own', () => {
    const r = dig(p(0));
    plantMany(Array.from({ length: FARM.batchMax }, (_, k) => p(k + 1)), 'tomato', 'start');
    expect(r.undo!()).toBe(true);
    vi.advanceTimersByTime(5000);
    expect(sent().map((e) => e.ops.length)).toEqual([FARM.batchMax]);
  });
  it('its banner held (a finger on it) holds the batch, a tap meanwhile joining it held still; let go, it goes', () => {
    const r = plantMany([p(1)], 'tomato', 'start');
    expect(r.hold!(null)).toBe(120_000);
    vi.advanceTimersByTime(10_000);
    plant(p(0), 'tomato', 'start');
    expect([sends.length, sends[0].holdMs]).toEqual([1, 120_000]); // the hold's end unmoved
    vi.advanceTimersByTime(10_000);
    expect(sent()).toEqual([]);
    expect(r.hold!(0)).toBe(0);
    expect(sent()).toEqual([{ ops: [...plants([1]), ...plants([0])] }]);
    expect(r.undo!()).toBe(false);
  });
  it('digMany: the plants off the field back to starts, one event', () => {
    digMany([p(0), p(1)]);
    vi.advanceTimersByTime(5000);
    expect(sent()).toEqual([{ ops: [{ o: 'dig', p: p(0) }, { o: 'dig', p: p(1) }] }]);
  });
  it('water: a tap’s plants to water join the held batch, one event; none, nothing sent', () => {
    expect(water([]).ok).toBe(false);
    water([p(0), p(1)]);
    vi.advanceTimersByTime(1000);
    plant(p(2), 'tomato', 'start');
    water([p(3)]);
    vi.advanceTimersByTime(2000);
    expect(sends).toHaveLength(1);
    expect(sent()).toEqual([{ ops: [{ o: 'water', p: p(0) }, { o: 'water', p: p(1) }, { o: 'plant', p: p(2), c: 'tomato', src: 'start' }, { o: 'water', p: p(3) }] }]);
  });
});

describe('the pick (たね)', () => {
  it('is kept on this phone; the demo’s apart from the app’s', () => {
    const kv = new Mem();
    configureStorage({ local: kv });
    pickSeed({ c: 'carrot', src: 'start' });
    expect(seed.pick).toEqual({ c: 'carrot', src: 'start' });
    fake.week.demo = 'plain';
    expect(seed.pick).toBeNull();
    pickSeed({ c: 'wheat', src: 'crop' });
    expect(seed.pick).toEqual({ c: 'wheat', src: 'crop' });
    fake.week.demo = false;
    expect(seed.pick).toEqual({ c: 'carrot', src: 'start' });
    expect([...kv.m.keys()].sort()).toEqual(['farm.seed', 'island-demo.farm.seed']);
  });
});
