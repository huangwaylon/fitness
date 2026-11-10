// The museum's baked light (bake.ts): the floors' ao darker at the walls' feet, in the corners and under what stands
// there (none in an opening), always within 0.3…1; the light pools where they're put and nowhere else, a tank's band
// with its caustics; the walls' ramps; the textures' sizes and colour spaces; the cards merged into one geometry.
import { describe, expect, test } from 'vitest';
import { AdditiveBlending, LinearFilter, NoColorSpace, SRGBColorSpace, Texture } from 'three';
import { CARD, aoValues, cardsGeometry, cardsMesh, floorBake, lightValues, rampValues, texel, wallRamps, type Pool } from './bake.ts';
import { HALL, OPENINGS, type Rect } from './plan.ts';

const N = 64;
/** The texel nearest a point (x, z) in the rect. */
const at = (r: Rect, x: number, z: number) => {
  const i = Math.min(N - 1, Math.floor(((x - r.x0) / (r.x1 - r.x0)) * N)), j = Math.min(N - 1, Math.floor(((r.z1 - z) / (r.z1 - r.z0)) * N));
  return j * N + i;
};
const R: Rect = { x0: 0, x1: 120, z0: 0, z1: 200 };

describe("the floors' ao", () => {
  const ao = aoValues(R, [{ x0: 40, x1: 80, z0: 90, z1: 110 }], [], N, N);
  test('within 0.3…1; the middle ~1, a wall foot ~0.55 rising over 12 u, a corner darker still', () => {
    for (const v of ao) (expect(v).toBeGreaterThanOrEqual(0.3), expect(v).toBeLessThanOrEqual(1));
    expect(ao[at(R, 60, 40)]).toBeGreaterThan(0.95);
    const foot = ao[at(R, 1, 40)];
    expect(foot).toBeLessThan(0.62);
    expect(ao[at(R, 8, 40)]).toBeGreaterThan(foot);
    expect(ao[at(R, 16, 40)]).toBeGreaterThan(ao[at(R, 8, 40)]);
    expect(ao[at(R, 1, 1)]).toBeLessThan(foot);
  });
  test('under a block 0.6, its feather back to the floor’s 6 u out', () => {
    expect(ao[at(R, 60, 100)]).toBeCloseTo(0.6, 1);
    expect(ao[at(R, 60, 104)]).toBeLessThan(0.65);
    expect(ao[at(R, 60, 120)]).toBeGreaterThan(0.95);
    expect(ao[at(R, 86, 100)]).toBeGreaterThan(ao[at(R, 82, 100)]);
  });
  test("no dark foot across an opening (the hall's side doorways)", () => {
    const hall = aoValues(HALL, [], OPENINGS, N, N), shut = aoValues(HALL, [], [], N, N);
    const door = at(HALL, HALL.x0 + 1, 10), wall = at(HALL, HALL.x0 + 1, -30);
    expect(hall[door]).toBeGreaterThan(0.8);
    expect(shut[door]).toBeLessThan(0.62);
    expect(hall[wall]).toBeCloseTo(shut[wall]);
  });
  test("texel(): column 0 at x0, row 0 at the front (z1, the plane's v 0)", () => {
    const [x, z] = texel(R, 0, 0, N, N);
    expect(x).toBeCloseTo(R.x0 + 120 / N / 2);
    expect(z).toBeCloseTo(R.z1 - 200 / N / 2);
    expect(texel(R, N - 1, N - 1, N, N)[1]).toBeCloseTo(R.z0 + 200 / N / 2);
  });
});

describe("the floors' light", () => {
  const pools: Pool[] = [
    { x: 30, z: 50, rx: 20, color: 0xffe6c0 },
    { x: 90, z: 150, rx: 24, rz: 10, color: 0xffd8a0, at: 0.5 }
  ];
  const lm = lightValues(R, pools, N, N);
  const rgb = (k: number) => [lm[k * 3], lm[k * 3 + 1], lm[k * 3 + 2]];
  test('a pool at its peak in its middle, warm, none past its radius; an ellipse longer across than deep', () => {
    const mid = rgb(at(R, 30, 50));
    expect(mid[0]).toBeGreaterThan(0.9);
    expect(mid[0]).toBeGreaterThan(mid[2]);
    expect(rgb(at(R, 30, 75))).toEqual([0, 0, 0]);
    expect(rgb(at(R, 60, 100))).toEqual([0, 0, 0]);
    expect(rgb(at(R, 90, 150))[0]).toBeCloseTo(0.5, 1);
    expect(rgb(at(R, 106, 150))[0]).toBeGreaterThan(rgb(at(R, 90, 158))[0]);
  });
  test("a lamp's pool with an edge: full over that share of its radius, then a quick fall, none past it", () => {
    const soft = lightValues(R, [{ x: 60, z: 100, rx: 40, color: 0xffffff }], N, N), hard = lightValues(R, [{ x: 60, z: 100, rx: 40, edge: 0.5, color: 0xffffff }], N, N);
    expect(hard[at(R, 78, 100) * 3]).toBeGreaterThan(0.97);
    expect(hard[at(R, 78, 100) * 3]).toBeGreaterThan(soft[at(R, 78, 100) * 3] + 0.2);
    expect(hard[at(R, 102, 100) * 3]).toBe(0);
  });
  test('overlapping pools add, clipped at 1', () => {
    const two = lightValues(R, [pools[0], { ...pools[0], at: 0.5 }], N, N);
    expect(two[at(R, 30, 62) * 3 + 2]).toBeGreaterThan(lm[at(R, 30, 62) * 3 + 2]);
    for (const v of two) expect(v).toBeLessThanOrEqual(1);
  });
  test("a tank's band: blue over its rect, fading over its feather, rippled by its caustics, the same every time", () => {
    const band: Pool = { band: { x0: 20, x1: 100, z0: 20, z1: 40 }, feather: 10, caustic: 0.3, color: 0x6fc6e8 };
    const a = lightValues(R, [band], N, N), b = lightValues(R, [band], N, N);
    expect(a).toEqual(b);
    const inside: number[] = [];
    for (let x = 22; x < 100; x += 4) inside.push(a[at(R, x, 30) * 3 + 2]);
    expect(Math.min(...inside)).toBeGreaterThan(0.5);
    expect(Math.max(...inside) - Math.min(...inside)).toBeGreaterThan(0.02);
    expect(a[at(R, 60, 30) * 3 + 2]).toBeGreaterThan(a[at(R, 60, 30) * 3]);
    expect(a[at(R, 60, 46) * 3 + 2]).toBeGreaterThan(0);
    expect(a[at(R, 60, 60) * 3 + 2]).toBe(0);
  });
});

describe('the textures', () => {
  test('a floor: ao linear and light sRGB, size² texels, smooth', () => {
    const { ao, light } = floorBake(R, [], [{ x: 60, z: 100, rx: 30, color: 0xffffff }], { size: 32 });
    expect([ao.image.width, ao.image.height, light.image.width]).toEqual([32, 32, 32]);
    expect([ao.colorSpace, light.colorSpace]).toEqual([NoColorSpace, SRGBColorSpace]);
    expect([ao.magFilter, light.minFilter]).toEqual([LinearFilter, LinearFilter]);
    const px = light.image.data as Uint8Array, mid = (16 * 32 + 16) * 4;
    expect(px[mid]).toBeGreaterThan(240);
    expect(px[3]).toBe(255);
    expect(px[0]).toBe(0);
  });
  test("the walls' ramps: ao 0.6 at the foot to 1 a quarter up, 0.9 under the cornice; the uplight high up only", () => {
    const { ao, up } = rampValues(64);
    expect(ao[0]).toBeCloseTo(0.6, 1);
    expect(ao[20]).toBeCloseTo(1, 2);
    expect(ao[63]).toBeCloseTo(0.9, 1);
    for (const v of ao) (expect(v).toBeGreaterThanOrEqual(0.6), expect(v).toBeLessThanOrEqual(1));
    expect(Math.max(...up.slice(0, 38))).toBe(0);
    const peak = up.indexOf(Math.max(...up));
    expect(peak / 64).toBeGreaterThan(0.7);
    expect(peak / 64).toBeLessThan(0.95);
    const t = wallRamps();
    expect([t.ao.image.width, t.ao.image.height, t.light.colorSpace]).toEqual([1, 64, SRGBColorSpace]);
  });
});

describe('the cards', () => {
  const cards = [
    { x: 0, y: 22, z: -49.7, w: 20, h: 15, yaw: 0 },
    { x: -59.7, y: 36, z: 0, w: 26, h: 34, yaw: Math.PI / 2 },
    { x: 10, y: 30, z: 5, w: 4, h: 4, yaw: Math.PI }
  ];
  test('merged: four corners and two triangles a card, each its size, standing on its wall facing out', () => {
    const g = cardsGeometry(cards);
    expect(g.getAttribute('position').count).toBe(12);
    expect(g.getAttribute('uv').count).toBe(12);
    expect(g.getIndex()!.count).toBe(18);
    const p = g.getAttribute('position');
    expect([p.getX(1) - p.getX(0), p.getY(2) - p.getY(1)]).toEqual([20, 15]);
    expect(p.getZ(0)).toBeCloseTo(-49.7);
    // the side wall's (yaw 90°: facing +x): across it in z, all at its x
    for (let k = 4; k < 8; k++) expect(p.getX(k)).toBeCloseTo(-59.7);
    expect(Math.abs(p.getZ(5) - p.getZ(4))).toBeCloseTo(26);
    // facing its way: the first triangle's normal along (sin yaw, 0, cos yaw)
    const n = (b: number) => {
      const v = [0, 1, 2].map((k) => [p.getX(b + k), p.getY(b + k), p.getZ(b + k)]);
      const e1 = v[1].map((c, i) => c - v[0][i]), e2 = v[2].map((c, i) => c - v[0][i]);
      return [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]];
    };
    expect(n(0)[2]).toBeGreaterThan(0);
    expect(n(4)[0]).toBeGreaterThan(0);
    expect(n(8)[2]).toBeLessThan(0);
    expect(cardsGeometry([]).getAttribute('position').count).toBe(0);
  });
  test('one additive mesh a kind, no depth write, its peak the kind’s opacity, brighter at night', () => {
    const { mesh, cards: set } = cardsMesh('wash', cards, new Texture());
    const m = mesh.material as import('three').MeshBasicMaterial;
    expect([m.blending, m.depthWrite, m.transparent]).toEqual([AdditiveBlending, false, true]);
    const day = m.color.r;
    expect(day * 0.42).toBeCloseTo(CARD.wash.opacity * new (m.color.constructor as typeof import('three').Color)(CARD.wash.color).r);
    set(1.4);
    expect(m.color.r).toBeCloseTo(day * 1.4);
  });
});
