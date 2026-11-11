// The fields' writes (store/farm.svelte.ts): a farm op joins the held batch of its day (taken back and sent again with
// it) within its hold, up to FARM.batchMax; a dig's 取り消す takes it back out; the pick is this phone's, the demo's apart.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { configureStorage, type KV } from '#lib/sync/storage.ts';
import { FARM, type FarmOp } from '#lib/contract/farm.ts';

/** A send as the queue holds it: kept until `at + holdMs`, its undo false from then on (sent). */
interface Held { type: string; data: { d: string; ops: FarmOp[] }; holdMs: number; at: number; undone: boolean }
const fake = vi.hoisted(() => ({ week: { demo: false as false | 'plain', model: {} as object | null, send: (() => ({ ok: false })) as (...a: never[]) => unknown } }));
vi.mock('./week.svelte.ts', () => fake);
const { dig, digMany, harvest, harvestAll, pickSeed, plant, plantMany, seed, waterAll } = await import('./farm.svelte.ts');
const { world } = await import('./world.svelte.ts');

class Mem implements KV {
  m = new Map<string, string>();
  getItem(k: string) { return this.m.get(k) ?? null; }
  setItem(k: string, v: string) { this.m.set(k, v); }
  removeItem(k: string) { this.m.delete(k); }
}

const T0 = Date.UTC(2026, 10, 4, 3); // 2026-11-04 12:00 Tokyo
const D = '2026-11-04', D2 = '2026-11-05';
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
    const s: Held = { type, data, holdMs: opts.holdMs ?? 0, at: Date.now(), undone: false };
    sends.push(s);
    const held = () => !s.undone && Date.now() < s.at + s.holdMs;
    return {
      ok: true,
      undo: () => (held() ? (s.undone = true) : false),
      // (live.ts: as long as allowed, 2 min, or `ms` from now)
      hold: (ms: number | null) => (held() ? ((s.holdMs = Date.now() - s.at + (ms ?? 120_000)), ms ?? 120_000) : 0)
    };
  }) as never;
});
afterEach(() => vi.useRealTimers());

describe('the farm batch', () => {
  it('taps within 2 s of each other are one event; one after the hold starts the next', () => {
    plant(D, p(0), 'tomato', 'start');
    vi.advanceTimersByTime(1500);
    plant(D, p(1), 'tomato', 'start');
    vi.advanceTimersByTime(1900);
    harvest(D, p(2), 3);
    // the second held 2 s from its own tap: the third (3.4 s on) joins it
    expect(sends.map((s) => s.undone)).toEqual([true, true, false]);
    vi.advanceTimersByTime(2000);
    harvest(D, p(3), 1);
    vi.advanceTimersByTime(2000);
    expect(sent()).toEqual([
      { d: D, ops: [{ o: 'plant', p: p(0), c: 'tomato', src: 'start' }, { o: 'plant', p: p(1), c: 'tomato', src: 'start' }, { o: 'harvest', p: p(2), n: 3 }] },
      { d: D, ops: [{ o: 'harvest', p: p(3), n: 1 }] }
    ]);
  });

  it(`holds at most FARM.batchMax (${FARM.batchMax}) ops: the next starts its own`, () => {
    for (let i = 0; i <= FARM.batchMax; i++) plant(D, p(i), 'tomato', 'start');
    vi.advanceTimersByTime(2000);
    expect(sent().map((e) => e.ops.length)).toEqual([FARM.batchMax, 1]);
  });

  it('a new day starts its own event', () => {
    plant(D, p(0), 'tomato', 'start');
    plant(D2, p(1), 'tomato', 'start');
    vi.advanceTimersByTime(2000);
    expect(sent().map((e) => [e.d, e.ops.length])).toEqual([[D, 1], [D2, 1]]);
  });

  it('a dig is held 5 s; its 取り消す sends the rest again, held what was left of theirs', () => {
    plant(D, p(0), 'tomato', 'start');
    vi.advanceTimersByTime(500);
    const r = dig(D, p(1));
    expect(r.ok).toBe(true);
    vi.advanceTimersByTime(500);
    expect(r.undo!()).toBe(true);
    const again = sends.at(-1)!;
    expect(again.data.ops).toEqual([{ o: 'plant', p: p(0), c: 'tomato', src: 'start' }]);
    expect(again.holdMs).toBe(4500); // the dig's 5 s from 500 ms on, 1 s gone
    // the batch goes on: a tap joins the one sent again
    plant(D, p(2), 'tomato', 'start');
    vi.advanceTimersByTime(5000);
    expect(sent()).toEqual([{ d: D, ops: [{ o: 'plant', p: p(0), c: 'tomato', src: 'start' }, { o: 'plant', p: p(2), c: 'tomato', src: 'start' }] }]);
  });

  it('a dig alone, taken back: nothing sent', () => {
    const r = dig(D, p(0));
    expect(r.undo!()).toBe(true);
    vi.advanceTimersByTime(5000);
    expect(sent()).toEqual([]);
  });

  it('a dig’s 取り消す fails once it was sent, and the dig stays', () => {
    const r = dig(D, p(0));
    vi.advanceTimersByTime(5000);
    expect(r.undo!()).toBe(false);
    expect(sent()).toEqual([{ d: D, ops: [{ o: 'dig', p: p(0) }] }]);
  });
});

describe('the 畑 sheet’s batches', () => {
  const plants = (ks: number[]) => ks.map((k) => ({ o: 'plant', p: p(k), c: 'tomato', src: 'start' }));
  it('join a tap’s held batch; their 取り消す takes back only theirs, the tap’s goes', () => {
    plant(D, p(0), 'tomato', 'start');
    const r = harvestAll(D, [{ p: p(1), n: 3 }, { p: p(2), n: 1 }]);
    expect(sends.at(-1)!.data.ops).toHaveLength(3);
    expect(sends.at(-1)!.holdMs).toBe(5000);
    expect(r.undo!()).toBe(true);
    vi.advanceTimersByTime(5000);
    expect(sent()).toEqual([{ d: D, ops: plants([0]) }]);
  });
  it('a batch past the held one’s room is its own event; the plan’s 40 plants one, taken back whole', () => {
    plant(D, p(0), 'tomato', 'start');
    const r = plantMany(D, Array.from({ length: FARM.batchMax }, (_, k) => p(k + 1)), 'tomato', 'start');
    expect(sends.at(-1)!.data.ops).toHaveLength(FARM.batchMax);
    expect(r.undo!()).toBe(true);
    vi.advanceTimersByTime(5000);
    expect(sent()).toEqual([{ d: D, ops: plants([0]) }]);
  });
  it('a 取り消す takes its own back while their event is held, after a later batch started its own', () => {
    const r = dig(D, p(0));
    plantMany(D, Array.from({ length: FARM.batchMax }, (_, k) => p(k + 1)), 'tomato', 'start');
    expect(r.undo!()).toBe(true);
    vi.advanceTimersByTime(5000);
    expect(sent().map((e) => e.ops.length)).toEqual([FARM.batchMax]);
  });
  it('its banner held (a finger on it) holds the batch, a tap meanwhile joining it held still; let go, it goes', () => {
    const r = harvestAll(D, [{ p: p(1), n: 3 }]);
    expect(r.hold!(null)).toBe(120_000);
    vi.advanceTimersByTime(10_000);
    plant(D, p(0), 'tomato', 'start');
    expect(sends.at(-1)!.holdMs).toBe(110_000);
    vi.advanceTimersByTime(10_000);
    expect(sent()).toEqual([]);
    expect(r.hold!(0)).toBe(0);
    expect(sent()).toEqual([{ d: D, ops: [{ o: 'harvest', p: p(1), n: 3 }, ...plants([0])] }]);
    expect(r.undo!()).toBe(false);
  });
  it('digMany: the plants off the field back to starts, one event', () => {
    digMany(D, [p(0), p(1)]);
    vi.advanceTimersByTime(5000);
    expect(sent()).toEqual([{ d: D, ops: [{ o: 'dig', p: p(0) }, { o: 'dig', p: p(1) }] }]);
  });
  it('waterAll: today’s shared day, what was new', () => {
    world.reset();
    world.attach(null, 'A');
    expect(waterAll([p(0), p(1)])).toBe(2);
    expect(waterAll([p(1), p(2)])).toBe(1);
    expect(Object.keys(world.day.watered).sort()).toEqual([p(0), p(1), p(2)]);
    world.reset();
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
