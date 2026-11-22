import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { Box3, Matrix4, Quaternion, Vector3 } from 'three';
import catalog from '../island/catalog.json';
import ja from '#lib/i18n/tent.ja.json';
import en from '#lib/i18n/tent.en.json';
import more from './more.json';
import { ALWAYS, CAMP, DEFAULT_FLOOR, DEFAULT_WALL, FLOORS, GIFTS, GYM, ITEMS, RUGS, STARTER, WALLS, codeOfCatch, codeOfFind, iconPacked, iconUrl } from './items.ts';
import { entries } from '../world3d/ktx2Pack.ts';
import { emitterOf, toRoom } from './grid.ts';
import { PATTERN_PART, patternless } from '../../../../scripts/room-pattern.ts';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';

interface Gltf {
  nodes: { mesh?: number; children?: number[]; matrix?: number[]; translation?: number[]; rotation?: number[]; scale?: number[] }[];
  scenes: { nodes: number[] }[];
  meshes: { primitives: { attributes: { POSITION: number }; material?: number }[] }[];
  accessors: { componentType: number; normalized?: boolean; min: number[]; max: number[] }[];
  materials: { name?: string; emissiveTexture?: object }[];
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
  it('every gym and camping piece NH has, ours from the start (ジム, キャンプ: 2026-11-22), each with its model', () => {
    expect(GYM.size).toBe(28);
    expect(CAMP.size).toBe(32);
    const hha = JSON.parse(readFileSync(join(import.meta.dirname, 'hha.json'), 'utf8')) as Record<string, { t?: string[] }>;
    for (const c of [...GYM, ...CAMP]) {
      expect(ITEMS[c], c).toBeDefined();
      expect(glb(c).readUInt32LE(0), c).toBe(0x46546c67);
    }
    // NH's whole fitness theme is the gym's (its football rug aside; the wallpapers and floors are free); its outdoors pieces for a camp are the camp's
    for (const [c, h] of Object.entries(hha)) if (h.t?.includes('fitness') && ITEMS[c] && !ITEMS[c].rug) expect(GYM.has(c), c).toBe(true);
    for (const c of ['f330', 'f4100', 'f1429', 'f1430', 'f13249', 'f13637', 'f14055', 'f12374']) expect(CAMP.has(c), c).toBe(true);
    // the barbell and kettlebell (crafted in NH: never the shop's nor a balloon's) are ours too
    expect(ALWAYS).toEqual(expect.arrayContaining(['f4078', 'f7535', 'f290', 'f330']));
    expect(ALWAYS.some((c) => ITEMS[c].starter)).toBe(false);
    expect(new Set(ALWAYS).size).toBe(ALWAYS.length);
    // the weight bench is lain on, as NH's Bed
    expect(ITEMS.f1452.u).toBe('l');
  });

  it('our own wedding sign: NH’s birthday sign with its banner of ours, loose, a find of 2026-11-22 (scripts/room-own.ts)', () => {
    const own = ITEMS.f90001, base = ITEMS.f3594;
    expect([own.w, own.d, own.h]).toEqual([base.w, base.d, base.h]);
    expect(own.pk).toBeUndefined();
    expect(own.starter).toBeUndefined();
    expect(JA['tent.item.f90001']).toBe('ハッピーウェディングボード');
    expect(EN['tent.item.f90001']).toBe('happy wedding sign');
    expect(iconUrl('f90001')).toMatch(/room\/icons\/f90001\.webp$/);
    // the same mesh, another picture: its WebP differs from the base's, the rest of the file as long within its picture's change
    const pic = (b: Buffer) => {
      const j = JSON.parse(b.subarray(20, 20 + b.readUInt32LE(12)).toString()) as { images: { bufferView: number }[]; bufferViews: { byteLength: number }[] };
      return j.bufferViews[j.images[0].bufferView].byteLength;
    };
    expect(pic(glb('f90001'))).not.toBe(pic(glb('f3594')));
    expect(Math.abs(glb('f90001').length - pic(glb('f90001')) - (glb('f3594').length - pic(glb('f3594'))))).toBeLessThan(64);
  });

  it('our own 2026 and 2027 arches: NH’s 2021 arch, its 1 (a shape in its mesh, on the albedo’s green) a 6 or a 7 (scripts/room-own.ts)', async () => {
    await MeshoptDecoder.ready;
    /** A model's picture's bytes, and its UVs in texels (the texture transform applied). */
    const read = (b: Buffer) => {
      const jl = b.readUInt32LE(12), bin = b.subarray(28 + jl);
      const j = JSON.parse(b.subarray(20, 20 + jl).toString()) as {
        images: { bufferView: number }[]; meshes: { primitives: { attributes: { TEXCOORD_0: number } }[] }[]; accessors: { bufferView: number; count: number }[];
        bufferViews: { byteOffset?: number; byteLength: number; extensions?: { EXT_meshopt_compression?: { byteOffset?: number; byteLength: number; byteStride: number; count: number; mode: string; filter?: string } } }[];
        materials: { pbrMetallicRoughness: { baseColorTexture: { extensions?: { KHR_texture_transform?: { offset: number[]; scale: number[] } } } } }[];
      };
      const view = (i: number) => bin.subarray(j.bufferViews[i].byteOffset ?? 0, (j.bufferViews[i].byteOffset ?? 0) + j.bufferViews[i].byteLength);
      const a = j.accessors[j.meshes[0].primitives[0].attributes.TEXCOORD_0], m = j.bufferViews[a.bufferView].extensions!.EXT_meshopt_compression!;
      const raw = new Uint8Array(m.count * m.byteStride);
      MeshoptDecoder.decodeGltfBuffer(raw, m.count, m.byteStride, bin.subarray(m.byteOffset ?? 0, (m.byteOffset ?? 0) + m.byteLength), m.mode, m.filter);
      const t = j.materials[0].pbrMetallicRoughness.baseColorTexture.extensions!.KHR_texture_transform!, dv = new DataView(raw.buffer);
      const uv = Array.from({ length: a.count }, (_, k) => [0, 1].map((c) => ((dv.getUint16(k * m.byteStride + c * 2, true) / 65535) * t.scale[c] + t.offset[c]) * 256));
      return { pic: Buffer.from(view(j.images[0].bufferView)), uv };
    };
    const base = read(glb('f13543')), green = ([u, v]: number[]) => u >= 165 && u < 194 && v < 128;
    for (const [code, ja, en] of [['f90002', '2026ねんのアーチ', '2026 celebratory arch'], ['f90003', '2027ねんのアーチ', '2027 celebratory arch']] as const) {
      const own = ITEMS[code], b = ITEMS.f13543, m = read(glb(code));
      expect([own.w, own.d, own.h, own.wl, own.sm], code).toEqual([b.w, b.d, b.h, b.wl, b.sm]);
      expect(own.pk).toBeUndefined();
      expect(JA[`tent.item.${code}`]).toBe(ja);
      expect(EN[`tent.item.${code}`]).toBe(en);
      expect(iconUrl(code)).toMatch(new RegExp(`room/icons/${code}\\.webp$`));
      expect(existsSync(join(STATIC, 'room', 'icons', `${code}.webp`))).toBe(true);
      // the picture the base's; the arch, the 2, 0, 2 as they were; the green 1 (46 vertices) now a digit of hundreds
      expect(m.pic.equals(base.pic)).toBe(true);
      expect(m.uv.filter((p) => !green(p)).length).toBe(base.uv.filter((p) => !green(p)).length);
      expect(base.uv.filter(green).length).toBe(46);
      expect(m.uv.filter(green).length).toBeGreaterThan(500);
    }
    // the same theme, colours and price as the arch: the tray files it with it
    const hha = JSON.parse(readFileSync(join(import.meta.dirname, 'hha.json'), 'utf8')) as Record<string, unknown>;
    expect(hha.f90002).toEqual(hha.f13543);
    expect(hha.f90003).toEqual(hha.f13543);
    const day = Date.parse('2026-11-22T00:00:00+09:00');
    expect(GIFTS).toEqual([['f90001', day], ['f90002', day], ['f90003', day]]);
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
      const icon = typeof m.icon === 'string' ? join(STATIC, 'art', `${m.icon}.webp`) : m.icon || !m.cat ? join(STATIC, 'room', 'icons', `${code}.webp`) : join(STATIC, 'art', 'finds', 'items', `${m.cat}.webp`);
      expect(existsSync(icon), icon).toBe(true);
    }
    // the loose set stays a few megabytes (~19 KB a piece, our own pieces too; a room loads only its own), the packed ~30 MB in ~130 packs
    expect(loose).toBeLessThan(16_500_000);
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
    // or the art's same picture (an editor kind's: the wooden bucket), never a copy in room/icons
    expect(iconUrl('f880')).toMatch(/art\/items\/wooden-bucket\.webp$/);
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

  it('a piece in NH’s no-pattern look leaves its pattern part out (scripts/room-pattern.ts): no gray slab on a table’s top', () => {
    // the rule: the first variation (the converted one) has no pattern while others have
    expect(patternless([{ pattern: null }, { pattern: 'Botanical' }])).toBe(true);
    expect(patternless([{}, { pattern: 'Blue roses' }])).toBe(true);
    expect(patternless([{ pattern: 'White' }, { pattern: 'Pink' }])).toBe(false);
    expect(patternless([{ pattern: null }, { pattern: null }])).toBe(false);
    expect(patternless([{ pattern: null }])).toBe(false);
    expect(patternless(undefined)).toBe(false);
    const materials = (code: string) => {
      const b = glb(code);
      return (JSON.parse(b.subarray(20, 20 + b.readUInt32LE(12)).toString()) as Gltf).materials.map((m) => m.name);
    };
    // the elegant console table (the shop's, 2026-11-22), the starter log tables, chair, sofa and shelves, a packed one
    for (const code of ['f13140', 'f4040', 'f4043', 'f4039', 'f4044', 'f4036', 'f13079']) {
      expect(materials(code), code).not.toContain(PATTERN_PART);
      expect(materials(code).length, code).toBeGreaterThan(0);
    }
    // a piece whose first look has a pattern keeps it (the cushion's white)
    expect(materials('f1792')).toContain(PATTERN_PART);
  });
});
