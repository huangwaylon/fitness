// offBuildings.test.ts's and offBuildingsMoved.test.ts's islands and sweep (two files: vitest runs them side by side,
// each sweep a few seconds of CPU): the user's island, a building moved beside the trees, and every place something is
// dropped or spawned on an island across seeds and days.
import { expect, test } from 'vitest';
import RECORD from '#lib/layout/record-2026-11-03.json' with { type: 'json' };
import { layoutOpOf, mergeLayout, type LayoutEntry } from '#lib/contract/layout.ts';
import { layoutOf, withChanges, type Layout } from '#lib/layout/model.ts';
import { navOf, type LayoutNav } from '#lib/layout/nav.ts';
import { onBuilding } from '#lib/layout/clear.ts';
import { daySpots } from '#lib/layout/spots.ts';
import { validate } from '#lib/layout/validate.ts';
import { worldOf } from './layoutWorld.ts';
import { setWorld } from './world.ts';
import { dropAt, dropSpots, goalTree, sceneryTrees, type ShakeTree } from './treeShake.ts';
import { giftAt } from './treeGifts.ts';
import { mushroomsOn } from './mushrooms.ts';
import { bottleAt, fragmentsOn, shellsAt } from './beach.ts';

export const userLayout = (): Layout => {
  const m = new Map<string, LayoutEntry>();
  const ops = [
    ...(RECORD as Record<string, unknown>[]),
    { who: 'A', sc: 'o', id: 'museum', at: 1.79e12, k: 'museum', x: 9, z: 18, f: 0 },
    { who: 'A', sc: 'o', id: 'shop', at: 1.79e12, k: 'shop', x: 7, z: 49, f: 0 }
  ];
  for (const { who, ...r } of ops) {
    const op = layoutOpOf(r);
    if (op) mergeLayout(m, { ...op, who } as LayoutEntry);
  }
  return layoutOf(m);
};

/** The layout with `id` moved to the first spot by `near`'s tiles where it stands without an error of its own. */
export function movedBeside(l: Layout, id: string, near: readonly [number, number][]): Layout | null {
  const o = l.objects.get(id)!;
  for (const [c, r] of near)
    for (const [dx, dz] of [[1, -4], [-7, -4], [1, -1], [-7, -1], [-3, -5], [-3, 1], [1, 0], [-7, 0]] as const) {
      const at = withChanges(l, { set: [{ ...o, x: c + dx, z: r + dz, f: 0 }] });
      if (!validate(at).some((i) => i.level === 'error' && i.ids.includes(id))) return at;
    }
  return null;
}

export const DAYS = Array.from({ length: 21 }, (_, i) => new Date(Date.UTC(2026, 9, 20 + i)).toISOString().slice(0, 10));
const SEEDS = ['island-fund', 'seed-b', 'seed-c'];

/** Every place something is dropped or spawned on `l` (the island set to it), with what and why. */
function everyDrop(l: Layout, g: LayoutNav): [string, number, number][] {
  setWorld(worldOf(l, g));
  const out: [string, number, number][] = [];
  const trees: ShakeTree[] = [...sceneryTrees(), goalTree('A'), goalTree('B')];
  for (const t of trees) {
    out.push([`present ${t.id}`, ...giftAt(t)]);
    dropSpots(t).forEach((p, k) => out.push([`wood or branch ${t.id}:${k}`, ...p]));
    for (const what of ['nest', 'bagworm'] as const) {
      const p = dropAt(t, what);
      out.push([`${what} ${t.id}`, p.x, p.z]);
    }
    for (const n of [0, 1]) {
      const p = dropAt(t, 'coconut', n);
      out.push([`coconut ${t.id}:${n}`, p.x, p.z]);
    }
  }
  for (const seed of SEEDS)
    for (const date of DAYS) {
      const s = daySpots(l, date, seed);
      for (const [x, z] of [...s.lawn, ...s.dig]) out.push([`spot ${date} ${seed}`, x, z]);
      for (const m of mushroomsOn(date, seed)) out.push([`mushroom ${date} ${seed}`, m.x, m.y]);
      const frags = fragmentsOn(date, 8, seed);
      for (const f of frags) out.push([`fragment ${date} ${seed}`, f.x, f.y]);
      for (let h = 1; h < 24; h += 2) {
        for (const sh of shellsAt(date, h * 3600_000, seed, frags)) out.push([`shell ${date} ${seed}`, sh.x, sh.y]);
        const b = bottleAt(date, h * 3600_000, seed, frags);
        if (b) out.push([`bottle ${date} ${seed}`, b.x, b.y]);
      }
    }
  return out;
}
/** The drops that lie on a building's ground. */
const onBuildings = (l: Layout) => {
  const g = navOf(l);
  return everyDrop(l, g).filter(([, x, z]) => onBuilding(g, x, z, 0)).map(([w, x, z]) => `${w} at ${x},${z}`);
};

/** The trees' tiles on `l` (where a building is moved beside them). */
export const treeTiles = (l: Layout) => [...l.objects.values()].filter((o) => o.k === 'oak' || o.k === 'cedar' || o.k === 'palm').map((o) => [o.x, o.z] as [number, number]);

/** Each case's island, and that nothing dropped or spawned on it lies on a building's ground. */
export const noDropOn = (cases: [string, () => Layout | null][]) => {
  for (const [name, get] of cases)
    test(`on ${name}: every tree’s drops, the day’s spots, mushrooms and beach finds`, () => {
      const l = get();
      expect(l, 'a spot for the building').not.toBeNull();
      expect(onBuildings(l!)).toEqual([]);
    }, 30_000);
};
