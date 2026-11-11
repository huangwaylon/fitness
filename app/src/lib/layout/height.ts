// The ground's height on the layout (docs/island-layout.md "Derived, never hand-made"), pure: what the 3D ground's
// mesh samples (layout/mesh.ts), where feet stand and where a tap lands. World units, y up.
//   A tile's tier is TIER_H a step (an exact rounded edge: fields.ts roundedIn, the cliff's wall stands on it).
//   Over its tier the ground is shaped by the distance fields (fields.ts): grass GRASS_Y, sand SAND_Y, the beach sloping
//   into the sea and the seabed falling away from the shore, a river's or a pond's banks sloping to its bed CARVE below,
//   a path sunk a little in the grass.
//   Stairs ramp from their tier to the next along their facing; a bridge's deck arches over its water.
import { GRID, TIER_H, TILE, idx, kindOf, onGrid, tileAt, tileX, tileZ, type Kind } from './grid.ts';
import { facingVec, footOf, type Layout } from './model.ts';
import { Ch, fieldsOf, masks, roundedIn, type Fields } from './fields.ts';
import { clamp01, smoothstep } from '#lib/math.ts';

export const GRASS_Y = 3;
const SAND_Y = 1.2;
const CARVE = 9;
/** The fresh water's surface below the bank. */
export const WATER_DROP = 2.5;
export const SEA_Y = -0.5;
/** The seabed's deepest, the deep plane's level under the sea past the grid (terrain.ts), and how far in from the grid's
 *  edge the seabed goes down to it. */
export const DEEP_Y = -7.5;
export const EDGE_FADE = 30;
/** How far (x, z) is inside the grid's edge (u; negative off it). */
const edgeDist = (x: number, z: number): number =>
  Math.min(x - GRID.x0, GRID.x0 + GRID.cols * TILE - x, z - GRID.z0, GRID.z0 + GRID.rows * TILE - z);
/** A river's bed where it meets the sea (it shallows to this over its last half tile, and runs on out at it). */
const MOUTH_Y = -1.5;
const DECK_Y = 6;


export interface Field {
  layout: Layout;
  fields: Fields;
  /** The ground's height at (x, z): the terrain only. */
  ground(x: number, z: number): number;
  /** The ground's height over its tier's level at (x, z) (the mesh adds the level of the piece it builds). */
  offset(x: number, z: number, tier: number): number;
  /** Where feet stand: the ground, a stairs' ramp, a bridge's deck. */
  feet(x: number, z: number): number;
  /** The rounded tier and surface at a point. */
  tierAt(x: number, z: number): number;
  surfaceAt(x: number, z: number): Kind;
}

const cache = new WeakMap<Layout, Field>();

/** The layout's height field (built once a layout). */
export function fieldOf(layout: Layout): Field {
  let f = cache.get(layout);
  if (!f) cache.set(layout, (f = build(layout)));
  return f;
}

/** The ground's height at (x, z) on the layout (feet: stairs and bridges included). */
export const heightAt = (layout: Layout, x: number, z: number): number => fieldOf(layout).feet(x, z);

function build(layout: Layout): Field {
  const F = fieldsOf(layout);
  const ms = masks(layout);
  const tierMasks = [ms[Ch.tier1], ms[Ch.tier2], ms[Ch.tier3]];
  const kindAt = (c: number, r: number): Kind => (onGrid(c, r) ? kindOf(layout.codes[idx(c, r)]) : 'sea');
  function tierAt(x: number, z: number): number {
    // (tileAt's tuple inline: the ground's height under every node each frame)
    const c = Math.floor((x - GRID.x0) / TILE), r = Math.floor((z - GRID.z0) / TILE);
    const u = (x - tileX(c)) / TILE, v = (z - tileZ(r)) / TILE;
    let t = 0;
    for (let i = 0; i < tierMasks.length; i++) if (roundedIn(tierMasks[i], c, r, u, v)) t = i + 1;
    return t;
  }
  function offset(x: number, z: number, tier: number): number {
    const dL = F.at(Ch.land, x, z), dS = F.at(Ch.sandy, x, z), dW = F.at(Ch.fresh, x, z), dP = F.at(Ch.path, x, z);
    let y: number;
    if (tier === 0) {
      // the seabed off the land; the beach rising from the shoreline
      // (continuous at the shoreline: a step there would show the mesh's 5u cells as teeth through the shallows)
      // (a river's mouth: its channel runs on out into the sea, MOUTH_Y deep, until the seabed is deeper: no step where
      // its bed meets the seabed, the user's 2026-11-06 hard line at the shore)
      // (and by the grid's edge the seabed is down at the deep plane's level, terrain.ts: no ledge where the mesh ends)
      if (dL > 0) {
        const bed = Math.min(-Math.min(dL * 0.3, 1.5 + dL * 0.14, 7.5), MOUTH_Y * smoothstep(1, -8, dW));
        return bed + (DEEP_Y - bed) * smoothstep(EDGE_FADE, 0, edgeDist(x, z));
      }
      const shore = Math.min(SAND_Y, -dL * 0.12);
      y = shore + (GRASS_Y - shore) * smoothstep(-1, 5, dS);
    } else y = SAND_Y + (GRASS_Y - SAND_Y) * smoothstep(-1, 5, dS);
    y -= 0.35 * smoothstep(2, -3, dP);
    // a river's or a pond's banks down to its bed; on the sea's level the bed shallows to MOUTH_Y at the shore
    const bed = GRASS_Y - CARVE + (tier === 0 ? (MOUTH_Y - GRASS_Y + CARVE) * smoothstep(-14, 0, dL) : 0);
    return y + (bed - y) * smoothstep(1, -8, dW);
  }
  function surfaceAt(x: number, z: number): Kind {
    if (F.at(Ch.land, x, z) > 0) return 'sea';
    const [c, r] = tileAt(x, z);
    const k = kindAt(c, r);
    if (F.at(Ch.fresh, x, z) < 0) return k === 'pond' ? 'pond' : 'river';
    if (F.at(Ch.path, x, z) < 0) return k === 'stone' || k === 'brick' || k === 'plank' || k === 'dirt' ? k : 'dirt';
    if (F.at(Ch.sandy, x, z) < 0) return 'sand';
    return 'grass';
  }
  const ground = (x: number, z: number) => {
    const t = tierAt(x, z);
    return t * TIER_H + offset(x, z, t);
  };
  // the structures: stairs' ramps and bridges' decks
  const ramps: { x0: number; x1: number; z0: number; z1: number; f: number; y0: number }[] = [];
  const decks: { x0: number; x1: number; z0: number; z1: number; along: 'x' | 'z'; y: number }[] = [];
  for (const o of layout.objects.values()) {
    if (o.k !== 'stairs' && o.k !== 'bridge') continue;
    const [w, d] = footOf(layout, o);
    const box = { x0: tileX(o.x), x1: tileX(o.x + w), z0: tileZ(o.z), z1: tileZ(o.z + d) };
    const base = (onGrid(o.x, o.z) ? layout.tier(o.x, o.z) : 0) * TIER_H + GRASS_Y;
    if (o.k === 'stairs') ramps.push({ ...box, f: o.f, y0: base });
    else decks.push({ ...box, along: o.f % 2 ? 'x' : 'z', y: base });
  }
  function feet(x: number, z: number): number {
    for (const p of ramps) {
      if (x < p.x0 || x > p.x1 || z < p.z0 || z > p.z1) continue;
      const [fx, fz] = facingVec(p.f);
      // rising away from its facing: f 0 (facing the camera) climbs toward +z
      const t = fz !== 0 ? (fz < 0 ? (z - p.z0) / (p.z1 - p.z0) : (p.z1 - z) / (p.z1 - p.z0)) : fx > 0 ? (p.x1 - x) / (p.x1 - p.x0) : (x - p.x0) / (p.x1 - p.x0);
      return p.y0 + TIER_H * clamp01(t);
    }
    for (const b of decks) {
      if (x < b.x0 || x > b.x1 || z < b.z0 || z > b.z1) continue;
      const t = b.along === 'z' ? (z - b.z0) / (b.z1 - b.z0) : (x - b.x0) / (b.x1 - b.x0);
      return b.y + DECK_Y * Math.sin(Math.PI * t);
    }
    return Math.max(ground(x, z), SEA_Y - 1);
  }
  return { layout, fields: F, ground, offset, feet, tierAt, surfaceAt };
}
