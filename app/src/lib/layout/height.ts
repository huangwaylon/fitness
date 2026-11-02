// The ground's height on the layout (docs/island-layout.md "Derived, never hand-made"), pure: what the 3D ground's
// mesh samples (world3d/terrain.ts), where feet stand and where a tap lands. World units, y up.
//   A tile's tier is TIER_H a step; the land's top at GRASS_Y over it (the beach's sand at SAND_Y), the river's and the
//   pond's bed CARVE below the bank, the sea's floor falling away from the shore.
//   Every edge is NH's rounded one: a convex corner of a region (a tier, the water, the beach, a path) is cut round,
//   a concave one filled round, so nothing on the island has a square corner (roundedIn).
//   Stairs ramp from their tier to the next along their facing; a bridge's deck arches over its water.
import { GRID, TILE, TIER_H, idx, isWater, kindOf, onGrid, tierOf, tileAt, tileX, tileZ, type Kind } from './grid.ts';
import { facingVec, footOf, type Layout, type Obj } from './model.ts';

export const GRASS_Y = 3;
const SAND_Y = 1.2;
const CARVE = 9;
const SEA_Y = -0.5;
const SEABED = -7;
/** The rounding's radius (a tile's share): the cliffs' corners, the water's banks, the beach and the paths. */
const ROUND = 0.42;
const DECK_Y = 6;

/** Whether a point at (u, v) in tile (c, r) (u, v in 0…1) is inside the rounded region `m` (a test on tiles). */
function roundedIn(m: (c: number, r: number) => boolean, c: number, r: number, u: number, v: number, R = ROUND): boolean {
  const own = m(c, r);
  const sx = u < 0.5 ? -1 : 1, sz = v < 0.5 ? -1 : 1;
  const du = sx < 0 ? u : 1 - u, dv = sz < 0 ? v : 1 - v;
  if (du >= R || dv >= R) return own;
  const h = m(c + sx, r), vv = m(c, r + sz);
  const inCircle = (R - du) ** 2 + (R - dv) ** 2 <= R * R;
  if (own && !h && !vv) return inCircle;
  if (!own && h && vv) return !inCircle;
  return own;
}

export interface Field {
  layout: Layout;
  /** The ground's height at (x, z): the terrain only. */
  ground(x: number, z: number): number;
  /** Where feet stand: the ground, a stairs' ramp, a bridge's deck. */
  feet(x: number, z: number): number;
  /** The rounded tier and surface at a point. */
  tierAt(x: number, z: number): number;
  surfaceAt(x: number, z: number): Kind;
}

const fields = new WeakMap<Layout, Field>();

/** The layout's height field (built once a layout). */
export function fieldOf(layout: Layout): Field {
  let f = fields.get(layout);
  if (!f) fields.set(layout, (f = build(layout)));
  return f;
}

/** The ground's height at (x, z) on the layout (feet: stairs and bridges included). */
export const heightAt = (layout: Layout, x: number, z: number): number => fieldOf(layout).feet(x, z);

function build(layout: Layout): Field {
  const codes = layout.codes;
  const kindAt = (c: number, r: number): Kind => (onGrid(c, r) ? kindOf(codes[idx(c, r)]) : 'sea');
  const tierOfTile = (c: number, r: number): number => (onGrid(c, r) ? tierOf(codes[idx(c, r)]) : 0);
  const land = (c: number, r: number) => kindAt(c, r) !== 'sea';
  const fresh = (c: number, r: number) => {
    const k = kindAt(c, r);
    return k === 'river' || k === 'pond';
  };
  const sandy = (c: number, r: number) => {
    const k = kindAt(c, r);
    return k === 'sand' || k === 'sea';
  };
  const tierMask = (t: number) => (c: number, r: number) => land(c, r) && tierOfTile(c, r) >= t;
  const masks = [1, 2, 3].map(tierMask);
  const local = (x: number, z: number): [number, number, number, number] => {
    const [c, r] = tileAt(x, z);
    return [c, r, (x - tileX(c)) / TILE, (z - tileZ(r)) / TILE];
  };
  function tierAt(x: number, z: number): number {
    const [c, r, u, v] = local(x, z);
    let t = 0;
    for (let i = 0; i < masks.length; i++) if (roundedIn(masks[i], c, r, u, v)) t = i + 1;
    return t;
  }
  function surfaceAt(x: number, z: number): Kind {
    const [c, r, u, v] = local(x, z);
    if (!roundedIn(land, c, r, u, v)) return 'sea';
    if (roundedIn(fresh, c, r, u, v)) {
      const k = kindAt(c, r);
      return k === 'pond' || k === 'river' ? k : 'river';
    }
    const k = kindAt(c, r);
    if (roundedIn(sandy, c, r, u, v)) return 'sand';
    if (k === 'sand' || isWater(k)) return 'grass';
    // a path's own kind, rounded against the grass
    const path = (cc: number, rr: number) => kindAt(cc, rr) === k;
    return roundedIn(path, c, r, u, v, 0.34) ? k : 'grass';
  }
  /** How far into the sea (u) a point off the land is, roughly: the seabed falls away from the shore. */
  function seaDepth(x: number, z: number): number {
    const [c, r] = tileAt(x, z);
    let best = 3;
    for (let dz = -2; dz <= 2; dz++)
      for (let dx = -2; dx <= 2; dx++) if (land(c + dx, r + dz)) best = Math.min(best, Math.max(Math.abs(dx), Math.abs(dz)));
    return best;
  }
  function ground(x: number, z: number): number {
    const s = surfaceAt(x, z);
    if (s === 'sea') return Math.max(SEABED, -1.5 - seaDepth(x, z) * 2);
    const base = tierAt(x, z) * TIER_H;
    if (s === 'river' || s === 'pond') return base + GRASS_Y - CARVE;
    if (s === 'sand') return base + SAND_Y;
    return base + GRASS_Y;
  }
  // the structures: stairs ramps and bridge decks
  const ramps: { x0: number; x1: number; z0: number; z1: number; f: number; y0: number }[] = [];
  const decks: { x0: number; x1: number; z0: number; z1: number; along: 'x' | 'z'; y: number }[] = [];
  for (const o of layout.objects.values()) {
    if (o.k !== 'stairs' && o.k !== 'bridge') continue;
    const [w, d] = footOf(layout, o);
    const box = { x0: tileX(o.x), x1: tileX(o.x + w), z0: tileZ(o.z), z1: tileZ(o.z + d) };
    if (o.k === 'stairs') ramps.push({ ...box, f: o.f, y0: tierOfTile(o.x, o.z) * TIER_H + GRASS_Y });
    else decks.push({ ...box, along: o.f % 2 ? 'x' : 'z', y: bankOf(o) });
  }
  function bankOf(o: Obj): number {
    // the deck sits over the bank at its near end
    return tierOfTile(o.x, o.z) * TIER_H + GRASS_Y;
  }
  function feet(x: number, z: number): number {
    for (const p of ramps) {
      if (x < p.x0 || x > p.x1 || z < p.z0 || z > p.z1) continue;
      const [fx, fz] = facingVec(p.f);
      // rising away from its facing: f 0 (facing the camera) climbs toward +z
      const t = fz !== 0 ? (fz < 0 ? (z - p.z0) / (p.z1 - p.z0) : (p.z1 - z) / (p.z1 - p.z0)) : fx > 0 ? (p.x1 - x) / (p.x1 - p.x0) : (x - p.x0) / (p.x1 - p.x0);
      return p.y0 + TIER_H * Math.max(0, Math.min(1, t));
    }
    for (const b of decks) {
      if (x < b.x0 || x > b.x1 || z < b.z0 || z > b.z1) continue;
      const t = b.along === 'z' ? (z - b.z0) / (b.z1 - b.z0) : (x - b.x0) / (b.x1 - b.x0);
      return b.y + DECK_Y * Math.sin(Math.PI * t);
    }
    return Math.max(ground(x, z), SEA_Y - 1);
  }
  return { layout, ground, feet, tierAt, surfaceAt };
}
