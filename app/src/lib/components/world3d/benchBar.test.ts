import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Matrix4, Quaternion, Vector3 } from 'three';
import { ASSET_KEYS, ASSET_MODELS } from './assets.ts';
import { barAt, barK, blendFrame, GRAB_MS, HELD, HELD_PROPS, HELD_SCALE, heldAt, heldIn, RACK_MS } from './benchBar.ts';

const GLB = join(import.meta.dirname, '../../../../static/room/world3d/decor/weight-bench.glb');
/** A GLB's JSON chunk. */
const gltfOf = (file: string) => {
  const b = readFileSync(file);
  return JSON.parse(b.subarray(20, 20 + b.readUInt32LE(12)).toString('utf8')) as { nodes: { name?: string; extras?: { rest?: number[]; axis?: string; len?: number }; children?: number[]; mesh?: number }[]; meshes: { primitives: { material: number }[] }[] };
};

describe('the weight bench\'s bar (split at conversion: scripts/world3d-models.ts `split`)', () => {
  const m = ASSET_MODELS['decor/weight-bench'], part = m.part!;
  it('is a part of its own across the bench, at the rack\'s top', () => {
    expect(part.name).toBe('bar');
    // its length along the bench's width (z: the bench runs along x), nearly the whole width, NH's plates at its ends
    expect(part.axis).toBe('z');
    expect(part.len).toBeGreaterThan((m.max[2] - m.min[2]) * 0.9);
    // near the top, over the head's end of the bench (−x)
    expect(part.rest[1]).toBeGreaterThan(m.max[1] * 0.75);
    expect(part.rest[1]).toBeLessThan(m.max[1]);
    expect(part.rest[0]).toBeLessThan(0);
    expect(Math.abs(part.rest[2])).toBeLessThan(0.01);
  });
  it('is its GLB\'s own node, its rest in its extras, the same material as the bench', () => {
    const g = gltfOf(GLB);
    const bar = g.nodes.find((n) => n.name === 'bar')!;
    expect(bar.extras).toEqual({ rest: part.rest, axis: 'z', len: part.len });
    const meshOf = (n: (typeof g.nodes)[number]) => n.mesh ?? g.nodes[n.children![0]].mesh!;
    const body = g.nodes.find((n) => n.name === 'mBody')!;
    expect(meshOf(bar)).not.toBe(meshOf(body));
    // (one material: +1 draw at most)
    expect(g.meshes[meshOf(bar)].primitives[0].material).toBe(g.meshes[meshOf(body)].primitives[0].material);
  });
});

describe('benchBar', () => {
  it('goes from the rack to the hands, and back', () => {
    expect(barK(0, 100, null, 0)).toBe(0);
    expect(barK(100 + GRAB_MS / 2, 100, null, 0)).toBeCloseTo(0.5);
    expect(barK(100 + GRAB_MS, 100, null, 0)).toBe(1);
    expect(barK(5000, 100, 5000, 1)).toBe(1);
    expect(barK(5000 + RACK_MS, 100, 5000, 1)).toBe(0);
    // (let go of part-way: back from there)
    expect(barK(5000, 100, 5000, 0.4)).toBeCloseTo(0.4);
  });
  const rest = new Matrix4().compose(new Vector3(10, 40, -5), new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), 0.3), new Vector3(3, 3, 3));
  const l = new Vector3(0, 30, 6), r = new Vector3(0, 32, -6);
  it('on the rack it rests; in the hands its middle is theirs, its length along them, its scale its own', () => {
    expect(barAt(new Matrix4(), rest, 'z', l, r, 0).equals(rest)).toBe(true);
    const out = barAt(new Matrix4(), rest, 'z', l, r, 1), p = new Vector3(), q = new Quaternion(), s = new Vector3();
    out.decompose(p, q, s);
    expect(p.distanceTo(new Vector3(0, 31, 0))).toBeLessThan(1e-6);
    expect(s.x).toBeCloseTo(3);
    const along = new Vector3(0, 0, 1).applyQuaternion(q), hands = l.clone().sub(r).normalize();
    expect(Math.abs(along.dot(hands))).toBeCloseTo(1);
  });
  it('half-way off the rack, half-way there', () => {
    const p = new Vector3();
    barAt(new Matrix4(), rest, 'z', l, r, 0.5).decompose(p, new Quaternion(), new Vector3());
    expect(p.distanceTo(new Vector3(5, 35.5, -2.5))).toBeLessThan(1e-6);
  });
});

describe('the gym\'s barbell pressed in the small bar\'s place (benchBar HELD)', () => {
  const m = ASSET_MODELS[HELD], part = ASSET_MODELS['decor/weight-bench'].part!;
  it('is the gym catalogue\'s barbell, its own model, longer than the bench\'s bar', () => {
    expect(HELD).toBe('decor/barbell');
    expect(ASSET_KEYS['decor/barbell-0'].m).toBe(HELD);
    expect(m.max[0] - m.min[0]).toBeGreaterThan(part.len * 1.5);
  });
  it('in the bar\'s frame: its middle at the frame\'s, its length along the bar\'s axis, its own size × HELD_SCALE, up kept', () => {
    const into = heldIn(new Matrix4(), part.axis, m.min, m.max, HELD_SCALE);
    const mid = new Vector3((m.min[0] + m.max[0]) / 2, (m.min[1] + m.max[1]) / 2, (m.min[2] + m.max[2]) / 2);
    expect(mid.clone().applyMatrix4(into).length()).toBeLessThan(1e-6);
    // its ends (along its x) on the bar's z, as long as it is (scaled)
    const end = new Vector3(m.max[0], mid.y, mid.z).applyMatrix4(into);
    expect(Math.abs(end.z)).toBeCloseTo(((m.max[0] - m.min[0]) / 2) * HELD_SCALE);
    expect(Math.hypot(end.x, end.y)).toBeLessThan(1e-6);
    const up = new Vector3(mid.x, m.max[1], mid.z).applyMatrix4(into);
    expect(up.y).toBeCloseTo(((m.max[1] - m.min[1]) / 2) * HELD_SCALE);
  });
  it('its grip (between the inner plates, 12 model units) holds a player\'s hands pressing (≤ 39 u apart at the island\'s 3); a villager\'s too', () => {
    const grip = 12 * 3 * HELD_SCALE;
    expect(grip).toBeGreaterThan(39 + 4);
    // (not so long it's twice NH's own)
    expect(HELD_SCALE).toBeLessThan(1.5);
  });
});

describe('a piece held for its use (heldAt: the curl\'s barbell, the kettlebell, the Ring-Con)', () => {
  const rest = new Matrix4().makeTranslation(0, 0, 10), fwd = new Vector3(0, 0, 1), head = new Vector3(0, 14, 0);
  const l = new Vector3(2, 6, 1), r = new Vector3(-2, 6, 1);
  const gripAt = (m: Matrix4, g: readonly number[]) => new Vector3(g[0], g[1], g[2]).applyMatrix4(m);
  it('its grip at the hands\' middle, its length along them, its up the world\'s, its size its own; where it rests at 0', () => {
    const h = HELD_PROPS.f4078, m = heldAt(new Matrix4(), rest, h, l, r, head, fwd, 1);
    expect(gripAt(m, h.grip).distanceTo(new Vector3(0, 6, 1))).toBeLessThan(1e-6);
    const q = new Quaternion(), s = new Vector3();
    m.decompose(new Vector3(), q, s);
    expect(Math.abs(new Vector3(1, 0, 0).applyQuaternion(q).x)).toBeCloseTo(1);
    expect(new Vector3(0, 1, 0).applyQuaternion(q).y).toBeCloseTo(1);
    // its front away from the body
    expect(new Vector3(0, 0, 1).applyQuaternion(q).z).toBeGreaterThan(0.99);
    expect(s.x).toBeCloseTo(h.scale);
    expect(heldAt(new Matrix4(), rest, h, l, r, head, fwd, 0).equals(rest)).toBe(true);
  });
  it('a kettlebell hangs from the hands down the arms; the dumbbell in the right hand', () => {
    const kb = HELD_PROPS.f7535, m = heldAt(new Matrix4(), rest, kb, l, r, new Vector3(0, 14, -6), fwd, 1);
    const up = new Vector3(0, 1, 0).transformDirection(m), arms = new Vector3(0, 14, -6).sub(new Vector3(0, 6, 1)).normalize();
    expect(up.dot(arms)).toBeGreaterThan(0.99);
    const db = HELD_PROPS.dumbbell, d = heldAt(new Matrix4(), rest, db, l, r, head, fwd, 1);
    expect(gripAt(d, db.grip).distanceTo(r)).toBeLessThan(1e-6);
  });
  it('blendFrame: halfway is half the way and half the turn', () => {
    const b = new Matrix4().makeRotationY(Math.PI / 2).setPosition(10, 0, 0), m = blendFrame(new Matrix4(), new Matrix4(), b, 0.5);
    const p = new Vector3(), q = new Quaternion();
    m.decompose(p, q, new Vector3());
    expect(p.x).toBeCloseTo(5);
    expect(q.angleTo(new Quaternion())).toBeCloseTo(Math.PI / 4);
  });
});
