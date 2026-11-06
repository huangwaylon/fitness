// The packing list on a phone (components/travel/packing.svelte.ts, docs/travel.md "Packing list (relay)"): the model's
// rows (the record's, then this phone's queued ones, marked) folded over the trip's seed; my edits and ticks as the ops
// the record takes, each stamped after what it replaces; the guest's own only.
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { EventRow } from '#lib/contract/api.ts';
import { foldEvents, reduce } from '#lib/model/state.ts';
import type { PackSeed } from '#lib/contract/pack.ts';

const T = Date.parse('2026-11-06T03:00:00.000Z');
const fake = vi.hoisted(() => ({
  me: 'A' as 'A' | 'B' | 'G',
  now: 0,
  rows: [] as EventRow[],
  queued: [] as EventRow[],
  sent: [] as { type: string; data: Record<string, unknown> }[]
}));
vi.mock('#lib/store/world.svelte.ts', () => ({ world: { now: () => fake.now } }));
vi.mock('#lib/store/week.svelte.ts', async () => {
  const { reduce: red, foldEvents: fold } = await import('#lib/model/state.ts');
  return {
    week: {
      get view() {
        return { viewer: fake.me };
      },
      get model() {
        const base = red({ metrics: [], events: fake.rows });
        return { state: fake.queued.length ? fold(base, fake.queued, null)! : base };
      },
      send(type: string, data: Record<string, unknown>) {
        fake.sent.push({ type, data });
        fake.queued.push([new Date(T + 1e9 + fake.queued.length).toISOString(), fake.me, `q${fake.queued.length}`, type as EventRow[3], JSON.stringify(data)]);
        return { ok: true };
      }
    }
  };
});
const { packing } = await import('./packing.svelte.ts');

const SEED: PackSeed = {
  cats: [
    { id: 'ok-0', name: { ja: '書類' }, icon: 'file', items: [{ id: 'ok-0-0', text: { ja: '身分証明書' } }, { id: 'ok-0-1', text: { ja: '免許証' } }] },
    { id: 'ok-1', name: { ja: 'ふく' }, icon: 'shirt', items: [{ id: 'ok-1-0', text: { ja: 'Tシャツ' } }] }
  ]
};
const rec = (t: number, who: 'A' | 'B' | 'G', type: string, data: object): EventRow => [new Date(t).toISOString(), who, `r${t}${who}`, type as EventRow[3], JSON.stringify(data)];
const ids = () => packing.list('okinawa', SEED).map((c) => [c.id, c.items.map((i) => i.id)]);

beforeEach(() => {
  fake.me = 'A';
  fake.now = T;
  fake.rows = [];
  fake.queued = [];
  fake.sent = [];
});

describe('the model', () => {
  it('folds the four types into state.pack, the queued ones marked', () => {
    const rows = [rec(T, 'B', 'pack_chk', { trip: 'okinawa', id: 'ok-0-0', at: T, v: 1 }), rec(T + 1, 'A', 'trip_note', { trip: 'okinawa', at: T, v: { k: 'v' } }), rec(T + 2, 'A', 'pack_reset', { trip: 'nz', at: T })];
    const s = reduce({ metrics: [], events: rows });
    expect(s.pack.map((r) => [r.type, r.who, !!r.queued])).toEqual([['pack_chk', 'B', false], ['trip_note', 'A', false], ['pack_reset', 'A', false]]);
    const q = foldEvents(s, [rec(T + 3, 'G', 'pack', { trip: 'okinawa', id: '_gst00001', at: T + 3, kind: 'item', cat: 'ok-0', ord: 3, name: { ja: 'x' }, by: 'G' })], null)!;
    expect(q.pack.at(-1)).toMatchObject({ type: 'pack', who: 'G', queued: true });
    expect(s.pack).toHaveLength(3);
    // a whole reduce with this phone's queue: the same marks
    expect(reduce({ metrics: [], events: [...rows, rec(T + 4, 'A', 'pack_chk', { trip: 'okinawa', id: 'ok-0-1', at: T + 4, v: 1 })] }, null, new Set([`r${T + 4}A`])).pack.at(-1)!.queued).toBe(true);
  });
});

describe('packing', () => {
  it('lists the seed, adds, renames, moves and removes as ops the record takes', () => {
    expect(ids()).toEqual([['ok-0', ['ok-0-0', 'ok-0-1']], ['ok-1', ['ok-1-0']]]);
    const id = packing.addItem('okinawa', SEED, 'ok-0', ' 日焼け止め ', 'ja')!;
    expect(fake.sent.at(-1)!.data).toMatchObject({ trip: 'okinawa', id, kind: 'item', cat: 'ok-0', ord: 2, name: { ja: '日焼け止め' }, by: 'A' });
    expect(ids()[0]).toEqual(['ok-0', ['ok-0-0', 'ok-0-1', id]]);
    // to the top: before the first
    expect(packing.move('okinawa', SEED, id, 0)).toBe(true);
    expect(fake.sent.at(-1)!.data).toMatchObject({ id, ord: -1, by: 'A' });
    // between the two seed items
    expect(packing.move('okinawa', SEED, id, 1)).toBe(true);
    expect(fake.sent.at(-1)!.data.ord).toBe(0.5);
    // into another category, at its end
    expect(packing.move('okinawa', SEED, 'ok-0-0', 9, 'ok-1')).toBe(true);
    expect(ids()).toEqual([['ok-0', [id, 'ok-0-1']], ['ok-1', ['ok-1-0', 'ok-0-0']]]);
    expect(packing.rename('okinawa', SEED, 'ok-1', 'きがえ', 'ja')).toBe(true);
    expect(fake.sent.at(-1)!.data).toMatchObject({ kind: 'cat', icon: 'shirt', name: { ja: 'きがえ' } });
    expect(fake.sent.at(-1)!.data.by).toBeUndefined();
    const cat = packing.addCat('okinawa', SEED, 'おやつ', 'ja')!;
    expect(packing.list('okinawa', SEED).at(-1)).toMatchObject({ id: cat, icon: 'shopping-bag', items: [] });
    expect(packing.remove('okinawa', SEED, 'ok-0-1')).toBe(true);
    expect(ids()[0]).toEqual(['ok-0', [id]]);
    // each op later than the one it replaces
    const ats = fake.sent.map((s) => s.data.at as number);
    expect(ats).toEqual([...ats].sort((a, b) => a - b));
    expect(new Set(ats).size).toBe(ats.length);
  });

  it('ticks are mine; counts mine and everyone’s; a reset clears only mine', () => {
    fake.rows = [rec(T - 10, 'B', 'pack_chk', { trip: 'okinawa', id: 'ok-0-0', at: T - 10, v: 1 })];
    expect(packing.tick('okinawa', 'ok-0-0', true)).toBe(true);
    expect(packing.tick('okinawa', 'ok-1-0', true)).toBe(true);
    expect(packing.counts('okinawa', SEED)).toEqual({ total: 3, mine: 2, done: { A: 2, B: 1, G: 0 } });
    expect(packing.reset('okinawa')).toBe(true);
    expect(packing.counts('okinawa', SEED)).toMatchObject({ mine: 0, done: { A: 0, B: 1 } });
    // the clock behind the reset: the tick still goes after it
    fake.now = T - 1_000_000;
    packing.tick('okinawa', 'ok-0-1', true);
    expect(packing.list('okinawa', SEED)[0].items[1].ticks).toEqual(['A']);
    expect(packing.tick('okinawa', 'ok-0-1', false)).toBe(true);
    expect(packing.counts('okinawa', SEED).mine).toBe(0);
  });

  it('the guest changes only what it added; the trip note is everyone’s to read', () => {
    fake.me = 'G';
    fake.rows = [rec(T - 5, 'A', 'trip_note', { trip: 'okinawa', at: T - 5, v: { flightRef: 'X1' } })];
    expect(packing.note('okinawa')).toEqual({ flightRef: 'X1' });
    expect(packing.note('nz')).toBeNull();
    const seedItem = packing.list('okinawa', SEED)[0].items[0];
    expect(packing.mayEdit(seedItem)).toBe(false);
    expect(packing.rename('okinawa', SEED, 'ok-0-0', 'x', 'ja')).toBe(false);
    expect(packing.remove('okinawa', SEED, 'ok-0-0')).toBe(false);
    const id = packing.addItem('okinawa', SEED, 'ok-0', 'ゲストの', 'en')!;
    expect(fake.sent.at(-1)!.data).toMatchObject({ by: 'G', name: { en: 'ゲストの' } });
    expect(packing.rename('okinawa', SEED, id, 'なおした', 'ja')).toBe(true);
    expect(fake.sent.at(-1)!.data).toMatchObject({ by: 'G', name: { ja: 'なおした' } });
    // a category of its own with a member's item in it: not the guest's to remove
    const cat = packing.addCat('okinawa', SEED, 'ゲストの', 'ja')!;
    expect(packing.mayEdit(packing.list('okinawa', SEED).at(-1)!)).toBe(true);
    fake.rows.push(rec(T + 7_200_000, 'A', 'pack', { trip: 'okinawa', id: '_aaa00001', at: T + 7_200_000, kind: 'item', cat, ord: 0, name: { ja: 'A' }, by: 'A' }));
    expect(packing.mayEdit(packing.list('okinawa', SEED).at(-1)!)).toBe(false);
    expect(packing.remove('okinawa', SEED, id)).toBe(true);
  });
});
