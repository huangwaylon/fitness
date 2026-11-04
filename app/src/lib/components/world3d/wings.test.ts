import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { FLAPS, flapPoint, wingHinge, type WingPart } from './wings.ts';

const DIR = join(import.meta.dirname, '../../../../static/room/world3d/critters/bugs');

/** A GLB's meshes as the shader sees them: each primitive's raw (quantized) positions and whether it's a wing. */
async function parts(file: string): Promise<WingPart[]> {
  await MeshoptDecoder.ready;
  const b = readFileSync(join(DIR, file));
  const jl = b.readUInt32LE(12);
  const j = JSON.parse(b.subarray(20, 20 + jl).toString());
  const bin = b.subarray(20 + jl + 8);
  const out: WingPart[] = [];
  for (const m of j.meshes)
    for (const p of m.primitives) {
      const a = j.accessors[p.attributes.POSITION], bv = j.bufferViews[a.bufferView], ext = bv.extensions?.EXT_meshopt_compression;
      let data: Uint8Array, stride: number;
      if (ext) {
        data = new Uint8Array(ext.count * ext.byteStride);
        MeshoptDecoder.decodeGltfBuffer(data, ext.count, ext.byteStride, new Uint8Array(bin.buffer, bin.byteOffset + (ext.byteOffset ?? 0), ext.byteLength), ext.mode, ext.filter);
        stride = ext.byteStride;
      } else {
        data = new Uint8Array(bin.buffer, bin.byteOffset + (bv.byteOffset ?? 0), bv.byteLength);
        stride = bv.byteStride ?? 12;
      }
      const dv = new DataView(data.buffer, data.byteOffset), pos = new Float32Array(a.count * 3);
      const get = a.componentType === 5123 ? (o: number) => dv.getUint16(o, true) : a.componentType === 5122 ? (o: number) => dv.getInt16(o, true) : (o: number) => dv.getFloat32(o, true);
      const w = a.componentType === 5126 ? 4 : 2;
      for (let i = 0; i < a.count; i++) for (let c = 0; c < 3; c++) pos[i * 3 + c] = get((a.byteOffset ?? 0) + i * stride + c * w);
      out.push({ pos, wing: /wing/i.test(j.materials[p.material]?.name ?? '') });
    }
  return out;
}

const fliers = readdirSync(DIR).filter((f) => f.endsWith('.glb') && FLAPS.test(`critters/bugs/${f.slice(0, -4)}`));

describe('the fliers’ wings (wings.ts)', () => {
  it('flaps the butterflies, moths, the bee and the dragonflies, not the fish named for them', () => {
    expect(fliers.length).toBeGreaterThanOrEqual(17);
    for (const f of ['common-butterfly', 'moth', 'atlas-moth', 'honeybee', 'red-dragonfly', 'queen-alexandras-birdwing'])
      expect(fliers).toContain(`${f}.glb`);
    expect(FLAPS.test('critters/fish/butterfly-fish')).toBe(false);
    expect(FLAPS.test('critters/fish/sea-butterfly')).toBe(false);
    expect(FLAPS.test('critters/bugs/tiger-beetle')).toBe(false);
  });

  it('flaps only the wing meshes of the bee and the dragonflies, the whole of a butterfly or moth (the atlas moth’s both layers)', async () => {
    for (const f of fliers) {
      const p = await parts(f), h = wingHinge(p);
      if (/honeybee|dragonfly/.test(f)) expect(h.flaps, f).toEqual(p.map((q) => q.wing));
      else expect(h.flaps.every(Boolean), f).toBe(true);
    }
  });

  it.each(fliers)('%s: its wings hinge at the body (the roots stay put, the tips swing up, the body still)', async (f) => {
    const p = await parts(f), h = wingHinge(p);
    let lo = Infinity, hi = -Infinity;
    for (const q of p) for (let i = 0; i < q.pos.length; i += 3) (lo = Math.min(lo, q.pos[i])), (hi = Math.max(hi, q.pos[i]));
    const half = (hi - lo) / 2;
    let tips = 0, near = Infinity;
    p.forEach((q, k) => {
      if (!h.flaps[k]) return;
      for (let i = 0; i < q.pos.length; i += 3) {
        const x = q.pos[i], y = q.pos[i + 1], d = Math.abs(x - h.x);
        if (d > h.root) near = Math.min(near, Math.hypot(d - h.root, y - h.y));
        for (const a of [-0.25, 0.6, 1.25]) {
          const [nx, ny] = flapPoint(h, x, y, a), moved = Math.hypot(nx - x, ny - y);
          // the body (in from the wings' roots) never moves
          if (d <= h.root) expect(moved, `${f} body`).toBe(0);
          // a tip goes up (raised wings) by most of its reach, and stays as far from the hinge as it was
          if (d > half * 0.8 && a === 0.6) {
            tips++;
            expect(ny - y, `${f} tip`).toBeGreaterThan(half * 0.35);
            const r0 = Math.hypot(d - h.root, y - h.y), r1 = Math.hypot(Math.abs(nx - h.x) - h.root, ny - h.y);
            expect(Math.abs(r1 - r0), `${f} tip reach`).toBeLessThan(half * 0.02);
          }
        }
      }
    });
    expect(tips, f).toBeGreaterThan(0);
    // the hinge runs through the wings' roots (a wing's point right on it), not through the air under or over them:
    // turned about it, the root stays on the body
    expect(near, f).toBeLessThan(half * 0.05);
    // the hinge is in the wings' plane: within the wings' own height band out past the body
    const ys = p.flatMap((q, k) => (h.flaps[k] ? [...Array(q.pos.length / 3).keys()].filter((i) => Math.abs(q.pos[i * 3] - h.x) > half * 0.25).map((i) => q.pos[i * 3 + 1]) : []));
    expect(h.y).toBeGreaterThanOrEqual(Math.min(...ys));
    expect(h.y).toBeLessThanOrEqual(Math.max(...ys));
  });

  it('the bee and the dragonflies face +z (their wings on the thorax, at the head’s end of the body)', async () => {
    for (const f of fliers.filter((f) => /honeybee|dragonfly/.test(f))) {
      const p = await parts(f);
      const zs = (w: boolean) => p.filter((q) => q.wing === w).flatMap((q) => [...Array(q.pos.length / 3).keys()].map((i) => q.pos[i * 3 + 2]));
      const body = zs(false), wing = zs(true), mid = (Math.min(...body) + Math.max(...body)) / 2;
      expect(wing.reduce((s, z) => s + z, 0) / wing.length, f).toBeGreaterThan(mid);
    }
  });
});
