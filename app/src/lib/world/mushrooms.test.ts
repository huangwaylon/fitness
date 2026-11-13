import { describe, expect, it } from 'vitest';
import { MUSHROOMS, mushroomSpots, OFF_SEASON_ODDS, RARE_ODDS, mushroomsOn, rareMushroom } from './mushrooms.ts';
import { DIG_SPOTS, LAWN } from './beach.ts';
import { OAK_AR } from '../components/island/scene.ts';
import { FLOWERS, GOAL_TREES, HOMES, SCENERY, TAPE_DECK, onGrass, surfaceAt } from './world.ts';
import { addDays } from '#lib/time/dates.ts';
import ja from '#lib/i18n/catch.ja.json';
import en from '#lib/i18n/catch.en.json';

/** Every date from `from` for `n` days. */
const days = (from: string, n: number): string[] => Array.from({ length: n }, (_, i) => addDays(from, i));

describe('mushroom season', () => {
  it('every November day brings 1–2 beside the trees, about half of them two, each on its own spot', () => {
    let two = 0;
    for (const year of [2026, 2027, 2028, 2029, 2030]) {
      for (const d of days(`${year}-11-01`, 30)) {
        const m = mushroomsOn(d);
        expect(m.length).toBeGreaterThanOrEqual(1);
        expect(m.length).toBeLessThanOrEqual(2);
        expect(new Set(m.map((x) => `${x.x},${x.y}`)).size).toBe(m.length);
        if (m.length === 2) two++;
      }
    }
    expect(two / 150).toBeGreaterThan(0.35);
    expect(two / 150).toBeLessThan(0.65);
  });
  it('the edges: Oct 31 and Dec 1 now and then, Nov 1 and Nov 30 always, September and January never', () => {
    expect(mushroomsOn('2026-11-01').length).toBeGreaterThan(0); // tomorrow
    expect(mushroomsOn('2026-11-30').length).toBeGreaterThan(0);
    for (const d of [...days('2026-09-01', 30), ...days('2027-01-01', 31), ...days('2027-06-01', 30)]) expect(mushroomsOn(d)).toEqual([]);
    const off = [...days('2026-10-01', 31), ...days('2026-12-01', 31), ...days('2027-10-01', 31), ...days('2027-12-01', 31), ...days('2028-10-01', 31), ...days('2028-12-01', 31)];
    const hits = off.filter((d) => mushroomsOn(d).length > 0);
    for (const d of hits) expect(mushroomsOn(d)).toHaveLength(1);
    // not a hard gate: some October and December days, about 1 in 8 of them
    expect(hits.length / off.length).toBeGreaterThan(OFF_SEASON_ODDS / 2.5);
    expect(hits.length / off.length).toBeLessThan(OFF_SEASON_ODDS * 2);
  });
  it('the same date and seed give the same mushrooms (both phones agree); another seed differs somewhere', () => {
    expect(mushroomsOn('2026-11-04')).toEqual(mushroomsOn('2026-11-04'));
    const a = days('2026-11-01', 30).map((d) => JSON.stringify(mushroomsOn(d)));
    const b = days('2026-11-01', 30).map((d) => JSON.stringify(mushroomsOn(d, 'other')));
    expect(a).not.toEqual(b);
  });
  it('skinny, round and flat are common, elegant rare (NH weights); the rare one never lies on the ground', () => {
    const n: Record<string, number> = {};
    for (const year of [2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033])
      for (const d of days(`${year}-11-01`, 30)) for (const m of mushroomsOn(d)) n[m.id] = (n[m.id] ?? 0) + 1;
    expect(n['rare-mushroom']).toBeUndefined();
    expect(n['elegant-mushroom'] ?? 0).toBeLessThan(n['skinny-mushroom'] / 3);
    for (const id of ['skinny-mushroom', 'round-mushroom', 'flat-mushroom']) expect(n[id]).toBeGreaterThan(40);
  });
  it('they grow beside the front lawn’s oak and cedar, past their canopies, away from the villagers, the dig spots, the weeds, the deck and the flowers', () => {
    expect(mushroomSpots()).toHaveLength(4);
    const trees = SCENERY.filter((s) => s.id === 'oak-m1' || s.id === 'cedar-m1');
    for (const [x, z] of mushroomSpots()) {
      const t = trees.reduce((a, b) => (Math.hypot(b.x - x, b.z - z) < Math.hypot(a.x - x, a.z - z) ? b : a));
      expect(Math.abs(x - t.x)).toBeLessThanOrEqual(70);
      expect(Math.abs(x - t.x)).toBeGreaterThan(t.h * (t.kind === 'oak' ? OAK_AR : 0.25) / 2 + 4); // past the canopy
      expect(z - t.z).toBeGreaterThanOrEqual(0), expect(z - t.z).toBeLessThanOrEqual(40);
      expect(onGrass(x, z) && surfaceAt(x, z) === 'grass').toBe(true);
      for (const [dx, dz] of [...DIG_SPOTS, ...LAWN, TAPE_DECK, HOMES.A, HOMES.B, ...Object.values(GOAL_TREES), ...FLOWERS.map((f) => [f.x, f.z] as const)]) expect(Math.hypot(x - dx, z - dz)).toBeGreaterThan(24);
    }
  });
  it('about 1 in 20 November dig spots hold the rare mushroom (its own stream), none in other months', () => {
    const nov = [2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033, 2034, 2035].flatMap((y) => days(`${y}-11-01`, 30));
    const rare = nov.flatMap((d) => ['f0', 'f1', 'f2', 'f3'].map((uid) => rareMushroom(d, uid))).filter(Boolean).length;
    expect(rare / (nov.length * 4)).toBeGreaterThan(RARE_ODDS / 2);
    expect(rare / (nov.length * 4)).toBeLessThan(RARE_ODDS * 2);
    for (const d of [...days('2026-10-01', 31), ...days('2026-12-01', 31)]) expect(rareMushroom(d, 'f0') || rareMushroom(d, 'f1')).toBe(false);
  });
  it('every mushroom has its official name in both languages', () => {
    for (const id of [...MUSHROOMS.map(([k]) => k), 'rare-mushroom']) {
      expect((ja as Record<string, string>)[`beach.name.${id}`]).toMatch(/キノコ$/);
      expect((en as Record<string, string>)[`beach.name.${id}`]).toMatch(/ mushroom$/);
    }
    expect((ja as Record<string, string>)['beach.name.round-mushroom']).toBe('まるいキノコ');
  });
});
