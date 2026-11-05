import { describe, expect, it } from 'vitest';
import { ISLAND_MAX, PLAN_X, PLAN_Z, isIslandDay } from './island.ts';
import { WORLD_X, WORLD_Z, tokyoDay } from '#lib/contract/live-protocol.ts';
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
      { ...ok, watered: ['fl 1'] }, { ...ok, wishes: { '2026-11-02': 0 } }, { ...ok, at: [0, PLAN_Z[1] + 1] },
      { ...ok, taken: Array.from({ length: ISLAND_MAX.taken + 1 }, (_, i) => `w${i}`) }
    ]) expect(isIslandDay(bad as Record<string, unknown>), JSON.stringify(bad).slice(0, 80)).toBe(false);
  });

  it('its plan is the relay protocol\'s', () => {
    expect([PLAN_X, PLAN_Z]).toEqual([WORLD_X, WORLD_Z]);
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
