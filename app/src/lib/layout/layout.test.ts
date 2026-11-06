import { describe, expect, test } from 'vitest';
import { CHUNKS_X, CHUNKS_Z, GRID, chunkIndex, chunkOf, chunkString, codeOf, codeOfChar, charOf, kindOf, tierOf, writeChunk, KINDS, TIERS, tileAt, tileMid } from './grid.ts';
import { defaultLayout, doorOf, extentOf, layoutOf, objMid, objTiles, opsBetween, toJson, fromJson, withChanges, footOf, type Obj } from './model.ts';
import { CHUNK_COUNT, chunkMesh, stairsMesh } from './mesh.ts';
import { DEFAULT_HOMES, FAMILIES, catalogue, homeFoot, partsOf } from './homes.ts';
import { diffLayouts } from './diff.ts';
import { heightAt, fieldOf, DEEP_Y, GRASS_Y } from './height.ts';
import { Ch, fieldsOf } from './fields.ts';
import { riverStems } from './river.ts';
import { navOf, findPath, snapTap, reachable, walkable } from './nav.ts';
import { validate } from './validate.ts';
import { KIND_LIST } from './catalog.ts';
import { planTap } from '../components/island/tapWalk.ts';
import type { LayoutEntry, LayoutOp } from '#lib/contract/layout.ts';
import {
  BRIDGE, CAMPSITE, DECOR_SLOTS, FLOWERS, GOAL_TREES, HEDGE_XS, HEDGE_Z, HOMES, ROCK, SCENERY, TAPE_DECK
} from '../components/island/world.ts';

const T0 = 1_800_000_000_000;
/** world.ts's z on the long island (scripts/layout-default.ts: おく moved 420u back, past the new middle). */
const long = (z: number) => (z < 680 ? z : z + 420);
const as = (who: 'A' | 'B' | 'G', op: LayoutOp): LayoutEntry => ({ ...op, who }) as LayoutEntry;

describe('the grid', () => {
  test('a tile code is a kind and a tier, one base-36 character', () => {
    for (const k of KINDS)
      for (let t = 0; t < TIERS; t++) {
        const c = codeOf(k, t);
        expect(kindOf(c)).toBe(k);
        expect(tierOf(c)).toBe(t);
        expect(codeOfChar(charOf(c))).toBe(c);
        expect(charOf(c)).toMatch(/^[0-9a-z]$/);
      }
  });
  test('a chunk round-trips through its 64 characters; off the grid is sea', () => {
    const l = defaultLayout();
    for (let i = 0; i < CHUNKS_X * CHUNKS_Z; i++) {
      const g = chunkString(l.codes, i);
      expect(g).toMatch(/^[0-9a-z]{64}$/);
      const codes = new Uint8Array(l.codes.length);
      writeChunk(codes, i, g);
      expect(chunkString(codes, i)).toBe(g);
    }
    // the third chunk across covers columns 16…23: 20…23 are off the grid
    expect(chunkString(l.codes, 2).slice(4, 8)).toBe('0000');
    expect(chunkIndex('c2x5')).toBe(5 * CHUNKS_X + 2);
    expect(chunkIndex('c3x0')).toBeNull();
    expect(chunkOf(9, 24)).toBe(3 * CHUNKS_X + 1);
  });
  test('world points and tiles', () => {
    expect(tileAt(GRID.x0, GRID.z0)).toEqual([0, 0]);
    expect(tileMid(9, 24)).toEqual([195, 645]);
  });
});

describe('the default layout (today island on the grid)', () => {
  const l = defaultLayout();
  test('keeps world.ts ids, each piece on the grid near where it stands today', () => {
    const at = (id: string) => objMid(l, l.objects.get(id)!);
    const near = (id: string, x: number, z: number) => expect(Math.hypot(at(id)[0] - x, at(id)[1] - long(z)), id).toBeLessThanOrEqual(80);
    // (the clifftop's cedars that made room round the museum: scripts/layout-default.ts; the shop stands in the middle,
    // where nothing of today's island is)
    const ROOM = new Set(['cedar-f3', 'cedar-f4', 'cedar-f5', 'cedar-f6']);
    for (const s of SCENERY) if (!ROOM.has(s.id)) near(s.id, s.x, s.z);
    HEDGE_XS.forEach((x, i) => near(`hedge-${i}`, x, HEDGE_Z));
    near('goal-A', ...GOAL_TREES.A);
    near('goal-B', ...GOAL_TREES.B);
    for (const d of DECOR_SLOTS) near(d.id, d.x, d.z);
    near('tape-deck', ...TAPE_DECK);
    near('rock', ...ROCK);
    near('bridge', BRIDGE.x, (BRIDGE.z0 + BRIDGE.z1) / 2);
    near('spot-villager-A', ...HOMES.A);
    for (const f of FLOWERS) if (!ROOM.has(f.id)) near(f.id, f.x, f.z);
    const door = doorOf(l, l.objects.get('home-A')!).at;
    expect(Math.hypot(door[0] - CAMPSITE.x, door[1] - long(CAMPSITE.z))).toBeLessThanOrEqual(30);
  });
  test('every piece of the default sits on the grid: no offsets, no two on one tile', () => {
    const seen = new Map<string, string>();
    for (const o of l.objects.values()) {
      expect(o.n, o.id).toBeUndefined();
      expect(Number.isInteger(o.x) && Number.isInteger(o.z), o.id).toBe(true);
      if (o.k === 'spot') continue;
      for (const [c, r] of objTiles(l, o)) {
        expect(seen.get(`${c},${r}`), `${o.id} on ${c},${r}`).toBeUndefined();
        seen.set(`${c},${r}`, o.id);
      }
    }
    // a footprint's middle is a tile's middle (odd sides) or a tile line (even): on the 30u grid either way
    for (const o of l.objects.values()) {
      const [x, z] = objMid(l, o);
      expect(((x + 90) * 2) % 30, o.id).toBe(0);
      expect(((z + 90) * 2) % 30, o.id).toBe(0);
    }
  });
  test('has the three homes, both goal trees and no errors', () => {
    for (const id of ['home-A', 'home-B', 'home-G']) expect(l.objects.get(id)?.k).toBe('home');
    const errors = validate(l).filter((i) => i.level === 'error');
    expect(errors).toEqual([]);
  });
  test('its terrain: the sea round it, the stream, the pond, the cliff a tier up', () => {
    expect(l.tile(0, 0).kind).toBe('sea');
    expect(l.tile(9, 24).kind).toBe('river'); // under the bridge
    const [pc, pr] = tileAt(74, long(772));
    expect(l.tile(pc, pr).kind).toBe('pond');
    expect(l.tile(9, 15).kind).toBe('dirt'); // the path up the lawn
    expect(l.tile(9, 32).kind).toBe('dirt'); // on through the middle
    expect(l.tile(15, 32).kind).toBe('river'); // the stream down its east side
    expect(l.tile(8, 55).tier).toBe(1);
    expect(l.tile(8, 38).tier).toBe(0);
  });
  test('a kind this phone doesn\'t know (a newer phone\'s piece, the gym\'s on an older app) is kept but ignored: no block, no issue', () => {
    const l = layoutOf([as('A', { sc: 'o', id: 'onew1', at: T0, k: 'hover-board', x: 6, z: 12, f: 1 })]);
    expect(l.objects.get('onew1')?.k).toBe('hover-board');
    expect(validate(l).filter((i) => i.ids.includes('onew1'))).toEqual([]);
    expect(walkable(navOf(l), ...objMid(l, l.objects.get('onew1')!))).toBe(true);
  });
  test('every kind on the catalogue has a footprint and a height', () => {
    for (const d of KIND_LIST) {
      expect(d.w).toBeGreaterThan(0);
      expect(d.d).toBeGreaterThan(0);
      expect(d.h).toBeGreaterThanOrEqual(0);
    }
  });
});

describe('the ops over it', () => {
  const base = defaultLayout();
  test('an object set moves it to its tile (the default offset gone); removed, it is gone; set again, back', () => {
    const l = layoutOf([as('A', { sc: 'o', id: 'oak-m1', at: T0, k: 'oak', x: 3, z: 20, f: 0 })]);
    expect(objMid(l, l.objects.get('oak-m1')!)).toEqual([-90 + 3 * 30 + 15, -90 + 20 * 30 + 15]);
    const gone = layoutOf([as('A', { sc: 'o', id: 'oak-m1', at: T0, rm: true })]);
    expect(gone.objects.has('oak-m1')).toBe(false);
    const back = layoutOf([as('A', { sc: 'o', id: 'oak-m1', at: T0, rm: true }), as('B', { sc: 'o', id: 'oak-m1', at: T0 + 1, k: 'oak', x: 4, z: 20, f: 0 })]);
    expect(back.objects.get('oak-m1')?.x).toBe(4);
  });
  test('a chunk paints its tiles; a home look restyles it', () => {
    const g = '4'.repeat(64);
    const l = layoutOf([as('B', { sc: 'c', id: 'c0x0', at: T0, g }), as('B', { sc: 'h', id: 'hB', at: T0, m: 'tent-n' })]);
    expect(l.tile(0, 0).kind).toBe('grass');
    expect(l.tile(7, 7).kind).toBe('grass');
    expect(l.tile(8, 0).kind).toBe('sea');
    expect(l.homes.B.m).toBe('tent-n');
    expect(base.homes.B.m).toBe('house');
  });
  test('a reset voids every object and chunk op before it, not after', () => {
    const l = layoutOf([
      as('A', { sc: 'o', id: 'oak-m1', at: T0, k: 'oak', x: 3, z: 20, f: 0 }),
      as('A', { sc: 'c', id: 'c0x0', at: T0, g: '4'.repeat(64) }),
      as('A', { sc: 'h', id: 'hA', at: T0, m: 'tent-p' }),
      as('B', { sc: 'r', id: 'reset', at: T0 + 5 }),
      as('A', { sc: 'o', id: 'cedar-m1', at: T0 + 6, k: 'cedar', x: 5, z: 18, f: 0 })
    ]);
    expect(l.objects.get('oak-m1')).toEqual(base.objects.get('oak-m1'));
    expect(l.tile(0, 0).kind).toBe('sea');
    expect(l.objects.get('cedar-m1')?.x).toBe(5);
    // a home's look isn't the outdoors': a reset leaves it
    expect(l.homes.A.m).toBe('tent-p');
  });
  test('the merge is order-free: any order gives one island (later wins, then G over B over A)', () => {
    const es: LayoutEntry[] = [
      as('A', { sc: 'o', id: 'oak-m1', at: T0, k: 'oak', x: 3, z: 20, f: 0 }),
      as('B', { sc: 'o', id: 'oak-m1', at: T0, k: 'oak', x: 4, z: 20, f: 0 }),
      as('A', { sc: 'o', id: 'oak-m1', at: T0 - 1, k: 'oak', x: 9, z: 20, f: 0 }),
      as('A', { sc: 'c', id: 'c1x1', at: T0, g: '4'.repeat(64) }),
      as('B', { sc: 'r', id: 'reset', at: T0 - 2 })
    ];
    const want = toJson(layoutOf(es));
    for (let k = 0; k < 20; k++) {
      const shuffled = [...es].sort(() => Math.random() - 0.5);
      expect(toJson(layoutOf(shuffled))).toEqual(want);
    }
    expect(layoutOf(es).objects.get('oak-m1')?.x).toBe(4);
  });
  test('opsBetween is what turns one layout into the other', () => {
    const a = defaultLayout();
    const tree = a.objects.get('oak-m1')!;
    const b = withChanges(a, { tiles: [[5, 5, codeOf('pond', 0)]], set: [{ ...tree, x: 2, z: 30, n: undefined }, { id: 'onew1', k: 'bush', x: 6, z: 30, f: 0, s: 'holly' }], remove: ['palm-3'], homes: { G: { m: 'tent-n' } } });
    const ops = opsBetween(a, b, T0);
    expect(ops.map((o) => o.sc).sort()).toEqual(['c', 'h', 'o', 'o', 'o']);
    const again = layoutOf(ops.map((o) => as('A', o)));
    expect(toJson(again)).toEqual(toJson(b));
  });
  test('JSON round-trips and refuses junk', () => {
    const j = toJson(defaultLayout());
    expect(toJson(fromJson(JSON.parse(JSON.stringify(j)))!)).toEqual(j);
    expect(fromJson({ v: 1, tiles: ['x'] })).toBeNull();
    // an export from the 60-row grid: the rows behind it the sea
    expect(toJson(fromJson({ ...j, tiles: j.tiles.slice(0, 60) })!)).toEqual(j);
    expect(fromJson({ ...j, tiles: [...j.tiles, j.tiles[0]] })).toBeNull();
    expect(fromJson({ ...j, objects: [{ id: 'x', k: 'nope', x: 0, z: 0, f: 0 }] })).toBeNull();
  });
  test('diffLayouts names the chunks and the objects that changed', () => {
    const a = defaultLayout();
    const b = withChanges(a, { tiles: [[9, 24, codeOf('grass', 0)]], set: [{ ...a.objects.get('oak-m1')!, x: 2 } as Obj], remove: ['palm-3'] });
    const d = diffLayouts(a, b);
    expect(d.chunks).toEqual([chunkOf(9, 24)]);
    expect(d.objects.move.map((o) => o.id)).toEqual(['oak-m1']);
    expect(d.objects.remove).toEqual(['palm-3']);
    expect(diffLayouts(a, withChanges(a, { homes: { B: { m: 'tent-p' } } })).objects.move.map((o) => o.id)).toEqual(['home-B']);
  });
});

describe('heights', () => {
  const l = defaultLayout();
  test('the lawn, the upper tier, the stream, the sea; the stairs ramp between tiers', () => {
    expect(heightAt(l, 240, 270)).toBeCloseTo(GRASS_Y);
    expect(heightAt(l, 200, 1630)).toBeCloseTo(40 + GRASS_Y);
    expect(fieldOf(l).ground(195, 646)).toBeLessThan(0);
    expect(heightAt(l, 195, -80)).toBeLessThan(0);
    const st = l.objects.get('stairs')!, [sx, sz] = objMid(l, st);
    const mid = heightAt(l, sx, sz);
    expect(mid).toBeGreaterThan(GRASS_Y + 10);
    expect(mid).toBeLessThan(40 + GRASS_Y - 10);
    // the bridge's deck over the stream
    expect(heightAt(l, 195, 646)).toBeGreaterThan(GRASS_Y);
  });
  test('a river runs out into the sea without a step: its bed shallows into the seabed (the user\'s 2026-11-06 hard line at the shore)', () => {
    const { ground, fields } = fieldOf(l);
    // the stream's mouth on the left beach (column 2, rows 23-24): across the shore along its middle, from its bed
    // inland out past where its stem runs on into the sea
    let z = 600, best = Infinity;
    for (let k = 600; k <= 660; k += 2.5) if (fields.at(Ch.fresh, -30, k) < best) (best = fields.at(Ch.fresh, -30, k)), (z = k);
    expect(best).toBeLessThan(-5);
    let prev = ground(40, z);
    expect(prev).toBeLessThan(-3);
    for (let x = 39; x >= -85; x--) {
      const y = ground(x, z);
      expect(Math.abs(y - prev)).toBeLessThan(0.6);
      prev = y;
    }
  });
  test('by the grid\'s edge the seabed is down at the deep plane\'s level (no ledge where the ground\'s mesh ends)', () => {
    const { ground } = fieldOf(l);
    // at the grid's edges, however near the land comes (the editor's しまの おおきさ keeps 2 tiles of sea)
    expect(ground(200, GRID.z0 + GRID.rows * 30 - 1)).toBeCloseTo(DEEP_Y, 1);
    expect(ground(GRID.x0 + 1, 600)).toBeCloseTo(DEEP_Y, 1);
    expect(ground(GRID.x0 + GRID.cols * 30 - 1, 600)).toBeCloseTo(DEEP_Y, 1);
    // and nearer the land, the shelf as it was
    expect(ground(-40, 600)).toBeGreaterThan(DEEP_Y + 0.5);
  });
  test('the corners are round: a convex cliff corner is cut', () => {
    const { tierAt } = fieldOf(l);
    // the upper tier's land meets the beach at its corners: the tile's very corner is lower than its middle
    expect(tierAt(-90 + 4 * 30 + 15, -90 + 55 * 30 + 15)).toBe(1);
  });
});

describe('the soft edges (fields.ts): the data on tiles, the drawn edge round', () => {
  const l = defaultLayout();
  const f = fieldsOf(l);
  test('a one-tile path keeps its breadth; the stream runs straight across under its bridge', () => {
    // the dirt path down column 9 (x 180…210); the stream under the bridge (column 9, row 24: z 630…660) pinned to its
    // tile's middle, its banks a breadth either side
    expect(Math.abs(f.at(Ch.path, 180, 400))).toBeLessThan(1);
    expect(f.at(Ch.path, 195, 400)).toBeLessThan(-9);
    expect(Math.abs(f.at(Ch.fresh, 195, 645 - 13.5))).toBeLessThan(1);
    expect(Math.abs(f.at(Ch.fresh, 195, 645 + 13.5))).toBeLessThan(1);
    expect(f.at(Ch.fresh, 195, 645)).toBeLessThan(-10);
  });
  test('the stream\'s turn is drawn round (river.ts): its staircase of tiles a quarter circle, its straights straight', () => {
    const [s] = riverStems(l);
    // one stem, from the mouth to the fall below the cliff
    expect(s.tiles).toHaveLength(42);
    // the staircase from (12, 24) up to (15, 27), between the straight across (row 24) and the straight up column 15:
    // one quarter circle, deep water through the steps (x 330, z 705), the grass tiles beside it bank (the middle of
    // (13, 24) and of (12, 26))
    expect(s.arcs).toHaveLength(1);
    expect(s.arcs[0].deg).toBeCloseTo(90, 3);
    expect(f.at(Ch.fresh, 330, 705)).toBeLessThan(-8);
    expect(f.at(Ch.fresh, 315, 645)).toBeGreaterThan(8);
    expect(f.at(Ch.fresh, 285, 705)).toBeGreaterThan(8);
    // the long reach up column 15 (x 360…390): exactly on its tiles' middle, one breadth
    const run = [...s.x.keys()].filter((i) => s.z[i] > 830 && s.z[i] < 1300);
    for (const i of run) {
      expect(s.x[i]).toBeCloseTo(375, 4);
      expect(s.hw[i]).toBe(13.5);
    }
    // the flow along it: downstream (toward the mouth: −z on this reach), on the water only
    const fl = f.flow(375, 1000)!;
    expect(fl[1]).toBeLessThan(-0.9);
    expect(f.flow(375 + 45, 1000)).toBeNull();
    // and the stream's water goes on over the bank tile beside its arc (the grass at (14, 28), inside the turn)
    const m = chunkMesh(l, chunkOf(14, 28));
    let over = 0;
    for (let k = 0; k < m.water.pos.length / 3; k++) {
      const x = m.water.pos[k * 3], z = -m.water.pos[k * 3 + 2];
      if (x > 330 && x < 360 && z > 750 && z < 780) over++;
    }
    expect(over).toBeGreaterThan(0);
  });
  test('the stream\'s water carries its place on the stem (the streaks\' way along and across), the falls\' lip and foot', () => {
    // up column 15: the length along grows upstream, the middle of the band across 0, its sides ±1
    const a = f.along(375, 1000)!, b = f.along(375, 1100)!;
    expect(b[0] - a[0]).toBeCloseTo(100, 0);
    expect(Math.abs(a[1])).toBeLessThan(0.05);
    expect(Math.abs(f.along(375 + 13.5, 1000)![1])).toBeCloseTo(1, 1);
    // round the quarter circle: no jump in the length along between neighbouring points
    const s1 = f.along(320, 690)![0], s2 = f.along(325, 695)![0];
    expect(Math.abs(s2 - s1)).toBeLessThan(10);
    expect(f.along(375 + 60, 1000)).toBeNull();
    // the fall at the cliff (column 15, between rows 52 and 53: z 1500): its lip above, its foam pool below
    const m = chunkMesh(l, chunkOf(15, 52)), n = m.water.pos.length / 3;
    let lip = 0, foot = 0;
    for (let k = 0; k < n; k++) {
      const z = -m.water.pos[k * 3 + 2];
      if (z > 1500 && z < 1510) lip = Math.max(lip, m.water.path[k * 4 + 3]);
      if (z < 1500 && z > 1490) foot = Math.max(foot, m.water.flow[k * 4 + 3]);
    }
    expect(lip).toBeGreaterThan(0.5);
    expect(foot).toBeGreaterThan(0.5);
  });
  test('a broad river (mostly not one stem) keeps its tiles', () => {
    const codes = new Uint8Array(l.codes);
    for (let r = 28; r <= 40; r++) for (const c of [13, 14]) codes[r * GRID.cols + c] = codeOf('river', 0);
    const broad = { ...l, codes, kind: l.kind, tier: l.tier } as typeof l;
    expect(riverStems(broad).some((st) => st.tiles.includes(30 * GRID.cols + 15))).toBe(false);
  });
  test('the coast\'s corners are round: the island\'s front corner is cut well inside its tile', () => {
    // sand tile (4, 2) at the front left (x 30…60, z −30…0): its outer corner is sea, its middle well inland
    expect(f.at(Ch.land, 31, -29)).toBeGreaterThan(4);
    expect(f.at(Ch.land, 45, -15)).toBeLessThan(-5);
  });
});

describe('walking on it (layout/nav.ts, planTap drop-in)', () => {
  const l = defaultLayout();
  const g = navOf(l);
  test('builds fast and names the spots', () => {
    expect(g.buildMs).toBeLessThan(250); // ~4 ms alone; a loaded machine runs the suite in parallel
    expect(g.named.homeA).toBeDefined();
    expect(g.named['door-home-B']).toBeDefined();
    expect(g.named.seatMaeL).toBeDefined();
  });
  test('from home to うめ house; up the stairs, the only way up the cliff', () => {
    expect(findPath(g, g.named.homeA, g.named['door-home-B'])).not.toBeNull();
    const p = findPath(g, g.named.homeA, [225, 1515]); // the clifftop, before the museum's door
    expect(p).not.toBeNull();
    const st = l.objects.get('stairs')!, [w, d] = footOf(l, st);
    const x0 = -90 + st.x * 30, z0 = -90 + st.z * 30;
    const via = [g.named.homeA, ...p!];
    // some leg crosses the stairs' footprint
    const onStairs = via.some((q, i) => i > 0 && [0.25, 0.5, 0.75].some((t) => {
      const x = via[i - 1][0] + (q[0] - via[i - 1][0]) * t, z = via[i - 1][1] + (q[1] - via[i - 1][1]) * t;
      return x >= x0 && x <= x0 + w * 30 && z >= z0 && z <= z0 + d * 30;
    }) || (q[0] >= x0 && q[0] <= x0 + w * 30 && q[1] >= z0 && q[1] <= z0 + d * 30));
    expect(onStairs).toBe(true);
  });
  test('without the stairs, the upper tier is out of reach (a pocket)', () => {
    const l2 = withChanges(l, { remove: ['stairs'] });
    const g2 = navOf(l2);
    expect(reachable(g2, 225, 1515)).toBe(false);
    expect(validate(l2, g2).some((i) => i.code === 'pocket' && i.tiles.length > 30)).toBe(true);
    // a home up there would be walled in, as the museum is
    const up = withChanges(l2, { set: [{ ...l.objects.get('home-B')!, z: 55, x: 4 }] });
    expect(validate(up).filter((i) => i.code === 'door').flatMap((i) => i.ids)).toEqual(['home-B', 'museum']);
  });
  test('a tap: on a home goes to its door; on the pond to its bank; on the lawn there', () => {
    const [hx, hz] = objMid(l, l.objects.get('home-A')!);
    expect(snapTap(g, hx, hz)).toMatchObject({ kind: 'door', building: 'home-A' });
    expect(snapTap(g, 74, long(772))).toMatchObject({ kind: 'bank', water: 'pond' });
    expect(snapTap(g, 240, 270)).toMatchObject({ kind: 'here' });
    expect(walkable(g, 195, 646)).toBe(true); // the bridge's deck
    const plan = planTap(g, g.named.homeA, 200, 400);
    expect(plan?.to).toEqual([200, 400]);
    expect(plan!.ms).toBeGreaterThan(0);
  });
});

describe('validation', () => {
  const l = defaultLayout();
  const codes = (ls: ReturnType<typeof validate>) => ls.filter((i) => i.level === 'error').map((i) => i.code);
  test('a missing or a second goal tree', () => {
    expect(codes(validate(withChanges(l, { remove: ['goal-A'] })))).toContain('goal');
    expect(codes(validate(withChanges(l, { set: [{ id: 'o2', k: 'goal-tree', x: 5, z: 15, f: 0, s: 'b' }] })))).toContain('goal');
  });
  test('a tree in the water, two things on one tile, stairs that join nothing, a bridge on dry land', () => {
    expect(codes(validate(withChanges(l, { set: [{ id: 'o3', k: 'oak', x: 9, z: 24, f: 0 }] })))).toContain('on-water');
    const tape = l.objects.get('tape-deck')!;
    expect(codes(validate(withChanges(l, { set: [{ id: 'o4', k: 'oak', x: tape.x, z: tape.z, f: 0 }] })))).toContain('overlap');
    expect(codes(validate(withChanges(l, { set: [{ id: 'o5', k: 'stairs', x: 5, z: 15, f: 0 }] })))).toContain('stairs');
    expect(codes(validate(withChanges(l, { set: [{ ...l.objects.get('bridge')!, z: 12 }] })))).toContain('bridge');
  });
  test('a home walled in: its door is an error', () => {
    const h = l.objects.get('home-A')!;
    const d = doorOf(l, h).tiles;
    const walls: Obj[] = d.map(([c, r], i) => ({ id: `w${i}`, k: 'garden-rock', x: c, z: r, f: 0 }));
    expect(codes(validate(withChanges(l, { set: walls })))).toContain('door');
  });
});

describe('the long island (20 × 80: rows of sea behind it to grow into) and its 3D ground (layout/mesh.ts)', () => {
  const l = defaultLayout();
  test('its extent: the land twice today’s length, the front shore, ウェイ’s door at the back', () => {
    const e = extentOf(l);
    expect(e.grid).toEqual({ x0: -90, x1: 510, z0: -90, z1: 2310 });
    expect(e.land.z1 - e.land.z0).toBeGreaterThan(1600);
    // the land as it was (rows 2…58), the grid's last 20 rows the sea
    expect(e.land.z1).toBe(1680);
    for (let r = 60; r < 80; r++) for (let c = 0; c < 20; c++) expect(l.kind(c, r)).toBe('sea');
    expect(e.shore).toBe(-30);
    expect(Math.abs(e.home[1] - long(CAMPSITE.z))).toBeLessThanOrEqual(30);
  });
  test('the chunks: finite, the cliff a wall, the stream falling where it steps down, fresh water, the stairs', { timeout: 30_000 }, () => {
    let walls = 0, falls = 0, water = 0;
    // the cliff's band (its walls, the falls, the stairs' foot), the middle's (the stream), the front's (the sea's edge)
    const bands = [chunkOf(9, 52), chunkOf(15, 52), chunkOf(15, 32), chunkOf(9, 2)];
    void CHUNK_COUNT;
    for (const i of bands) {
      const m = chunkMesh(l, i);
      for (const a of [m.top.pos, m.walls.pos, m.water.pos]) expect(a.every(Number.isFinite)).toBe(true);
      expect(m.top.index.every((k) => k < m.top.pos.length / 3)).toBe(true);
      walls += m.walls.index.length;
      falls += m.falls.index.length;
      water += m.water.index.length;
    }
    expect(walls).toBeGreaterThan(100);
    expect(falls).toBeGreaterThan(0);
    expect(water).toBeGreaterThan(300);
    expect(stairsMesh(l).index.length).toBeGreaterThan(8 * 6 * 3);
  });
  test('a cliff wall stands from the upper ground down to the lower', { timeout: 30_000 }, () => {
    // the chunk holding the cliff's line at the island's middle
    const m = chunkMesh(l, chunkOf(9, 52));
    const ys = Array.from({ length: m.walls.pos.length / 3 }, (_, k) => m.walls.pos[k * 3 + 1]);
    expect(Math.max(...ys)).toBeCloseTo(40 + GRASS_Y, 0);
    expect(Math.min(...ys)).toBeLessThan(GRASS_Y + 0.5);
  });
});

describe('the homes (layout/homes.ts)', () => {
  test('every door stands in its wall’s doorway (NH’s DoorModel0: up the step, across to a villager house’s door), inside the front wall', () => {
    const walls = Object.entries(FAMILIES).filter(([f]) => f.startsWith('wall-')), doors = Object.entries(FAMILIES).filter(([f]) => f.startsWith('door-'));
    expect(walls.length).toBeGreaterThan(10);
    for (const [wf, w] of walls) {
      const at = w.door!;
      expect(at, wf).toHaveLength(3);
      expect(at[1], `${wf}: up its step`).toBeGreaterThan(1);
      expect(Math.abs(at[0]), `${wf}: the player house's door in the middle, a villager's to the right`).toBe(wf.includes('pa04') ? 0 : 5);
      for (const [df, d] of doors) {
        const lo = d.min.map((n, i) => n + at[i]), hi = d.max.map((n, i) => n + at[i]);
        // inside the wall's bounds across, up and deep (no further out than its front, its porch's step)
        for (const [i, axis] of ['across', 'up', 'deep'].entries()) expect(lo[i] >= w.min[i] && hi[i] <= w.max[i], `${df} in ${wf} ${axis}`).toBe(true);
      }
    }
    // the style's door part carries its wall's doorway
    const parts = partsOf(DEFAULT_HOMES.G);
    expect(parts[2].at).toEqual(FAMILIES[parts[0].family].door);
  });
  const l = defaultLayout();
  test('each style’s parts: NH’s families in their colours; a roof of another shape mended to the wall’s', () => {
    expect(partsOf({ m: 'house', w: 'PA04Stucco.B', r: 'PA04Westerntile.C', d: 'Simple.R.A' })).toEqual([
      { family: 'wall-pa04-stucco', colour: 'B' }, { family: 'roof-pa04-westerntile', colour: 'C' }, { family: 'door-simple-r', colour: 'A', at: [0, 2, -1.63] }
    ]);
    const mended = partsOf({ m: 'house', w: 'NCJapanese.A', r: 'PA04Stone.A', d: 'Lattice.S.B' });
    expect(mended[1].family).toMatch(/^roof-nc-/);
    expect(mended[2]).toMatchObject({ family: 'door-lattice-s', colour: 'B' });
    expect(partsOf({ m: 'tent-n', w: 'B' })).toEqual([{ family: 'tent-n', colour: 'B' }]);
    expect(partsOf({ m: 'campsite' })).toEqual([]);
    const cat = catalogue();
    expect(Object.keys(cat.walls).sort()).toEqual(['NA', 'NB', 'NC', 'ND', 'PA04']);
    expect(cat.doors.length).toBe(14);
    // every family's colours ship (scripts/home-models.ts: its GLB, its swatches)
    for (const [f, fam] of Object.entries(FAMILIES)) expect(Object.keys(fam.colours).length, f).toBeGreaterThan(0);
  });
  test('a new look keeps the door where it was: the footprint grows round it (half a tile across for an even width)', () => {
    const b = l.objects.get('home-B')!;
    const door = doorOf(l, b);
    for (const style of [{ m: 'tent-n', w: 'A' }, { m: 'house', w: 'NDSoil.A', r: 'NDStone.A', d: 'Simple.S.A' }, { m: 'house', w: 'NAMetal.C', r: 'NASlate.A', d: 'Window.R.D' }]) {
      const l2 = withChanges(l, { homes: { B: style } });
      const d2 = doorOf(l2, l2.objects.get('home-B')!);
      expect(d2.at[1]).toBe(door.at[1]);
      expect(Math.abs(d2.at[0] - door.at[0])).toBeLessThanOrEqual(15);
      // the tile before the door (its anchor's) is still the way in
      expect(d2.tiles).toContainEqual([b.x, b.z - 1]);
      expect(footOf(l2, b)).toEqual([...homeFoot(style)]);
      expect(validate(l2).filter((i) => i.level === 'error' && i.ids.includes('home-B'))).toEqual([]);
    }
  });
});

describe('a home turns with its owner’s look', () => {
  const l = defaultLayout();
  test('the owner’s `h` op turns it (its door and footprint with it); an outdoor op never does', () => {
    const turned = layoutOf([as('B', { sc: 'h', id: 'hB', at: T0, ...DEFAULT_HOMES.B, f: 1 } as LayoutOp)]);
    const b = turned.objects.get('home-B')!;
    expect(b.f).toBe(1);
    const d0 = doorOf(l, l.objects.get('home-B')!), d1 = doorOf(turned, b);
    expect(d1.at).not.toEqual(d0.at);
    expect(footOf(turned, b)).toEqual([...homeFoot(DEFAULT_HOMES.B)].reverse());
    // a member's move of it keeps its facing (the owner's)
    const moved = layoutOf([as('A', { sc: 'o', id: 'home-B', at: T0, k: 'home', x: 5, z: 29, f: 2 })]);
    expect(moved.objects.get('home-B')!.f).toBe(l.objects.get('home-B')!.f);
  });
});
