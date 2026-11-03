// The tent's catalogue (docs/design.md "The tent"): NH's furniture, rugs, wallpapers and floors converted by
// scripts/room-models.ts (items.json: each item's footprint in tiles, its height, its size on the wire; the files under
// static/room/). Item codes are NH's internal ids with a kind letter: `f…` furniture or a rug, `w…` a wallpaper, `g…`
// a floor. Pure, no three.js: the room's chunk and the picker read it.
import { asset } from '$app/paths';
import data from './items.json';

export interface ItemMeta {
  /** Footprint in tiles in its own facing: w across, d deep. */
  w: number;
  d: number;
  /** Height in model units (a tile is 10). */
  h: number;
  /** The model's size (KB). */
  kb: number;
  /** Its content hash (the URL's version). */
  v: string;
  /** The ずかん's id: a balloon can bring it (カタログ). */
  cat?: string;
  /** In the starter set (always in the picker). */
  starter?: 1;
  /** A rug: a layer of its own, under the furniture. */
  rug?: 1;
  /** It has an emissive map: lit at dusk and night. */
  lit?: 1;
  /** Its icon is NH's own (static/room/icons), not the ずかん's. */
  icon?: 1;
  /** NH's surface (the ACNH spreadsheet's `surface`): small things stand on its top. */
  s?: 1;
  /** Its top, from its model (scripts/room-surfaces.ts): how high (model units), the rectangle it covers (its own
   *  frame, its middle at 0: x0, z0, x1, z1) and the tiles of its own footprint that hold a thing ([sx, sz]). */
  sy?: number;
  st?: [number, number, number, number];
  sl?: [number, number][];
  /** Small (NH's miscellaneous, any size that fits): may stand on a surface. */
  sm?: 1;
  /** NH's interaction: sat on (s: a chair, a sofa, a stool) or lain on (l: a bed), by n at once. */
  u?: 's' | 'l';
  n?: number;
  /** A light: a lamp, the lantern, the fireplace (a switch). */
  lt?: 1;
  /** On a wall (NH's wall-mounted things): w tiles across it, h high, its middle at its origin, out of the wall from its
   *  back. */
  wl?: 1;
}

export const ITEMS: Readonly<Record<string, ItemMeta>> = data.items as unknown as Record<string, ItemMeta>;
export const WALLS: readonly string[] = data.walls;
export const FLOORS: readonly string[] = data.floors;
/** The tent's own look: the first wallpaper and floor. */
export const DEFAULT_WALL: string = data.wall;
export const DEFAULT_FLOOR: string = data.floor;

/** The starter set, in the script's order: furniture first, then the rugs. */
export const STARTER: readonly string[] = Object.keys(ITEMS).filter((c) => ITEMS[c].starter);

const BY_CAT = new Map(Object.entries(ITEMS).flatMap(([c, m]) => (m.cat ? [[m.cat, c] as const] : [])));
/** A ずかん catalogue id → the tent's code, when NH has a model of it. */
export const codeOfFind = (cat: string): string | null => BY_CAT.get(cat) ?? null;

/** An item's footprint (tiles: across, deep) turned to facing `f` (a quarter turn each). */
export function footprint(code: string, f: number): [number, number] {
  const m = ITEMS[code];
  if (!m) return [1, 1];
  return f % 2 ? [m.d, m.w] : [m.w, m.d];
}

export const modelUrl = (code: string): string => `${asset(`room/models/${code}.glb` as Parameters<typeof asset>[0])}?v=${ITEMS[code]?.v ?? ''}`;
export const wallUrl = (code: string): string => asset(`room/wall/${code}.webp` as Parameters<typeof asset>[0]);
export const floorUrl = (code: string): string => asset(`room/floor/${code}.webp` as Parameters<typeof asset>[0]);
/** An item's or a surface's icon: NH's own, or the ずかん's (the same NH icon, already on the phone). */
export function iconUrl(code: string): string {
  const m = ITEMS[code];
  const path = m && !m.icon && m.cat ? `art/finds/items/${m.cat}.webp` : `room/icons/${code}.webp`;
  return asset(path as Parameters<typeof asset>[0]);
}
