// The 3D island's effects that NH's files have no model for (scripts/world3d-assets.ts `fx`): a sparkle, the 「！」 over a
// bite, a puff of dust, a splash and its ripple, as small stylised meshes in the 2D island's colours (Critters.svelte,
// Finds.svelte), flat-coloured and unlit, written as glTF for scripts/world3d-models.ts to pack like NH's models. Facing
// +z where flat (the runtime turns them to the camera); 1 model unit ≈ the effect's radius.

export type Fx = 'sparkle' | 'bang' | 'dust' | 'splash' | 'ripple';

interface Part { pos: number[]; col: [number, number, number, number] }
type V3 = [number, number, number];

const hex = (h: number, a = 1): [number, number, number, number] => [((h >> 16) & 255) / 255, ((h >> 8) & 255) / 255, (h & 255) / 255, a];
/** A flat fan (a star, a disc, a dot): a centre and a rim, at depth z. */
function fan(rim: [number, number][], z: number, cx = 0, cy = 0): number[] {
  const out: number[] = [];
  for (let i = 0; i < rim.length; i++) {
    const a = rim[i], b = rim[(i + 1) % rim.length];
    out.push(cx, cy, z, a[0], a[1], z, b[0], b[1], z);
  }
  return out;
}
const circle = (r: number, n: number, cx = 0, cy = 0): [number, number][] => Array.from({ length: n }, (_, i) => [cx + r * Math.cos((i / n) * 2 * Math.PI), cy + r * Math.sin((i / n) * 2 * Math.PI)]);
function quad(x0: number, y0: number, x1: number, y1: number, z: number): number[] {
  return [x0, y0, z, x1, y0, z, x1, y1, z, x0, y0, z, x1, y1, z, x0, y1, z];
}
/** A flat ring in the ground plane (y up), inner r0 to outer r1. */
function ring(r0: number, r1: number, n: number, y = 0): number[] {
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    const [a, b] = [(i / n) * 2 * Math.PI, ((i + 1) / n) * 2 * Math.PI];
    const p = (r: number, t: number): V3 => [r * Math.cos(t), y, r * Math.sin(t)];
    out.push(...p(r0, a), ...p(r1, a), ...p(r1, b), ...p(r0, a), ...p(r1, b), ...p(r0, b));
  }
  return out;
}
/** A low-poly ball (an octahedron split once, pushed out to the sphere). */
function ball(r: number, [cx, cy, cz]: V3): number[] {
  const v: V3[] = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
  const faces = [[0, 2, 4], [2, 1, 4], [1, 3, 4], [3, 0, 4], [2, 0, 5], [1, 2, 5], [3, 1, 5], [0, 3, 5]];
  const norm = (p: V3): V3 => { const l = Math.hypot(...p); return [p[0] / l, p[1] / l, p[2] / l]; };
  const mid = (a: V3, b: V3) => norm([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2]);
  const out: number[] = [];
  const put = (...ps: V3[]) => { for (const p of ps) out.push(cx + p[0] * r, cy + p[1] * r, cz + p[2] * r); };
  for (const [i, j, k] of faces) {
    const [a, b, c] = [v[i], v[j], v[k]], [ab, bc, ca] = [mid(a, b), mid(b, c), mid(c, a)];
    put(a, ab, ca, ab, b, bc, ca, bc, c, ab, bc, ca);
  }
  return out;
}
/** A droplet thrown up: a thin cone from the ground, leaning out from the centre. */
function drop(t: number, h: number, r: number, out0: number): number[] {
  const [dx, dz] = [Math.cos(t), Math.sin(t)];
  const tip: V3 = [dx * (out0 + 0.35), h, dz * (out0 + 0.35)];
  const base = (k: number): V3 => {
    const a = t + Math.PI / 2 + (k / 4) * 2 * Math.PI;
    return [dx * out0 + Math.cos(a) * r, 0, dz * out0 + Math.sin(a) * r];
  };
  const out: number[] = [];
  for (let k = 0; k < 4; k++) out.push(...base(k), ...base(k + 1), ...tip);
  return out;
}

function parts(fx: Fx): Part[] {
  switch (fx) {
    case 'sparkle': {
      // NH's four-pointed glint, the 2D's path (M12 0 C13 8 16 11 24 12 …): long points, a slim waist
      const rim: [number, number][] = [];
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * 2 * Math.PI, r = i % 4 === 0 ? 1 : i % 2 === 0 ? 0.16 : 0.24;
        rim.push([r * Math.sin(a), r * Math.cos(a)]);
      }
      return [{ pos: fan(rim, 0), col: hex(0xfff6c8) }];
    }
    case 'bang': {
      // the 「！」: a cream disc, a red rim, a red ！ (Critters.svelte .bang)
      return [
        { pos: fan(circle(1, 24), 0), col: hex(0xf2484a) },
        { pos: fan(circle(0.86, 24), 0.01), col: hex(0xfffdf6) },
        { pos: [...quad(-0.13, -0.18, 0.13, 0.6, 0.02), ...fan(circle(0.14, 10, 0, -0.44), 0.02, 0, -0.44)], col: hex(0xe8383a) }
      ];
    }
    case 'dust':
      // a puff of earth (a dig, a landing fruit): a few soft balls
      return [{ pos: [...ball(0.55, [0, 0.45, 0]), ...ball(0.42, [-0.55, 0.32, 0.1]), ...ball(0.4, [0.55, 0.3, -0.05]), ...ball(0.3, [0.1, 0.25, 0.5])], col: hex(0xe6d6b4) }];
    case 'splash':
      // the bobber's splash: droplets thrown up in a crown
      return [{ pos: Array.from({ length: 8 }, (_, i) => drop((i / 8) * 2 * Math.PI, i % 2 ? 0.9 : 1.2, 0.09, 0.45)).flat(), col: hex(0xf4fbff, 0.9) }];
    case 'ripple':
      return [{ pos: ring(0.86, 1, 32, 0.01), col: hex(0xffffff, 0.85) }];
  }
}

/** The effect as glTF (its buffer a data URI), its bounds and its triangles. */
export function fxGltf(fx: Fx): { gltf: string; box: [number[], number[]]; tris: number } {
  const ps = parts(fx);
  const pos = ps.flatMap((p) => p.pos);
  const col = ps.flatMap((p) => Array.from({ length: p.pos.length / 3 }, () => p.col).flat());
  const n = pos.length / 3;
  const min = [0, 1, 2].map((k) => Math.min(...pos.filter((_, i) => i % 3 === k)));
  const max = [0, 1, 2].map((k) => Math.max(...pos.filter((_, i) => i % 3 === k)));
  const bin = Buffer.concat([Buffer.from(new Float32Array(pos).buffer), Buffer.from(new Float32Array(col).buffer)]);
  const blend = ps.some((p) => p.col[3] < 1);
  const g = {
    asset: { version: '2.0', generator: 'scripts/world3d-fx.ts' },
    extensionsUsed: ['KHR_materials_unlit'],
    scene: 0, scenes: [{ nodes: [0] }], nodes: [{ mesh: 0, name: fx }],
    meshes: [{ primitives: [{ attributes: { POSITION: 0, COLOR_0: 1 }, material: 0 }] }],
    materials: [{ name: fx, doubleSided: true, ...(blend ? { alphaMode: 'BLEND' } : {}), pbrMetallicRoughness: { baseColorFactor: [1, 1, 1, 1], metallicFactor: 0, roughnessFactor: 1 }, extensions: { KHR_materials_unlit: {} } }],
    accessors: [
      { bufferView: 0, componentType: 5126, count: n, type: 'VEC3', min, max },
      { bufferView: 1, componentType: 5126, count: n, type: 'VEC4' }
    ],
    bufferViews: [{ buffer: 0, byteOffset: 0, byteLength: n * 12 }, { buffer: 0, byteOffset: n * 12, byteLength: n * 16 }],
    buffers: [{ byteLength: bin.length, uri: `data:application/octet-stream;base64,${bin.toString('base64')}` }]
  };
  return { gltf: JSON.stringify(g), box: [min, max], tris: n / 3 };
}
