import { afterEach, describe, expect, test } from 'vitest';
import { worldOf } from './layoutWorld.ts';
import * as W from './world.ts';
import { walkNav, buildingAt, doorOf } from './nav.ts';
import { route, walkGeo, walkable } from './walkGraph.ts';
import { planTap } from './tapWalk.ts';
import { guestSpot } from './buildings.ts';
import { mushroomSpots } from './mushrooms.ts';
import { defaultLayout, withChanges } from '#lib/layout/model.ts';
import { isLayoutNav } from '#lib/layout/nav.ts';
import { validate } from '#lib/layout/validate.ts';
import { freshAreas, waterAt } from './critters.ts';

const l = defaultLayout();
const g = worldOf(l);
const near = (a: readonly number[], b: readonly number[], d: number) => Math.hypot(a[0] - b[0], a[1] - b[1]) <= d;

describe('worldOf: world.ts from the layout', () => {
  test('the homes: the campsite is ウェイ’s home at the back, うめ’s and the guest’s in the middle', () => {
    const camp = g.BUILDINGS.find((b) => b.id === 'campsite')!;
    expect(camp.z).toBeGreaterThan(1350);
    expect(g.BUILDINGS.map((b) => b.id).sort()).toEqual(['campsite', 'home-B', 'home-G']);
    for (const b of g.BUILDINGS) expect(b.z).toBeGreaterThan(700);
    // おく's camera stop: the 3D camera's far end, the tent's feet mid-screen
    expect(camp.z - g.CAMS.oku).toBeGreaterThan(100);
    expect(camp.z - g.CAMS.oku).toBeLessThan(200);
  });
  test('the front is where it was (the villagers, the goal trees, the beach and the sea), おく 420u back', () => {
    expect(near(g.HOMES.A, W.WORLD_2D.HOMES.A, 16)).toBe(true);
    expect(near(g.GOAL_TREES.B, W.WORLD_2D.GOAL_TREES.B, 16)).toBe(true);
    expect(g.SHORE_Z).toBe(W.WORLD_2D.SHORE_Z);
    expect(g.SEA_BOX).toEqual(W.WORLD_2D.SEA_BOX);
    expect(near(g.CENTRE_STAGE, [W.WORLD_2D.CENTRE_STAGE[0], W.WORLD_2D.CENTRE_STAGE[1] + 420], 60)).toBe(true);
    expect(near([g.POND.x, g.POND.z], [W.WORLD_2D.POND.x, W.WORLD_2D.POND.z + 420], 20)).toBe(true);
  });
  test('the river runs from the upper tier to the sea, the bridge over it', () => {
    expect(g.RIVER[0][1]).toBeGreaterThan(g.CLIFF.z0);
    expect(g.RIVER.at(-1)![0]).toBeLessThan(0);
    for (let i = 1; i < g.RIVER.length; i++) expect(Math.hypot(g.RIVER[i][0] - g.RIVER[i - 1][0], g.RIVER[i][1] - g.RIVER[i - 1][1])).toBeLessThan(60);
    expect(g.inRiver(g.BRIDGE.x, (g.BRIDGE.z0 + g.BRIDGE.z1) / 2)).toBe(false);
    expect(g.surfaceAt(g.BRIDGE.x, (g.BRIDGE.z0 + g.BRIDGE.z1) / 2)).toBe('stone');
  });
  test('the waters a cast lands in, the ground underfoot', () => {
    expect(g.surfaceAt(195, -60)).toBe('sea');
    expect(g.surfaceAt(g.POND.x, g.POND.z)).toBe('water');
    expect(g.freshWhere(g.POND.x, g.POND.z)).toBe('pond');
    expect(g.freshWhere(g.SPRING.x, g.SPRING.z)).toBe('clifftop');
    expect(g.freshWhere(375, 1000)).toBe('river');
    const m = g.RIVER.findLast((p) => p[0] > -30)!;
    expect(g.freshWhere(m[0], m[1])).toBe('mouth');
    expect(g.surfaceAt(250, 120)).toBe('grass');
    expect(g.surfaceAt(195, 300)).toBe('dirt');
  });
  test('the seats, the decor’s spots, the scenery and the flowers keep their ids', () => {
    for (const s of ['seatMaeL', 'seatPondR', 'stoolW', 'stoolE']) expect(g.SEATS[s], s).toBeTruthy();
    expect(g.DECOR_SLOTS.find((d) => d.id === 'bench-pond')?.key).toBe('deco/log-bench');
    expect(g.SCENERY.find((s) => s.id === 'hedge-3')?.kind).toBe('bush');
    expect(g.SCENERY.find((s) => s.id === 'cedar-f4')?.h).toBe(W.WORLD_2D.SCENERY.find((s) => s.id === 'cedar-f4')!.h);
    expect(g.FLOWERS.length).toBeGreaterThanOrEqual(W.WORLD_2D.FLOWERS.length);
    expect(g.HEDGE_XS).toEqual([]);
  });
  test('a change follows: a home moved, the pond gone', () => {
    const b = l.objects.get('home-B')!;
    const pondless = withChanges(l, { set: [{ ...b, x: b.x + 2 }], tiles: [...l.codes].flatMap((c, i) => (c >> 2 === 8 ? [[i % 20, Math.floor(i / 20), 4] as [number, number, number]] : [])) });
    const h = worldOf(pondless);
    expect(h.BUILDINGS.find((x) => x.id === 'home-B')!.x).toBe(g.BUILDINGS.find((x) => x.id === 'home-B')!.x + 60);
    expect(h.POND.x).toBeLessThan(-1000);
  });
});

describe('a pond put down (kind pond): a fresh water as the painted pond’s', () => {
  afterEach(() => W.setWorld(null));
  // on the first open grass it fits on, turned a quarter too
  const at = (x: number, z: number, f: 0 | 1) => withChanges(l, { set: [{ id: 'p1', k: 'pond', x, z, f }] });
  const fits = (x: number, z: number) => ([0, 1] as const).every((f) => !validate(at(x, z, f)).some((i) => i.level === 'error' && i.ids?.includes('p1')));
  const spot = (() => {
    for (let z = 8; z < 50; z++) for (let x = 2; x < 16; x++) if (fits(x, z)) return [x, z] as const;
    throw new Error('no room for a pond');
  })();
  const put = (f: 0 | 1) => at(spot[0], spot[1], f);
  test('its water: underfoot, a cast’s, the fish’s, the walk’s', () => {
    for (const f of [0, 1] as const) {
      const pl = put(f), g2 = worldOf(pl);
      expect(g2.PONDS).toHaveLength(1);
      const o = g2.PONDS[0];
      expect(f ? o.rz > o.rx : o.rx > o.rz).toBe(true);
      expect(g2.surfaceAt(o.x, o.z)).toBe('water');
      expect(g2.freshWhere(o.x, o.z)).toBe('pond');
      W.setWorld(g2);
      expect(W.pondAt(o.x, o.z)).toBe(o);
      expect(waterAt(o.x, o.z, false)).toBe('pond');
      expect(freshAreas('pond').some((a) => a.cx === o.x && a.cz === o.z)).toBe(true);
      // nobody walks into it
      expect(walkable(walkGeo(), o.x, o.z)).toBe(false);
      W.setWorld(null);
    }
  });
});

describe('setWorld: the island on its layout', () => {
  afterEach(() => W.setWorld(null));
  test('swaps every value in, and world.ts’s own back', () => {
    const gen = W.worldGen();
    W.setWorld(g);
    expect(W.onLayout()).toBe(true);
    expect(W.CAMPSITE.z).toBeGreaterThan(1350);
    expect(W.SCENERY).toBe(g.SCENERY);
    expect(W.CAM_MAX).toBe(g.CAMS.oku);
    expect(W.surfaceAt(g.POND.x, g.POND.z)).toBe('water');
    expect(W.worldGen()).toBe(gen + 1);
    W.setWorld(null);
    expect(W.CAMPSITE).toBe(W.WORLD_2D.BUILDINGS[0]);
    expect(W.SCENERY).toBe(W.WORLD_2D.SCENERY);
    expect(W.CAM_MAX).toBe(642);
  });
  test('the walk is the layout’s: up to the tent’s door, to うめ’s, over the bridge', () => {
    W.setWorld(g);
    const n = walkNav();
    expect(isLayoutNav(n)).toBe(true);
    expect(near(n.named['door-campsite'], doorOf('campsite'), 1)).toBe(true);
    const home = n.named.homeA, door = doorOf('campsite');
    const p = planTap(n, home, door[0], door[1]);
    expect(p?.pts.at(-1)).toEqual([Math.round(door[0]), Math.round(door[1])]);
    // a tap on うめ's home goes to its door
    const b = g.BUILDINGS.find((x) => x.id === 'home-B')!;
    expect(buildingAt(b.x, b.z + 30)).toBe('home-B');
    expect(planTap(n, home, b.x, b.z + 30)?.snap.kind).toBe('door');
    // the villagers' idle walks too
    const geo = walkGeo();
    expect(walkable(geo, g.POND.x, g.POND.z)).toBe(false);
    expect(route(geo, home, n.named.centreStage)?.at(-1)).toEqual(n.named.centreStage);
    // the guest stands by its own house, where a walker reaches
    const gs = guestSpot(), gd = doorOf('home-G');
    expect(Math.hypot(gs[0] - gd[0], gs[1] - gd[1])).toBeLessThan(60);
    expect(walkable(geo, gs[0], gs[1])).toBe(true);
    expect(route(geo, home, gs)?.at(-1)).toEqual(gs);
    // November's mushrooms by the trees, never on the rock or the tape deck (a tap there is theirs)
    for (const [x, z] of mushroomSpots()) for (const p of [W.ROCK, W.TAPE_DECK]) expect(Math.hypot(p[0] - x, p[1] - z)).toBeGreaterThanOrEqual(44);
  });
});
