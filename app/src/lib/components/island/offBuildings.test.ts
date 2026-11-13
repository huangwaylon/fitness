// What lies on the ground keeps off the island's buildings (layout/clear.ts; docs/design.md "Tap targets"): every drop
// and spawn (a tree's present, wood, a branch, coconuts, a nest's and a bug's spot, mushrooms, the beach's shells,
// fragments and bottles, the day's weeds and dig spots) on the default island, the user's (the record of 2026-11-03,
// the museum and the shop where they placed them) and islands with a building moved next to the trees or onto the
// beach, across seeds and days (those moved: offBuildingsMoved.test.ts); and what lies there already is drawn off them,
// the same on every phone.
import { afterAll, describe, expect, test } from 'vitest';
import { defaultLayout, withChanges } from '#lib/layout/model.ts';
import { navOf, walkable, levelAt } from '#lib/layout/nav.ts';
import { offBuildings, onBuilding, tapCovered } from '#lib/layout/clear.ts';
import { tileAt } from '#lib/layout/grid.ts';
import { worldOf } from '#lib/world/layoutWorld.ts';
import { setWorld, offBuildingsAt } from '#lib/world/world.ts';
import { dropSpots, sceneryTrees } from './treeShake.ts';
import { giftAt } from './treeGifts.ts';
import { digSpots } from '#lib/world/beach.ts';
import { weedsAt } from '#lib/world/care.ts';
import { DAYS, movedBeside, noDropOn, treeTiles, userLayout } from './offBuildings.cases.ts';

afterAll(() => setWorld(null));

describe('nothing is dropped or spawned on a building’s ground (layout/clear.ts)', () => {
  const def = defaultLayout();
  noDropOn([
    ['the default island', () => def],
    ['the user’s island (the record, the museum and the shop where they placed them)', userLayout]
  ]);
  test('a building moved beside a tree takes its present’s, its wood’s and its branch’s old spots: they move off it', () => {
    const l = movedBeside(def, 'museum', treeTiles(def))!;
    const g = navOf(l);
    setWorld(worldOf(l, g));
    // (the old rule's spots, before any building was kept clear)
    const old = sceneryTrees().flatMap((t) => [[t.x - t.out * 16, t.z - 20], [t.x, t.z - 40], [t.x - t.out * 36, t.z - 2]] as [number, number][]);
    expect(old.filter(([x, z]) => onBuilding(g, x, z, 0)).length).toBeGreaterThan(0);
    for (const t of sceneryTrees()) {
      expect(onBuilding(g, ...giftAt(t), 0)).toBe(false);
      for (const p of dropSpots(t)) expect(onBuilding(g, ...p, 0)).toBe(false);
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
