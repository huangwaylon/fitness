// The museum's baked light (docs/design.md "The museum"): no real lamps (no point or spot lights, no shadow maps), so
// each room's floor carries its own: an aoMap (darker at the walls' feet and in the corners, under what stands on it,
// a soft vignette to the walls) and a lightMap (warm pools under the exhibits, a blue band before each tank, its
// caustics baked, never moving). The walls share two 1 × 64 ramps, the same two slots (one program with the floors): a
// dark foot and a cornice line, and a soft uplight band near the top. The wash and halo cards over paintings, sconces
// and tanks: one merged geometry a wing, additive (one draw). Built once from the plan (plan.ts) and the exhibits'
// rects; the pixel math pure (bake.test.ts), DataTextures (no canvas), static: nothing per frame.
import {
  AdditiveBlending, BufferGeometry, Color, DataTexture, Float32BufferAttribute, LinearFilter, Mesh, MeshBasicMaterial, SRGBColorSpace,
  type Texture
} from 'three';
import type { Opening, Rect } from './plan.ts';

/** A texel's place: column i of w across x0 → x1, row j of h from the front (z1, the plane's v 0: a floor is a
 *  PlaneGeometry turned −90° about x, its v up toward −z; a DataTexture's row 0 is v 0) to the back (z0). */
export function texel(r: Rect, i: number, j: number, w: number, h: number): [number, number] {
  return [r.x0 + ((i + 0.5) / w) * (r.x1 - r.x0), r.z1 - ((j + 0.5) / h) * (r.z1 - r.z0)];
}

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const smooth = (t: number) => {
  const x = clamp01(t);
  return x * x * (3 - 2 * x);
};

/** How far a point is outside a rect (negative inside: how far in from its nearest edge). */
function signedDist(r: Rect, x: number, z: number): number {
  const dx = Math.max(r.x0 - x, x - r.x1), dz = Math.max(r.z0 - z, z - r.z1);
  return dx > 0 || dz > 0 ? Math.hypot(Math.max(dx, 0), Math.max(dz, 0)) : Math.max(dx, dz);
}

/** Something standing on a floor (a tank, a plinth, a bench, a partition): darker under it, `ao` (default 0.6). */
export interface Block extends Rect { ao?: number }
/** A gap in a room's walls (plan.ts Opening's span: no dark foot there). */
type Gap = Pick<Opening, 'axis' | 'at' | 'from' | 'to'>;

const WALL_RISE = 12, WALL_FOOT = 0.55, CORNER = 0.45, FEATHER = 6, VIGNETTE = 0.85, AO_MIN = 0.3;

/** The aoMap's values (row-major, w × h, texel()'s rows): the walls' feet 0.55 rising to 1 over 12 u, an inner corner
 *  0.45, under a block its ao (a 6 u feather out from it), a vignette 1 in the middle to 0.85 at the walls; the
 *  openings in `gaps` have no foot. All multiplied, kept ≥ 0.3. */
export function aoValues(r: Rect, blocks: readonly Block[], gaps: readonly Gap[], w: number, h: number): Float32Array {
  const out = new Float32Array(w * h);
  const half = Math.min(r.x1 - r.x0, r.z1 - r.z0) / 2;
  const open = (axis: 'x' | 'z', at: number, along: number) => gaps.some((g) => g.axis === axis && Math.abs(g.at - at) < 1 && along > g.from && along < g.to);
  for (let j = 0; j < h; j++) {
    for (let i = 0; i < w; i++) {
      const [x, z] = texel(r, i, j, w, h);
      // each wall's darkness at its foot (none in an opening), the darkest of them, a little more where two meet
      const ds = [
        open('x', r.x0, z) ? Infinity : x - r.x0,
        open('x', r.x1, z) ? Infinity : r.x1 - x,
        open('z', r.z0, x) ? Infinity : z - r.z0,
        open('z', r.z1, x) ? Infinity : r.z1 - z
      ].map((d) => (1 - WALL_FOOT) * (1 - smooth(d / WALL_RISE)));
      ds.sort((a, b) => b - a);
      const walls = 1 - ds[0] - ((WALL_FOOT - CORNER) / (1 - WALL_FOOT)) * ds[1];
      let under = 1;
      for (const b of blocks) {
        const a = b.ao ?? 0.6;
        under = Math.min(under, a + (1 - a) * smooth(signedDist(b, x, z) / FEATHER));
      }
      const edge = Math.min(x - r.x0, r.x1 - x, z - r.z0, r.z1 - z);
      const vig = VIGNETTE + (1 - VIGNETTE) * smooth(edge / half);
      out[j * w + i] = Math.max(AO_MIN, walls * under * vig);
    }
  }
  return out;
}

/** A light pool on a floor: round or elliptic (x, z, its radii), or a band over a rect (its light fading over
 *  `feather` u out from it; `caustic`: that share of it a static ripple). `color` sRGB hex (look.ts POOL), `at` its
 *  peak (default 1). */
export type Pool =
  | { x: number; z: number; rx: number; rz?: number; color: number; at?: number }
  | { band: Rect; feather?: number; caustic?: number; color: number; at?: number };

/** A deterministic ripple 0…1 (two crossed sines broken by a hash: the caustics, baked). */
function ripple(x: number, z: number): number {
  const h = Math.sin(x * 12.9898 + z * 78.233) * 43758.5453;
  const n = h - Math.floor(h);
  return clamp01(0.5 + 0.25 * Math.sin(x * 0.55 + Math.sin(z * 0.4) * 2) + 0.25 * Math.sin(z * 0.6 - Math.sin(x * 0.35) * 2) + 0.15 * (n - 0.5));
}

/** The lightMap's values (linear RGB, 3 a texel, texel()'s rows): each pool's colour × at × its falloff (a round one
 *  smooth to 0 at its radius, a band 1 over its rect and smooth to 0 over its feather), summed, clipped at 1. */
export function lightValues(r: Rect, pools: readonly Pool[], w: number, h: number): Float32Array {
  const out = new Float32Array(w * h * 3);
  const cols = pools.map((p) => new Color(p.color));
  for (let j = 0; j < h; j++) {
    for (let i = 0; i < w; i++) {
      const [x, z] = texel(r, i, j, w, h);
      let lr = 0, lg = 0, lb = 0;
      pools.forEach((p, k) => {
        let f: number;
        if ('band' in p) {
          f = 1 - smooth(signedDist(p.band, x, z) / (p.feather ?? 10));
          if (p.caustic) f *= 1 - p.caustic + p.caustic * ripple(x, z);
        } else {
          const d = Math.hypot((x - p.x) / p.rx, (z - p.z) / (p.rz ?? p.rx));
          f = 1 - smooth(d);
        }
        f *= p.at ?? 1;
        lr += cols[k].r * f;
        lg += cols[k].g * f;
        lb += cols[k].b * f;
      });
      const o = (j * w + i) * 3;
      out[o] = Math.min(1, lr);
      out[o + 1] = Math.min(1, lg);
      out[o + 2] = Math.min(1, lb);
    }
  }
  return out;
}

const toSrgb = (v: number) => (v <= 0.0031308 ? v * 12.92 : 1.055 * Math.pow(v, 1 / 2.4) - 0.055);
/** Values as an RGBA DataTexture: `grey` one value a texel (linear: an aoMap reads .r), else RGB linear stored sRGB
 *  (the dark end's steps finer in 8 bits; three decodes it). */
function texture(v: Float32Array, w: number, h: number, grey: boolean): DataTexture {
  const px = new Uint8Array(w * h * 4);
  for (let k = 0; k < w * h; k++) {
    for (let c = 0; c < 3; c++) px[k * 4 + c] = Math.round(255 * (grey ? v[k] : toSrgb(v[k * 3 + c])));
    px[k * 4 + 3] = 255;
  }
  const t = new DataTexture(px, w, h);
  if (!grey) t.colorSpace = SRGBColorSpace;
  t.magFilter = t.minFilter = LinearFilter;
  t.needsUpdate = true;
  return t;
}

/** A room's floor bake: its aoMap and lightMap (size² texels across its rect: on its PlaneGeometry's own uv, repeat
 *  1, so the tiled map's repeat is untouched). */
export function floorBake(r: Rect, blocks: readonly Block[], pools: readonly Pool[], o: { gaps?: readonly Gap[]; size?: number } = {}): { ao: DataTexture; light: DataTexture } {
  const n = o.size ?? 256;
  return { ao: texture(aoValues(r, blocks, o.gaps ?? [], n, n), n, n, true), light: texture(lightValues(r, pools, n, n), n, n, false) };
}

/** The walls' ramps (n values from the foot, v 0, to the top): ao 0.6 at the foot to 1 by a quarter up, 0.9 just under
 *  the cornice; the uplight a soft band 70-95 % up, 0…1 (times UPLIGHT). */
export function rampValues(n = 64): { ao: Float32Array; up: Float32Array } {
  const ao = new Float32Array(n), up = new Float32Array(n);
  for (let k = 0; k < n; k++) {
    const v = (k + 0.5) / n;
    ao[k] = (0.6 + 0.4 * smooth(v / 0.25)) * (1 - 0.1 * smooth((v - 0.92) / 0.06));
    up[k] = smooth((v - 0.62) / 0.16) * (1 - smooth((v - 0.9) / 0.08));
  }
  return { ao, up };
}
/** The uplight's colour (linear peak, sRGB hex). */
const UPLIGHT = 0xffe0b8, UPLIGHT_AT = 0.45;

/** The walls' two ramps as 1 × 64 textures (each wall face's v 0 → 1 from its foot to its top: BoxGeometry's). */
export function wallRamps(n = 64): { ao: DataTexture; light: DataTexture } {
  const { ao, up } = rampValues(n), c = new Color(UPLIGHT), rgb = new Float32Array(n * 3);
  up.forEach((u, k) => rgb.set([c.r * u * UPLIGHT_AT, c.g * u * UPLIGHT_AT, c.b * u * UPLIGHT_AT], k * 3));
  return { ao: texture(ao, 1, n, true), light: texture(rgb, 1, n, false) };
}

/** A wash or halo card: its middle, its size, its yaw (its face toward (sin yaw, cos yaw): 0 faces +z) set 0.3 u off
 *  the wall by the caller. */
export interface Card { x: number; y: number; z: number; w: number; h: number; yaw: number }
/** The cards' looks: a painting's wash (1.4 w × 1.25 h of the frame, 0.2 h above its middle), a sconce's halo (26 × 34
 *  u), a tank's glow lip (4 u tall along its water's top); colour and opacity at the look's cards 1. */
export const CARD = {
  wash: { color: 0xffe9c4, opacity: 0.35 },
  halo: { color: 0xffd9a0, opacity: 0.4 },
  lip: { color: 0x7fd8ff, opacity: 0.5 }
} as const;

/** The cards as one geometry (two triangles a card: position and uv, indexed), for one draw. */
export function cardsGeometry(cards: readonly Card[]): BufferGeometry {
  const pos: number[] = [], uv: number[] = [], idx: number[] = [];
  cards.forEach((c, k) => {
    const ax = Math.cos(c.yaw), az = -Math.sin(c.yaw), hw = c.w / 2, hh = c.h / 2;
    for (const [u, v] of [[0, 0], [1, 0], [1, 1], [0, 1]] as const) {
      const s = (u * 2 - 1) * hw;
      pos.push(c.x + ax * s, c.y + (v * 2 - 1) * hh, c.z + az * s);
      uv.push(u, v);
    }
    const b = k * 4;
    idx.push(b, b + 1, b + 2, b, b + 2, b + 3);
  });
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeBoundingSphere();
  return g;
}

/** A wing's cards of one kind as one mesh: additive, no depth write, its map a soft gradient (softDisc's white, from
 *  world3d/cards.ts: the blob shadows' program, blending isn't in its key). Its colour is CARD's × opacity ÷ the
 *  disc's 0.42 peak (so the peak is the opacity); `cards(look.cards)` sets it for the look. */
export function cardsMesh(kind: keyof typeof CARD, cards: readonly Card[], map: Texture): { mesh: Mesh; cards(k: number): void } {
  const m = new MeshBasicMaterial({ map, transparent: true, depthWrite: false, blending: AdditiveBlending });
  const mesh = new Mesh(cardsGeometry(cards), m);
  mesh.renderOrder = 2;
  const set = (k: number) => void m.color.setHex(CARD[kind].color).multiplyScalar((CARD[kind].opacity / 0.42) * k);
  set(1);
  return { mesh, cards: set };
}
