// What lies on the ground keeps off the island's buildings (layout/clear.ts; docs/design.md "Tap targets"): every drop
// and spawn (a tree's present, wood, a branch, coconuts, a nest's and a bug's spot, mushrooms, the beach's shells,
// fragments and bottles, the day's weeds and dig spots) on the default island, the user's (the record of 2026-11-03,
// the museum and the shop where they placed them) and islands with a building moved next to the trees or onto the
// beach, across seeds and days; and what lies there already is drawn off them, the same on every phone.
import { afterAll, describe, expect, test } from 'vitest';
import RECORD from '#lib/layout/record-2026-11-03.json' with { type: 'json' };
import { layoutOpOf, mergeLayout, type LayoutEntry } from '#lib/contract/layout.ts';
import { defaultLayout, layoutOf, withChanges, type Layout } from '#lib/layout/model.ts';
import { navOf, walkable, levelAt, type LayoutNav } from '#lib/layout/nav.ts';
import { offBuildings, onBuilding, tapCovered } from '#lib/layout/clear.ts';
import { daySpots } from '#lib/layout/spots.ts';
import { validate } from '#lib/layout/validate.ts';
import { tileAt } from '#lib/layout/grid.ts';
import { worldOf } from './layoutWorld.ts';
import { setWorld, offBuildingsAt } from './world.ts';
import { dropAt, goalTree, sceneryTrees, woodAt, type ShakeTree } from './treeShake.ts';
import { giftAt } from './treeGifts.ts';
import { mushroomsOn } from './mushrooms.ts';
import { bottleAt, digSpots, fragmentsOn, shellsAt } from './beach.ts';
import { weedsAt } from './care.ts';

afterAll(() => setWorld(null));

const userLayout = (): Layout => {
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
function movedBeside(l: Layout, id: string, near: readonly [number, number][]): Layout | null {
  const o = l.objects.get(id)!;
  for (const [c, r] of near)
    for (const [dx, dz] of [[1, -4], [-7, -4], [1, -1], [-7, -1], [-3, -5], [-3, 1], [1, 0], [-7, 0]] as const) {
      const at = withChanges(l, { set: [{ ...o, x: c + dx, z: r + dz, f: 0 }] });
      if (!validate(at).some((i) => i.level === 'error' && i.ids.includes(id))) return at;
    }
  return null;
}

const DAYS = Array.from({ length: 21 }, (_, i) => new Date(Date.UTC(2026, 9, 20 + i)).toISOString().slice(0, 10));
const SEEDS = ['island-fund', 'seed-b', 'seed-c'];

/** Every place something is dropped or spawned on `l` (the island set to it), with what and why. */
function everyDrop(l: Layout, g: LayoutNav): [string, number, number][] {
  setWorld(worldOf(l, g));
  const out: [string, number, number][] = [];
  const trees: ShakeTree[] = [...sceneryTrees(), goalTree('A'), goalTree('B')];
  for (const t of trees) {
    out.push([`present ${t.id}`, ...giftAt(t)]);
    for (let k = 0; k < 3; k++) out.push([`wood ${t.id}:${k}`, ...woodAt(t, k)]);
    for (const what of ['branch', 'nest', 'bagworm'] as const) {
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

describe('nothing is dropped or spawned on a building’s ground (layout/clear.ts)', () => {
  const def = defaultLayout(), user = userLayout();
  const treeTiles = (l: Layout) => [...l.objects.values()].filter((o) => o.k === 'oak' || o.k === 'cedar' || o.k === 'palm').map((o) => [o.x, o.z] as [number, number]);
  /** The shop put down on the front beach's sand (where the shells and the bottle wash up), over the grass behind it. */
  const onTheBeach = (l: Layout) => {
    let r = 0;
    while (r < 30 && l.kind(10, r) !== 'sand') r++;
    return withChanges(l, { set: [{ ...l.objects.get('shop')!, x: 6, z: r, f: 0 }] });
  };
  const cases: [string, () => Layout | null][] = [
    ['the default island', () => def],
    ['the user’s island (the record, the museum and the shop where they placed them)', () => user],
    ['the default with the museum beside its trees', () => movedBeside(def, 'museum', treeTiles(def))],
    ['the user’s with the museum beside its trees', () => movedBeside(user, 'museum', treeTiles(user))],
    ['the default with the shop on the front beach', () => onTheBeach(def)]
  ];
  for (const [name, get] of cases)
    test(`on ${name}: every tree’s drops, the day’s spots, mushrooms and beach finds`, () => {
      const l = get();
      expect(l, 'a spot for the building').not.toBeNull();
      expect(onBuildings(l!)).toEqual([]);
    }, 30_000);
  test('a building moved beside a tree takes its present’s, its wood’s and its branch’s old spots: they move off it', () => {
    const l = movedBeside(def, 'museum', treeTiles(def))!;
    const g = navOf(l);
    setWorld(worldOf(l, g));
    // (the old rule's spots, before any building was kept clear)
    const old = sceneryTrees().flatMap((t) => [[t.x - t.out * 16, t.z - 20], [t.x, t.z - 40], [t.x - t.out * 36, t.z - 2]] as [number, number][]);
    expect(old.filter(([x, z]) => onBuilding(g, x, z, 0)).length).toBeGreaterThan(0);
    for (const t of sceneryTrees()) {
      expect(onBuilding(g, ...giftAt(t), 0)).toBe(false);
      expect(onBuilding(g, ...woodAt(t, 0), 0)).toBe(false);
      const b = dropAt(t, 'branch');
      expect(onBuilding(g, b.x, b.z, 0)).toBe(false);
    }
  });
});

describe('what lies on a building’s ground already is drawn off it (offBuildings)', () => {
  const l = userLayout(), g = navOf(l);
  const museum = g.doors.museum.box;
  test('a present on the museum’s steps lies just in front of them, on open ground, the same every time', () => {
    const steps: [number, number] = [(museum.x0 + museum.x1) / 2 + 20, museum.y0 + 12];
    expect(onBuilding(g, ...steps)).toBe(true);
    const [x, z] = offBuildings(g, ...steps);
    expect(onBuilding(g, x, z)).toBe(false);
    expect(walkable(g, x, z)).toBe(true);
    // (not under a tree's leaves or by a bush: their tap areas would take the tap)
    expect(tapCovered(l, 'canopy').has(tileAt(x, z).join(','))).toBe(false);
    expect(levelAt(g, x, z)).toBe(levelAt(g, steps[0], museum.y0 - 40));
    expect(Math.hypot(x - steps[0], z - steps[1])).toBeLessThan(60);
    expect(offBuildings(g, ...steps)).toEqual([x, z]);
    // (navOf a fresh copy of the same layout: another phone)
    expect(offBuildings(navOf(userLayout()), ...steps)).toEqual([x, z]);
  });
  test('inside the walls and behind the building too; open ground is left as it is', () => {
    const fails: string[] = [];
    for (let x = museum.x0; x <= museum.x1; x += 10)
      for (let z = museum.y0; z <= museum.y1 + 70; z += 10) {
        const p = offBuildings(g, x, z);
        if (onBuilding(g, ...p)) fails.push(`${x},${z} → ${p}`);
      }
    expect(fails).toEqual([]);
    const free: [number, number] = [museum.x0 - 60, museum.y0 - 60];
    expect(onBuilding(g, ...free)).toBe(false);
    expect(offBuildings(g, ...free)).toEqual(free);
  });
  test('a building placed over a present lying there (the もようがえ): it’s drawn off it at once; the island’s helper follows the layout', () => {
    const at: [number, number] = [museum.x0 - 120, museum.y0 + 40];
    setWorld(worldOf(l, g));
    expect(offBuildingsAt(...at)).toEqual(at);
    const o = l.objects.get('museum')!, [c, r] = tileAt(...at);
    const built = withChanges(l, { set: [{ ...o, x: c - 3, z: r - 2 }] });
    const bg = navOf(built);
    setWorld(worldOf(built, bg));
    expect(onBuilding(bg, ...at)).toBe(true);
    const p = offBuildingsAt(...at);
    expect(onBuilding(bg, ...p)).toBe(false);
    expect(p).toEqual(offBuildings(bg, ...at));
  });
  test('the day’s weeds and dig spots keep off it too', () => {
    setWorld(worldOf(l, g));
    const fails: string[] = [];
    for (const date of DAYS) {
      for (const s of digSpots(date, new Set())) if (onBuilding(g, s.x, s.y, 0)) fails.push(`dig ${date} ${s.x},${s.y}`);
      for (const w of weedsAt(date, 23 * 3600_000)) if (onBuilding(g, w.x, w.y, 0)) fails.push(`weed ${date} ${w.x},${w.y}`);
    }
    expect(fails).toEqual([]);
  });
});
