// The 3D pick (pick3d.ts): the tap areas the island's models put in things3, projected through the camera as the
// World places their DOM nodes, chosen top first as the DOM stacks them.
import { describe, expect, it, vi } from 'vitest';
import { World, type Proj3 } from '../island/camera.svelte.ts';
import { areaOf, boxTaps, controlTaps, onArea, pickTaps, tapsNow } from './pick3d.ts';
import { tap, type Tap3 } from './things3.ts';
import type { At } from './engine.ts';

/** A flat camera: a world point (x, z) at (x, z) px, `lift` up the screen, a unit 2 px (an upright model squashed to
 *  half its height: `up` 0.5); behind it past z 2000; a model's outline its id's box. */
const flat = (): Proj3 => ({
  at: (x, z, lift, out) => Object.assign(out ?? ({} as At), { sx: x, sy: z - 2 * lift, k: 2, up: 0.5, ground: 1, depth: z < 2000 ? 100 : -1, visible: z < 2000 }),
  outline: (id) => (id === 'house' ? [[100, 100], [160, 100], [160, 140], [100, 140]] : null),
  ground: () => null,
  horizon: () => 0,
  rev: () => 0,
  kick: vi.fn(),
  idle: () => true
});
const world = (vh = 844) => {
  const w = new World();
  w.fit(390, vh);
  w.useThree(flat());
  w.step(0);
  return w;
};
/** Only these tap areas (not the goal trees': tapsNow adds them). */
const mine = (w: World) => tapsNow(w).filter((t) => t.kind !== 'goal' && t.kind !== 'row');
const at = (x: number, z: number, more: Partial<Tap3> = {}): Tap3 => ({ kind: 'bush', id: `${x},${z}`, x, z, l: -10, r: 10, b: 0, t: 20, ...more });

describe('pick3d', () => {
  it("an area's box: its rect round the foot at the camera's scale, an upright model's height squashed; a least size grown about its middle or up from its bottom", () => {
    const w = world();
    expect(areaOf(w, at(100, 300))).toMatchObject({ l: 80, r: 120, t: 260, b: 300 });
    expect(areaOf(w, at(100, 300, { model: true }))).toMatchObject({ t: 280, b: 300 });
    // (2 u across is 4 px: grown to 44 × 48 up from its bottom)
    expect(areaOf(w, at(100, 300, { l: -1, r: 1, b: -2, t: 0, min: [44, 48, 'bottom'] }))).toMatchObject({ l: 78, r: 122, t: 256, b: 304 });
    expect(areaOf(w, at(100, 300, { l: -1, r: 1, b: -1, t: 1, min: [44, 44, 'mid'] }))).toMatchObject({ l: 78, r: 122, t: 278, b: 322 });
  });

  it('hidden as its node would be: past the screen, behind the camera; never by its distance ahead (no z window)', () => {
    const w = world(2400);
    expect(areaOf(w, at(100, 1500))).not.toBeNull();
    expect(areaOf(w, at(100, 50, { live: () => [100, 1500] }))).not.toBeNull();
    expect(areaOf(w, at(-500, 300))).toBeNull();
    expect(areaOf(w, at(100, 2100))).toBeNull();
  });

  it('rounded corners and a clip as the DOM hit-tests them; a body by its outline', () => {
    const w = world();
    const a = areaOf(w, at(100, 300, { round: [0.5, 0.5] }))!;
    expect([onArea(a, 100, 280), onArea(a, 81, 261), onArea(a, 100, 261)]).toEqual([true, false, true]);
    const c = areaOf(w, at(100, 300, { clip: { l: -10, r: 0, b: 0, t: 20 } }))!;
    expect([onArea(c, 90, 280), onArea(c, 110, 280)]).toEqual([true, false]);
    const house = areaOf(w, { kind: 'building', id: 'campsite', x: 130, z: 140, l: 0, r: 0, b: 0, t: 0, body: { x0: 100, x1: 160, z0: 100, z1: 140, h: 20, shape: 'house' } })!;
    expect([house.l, house.t, house.r, house.b]).toEqual([100, 100, 160, 140]);
    expect([onArea(house, 130, 120), onArea(house, 99, 120)]).toEqual([true, false]);
  });

  it('a tap goes to the area on top: the nearer one, a later one over an equal depth, its own order over every depth; with what else it is', () => {
    const w = world();
    tap(w, [at(100, 300, { id: 'far' }), at(100, 290, { id: 'near' })])();
    expect(pickTaps(w, mine(w), 100, 280)).toEqual({ kind: 'bush', id: 'near', also: [] });
    tap(w, [at(100, 400, { kind: 'swarm', id: 'mine', zi: 50_000_000, t: 200 })])();
    expect(pickTaps(w, mine(w), 100, 280)?.kind).toBe('swarm');
    const w2 = world();
    tap(w2, [at(100, 300, { kind: 'sit', id: 'bench', also: [{ kind: 'fixture', id: 'bench' }] })])();
    expect(pickTaps(w2, mine(w2), 100, 280)).toEqual({ kind: 'sit', id: 'bench', also: [{ kind: 'fixture', id: 'bench' }] });
    expect(pickTaps(w2, mine(w2), 300, 280)).toBeNull();
  });

  it("a thing's box unites its parts (a tree's leaves and trunk; `trunk` the trunk alone; a seat's fixture by its alias); the controls, each once", () => {
    const w = world();
    tap(w, [at(100, 300, { kind: 'tree', id: 'oak', part: 'leaves', t: 40, b: 20 }), at(100, 300, { kind: 'tree', id: 'oak', part: 'trunk', l: -5, r: 5 })])();
    expect(boxTaps(w, mine(w), 'tree', 'oak')).toEqual({ left: 80, top: 220, width: 40, height: 80, foot: null });
    expect(boxTaps(w, mine(w), 'trunk', 'oak')).toMatchObject({ left: 90, width: 20 });
    tap(w, [at(200, 300, { kind: 'sit', id: 'b', also: [{ kind: 'fixture', id: 'b' }] }), at(300, 300, { kind: 'villager', id: 'mine' })])();
    expect(boxTaps(w, mine(w), 'fixture', 'b')).toMatchObject({ left: 180 });
    expect(boxTaps(w, mine(w), 'villager', 'mine')?.foot).toEqual([300, 300]);
    expect(controlTaps(w, mine(w), new Set(['villager'])).map((c) => `${c.kind}:${c.id}`)).toEqual(['villager:mine']);
  });

  it('a tap area off the island once its taking off runs; a later one of the same kind, id and part replaces it', () => {
    const w = world(), off = tap(w, [at(100, 300)])();
    tap(w, [at(100, 300, { r: 30 })])();
    expect(mine(w).map((t) => t.r)).toEqual([30]);
    off();
    expect(mine(w)).toHaveLength(1);
  });
});
