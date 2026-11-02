import { describe, expect, test } from 'vitest';
import { CHUNKS_X, CHUNKS_Z, GRID, chunkIndex, chunkOf, chunkString, codeOf, codeOfChar, charOf, kindOf, tierOf, writeChunk, KINDS, TIERS, tileAt, tileMid } from './grid.ts';
import { defaultLayout, doorOf, layoutOf, objMid, opsBetween, toJson, fromJson, withChanges, footOf, type Obj } from './model.ts';
import { diffLayouts } from './diff.ts';
import { heightAt, fieldOf, GRASS_Y } from './height.ts';
import { navOf, findPath, snapTap, reachable, walkable } from './nav.ts';
import { validate } from './validate.ts';
import { KIND_LIST } from './catalog.ts';
import { planTap } from '../components/island/tapWalk.ts';
import type { LayoutEntry, LayoutOp } from '#lib/contract/layout.ts';
import {
  BRIDGE, CAMPSITE, DECOR_SLOTS, FLOWERS, GOAL_TREES, HEDGE_XS, HEDGE_Z, HOMES, ROCK, SCENERY, TAPE_DECK
} from '../components/island/world.ts';

const T0 = 1_800_000_000_000;
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
  test('keeps world.ts ids, every object exactly where it stands today', () => {
    const at = (id: string) => objMid(l, l.objects.get(id)!).map((v) => Math.round(v * 10) / 10);
    for (const s of SCENERY.filter((s) => !s.id.startsWith('cedar-f'))) expect(at(s.id), s.id).toEqual([s.x, s.z]);
    HEDGE_XS.forEach((x, i) => expect(at(`hedge-${i}`)).toEqual([x, HEDGE_Z]));
    expect(at('goal-A')).toEqual([...GOAL_TREES.A]);
    expect(at('goal-B')).toEqual([...GOAL_TREES.B]);
    for (const d of DECOR_SLOTS) expect(at(d.id), d.id).toEqual([d.x, d.z]);
    expect(at('tape-deck')).toEqual([...TAPE_DECK]);
    expect(at('rock')).toEqual([...ROCK]);
    expect(at('bridge')).toEqual([BRIDGE.x, (BRIDGE.z0 + BRIDGE.z1) / 2]);
    expect(at('spot-villager-A')).toEqual([...HOMES.A]);
    for (const f of FLOWERS) expect(at(f.id)).toEqual([f.x, f.z]);
    // the campsite's tent: its front on the door line
    expect(doorOf(l, l.objects.get('home-A')!).at.map(Math.round)).toEqual([CAMPSITE.x, CAMPSITE.z]);
  });
  test('has the three homes, both goal trees and no errors', () => {
    for (const id of ['home-A', 'home-B', 'home-G']) expect(l.objects.get(id)?.k).toBe('home');
    const errors = validate(l).filter((i) => i.level === 'error');
    expect(errors).toEqual([]);
  });
  test('its terrain: the sea round it, the stream, the pond, the cliff a tier up', () => {
    expect(l.tile(0, 0).kind).toBe('sea');
    expect(l.tile(9, 24).kind).toBe('river'); // under the bridge
    const [pc, pr] = tileAt(74, 772);
    expect(l.tile(pc, pr).kind).toBe('pond');
    expect(l.tile(9, 15).kind).toBe('dirt'); // the path up the lawn
    expect(l.tile(8, 41).tier).toBe(1);
    expect(l.tile(8, 30).tier).toBe(0);
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
    expect(heightAt(l, 195, 300)).toBeCloseTo(GRASS_Y);
    expect(heightAt(l, 200, 1160)).toBeCloseTo(40 + GRASS_Y);
    expect(fieldOf(l).ground(195, 646)).toBeLessThan(0);
    expect(heightAt(l, 195, -80)).toBeLessThan(0);
    const st = l.objects.get('stairs')!, [sx, sz] = objMid(l, st);
    const mid = heightAt(l, sx, sz);
    expect(mid).toBeGreaterThan(GRASS_Y + 10);
    expect(mid).toBeLessThan(40 + GRASS_Y - 10);
    // the bridge's deck over the stream
    expect(heightAt(l, 195, 646)).toBeGreaterThan(GRASS_Y);
  });
  test('the corners are round: a convex cliff corner is cut', () => {
    const { tierAt } = fieldOf(l);
    // the upper tier's land meets the beach at its corners: the tile's very corner is lower than its middle
    expect(tierAt(-90 + 3 * 30 + 15, -90 + 43 * 30 + 15)).toBe(1);
  });
});

describe('walking on it (layout/nav.ts, planTap drop-in)', () => {
  const l = defaultLayout();
  const g = navOf(l);
  test('builds fast and names the spots', () => {
    expect(g.buildMs).toBeLessThan(50);
    expect(g.named.homeA).toBeDefined();
    expect(g.named['door-home-B']).toBeDefined();
    expect(g.named.seatMaeL).toBeDefined();
  });
  test('from home to うめ house: up the stairs, the only way up the cliff', () => {
    const p = findPath(g, g.named.homeA, g.named['door-home-B']);
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
  test('without the stairs, the upper tier is out of reach and its doors are errors', () => {
    const l2 = withChanges(l, { remove: ['stairs'] });
    const g2 = navOf(l2);
    expect(reachable(g2, 200, 1160)).toBe(false);
    expect(validate(l2, g2).filter((i) => i.code === 'door').flatMap((i) => i.ids).sort()).toEqual(['home-B', 'home-G']);
  });
  test('a tap: on a home goes to its door; on the pond to its bank; on the lawn there', () => {
    const [hx, hz] = objMid(l, l.objects.get('home-A')!);
    expect(snapTap(g, hx, hz)).toMatchObject({ kind: 'door', building: 'home-A' });
    expect(snapTap(g, 74, 772)).toMatchObject({ kind: 'bank', water: 'pond' });
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
