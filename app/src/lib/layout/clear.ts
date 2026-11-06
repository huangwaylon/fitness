// What lies on the ground keeps off the island's buildings (docs/design.md "Tap targets", "Shaking a tree"), pure: a
// present, a piece of wood, a branch, a coconut, a mushroom, a shell, a weed or a dig spot never lies where a building
// stands (its footprint: the walk grid's, nav.ts doors[].box, the layout's tiles), on its door's step (doorOf's tiles),
// or on the strip behind it that its model hides from the camera (it looks down the island toward +z at 58°: a
// building h tall hides ~0.62·h of the ground behind it). Drawn there it would be lost: inside the walls or behind them
// it can't be seen, and on the steps the building's tap area takes the tap (SceneTaps' notBehind: what stands within
// its footprint is behind its front line).
// One rule, both ways: what's placed takes a spot off them (`offBuildings` before the put, or a derived spot filtered),
// and what lies there already (put before this rule, or a building placed or moved since in the もようがえ over it) is
// drawn and tapped at the free spot `offBuildings` gives it. A function of the layout and the point alone, so every
// phone holding the layout puts it in the same place, and the stored point (the put's `at`) stays as it was.
import { tileAt, tileX, tileZ } from './grid.ts';
import { doorOf, objTiles, type Layout, type Obj } from './model.ts';
import { goesIn, isMarker, kindDef } from './catalog.ts';
import { levelAt, walkable, type Box, type LayoutNav } from './nav.ts';

/** How much of a building's height its model hides of the ground behind it (1 / tan 58°, and a little). */
const HIDES = 0.65;
/** What lies there keeps this far off (u): about half a find (a present is 30u across). */
const KEEP = 10;
/** The search for a free spot: rings STEP apart out to REACH (u). */
const STEP = 6, REACH = 240;
/** How many rows behind a board its art (60u tall: board/spot.ts BOARD_H) covers on screen: the ground to ~88u past its
 *  back at every zoom (pitch 58° … 40°), a 6px guard round it: three tiles (the third in part, zoomed in). */
const FRONT_BEHIND = 3;

const zoneCache = new WeakMap<LayoutNav, Box[]>();
/** Each building's ground (u, unpadded; y is z): its footprint, its door's step(s) and the strip behind it it hides. */
export function buildingZones(g: LayoutNav): Box[] {
  const had = zoneCache.get(g);
  if (had) return had;
  const out: Box[] = [];
  for (const [id, d] of Object.entries(g.doors)) {
    const o: Obj | undefined = g.layout.objects.get(id);
    if (!o || !goesIn(o.k)) continue;
    const b = d.box, h = kindDef(o.k)?.h ?? 80;
    out.push(b, { x0: b.x0, x1: b.x1, y0: b.y1, y1: b.y1 + h * HIDES });
    for (const [c, r] of doorOf(g.layout, o).tiles) out.push({ x0: tileX(c), x1: tileX(c + 1), y0: tileZ(r), y1: tileZ(r + 1) });
  }
  zoneCache.set(g, out);
  return out;
}

/** Whether a thing `r` u round (x, z) would lie on a building's ground. */
export function onBuilding(g: LayoutNav, x: number, z: number, r = KEEP): boolean {
  return buildingZones(g).some((b) => x > b.x0 - r && x < b.x1 + r && z > b.y0 - r && z < b.y1 + r);
}

const covered = { all: new WeakMap<Layout, Set<string>>(), canopy: new WeakMap<Layout, Set<string>>() };
/** The tiles ("c,r") something stands on or one taps over (spots.ts openGrass's: what the day's weeds and fossils keep
 *  off): its tiles, a home's or a board's door, a spot's ring, the stairs' foot, a tree's canopy (the tiles beside and
 *  behind it, and in front), a bush's, a flower's or a block's tap area round it. `canopy`: only the trees' and the
 *  bushes' (their tap areas are buttons over the ground: what a find moved off a building keeps off). */
export function tapCovered(layout: Layout, which: keyof typeof covered = 'all'): Set<string> {
  const had = covered[which].get(layout);
  if (had) return had;
  const taken = new Set<string>();
  const mark = (c: number, r: number) => taken.add(`${c},${r}`);
  for (const o of layout.objects.values()) {
    // (a visitors' spot is a mark: nothing stands on it)
    if (isMarker(o.k) || (which === 'canopy' && kindDef(o.k)?.group !== 'tree' && kindDef(o.k)?.group !== 'bush')) continue;
    for (const [c, r] of objTiles(layout, o)) mark(c, r);
    const def = kindDef(o.k);
    // what one walks up to: its door's tiles (a home, a board) and a spot's ring stay clear
    if (o.k === 'home' || def?.front) for (const [c, r] of doorOf(layout, o).tiles) mark(c, r);
    if (o.k === 'spot') for (const [c, r] of objTiles(layout, o)) for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) mark(c + i, r + j);
    if (o.k === 'stairs') for (const [c, r] of objTiles(layout, o)) for (let j = -1; j <= 1; j++) mark(c, r + j);
    // a tree's canopy stands over the ground behind it and beside it on screen (its leaves take a tap there), a bush's
    // or a flower's thumb-sized tap area over the tiles round it
    // (the tile in front too: a spot's own thumb-sized tap area there would reach up over a trunk, a bush, a flower; anything
    // else one taps all round it, the rock, the tape deck, a bench: a weed beside the rock clonked it, a fossil by the
    // bench took the bench's tap)
    const ROUND = def?.block === true && def.group !== 'tree' && def.group !== 'bush' && o.k !== 'home';
    const over = def?.group === 'tree' ? 2 : def?.group === 'bush' || def?.group === 'flower' || ROUND ? 1 : -1;
    for (const [c, r] of over >= 0 ? objTiles(layout, o) : []) for (let j = -1; j <= over; j++) for (let i = -1; i <= 1; i++) mark(c + i, r + j);
    // what one stands before to use (the board, K.K.'s stool: catalog.ts `front`) is a button standing up over the
    // ground behind it: on screen it covers FRONT_BEHIND rows there (and a tile each side), where a spot would hide
    // under it once the camera settled (Finds' uncovered) and show again while the camera moved, flickering
    if (def?.front) for (const [c, r] of objTiles(layout, o)) for (let j = 1; j <= FRONT_BEHIND; j++) for (let i = -1; i <= 1; i++) mark(c + i, r + j);
  }
  covered[which].set(layout, taken);
  return taken;
}

/**
 * Where a thing meant for (x, z) lies: there, unless that's a building's ground (onBuilding, `r` u round it); then the
 * nearest free spot: straight out of the ground it's on (its front, its sides, its back: the nearest first), else on
 * rings STEP apart (each from the camera's side round: the front first). Free: ground a walker may stand on at the same
 * level (not the water, a trunk or a bench, a cliff's top or foot), clear of every building's ground and off the trees'
 * and the bushes' tap areas (tapCovered's canopy: under a tree's leaves a tap is the tree's); failing that, any such
 * ground. Rounded to whole units. Where nothing is free within REACH, the point itself.
 */
export function offBuildings(g: LayoutNav, x: number, z: number, r = KEEP): [number, number] {
  if (!onBuilding(g, x, z, r)) return [x, z];
  const lv = levelAt(g, x, z), flat = Number.isInteger(lv), taps = tapCovered(g.layout, 'canopy');
  const free = (px: number, pz: number, open: boolean) => {
    if (onBuilding(g, px, pz, r) || !walkable(g, px, pz) || (open && taps.has(tileAt(px, pz).join(',')))) return false;
    const pl = levelAt(g, px, pz);
    return Number.isInteger(pl) && (!flat || pl === lv);
  };
  // (straight out of each zone holding it, a unit past its edge: a stable sort, the same order on every phone)
  const out: [number, number, number][] = [];
  for (const b of buildingZones(g))
    if (x > b.x0 - r && x < b.x1 + r && z > b.y0 - r && z < b.y1 + r)
      for (const [px, pz] of [[x, b.y0 - r - 1], [b.x0 - r - 1, z], [b.x1 + r + 1, z], [x, b.y1 + r + 1]]) out.push([Math.round(px), Math.round(pz), Math.hypot(px - x, pz - z)]);
  out.sort((a, b) => a[2] - b[2]);
  for (const open of [true, false]) {
    // (the nearest straight way out bounds the rings: one of them nearer wins)
    const exit = out.find(([px, pz]) => free(px, pz, open));
    for (let d = STEP; d <= Math.min(REACH, exit ? exit[2] - 1 : REACH); d += STEP) {
      const n = Math.max(16, Math.ceil((2 * Math.PI * d) / STEP));
      for (let k = 0; k < n; k++) {
        // (from straight toward the camera, −z, out both ways in turn)
        const a = -Math.PI / 2 + (k % 2 ? 1 : -1) * Math.ceil(k / 2) * ((2 * Math.PI) / n);
        const px = Math.round(x + Math.cos(a) * d), pz = Math.round(z + Math.sin(a) * d);
        if (free(px, pz, open)) return [px, pz];
      }
    }
    if (exit) return [exit[0], exit[1]];
  }
  return [x, z];
}
