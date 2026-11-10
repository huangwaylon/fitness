// Things on the island's tables (docs/island-layout.md "Table tops"), pure: NH's table tops outdoors, the rooms' rules
// (lib/surface.ts). A small thing (NH's miscellaneous: the food, a kettle, the lantern, the radio) may stand on a surface
// (a table, the camp kitchen, a stool, the outdoor bench, the wagon), one a tile of the surface's top. It keeps its own
// tile (one of its surface's) and says what it's on (`on`: model.ts Obj, contract/layout.ts), so every other reader of
// the layout (the walk, the checks, an older phone) sees a thing on that tile; the 3D island draws it on the top
// (world3d/objects.ts), turned and carried with its surface (carryTops: the editors' edits).
import { onTop, slotsOf, type Top } from '#lib/surface.ts';
import { kindDef } from './catalog.ts';
import { GRID, TILE } from './grid.ts';
import { footOf, objMid, originOf, withChanges, type Layout, type Obj } from './model.ts';
import { yawOf } from './nav.ts';
import { outdoorSmall, outdoorTop } from './outdoor.ts';

type Facing = Obj['f'];
/** A model unit (NH's: a tile is 10) in world units at NH's furniture scale (DECOR_U). */
const U = TILE / 10;

/** NH's surfaces among the island's kinds: each one's top, its room piece's (tent/items.json, the same NH model:
 *  tops.test holds them together) [room code, height, top rectangle]; the slots are all its tiles. The iron garden
 *  table has no room piece: its model's (assets.json decor/iron-table). */
const TOPS: Readonly<Record<string, readonly [room: string | null, sy: number, st: Top['st']]>> = {
  'folding-table': ['f13680', 7.2, [-4, -4, 4, 4]],
  'outdoor-table': ['f3946', 7.2, [-9, -4.5, 9, 4.5]],
  'outdoor-kitchen': ['f14055', 7.2, [-9.5, -4, 9, 4]],
  'outdoor-bench': ['f3947', 4.3, [-8.5, -3, 8.5, 3]],
  'utility-wagon': ['f13638', 6.6, [-4.5, -3.5, 4.5, 3.5]],
  'log-stool': ['f4038', 4.2, [-2.5, -2.5, 3, 2.5]],
  'upright-locker': ['f833', 18.5, [-4, -3.5, 4, 3.5]],
  'iron-table': [null, 7.3, [-4, -4, 4, 4]]
};
/** NH's small things (its miscellaneous, one tile) among the island's kinds: they may stand on a surface. */
const SMALL: ReadonlySet<string> = new Set([
  'lantern', 'cooler-box', 'camp-stove', 'water-jug', 'simple-kettle', 'portable-radio', 'plastic-canister', 'kettle', 'espresso-maker',
  'wooden-bucket', 'tin-bucket', 'picnic-basket', 'fruit-basket', 'bread', 'sandwich-set', 'stewpot', 'frying-pan', 'seafood-ajillo',
  'grilled-sea-bass', 'western-meal', 'japanese-meal', 'bottled-beverage', 'coconut-juice', 'cookies', 'kettlebell', 'protein-shaker'
]);

/** @public (tops.test) A surface kind's room piece (tent/items.json), null for the iron table. */
export const roomOf = (k: string): string | null | undefined => TOPS[k]?.[0];
// (the outdoor catalogue's: its room piece's top, its small things: layout/outdoor.ts)
export const isSurfaceKind = (k: string): boolean => k in TOPS || !!outdoorTop(k);
export const isSmallKind = (k: string): boolean => SMALL.has(k) || outdoorSmall(k);
/** A surface kind's top (lib/surface.ts). */
export function topOf(k: string): Top | null {
  const t = TOPS[k], def = kindDef(k);
  return t && def ? { w: def.w, d: def.d, sy: t[1], st: t[2] } : outdoorTop(k);
}

/** The footprint's middle (u: no default's offset), the tiles' frame. */
function footMid(l: Layout, p: Obj): [number, number] {
  const [w, d] = footOf(l, p), [x0, z0] = originOf(l, p);
  return [GRID.x0 + (x0 + w / 2) * TILE, GRID.z0 + (z0 + d / 2) * TILE];
}
/** A point of a piece's own frame (model units: three's, +z its front) off its spot in the island's x, z (u), turned by
 *  its yaw as the 3D island turns it (world3d/things.ts lamps: z the world's −z) and scaled by `k` (u a model unit). */
function turned(p: Obj, lx: number, lz: number, k: number): [number, number] {
  const a = yawOf(p), c = Math.cos(a), s = Math.sin(a);
  return [(lx * c + lz * s) * k, (lx * s - lz * c) * k];
}
/** The island tile of slot (sx, sz) on surface `p` (as it stands, turned). */
export function tileOfSlot(l: Layout, p: Obj, sx: number, sz: number): [number, number] {
  const t = topOf(p.k)!, [mx, mz] = footMid(l, p);
  const [dx, dz] = turned(p, (sx + 0.5 - t.w / 2) * 10, (sz + 0.5 - t.d / 2) * 10, U);
  return [Math.floor((mx + dx - GRID.x0) / TILE + 1e-6), Math.floor((mz + dz - GRID.z0) / TILE + 1e-6)];
}
/** The slot of surface `p` over island tile (c, r) that holds a thing, or null. */
export function slotAt(l: Layout, p: Obj, c: number, r: number): [number, number] | null {
  const t = topOf(p.k);
  if (!t) return null;
  for (const [sx, sz] of slotsOf(t)) {
    const [x, z] = tileOfSlot(l, p, sx, sz);
    if (x === c && z === r) return [sx, sz];
  }
  return null;
}

/** The surface a thing stands on: its `on`, when that's a surface on the island (on the ground itself) whose top holds
 *  the thing's tile; else null, and it stands on the ground at its tile (its surface gone: a race between two phones). */
export function parentOf(l: Layout, o: Obj): Obj | null {
  const p = o.on ? l.objects.get(o.on) : undefined;
  return p && !p.on && isSurfaceKind(p.k) && isSmallKind(o.k) && slotAt(l, p, o.x, o.z) ? p : null;
}
/** What stands on a surface's top. */
export const kidsOf = (l: Layout, id: string): Obj[] => [...l.objects.values()].filter((o) => o.on === id);

/** Where a thing on a top is drawn: its middle (u, the top's rectangle) and how high over the ground (u), `k` its
 *  surface's u a model unit (its drawn scale; NH's furniture scale by default); null: it stands on the ground. */
export function topSpot(l: Layout, o: Obj, k = U): { x: number; z: number; lift: number } | null {
  const p = parentOf(l, o);
  if (!p) return null;
  const [sx, sz] = slotAt(l, p, o.x, o.z)!;
  const [lx, y, lz] = onTop(topOf(p.k)!, 1, 1, sx, sz);
  const [mx, mz] = objMid(l, p), [dx, dz] = turned(p, lx, lz, k);
  return { x: mx + dx, z: mz + dz, lift: y * k };
}

/** The surface whose top holds island tile (c, r) (not `except`), or null. */
export function surfaceAt(l: Layout, c: number, r: number, except?: string): Obj | null {
  for (const o of l.objects.values()) if (o.id !== except && !o.on && isSurfaceKind(o.k) && slotAt(l, o, c, r)) return o;
  return null;
}
/** Why small thing `id` (null: a new one) can't go on surface `p`'s tile (c, r): `top` (no slot there), `taken`
 *  (another thing on it), or null: it can. */
export function topWhy(l: Layout, p: Obj, c: number, r: number, id: string | null): 'top' | 'taken' | null {
  if (!slotAt(l, p, c, r)) return 'top';
  return [...l.objects.values()].some((o) => o.on === p.id && o.id !== id && o.x === c && o.z === r) ? 'taken' : null;
}
/** A small thing at its tile, on the surface there when it may stand on its top (else on the ground): its `on`. */
export function seat(l: Layout, o: Obj): Obj {
  const { on: _, ...ground } = o;
  if (!isSmallKind(o.k)) return ground;
  const p = surfaceAt(l, o.x, o.z, o.id);
  return p && !topWhy(l, p, o.x, o.z, o.id) ? { ...ground, on: p.id } : ground;
}

/**
 * An edit's things on tops made right: those on a surface that moved or turned go with it (the same slot, turned as
 * it turned), those on one taken away go too; a thing the edit itself put somewhere (its `on` new) stays as it is.
 */
export function carryTops(before: Layout, after: Layout): Layout {
  const set: Obj[] = [], gone: string[] = [];
  for (const o of after.objects.values()) {
    if (!o.on) continue;
    const was = before.objects.get(o.id), pb = before.objects.get(o.on), pa = after.objects.get(o.on);
    if (!was || was.on !== o.on || !pb) continue;
    if (!pa) {
      gone.push(o.id);
      continue;
    }
    if (pa.x === pb.x && pa.z === pb.z && pa.f === pb.f) continue;
    const slot = slotAt(before, pb, was.x, was.z);
    if (!slot) continue;
    const [x, z] = tileOfSlot(after, pa, ...slot);
    const f = ((((was.f + pa.f - pb.f) % 4) + 4) % 4) as Facing;
    if (x !== o.x || z !== o.z || f !== o.f) set.push({ ...o, x, z, f });
  }
  return set.length || gone.length ? withChanges(after, { set, remove: gone }) : after;
}
