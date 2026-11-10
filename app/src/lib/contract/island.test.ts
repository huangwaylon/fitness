import { describe, expect, it } from 'vitest';
import { ISLAND_MAX, isIslandDay, mergeIslandDay, type IslandDayData } from './island.ts';
import { WORLD_X, WORLD_Z } from './layout.ts';
import { GRID, tileMid } from '#lib/layout/grid.ts';
import { tokyoDay } from '#lib/contract/live-protocol.ts';
import { apply, emptyDay, rowOf, type DayEvent } from '#lib/sync/world-day.ts';

const ok = { date: '2026-11-01', taken: ['s1000'], puts: [['pa1', 'present', 120, 300]], shakes: [['oak-p1', 'nest', 1_793_000_000_000]], watered: ['fl:130:344'], wishes: { '2026-11-02': 2 } };

describe('an island day (contract/island.ts)', () => {
  it('takes a well-formed day, with or without where the villager stands', () => {
    expect(isIslandDay(ok)).toBe(true);
    expect(isIslandDay({ ...ok, at: [100, 500] })).toBe(true);
    expect(isIslandDay({ ...ok, taken: [], puts: [], shakes: [], watered: [], wishes: {} })).toBe(true);
    expect(isIslandDay({ ...ok, date: '2026-11-03' }, '2026-11-01')).toBe(false); // after tomorrow
    expect(isIslandDay({ ...ok, date: '2026-11-02' }, '2026-11-01')).toBe(true);
  });

  it('refuses anything else', () => {
    for (const bad of [
      { ...ok, extra: 1 }, { ...ok, date: '2026-02-30' }, { ...ok, taken: 'x' }, { ...ok, taken: ['a b'] },
      { ...ok, puts: [['p', 'Present', 0, 0]] }, { ...ok, puts: [['p', 'present', 0]] }, { ...ok, shakes: [['t', 'none', 1]] },
      { ...ok, watered: ['fl 1'] }, { ...ok, wishes: { '2026-11-02': 0 } }, { ...ok, at: [0, WORLD_Z[1] + 1] },
      { ...ok, taken: Array.from({ length: ISLAND_MAX.taken + 1 }, (_, i) => `w${i}`) }
    ]) expect(isIslandDay(bad as Record<string, unknown>), JSON.stringify(bad).slice(0, 80)).toBe(false);
  });

  it('keeps the villager\'s spot and a present anywhere on the grid, its last land row too (the record\'s plan is the relay protocol\'s world: contract/layout.ts WORLD_X, WORLD_Z)', () => {
    const [x, z] = tileMid(GRID.cols - 1, GRID.rows - 2);
    expect(isIslandDay({ ...ok, at: [x, z], puts: [['pa1', 'present', x, z]] })).toBe(true);
    expect(isIslandDay({ ...ok, at: [WORLD_X[1], WORLD_Z[1]] })).toBe(true);
    expect(isIslandDay({ ...ok, at: [WORLD_X[0] - 1, 0] })).toBe(false);
  });

  it('a phone\'s row of a busy day is always one the server takes, and under the event size limit', () => {
    const t0 = Date.UTC(2026, 10, 1, 3), d = emptyDay(tokyoDay(t0));
    const ev = (i: number): DayEvent => {
      const t = t0 + i * 1000;
      switch (i % 6) {
        case 0: return { kind: 'pick', id: `w${i}`, what: 'weed', at: [100, 200], who: 'A', t };
        case 1: return { kind: 'put', id: `pa${i}`, what: 'present', at: [120, 300], who: 'A', t };
        case 2: return { kind: 'shake', tree: `oak-${i % 9}`, drop: (['branch', 'nest', 'none', 'coconut'] as const)[i % 4], who: 'A', t };
        case 3: return { kind: 'world', op: 'watered', id: `fl:${i % 400}:${i % 1300}`, who: 'A', t };
        case 4: return { kind: 'walk', to: [i % 300, 500], who: 'A', t };
        default: return { kind: 'put', id: `bug${i}`, what: 'bug:common-butterfly:bush', at: [36, 596], who: 'A', t };
      }
    };
    for (let i = 0; i < 3000; i++) apply(d, ev(i), 'A');
    const row = { date: '2026-11-01', ...rowOf(d, 'A') };
    expect(isIslandDay(row)).toBe(true);
    expect(JSON.stringify(row).length).toBeLessThan(20_000);
    expect(row.puts.some((p) => p[1].startsWith('bug:'))).toBe(false); // a bush's bug is gone in seconds: not kept
  });
});

describe('mergeIslandDay (contract/island.ts: the row kept when a sent day replaces a held one)', () => {
  const day = (o: Partial<IslandDayData>): IslandDayData => ({ date: '2026-11-11', taken: [], puts: [], shakes: [], watered: [], wishes: {}, ...o });
  it('only what can only grow is merged: the wishes their max, the watered both rows\', the spot the sent one\'s or else the held one\'s', () => {
    const held = day({ taken: ['t1'], watered: ['f1', 'f2'], wishes: { '2026-11-10': 3, '2026-11-11': 1 }, at: [10, 20] });
    const sent = day({ taken: [], watered: ['f2', 'f3'], wishes: { '2026-11-11': 2 } });
    expect(mergeIslandDay(held, sent)).toEqual({ ...sent, watered: ['f1', 'f2', 'f3'], wishes: { '2026-11-10': 3, '2026-11-11': 2 }, at: [10, 20] });
    expect(mergeIslandDay(held, { ...sent, at: [30, 40] }).at).toEqual([30, 40]);
    expect('at' in mergeIslandDay(day({}), day({}))).toBe(false);
  });
  it('within ISLAND_MAX: the newest mornings and the latest watered kept', () => {
    const many = (n: number, p: string) => Array.from({ length: n }, (_, i) => `${p}${i}`);
    const wishes = Object.fromEntries(Array.from({ length: ISLAND_MAX.wishes + 2 }, (_, i) => [`2026-10-${String(i + 1).padStart(2, '0')}`, 1]));
    const m = mergeIslandDay(day({ watered: many(ISLAND_MAX.watered, 'a') }), day({ watered: ['b0'], wishes }));
    expect(m.watered).toHaveLength(ISLAND_MAX.watered);
    expect(m.watered.at(-1)).toBe('b0');
    expect(Object.keys(m.wishes)).toEqual(Object.keys(wishes).slice(-ISLAND_MAX.wishes));
  });
});
