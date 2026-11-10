// The tent's catalogue (docs/design.md "The tent"): NH's furniture, rugs, wallpapers and floors converted by
// scripts/room-models.ts (items.json: each item's footprint in tiles, its height, its size on the wire; the files under
// static/room/). Item codes are NH's internal ids with a kind letter: `f…` furniture or a rug, `w…` a wallpaper, `g…`
// a floor. items.json holds the starter set and the ずかん's pieces (loose files: models/, wall/, floor/, icons/);
// more.json the rest of NH's catalogue (2026-11-10), packed (scripts/room-packs.ts: static/room/pack/, each file's
// place [pack, offset, bytes]; docs/world3d-assets.md "Room packs"). No three.js: the room's chunk and the picker read it.
import data from './items.json';
import more from './more.json';
import { staticUrl } from '#lib/staticUrl.ts';
import type { PackRef } from '#lib/packStore.ts';
import { roomPacks } from './roomPacks.ts';

export interface ItemMeta {
  /** Footprint in tiles in its own facing: w across, d deep. */
  w: number;
  d: number;
  /** Height in model units (a tile is 10). */
  h: number;
  /** The model's size (KB) and its content hash (the URL's version): a loose one's (a packed one's are its pack's). */
  kb?: number;
  v?: string;
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
  /** A light's emitter, where its point light stands (model units, its own frame; scripts/room-models.ts emitters):
   *  NH's light locator (el), else the middle of its emissive map's lit texels. */
  e?: [number, number, number];
  el?: 1;
  /** On a wall (NH's wall-mounted things): w tiles across it, h high, its middle at its origin, out of the wall from its
   *  back. */
  wl?: 1;
  /** Hung from the ceiling (NH's ceiling decor): its model's origin at the top, hanging down h; a layer of its own. */
  cl?: 1;
  /** A gyroid (NH's はにわ): a tap sets it bobbing a while. */
  gy?: 1;
  /** A critter's tank (NH's fish, bug or sea creature put down indoors): the ずかん find, `kind:id`, that brings it. */
  cr?: string;
  /** Packed: its pack's group and its model's place in it. */
  g?: string;
  pk?: PackRef;
}

export const ITEMS: Readonly<Record<string, ItemMeta>> = { ...data.items, ...more.items } as unknown as Record<string, ItemMeta>;
export const WALLS: readonly string[] = [...data.walls, ...more.walls];
export const FLOORS: readonly string[] = [...data.floors, ...more.floors];
/** The packed wallpapers' and floors' textures (a glow's as `<code>.e`) and the packed icons. */
const TEX = more.tex as unknown as Record<string, PackRef>;
const ICONS = more.icons as unknown as Record<string, PackRef>;
/** The tent's own look: the first wallpaper and floor. */
export const DEFAULT_WALL: string = data.wall;
export const DEFAULT_FLOOR: string = data.floor;

/** The starter set, in the script's order: furniture first, then the rugs. */
export const STARTER: readonly string[] = Object.keys(ITEMS).filter((c) => ITEMS[c].starter);

/** Every rug (NH's 209: free in もようがえ's ラグ, as the wallpapers and floors), the starter set's first. */
export const RUGS: readonly string[] = [...STARTER.filter((c) => ITEMS[c].rug), ...Object.keys(ITEMS).filter((c) => ITEMS[c].rug && !ITEMS[c].starter)];
const BY_CRITTER = new Map(Object.entries(ITEMS).flatMap(([c, m]) => (m.cr ? [[m.cr, c] as const] : [])));
/** A ずかん catch (`kind:id`: fish, bug, sea) → its tank's code, NH's critter put down indoors. */
export const codeOfCatch = (key: string): string | null => BY_CRITTER.get(key) ?? null;

const BY_CAT = new Map(Object.entries(ITEMS).flatMap(([c, m]) => (m.cat ? [[m.cat, c] as const] : [])));
/** A ずかん catalogue id → the tent's code, when NH has a model of it. */
export const codeOfFind = (cat: string): string | null => BY_CAT.get(cat) ?? null;
/** NH's fitness furniture the rooms have (the island's ジム, layout/catalog.ts group 'gym', by its ずかん id): the
 *  もようがえ's ジム tab gathers the ones found or bought (the rooms' pieces stay the shop's and the balloons': NH's
 *  barbell and kettlebell are crafted, in neither). */
const GYM_CATS = ['pull-up-bar-stand', 'weight-bench', 'exercise-bike', 'treadmill', 'punching-bag', 'exercise-ball', 'protein-shaker-bottle', 'water-cooler', 'digital-scale', 'climbing-wall', 'upright-locker'];
export const GYM: ReadonlySet<string> = new Set(GYM_CATS.flatMap((c) => BY_CAT.get(c) ?? []));

/** An item's footprint (tiles: across, deep) turned to facing `f` (a quarter turn each). */
export function footprint(code: string, f: number): [number, number] {
  const m = ITEMS[code];
  if (!m) return [1, 1];
  return f % 2 ? [m.d, m.w] : [m.w, m.d];
}

/** A loose piece's model (items.json's: a packed one's bytes are `modelBytes`). */
export const modelUrl = (code: string): string => `${staticUrl(`room/models/${code}.glb`)}?v=${ITEMS[code]?.v ?? ''}`;

/** A packed piece's model, cut from its pack (null: not packed, or the pack can't be had). */
export const modelBytes = (code: string): Promise<ArrayBuffer | null> => (ITEMS[code]?.pk ? roomPacks.bytes(ITEMS[code].pk!) : Promise.resolve(null));
/** Object URLs of packed pictures, made once (a few KB each: kept for the page's life). */
const blobs = new Map<string, Promise<string | null>>();
function blobUrl(ref: PackRef): Promise<string | null> {
  const k = ref.join(':');
  let p = blobs.get(k);
  if (!p) {
    p = roomPacks.bytes(ref).then((b) => (b ? URL.createObjectURL(new Blob([b], { type: 'image/webp' })) : null));
    blobs.set(k, p);
    void p.then((u) => u || blobs.delete(k));
  }
  return p;
}
/** A wallpaper's or a floor's picture (2 tiles wide and the wall's height; a floor 4 × 4 tiles), and its glow (lit in
 *  the dark: NH's emissive wallpapers and floors), null for none. */
export function texUrl(kind: 'wall' | 'floor', code: string): Promise<string | null> {
  return TEX[code] ? blobUrl(TEX[code]) : Promise.resolve(staticUrl(`room/${kind}/${code}.webp`));
}
export const glowUrl = (code: string): Promise<string | null> => (TEX[`${code}.e`] ? blobUrl(TEX[`${code}.e`]) : Promise.resolve(null));
/** Whether an icon is packed (its picture is `iconSrc`'s, not a URL of its own). */
export const iconPacked = (code: string): boolean => !!ICONS[code];
/** An item's or a surface's icon: NH's own, or the ずかん's (the same NH icon, already on the phone); a packed one's
 *  file isn't loose: `iconSrc`. */
export function iconUrl(code: string): string {
  const m = ITEMS[code];
  const path = m && !m.icon && m.cat ? `art/finds/items/${m.cat}.webp` : `room/icons/${code}.webp`;
  return staticUrl(path);
}
/** Any icon's picture: its URL, or a packed one's object URL. */
export const iconSrc = (code: string): Promise<string | null> => (ICONS[code] ? blobUrl(ICONS[code]) : Promise.resolve(iconUrl(code)));
