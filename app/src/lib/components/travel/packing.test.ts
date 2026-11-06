// The packing list on a phone (components/travel/packing.svelte.ts, docs/travel.md "Packing list (relay)"): the model's
// rows (the record's, then this phone's queued ones, marked) folded over the trip's seed; my edits and ticks as the ops
// the record takes, each stamped after what it replaces; the guest's own only.
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { EventRow } from '#lib/contract/api.ts';
import { foldEvents, reduce } from '#lib/model/state.ts';
import type { PackSeed } from '#lib/contract/pack.ts';

const T = Date.parse('2026-11-06T03:00:00.000Z');
const fake = vi.hoisted(() => ({
  me: 'A' as 'A' | 'B' | 'G' | null,
  now: 0,
  server: 0,
  rows: [] as EventRow[],
  queued: [] as EventRow[],
  sent: [] as { type: string; data: Record<string, unknown> }[]
}));
vi.mock('#lib/store/world.svelte.ts', () => ({ world: { now: () => fake.now, serverNow: () => fake.server }, opClock: (last: number, after = 0) => Math.max(Math.round(fake.server), last + 1, after + 1) }));
vi.mock('#lib/store/week.svelte.ts', async () => {
  const { reduce: red, foldEvents: fold } = await import('#lib/model/state.ts');
  return {
    week: {
      get view() {
        return fake.me ? { viewer: fake.me } : null;
      },
      get model() {
        const base = red({ metrics: [], events: fake.rows });
        return { state: fake.queued.length ? fold(base, fake.queued, null)! : base };
      },
      send(type: string, data: Record<string, unknown>) {
        fake.sent.push({ type, data });
        fake.queued.push([new Date(T + 1e9 + fake.queued.length).toISOString(), fake.me!, `q${fake.queued.length}`, type as EventRow[3], JSON.stringify(data)]);
        return { ok: true };
      },
      sendMany(type: string, datas: Record<string, unknown>[]) {
        for (const d of datas) this.send(type, d);
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
  fake.server = T;
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
    // a seed item to its category's end
    expect(packing.move('okinawa', SEED, 'ok-0-0', 9)).toBe(true);
    expect(ids()).toEqual([['ok-0', [id, 'ok-0-1', 'ok-0-0']], ['ok-1', ['ok-1-0']]]);
    expect(packing.rename('okinawa', SEED, 'ok-1', 'きがえ', 'ja')).toBe(true);
    expect(fake.sent.at(-1)!.data).toMatchObject({ kind: 'cat', icon: 'shirt', name: { ja: 'きがえ' } });
    expect(fake.sent.at(-1)!.data.by).toBeUndefined();
    const cat = packing.addCat('okinawa', SEED, 'おやつ', 'ja')!;
    expect(packing.list('okinawa', SEED).at(-1)).toMatchObject({ id: cat, icon: 'shopping-bag', items: [] });
    expect(packing.removeHeld('okinawa', SEED, 'ok-0-1', 0).ok).toBe(true);
    expect(ids()[0]).toEqual(['ok-0', [id, 'ok-0-0']]);
    // each op later than the one it replaces
    const ats = fake.sent.map((s) => s.data.at as number);
    expect(ats).toEqual([...ats].sort((a, b) => a - b));
    expect(new Set(ats).size).toBe(ats.length);
  });

  it('stamps on the relay\'s clock, never a ?date= preview\'s', () => {
    fake.server = T + 1e6;
    fake.now = T + 30 * 86400e3;
    packing.addItem('okinawa', SEED, 'ok-0', 'かさ', 'ja');
    expect(fake.sent.at(-1)!.data.at).toBe(T + 1e6);
  });

  it('sends names cleaned as the record keeps them, so they stay on the list (a double space, a tab, NFD)', () => {
    const nfd = 'か\u3099さ';
    const id = packing.addItem('okinawa', SEED, 'ok-0', ' a  b\tc ', 'ja')!;
    expect(fake.sent.at(-1)!.data.name).toEqual({ ja: 'a b c' });
    expect(ids()[0][1]).toContain(id);
    const cat = packing.addCat('okinawa', SEED, nfd, 'ja')!;
    expect(packing.list('okinawa', SEED).at(-1)).toMatchObject({ id: cat, name: { ja: 'がさ' } });
    expect(packing.rename('okinawa', SEED, id, 'x  y', 'ja')).toBe(true);
    expect(packing.list('okinawa', SEED)[0].items.at(-1)!.name).toEqual({ ja: 'x y' });
    // the same name once cleaned: nothing to send
    const n = fake.sent.length;
    expect(packing.rename('okinawa', SEED, cat, `${nfd} `, 'ja')).toBe(true);
    expect(fake.sent).toHaveLength(n);
  });

  it('a gap with no room left: the siblings are renumbered with the move', () => {
    const x = packing.addItem('okinawa', SEED, 'ok-0', 'x', 'ja')!, y = packing.addItem('okinawa', SEED, 'ok-0', 'y', 'ja')!;
    // each move into the gap after ok-0-1 (ord 1) halves it: past ~50, the halves run out
    for (let i = 0; i < 60; i++) {
      expect(packing.move('okinawa', SEED, i % 2 ? y : x, 2)).toBe(true);
      expect(ids()[0][1][2]).toBe(i % 2 ? y : x);
    }
    expect(ids()[0][1]).toEqual(['ok-0-0', 'ok-0-1', y, x]);
    // renumbered once the halves ran out (…, 1 + 2⁻⁵², then 2 and 3 together); the seed's two already at 0 and 1, unsent
    const ords = fake.sent.map((s) => s.data.ord as number);
    expect(ords.indexOf(1 + 2 ** -52)).toBeGreaterThan(40);
    expect(ords.slice(ords.indexOf(1 + 2 ** -52) + 1, ords.indexOf(1 + 2 ** -52) + 3)).toEqual([2, 3]);
    expect(fake.sent.some((s) => s.data.id === 'ok-0-0' || s.data.id === 'ok-0-1')).toBe(false);
    expect(packing.list('okinawa', SEED)[0].items.every((it, i, l) => i === 0 || it.ord > l[i - 1].ord)).toBe(true);
    // the guest can't renumber the seed's items: refused, not silently lost
    fake.me = 'G';
    fake.queued = [];
    fake.rows = [rec(T, 'A', 'pack', { trip: 'okinawa', id: 'ok-0-1', at: T, kind: 'item', cat: 'ok-0', ord: Number.MIN_VALUE, name: { ja: '免許証' } })];
    const g = packing.addItem('okinawa', SEED, 'ok-0', 'g', 'ja')!;
    expect(packing.move('okinawa', SEED, g, 1)).toBe(false);
  });

  it('nothing is mine until I am known (the week’s view loading)', () => {
    fake.me = null;
    expect(packing.me).toBeNull();
    expect(packing.addItem('okinawa', SEED, 'ok-0', 'x', 'ja')).toBeNull();
    expect(packing.rename('okinawa', SEED, 'ok-0-0', 'x', 'ja')).toBe(false);
    expect(packing.tick('okinawa', 'ok-0-0', true)).toBe(false);
    expect(packing.resetHeld('okinawa', 0).ok).toBe(false);
    expect(fake.sent).toEqual([]);
  });

  it('ticks are mine; a reset clears only mine', () => {
    fake.rows = [rec(T - 10, 'B', 'pack_chk', { trip: 'okinawa', id: 'ok-0-0', at: T - 10, v: 1 })];
    const ticks = () => packing.list('okinawa', SEED).flatMap((c) => c.items.map((i) => i.ticks.join('')));
    expect(packing.tick('okinawa', 'ok-0-0', true)).toBe(true);
    expect(packing.tick('okinawa', 'ok-1-0', true)).toBe(true);
    expect(ticks()).toEqual(['AB', '', 'A']);
    expect(packing.resetHeld('okinawa', 0).ok).toBe(true);
    expect(ticks()).toEqual(['B', '', '']);
    // the clock behind the reset: the tick still goes after it
    fake.now = T - 1_000_000;
    packing.tick('okinawa', 'ok-0-1', true);
    expect(packing.list('okinawa', SEED)[0].items[1].ticks).toEqual(['A']);
    expect(packing.tick('okinawa', 'ok-0-1', false)).toBe(true);
    expect(ticks()).toEqual(['B', '', '']);
  });

  it('the guest changes only what it added; the trip note is everyone’s to read', () => {
    fake.me = 'G';
    fake.rows = [rec(T - 5, 'A', 'trip_note', { trip: 'okinawa', at: T - 5, v: { flightRef: 'X1' } })];
    expect(packing.note('okinawa')).toEqual({ flightRef: 'X1' });
    expect(packing.note('nz')).toBeNull();
    expect(packing.rename('okinawa', SEED, 'ok-0-0', 'x', 'ja')).toBe(false);
    expect(packing.removeHeld('okinawa', SEED, 'ok-0-0', 0).ok).toBe(false);
    const id = packing.addItem('okinawa', SEED, 'ok-0', 'ゲストの', 'en')!;
    expect(fake.sent.at(-1)!.data).toMatchObject({ by: 'G', name: { en: 'ゲストの' } });
    expect(packing.rename('okinawa', SEED, id, 'なおした', 'ja')).toBe(true);
    expect(fake.sent.at(-1)!.data).toMatchObject({ by: 'G', name: { ja: 'なおした' } });
    // a category of its own with a member's item in it: not the guest's to remove
    const cat = packing.addCat('okinawa', SEED, 'ゲストの', 'ja')!;
    expect(packing.rename('okinawa', SEED, cat, 'ゲストのもの', 'ja')).toBe(true);
    fake.rows.push(rec(T + 7_200_000, 'A', 'pack', { trip: 'okinawa', id: '_aaa00001', at: T + 7_200_000, kind: 'item', cat, ord: 0, name: { ja: 'A' }, by: 'A' }));
    expect(packing.removeHeld('okinawa', SEED, cat, 0).ok).toBe(false);
    expect(packing.removeHeld('okinawa', SEED, id, 0).ok).toBe(true);
  });
});
