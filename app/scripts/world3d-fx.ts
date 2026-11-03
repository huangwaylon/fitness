// The 3D island's effects that NH's files have no model for (scripts/world3d-assets.ts `fx`): a sparkle, the 「！」 over a
// bite, a puff of dust, a splash and its ripple, a zzz, a sweat drop, confetti, a campfire's flame, the pond's lily pad, as small stylised meshes in the 2D island's colours (Critters.svelte,
// Finds.svelte), flat-coloured and unlit, written as glTF for scripts/world3d-models.ts to pack like NH's models. Facing
// +z where flat (the runtime turns them to the camera); 1 model unit ≈ the effect's radius.

export type Fx = 'sparkle' | 'bang' | 'dust' | 'splash' | 'ripple' | 'zzz' | 'sweat' | 'confetti' | 'flame' | 'lily-pad';

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
    case 'zzz': {
      // three Zs, small to big, rising to the right (Fx.svelte: --fx-zzz with a white rim)
      const z = (x: number, y: number, k: number, d: number) => [
        ...quad(x, y + 0.8 * k, x + 0.7 * k, y + k, d), ...quad(x, y, x + 0.7 * k, y + 0.2 * k, d),
        // the diagonal: a slanted quad from the top right to the bottom left
        x + 0.7 * k, y + 0.8 * k, d, x + 0.45 * k, y + 0.8 * k, d, x, y + 0.2 * k, d,
        x + 0.7 * k, y + 0.8 * k, d, x, y + 0.2 * k, d, x + 0.25 * k, y + 0.2 * k, d
      ];
      const zs = [[-1, -1, 0.55], [-0.35, -0.3, 0.75], [0.35, 0.35, 0.95]] as const;
      return [
        { pos: zs.flatMap(([x, y, k]) => z(x - 0.06, y - 0.06, k + 0.12, 0)), col: hex(0xffffff) },
        { pos: zs.flatMap(([x, y, k]) => z(x, y, k, 0.01)), col: hex(0x8f9ce6) }
      ];
    }
    case 'sweat': {
      // a drop: a round bottom and a point on top (--fx-sweat), a highlight
      const rim: [number, number][] = [];
      for (let i = 0; i <= 20; i++) { const a = Math.PI * (1 + i / 20); rim.push([0.6 * Math.cos(a), -0.3 + 0.6 * Math.sin(a)]); }
      rim.push([0, 1]);
      return [
        { pos: fan(rim, 0, 0, -0.3), col: hex(0x8fd3f4) },
        { pos: fan(circle(0.14, 8, -0.22, -0.2), 0.01, -0.22, -0.2), col: hex(0xffffff, 0.9) }
      ];
    }
    case 'confetti':
      // a burst's pieces (Finds.svelte CONFETTI's colours): small squares, each its own colour, scattered and tilted
      return ([0xf2484a, 0xffd23f, 0x4fc3f7, 0x8bd45b, 0xff7fa8, 0xb388ff] as const).map((c, i) => {
        const a = (i / 6) * 2 * Math.PI, [cx, cy] = [Math.cos(a) * 0.7, Math.sin(a) * 0.7], t = a * 1.7, r = 0.18;
        const corner = (k: number): [number, number] => [cx + r * Math.cos(t + (k * Math.PI) / 2), cy + r * Math.sin(t + (k * Math.PI) / 2)];
        return { pos: fan([corner(0), corner(1), corner(2), corner(3)], (i % 3) * 0.1 - 0.1, cx, cy), col: hex(c) };
      });
    case 'flame': {
      // a campfire's flame: an orange tongue, a yellow core, two crossed cards (cheap: unlit, it glows by itself)
      const tongue = (w: number, h: number, z: number) => {
        const rim: [number, number][] = [];
        for (let i = 0; i <= 12; i++) { const a = Math.PI * (1 + i / 12); rim.push([w * Math.cos(a), w * 0.6 + w * Math.sin(a)]); }
        rim.push([0, h]);
        return fan(rim, z, 0, w * 0.6);
      };
      /** The card turned a quarter about the up axis: (x, y, z) → (z, y, x). */
      const turn = (pos: number[]) => pos.map((_, i) => (i % 3 === 0 ? pos[i + 2] : i % 3 === 2 ? pos[i - 2] : pos[i]));
      const outer = tongue(0.55, 1.6, 0), inner = tongue(0.3, 1.0, 0.02);
      return [
        { pos: [...outer, ...turn(outer)], col: hex(0xff8a2a) },
        { pos: [...inner, ...turn(inner)], col: hex(0xffe15a) }
      ];
    }
    case 'lily-pad': {
      // the pond's pad: a green disc lying on the water, a wedge cut out
      const rim: [number, number][] = [];
      for (let i = 0; i <= 28; i++) { const a = 0.35 + (i / 28) * (2 * Math.PI - 0.7); rim.push([Math.cos(a), Math.sin(a)]); }
      const flat = (pos: number[]) => pos.map((v, i) => (i % 3 === 1 ? pos[i + 1] : i % 3 === 2 ? -pos[i - 1] : v));
      return [{ pos: flat(fan(rim, 0.02)), col: hex(0x5db65a) }, { pos: flat(fan(circle(0.55, 16), 0.03)), col: hex(0x6cc468) }];
    }
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
