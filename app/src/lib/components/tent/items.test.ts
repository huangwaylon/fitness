import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { Box3, Matrix4, Quaternion, Vector3 } from 'three';
import catalog from '../island/catalog.json';
import ja from '#lib/i18n/tent.ja.json';
import en from '#lib/i18n/tent.en.json';
import more from './more.json';
import { DEFAULT_FLOOR, DEFAULT_WALL, FLOORS, GYM, ITEMS, RUGS, STARTER, WALLS, codeOfCatch, codeOfFind, iconPacked, iconUrl } from './items.ts';
import { entries } from '../world3d/ktx2Pack.ts';
import { emitterOf, toRoom } from './grid.ts';

interface Gltf {
  nodes: { mesh?: number; children?: number[]; matrix?: number[]; translation?: number[]; rotation?: number[]; scale?: number[] }[];
  scenes: { nodes: number[] }[];
  meshes: { primitives: { attributes: { POSITION: number }; material?: number }[] }[];
  accessors: { componentType: number; normalized?: boolean; min: number[]; max: number[] }[];
  materials: { emissiveTexture?: object }[];
}
const NORM: Record<number, number> = { 5120: 127, 5121: 255, 5122: 32767, 5123: 65535 };
const STATIC = join(import.meta.dirname, '..', '..', '..', '..', 'static');
const PACKS = join(STATIC, 'room', 'pack');
type Ref = readonly [string, number, number];
const packBytes = new Map<string, Buffer>();
/** A packed file's bytes (scripts/room-packs.ts: [pack, offset, bytes]), checked against the pack's own head. */
function cut([stem, off, n]: Ref): Buffer {
  let b = packBytes.get(stem);
  if (!b) packBytes.set(stem, (b = readFileSync(join(PACKS, `${stem}.pak`))));
  return b.subarray(off, off + n);
}
/** A piece's model: its file, or its cut of its pack. */
const glb = (code: string): Buffer => (ITEMS[code].pk ? cut(ITEMS[code].pk!) : readFileSync(join(STATIC, 'room', 'models', `${code}.glb`)));

/** A converted model's bounds, and its emissive part's (the meshes with an emissive map), from its glTF alone: each
 *  primitive's POSITION min/max (dequantised) through its node's transforms. */
function boundsOf(code: string): { all: Box3; lit: Box3 } {
  const b = glb(code), j = JSON.parse(b.subarray(20, 20 + b.readUInt32LE(12)).toString()) as Gltf;
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

  it('every item has its model within the byte budget (its file, or its cut of its pack), a footprint in whole tiles and its names', () => {
    let loose = 0, packed = 0;
    for (const [code, m] of Object.entries(ITEMS)) {
      expect(code).toMatch(/^f\d+$/);
      const bytes = glb(code).length;
      // a GLB: its magic, its length its own
      expect(glb(code).readUInt32LE(0), code).toBe(0x46546c67);
      expect(glb(code).readUInt32LE(8), code).toBe(bytes);
      if (m.pk) packed += bytes;
      else {
        loose += bytes;
        expect(m.v).toMatch(/^[0-9a-f]{8}$/);
      }
      expect(bytes, code).toBeLessThanOrEqual(120_000);
      expect(Number.isInteger(m.w) && m.w >= 1 && m.w <= 8 && Number.isInteger(m.d) && m.d >= 1 && m.d <= 8, code).toBe(true);
      expect(JA[`tent.item.${code}`], code).toBeTruthy();
      expect(EN[`tent.item.${code}`], code).toBeTruthy();
      if (iconPacked(code)) continue;
      const icon = m.icon || !m.cat ? join(STATIC, 'room', 'icons', `${code}.webp`) : join(STATIC, 'art', 'finds', 'items', `${m.cat}.webp`);
      expect(existsSync(icon), icon).toBe(true);
    }
    // the loose set stays a few megabytes (~19 KB a piece; a room loads only its own), the packed ~30 MB in ~130 packs
    expect(loose).toBeLessThan(16_000_000);
    expect(packed).toBeLessThan(40_000_000);
  });

  it('NH’s whole catalogue but character customisation (2026-11-10): every rug, the ceiling’s 39, the 36 gyroids and the critters’ tanks', () => {
    expect(Object.keys(ITEMS).length).toBeGreaterThan(2300);
    expect(RUGS.length).toBe(209);
    expect(RUGS.slice(0, 6).every((c) => ITEMS[c].starter)).toBe(true);
    const ceiling = Object.keys(ITEMS).filter((c) => ITEMS[c].cl);
    expect(ceiling).toHaveLength(39);
    // a ceiling piece hangs from its origin: its model under it (grid.ts isCeiling: engine.ts hangs it at the ceiling)
    for (const c of ceiling) {
      const { all } = boundsOf(c);
      expect(all.max.y, c).toBeLessThan(0.6);
      expect(-all.min.y, c).toBeGreaterThan(2);
      expect(ITEMS[c].rug || ITEMS[c].wl || ITEMS[c].s || ITEMS[c].sm, c).toBeFalsy();
    }
    expect(Object.keys(ITEMS).filter((c) => ITEMS[c].gy)).toHaveLength(36);
    // each of the island's catches has its tank (NH's critter put down indoors), bar a few the island doesn't have yet
    const tanks = Object.keys(ITEMS).filter((c) => ITEMS[c].cr);
    expect(tanks.length).toBeGreaterThan(170);
    for (const c of tanks) expect(codeOfCatch(ITEMS[c].cr!), c).toBe(c);
    expect(codeOfCatch('fish:koi')).toBe('f2220');
    expect(codeOfCatch('fish:no-such')).toBeNull();
  });

  it('every pack is whole: its head names its files, each place in more.json its cut, none past its bound', () => {
    const stems = readdirSync(PACKS).filter((f) => f.endsWith('.pak')).map((f) => f.slice(0, -4));
    const used = new Set<string>();
    const refs: [string, Ref][] = [
      ...Object.entries(ITEMS).flatMap(([c, m]) => (m.pk ? [[`models/${c}.glb`, m.pk] as [string, Ref]] : [])),
      ...Object.entries(more.tex as unknown as Record<string, Ref>).map(([c, r]): [string, Ref] => [`${r[0].startsWith('floor') ? 'floor' : 'wall'}/${c}.webp`, r]),
      ...Object.entries(more.icons as unknown as Record<string, Ref>).map(([c, r]): [string, Ref] => [`icons/${c}.webp`, r])
    ];
    for (const [path, ref] of refs) {
      expect(stems, path).toContain(ref[0]);
      const head = entries(readFileSync(join(PACKS, `${ref[0]}.pak`)))!;
      expect(head.get(path), path).toEqual([ref[1], ref[2]]);
      used.add(ref[0]);
    }
    // every pack is used; a pack's name ends in its content's hash; ��� 320 KB (a lone file over it alone)
    expect(stems.filter((s) => !used.has(s))).toEqual([]);
    for (const s of stems) {
      expect(s).toMatch(/^[a-z]+(-[a-z]+)?(-\d+)?\.[0-9a-f]{8}$/);
      const n = statSync(join(PACKS, `${s}.pak`)).size, files = entries(readFileSync(join(PACKS, `${s}.pak`)))!.size;
      expect(n <= 330_000 || files === 1, s).toBe(true);
    }
  });

  it('every wallpaper and floor (NH’s 306 and 209) has its texture, its icon and its names; the tent’s own come first', () => {
    expect(WALLS[0]).toBe(DEFAULT_WALL);
    expect(FLOORS[0]).toBe(DEFAULT_FLOOR);
    expect(WALLS).toHaveLength(306);
    expect(FLOORS).toHaveLength(209);
    const tex = more.tex as unknown as Record<string, Ref>, icons = more.icons as unknown as Record<string, Ref>;
    for (const [list, dir, k] of [[WALLS, 'wall', 'wall'], [FLOORS, 'floor', 'floor']] as const) {
      for (const c of list) {
        // the first set loose; the rest packed, its picture a WebP
        if (tex[c]) expect(cut(tex[c]).subarray(8, 12).toString(), c).toBe('WEBP');
        else expect(existsSync(join(STATIC, 'room', dir, `${c}.webp`)), c).toBe(true);
        if (icons[c]) expect(cut(icons[c]).subarray(8, 12).toString(), c).toBe('WEBP');
        else expect(existsSync(join(STATIC, 'room', 'icons', `${c}.webp`)), c).toBe(true);
        expect(JA[`tent.${k}.${c}`], c).toBeTruthy();
      }
    }
    // NH's glowing ones glow (the aurora wall's emissive map: lit in the dark)
    expect(Object.keys(tex).filter((c) => c.endsWith('.e')).length).toBeGreaterThan(20);
    expect(tex['w13609.e']).toBeDefined();
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
      const { all, lit } = boundsOf(code);
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
