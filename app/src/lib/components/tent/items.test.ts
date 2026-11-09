import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { Box3, Matrix4, Quaternion, Vector3 } from 'three';
import catalog from '../island/catalog.json';
import ja from '#lib/i18n/tent.ja.json';
import en from '#lib/i18n/tent.en.json';
import { DEFAULT_FLOOR, DEFAULT_WALL, FLOORS, GYM, ITEMS, STARTER, WALLS, codeOfFind, iconUrl } from './items.ts';
import { emitterOf, toRoom } from './grid.ts';

interface Gltf {
  nodes: { mesh?: number; children?: number[]; matrix?: number[]; translation?: number[]; rotation?: number[]; scale?: number[] }[];
  scenes: { nodes: number[] }[];
  meshes: { primitives: { attributes: { POSITION: number }; material?: number }[] }[];
  accessors: { componentType: number; normalized?: boolean; min: number[]; max: number[] }[];
  materials: { emissiveTexture?: object }[];
}
const NORM: Record<number, number> = { 5120: 127, 5121: 255, 5122: 32767, 5123: 65535 };
/** A converted model's bounds, and its emissive part's (the meshes with an emissive map), from its glTF alone: each
 *  primitive's POSITION min/max (dequantised) through its node's transforms. */
function boundsOf(file: string): { all: Box3; lit: Box3 } {
  const b = readFileSync(file), j = JSON.parse(b.subarray(20, 20 + b.readUInt32LE(12)).toString()) as Gltf;
  const all = new Box3(), lit = new Box3();
  const walk = (i: number, parent: Matrix4) => {
    const n = j.nodes[i];
    const local = n.matrix ? new Matrix4().fromArray(n.matrix) : new Matrix4().compose(
      new Vector3(...(n.translation ?? [0, 0, 0])), new Quaternion(...(n.rotation ?? [0, 0, 0, 1])), new Vector3(...(n.scale ?? [1, 1, 1])));
    const world = parent.clone().multiply(local);
    for (const p of n.mesh === undefined ? [] : j.meshes[n.mesh].primitives) {
      const a = j.accessors[p.attributes.POSITION], k = a.normalized ? NORM[a.componentType] : 1;
      const box = new Box3(new Vector3(...a.min).divideScalar(k), new Vector3(...a.max).divideScalar(k)).applyMatrix4(world);
      all.union(box);
      if (p.material !== undefined && j.materials[p.material].emissiveTexture) lit.union(box);
    }
    for (const c of n.children ?? []) walk(c, world);
  };
  for (const i of j.scenes[0].nodes) walk(i, new Matrix4());
  return { all, lit };
}

const STATIC = join(import.meta.dirname, '..', '..', '..', '..', 'static');
const JA = ja as Record<string, string>, EN = en as Record<string, string>;

describe('the tent’s catalogue (scripts/room-models.ts)', () => {
  it('has NH’s fitness furniture for the ジム tab (the island’s gym, less the crafted barbell and kettlebell), none of it free', () => {
    expect(GYM.size).toBe(11);
    expect([...GYM].every((c) => ITEMS[c] && !ITEMS[c].starter)).toBe(true);
    // the weight bench is lain on, as NH's Bed
    expect(ITEMS.f1452.u).toBe('l');
  });

  it('a starter set of about thirty pieces and a few rugs for a campsite tent', () => {
    const rugs = STARTER.filter((c) => ITEMS[c].rug);
    expect(STARTER.length - rugs.length).toBeGreaterThanOrEqual(28);
    expect(rugs.length).toBeGreaterThanOrEqual(4);
  });

  it('every item has its model within the byte budget, a footprint in whole tiles and its names', () => {
    let total = 0;
    for (const [code, m] of Object.entries(ITEMS)) {
      expect(code).toMatch(/^f\d+$/);
      const f = join(STATIC, 'room', 'models', `${code}.glb`);
      expect(existsSync(f), f).toBe(true);
      const bytes = statSync(f).size;
      total += bytes;
      expect(bytes, code).toBeLessThanOrEqual(120_000);
      expect(Number.isInteger(m.w) && m.w >= 1 && m.w <= 8 && Number.isInteger(m.d) && m.d >= 1 && m.d <= 8, code).toBe(true);
      expect(m.v).toMatch(/^[0-9a-f]{8}$/);
      expect(JA[`tent.item.${code}`], code).toBeTruthy();
      expect(EN[`tent.item.${code}`], code).toBeTruthy();
      const icon = m.icon || !m.cat ? join(STATIC, 'room', 'icons', `${code}.webp`) : join(STATIC, 'art', 'finds', 'items', `${m.cat}.webp`);
      expect(existsSync(icon), icon).toBe(true);
    }
    // the whole set stays a few megabytes (~19 KB a piece; a room loads only its own)
    expect(total).toBeLessThan(16_000_000);
  });

  it('every wallpaper and floor has its texture, its icon and its names; the tent’s own come first', () => {
    expect(WALLS[0]).toBe(DEFAULT_WALL);
    expect(FLOORS[0]).toBe(DEFAULT_FLOOR);
    for (const [list, dir, k] of [[WALLS, 'wall', 'wall'], [FLOORS, 'floor', 'floor']] as const) {
      expect(list.length).toBeGreaterThanOrEqual(30);
      for (const c of list) {
        expect(existsSync(join(STATIC, 'room', dir, `${c}.webp`)), c).toBe(true);
        expect(existsSync(join(STATIC, 'room', 'icons', `${c}.webp`)), c).toBe(true);
        expect(JA[`tent.${k}.${c}`], c).toBeTruthy();
      }
    }
  });

  it('every surface (NH’s, the spreadsheet’s flag) has its top from its model: under its bounds, inside its footprint', () => {
    const surfaces = Object.entries(ITEMS).filter(([, m]) => m.s);
    expect(surfaces.length).toBeGreaterThanOrEqual(60);
    for (const [code, m] of surfaces) {
      expect(m.sy, code).toBeGreaterThan(0);
      expect(m.sy!, code).toBeLessThanOrEqual(m.h + 0.1);
      expect(m.sl!.length, code).toBeGreaterThan(0);
      for (const [sx, sz] of m.sl!) expect(sx >= 0 && sx < m.w && sz >= 0 && sz < m.d, code).toBe(true);
      const [x0, z0, x1, z1] = m.st!;
      expect(x0 < x1 && z0 < z1 && x0 >= -m.w * 5 - 0.1 && x1 <= m.w * 5 + 0.1 && z0 >= -m.d * 5 - 0.1 && z1 <= m.d * 5 + 0.1, code).toBe(true);
      expect(m.rug || m.wl, code).toBeFalsy();
    }
    // nothing else has one; a wall thing is never a surface nor goes on one (NH's Wall-mounted sheet has no surface)
    for (const [code, m] of Object.entries(ITEMS)) if (!m.s) expect(m.sy ?? m.sl, code).toBeUndefined();
    for (const [code, m] of Object.entries(ITEMS)) if (m.wl) expect(m.sm, code).toBeUndefined();
  });

  it('a ずかん find with an NH model maps to its piece; the rest of the カタログ has none', () => {
    const furniture = catalog.items.map((r) => r.split(' ')).filter(([, c]) => c === 'housewares' || c === 'misc').map(([id]) => id);
    const mapped = furniture.filter((id) => codeOfFind(id));
    expect(mapped.length).toBeGreaterThan(300);
    for (const id of mapped) expect(ITEMS[codeOfFind(id)!].cat).toBe(id);
    expect(codeOfFind('no-such-thing')).toBeNull();
    // its icon is the ずかん's (already on the phone), NH's own where the ずかん has none
    expect(iconUrl(codeOfFind(mapped[0])!)).toMatch(/art\/finds\/items\//);
    expect(iconUrl(WALLS[0])).toMatch(/room\/icons\/w\d+\.webp$/);
  });

  it('every light’s emitter (its point light) is where it glows: NH’s light locator inside the model, else inside its emissive part, at every facing', () => {
    const lights = Object.entries(ITEMS).filter(([, m]) => m.lt);
    expect(lights.length).toBeGreaterThanOrEqual(80);
    const up = new Vector3(0, 1, 0), SLACK = 0.3;
    let byGlow = 0;
    for (const [code, m] of lights) {
      expect(m.e, code).toHaveLength(3);
      const { all, lit } = boundsOf(join(STATIC, 'room', 'models', `${code}.glb`));
      // the glow's part when it has one and the emitter isn't NH's own locator (the lantern's flame, the fireplace's fire)
      const part = !m.el && m.lit && !lit.isEmpty() ? lit : all;
      if (part === lit) byGlow++;
      for (let f = 0; f < 4; f++) {
        // the room turns a piece by rotation.y = f·90° (engine.ts placeRoot; a wall thing stays at f 0 in its wall's frame)
        const turned = new Box3().setFromPoints([0, 1, 2, 3, 4, 5, 6, 7].map((i) => new Vector3(
          i & 1 ? part.max.x : part.min.x, i & 2 ? part.max.y : part.min.y, i & 4 ? part.max.z : part.min.z).applyAxisAngle(up, (f * Math.PI) / 2)));
        expect(turned.expandByScalar(SLACK).containsPoint(new Vector3(...emitterOf(code, f))), `${code} f${f}`).toBe(true);
      }
    }
    expect(byGlow).toBeGreaterThanOrEqual(15);
    // toRoom is three's rotation.y = f·90° (and a scale)
    for (let f = 0; f < 4; f++) {
      const v = new Vector3(1, 2, 3).applyAxisAngle(up, (f * Math.PI) / 2).multiplyScalar(2);
      expect(toRoom([1, 2, 3], f, 2).map((n, i) => n - v.getComponent(i)).every((d) => Math.abs(d) < 1e-9), `f${f}`).toBe(true);
    }
    // the old guess (straight over its spot, 0.8 of its height up) was outside the fireplace's fire and the iron wall lamp
    expect(ITEMS.f742.e![1]).toBeLessThan(ITEMS.f742.h / 2);
    expect(ITEMS.f3559.e![2]).toBeGreaterThan(2);
  });
});
