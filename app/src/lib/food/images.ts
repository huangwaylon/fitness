// ごはん's pictures (docs/food-data.md "Pictures"): AI-generated イメージ of generic foods and dishes (a product: its
// subcategory's, by the word its name ends with; never a package), packed into sprite sheets in static/food-img/ by
// food-data/images/fi.py pack. index.json maps a food id to its picture's two cells:
// a 128 px one in a thumbnail sheet (rows and lists, 40-64 px) and a 384 px one in a detail sheet (the amount's
// picture). Sheet names carry their content hash, so a URL never changes (cached on first use, service worker).
// A custom food's is its own (its owner's photo, or an illustration: components/food/customPics.svelte.ts, set by ownPics), the whole 384 px file as a
// cell. A food without one (a product no word names) gets none: FoodThumb shows its category's tile.
// A chain menu's (Kalori) is Kalori's own generated picture, hotlinked (kaloriImg).
import { quiet } from '#lib/quiet.ts';
import { staticUrl } from '#lib/staticUrl.ts';
import type { Item } from './types.ts';

/** A cell of a sheet: FoodThumb's `img` (its url, the cell's x / y and size in the sheet's pixels). */
export interface FoodImg {
  url: string;
  x: number;
  y: number;
  size: number;
}

/** static/food-img/index.json. */
export interface FoodImageIndex {
  v: 1;
  /** The cells' sizes: thumbnails, details. */
  t: number;
  d: number;
  sheets: string[];
  /** Per picture: its thumbnail's sheet, x, y, then its detail's. */
  keys: [number, number, number, number, number, number][];
  /** Food id → picture. */
  ids: Record<string, number>;
  /** The build's cut (scripts/food-shards.ts): the products' ids are in `off.json?v=<off>` (loadProductImages), not
   *  `ids`; none: `ids` holds them (the dev server). */
  off?: string;
  /** The products' ids, once loadProductImages has them. */
  offIds?: Record<string, number>;
}

/** Up to this displayed size, the thumbnail cell (≥ 2× of it); above, the detail cell. */
const THUMB_MAX = 64;

const fileUrl = (f: string): string => staticUrl(`food-img/${f}`);

let loading: Promise<FoodImageIndex | null> | null = null;

/** The index, fetched once (none, a missing or broken file: every food keeps its tile, and the next call tries again). */
export function loadFoodImages(): Promise<FoodImageIndex | null> {
  loading ??= quiet(fetch(fileUrl('index.json')).then((r) => (r.ok ? (r.json() as Promise<FoodImageIndex>) : null)), 'food.images', null)
    .then((ix) => {
      if (!ix) loading = null;
      return ix;
    });
  return loading;
}

/** The index with the products' ids (off.json, ~90 KB brotli of the 147 KB the whole index was), fetched for a
 *  product's row (a day's, さいきん's, the search's); the index as it was without a cut, or when they won't load. */
export async function loadProductImages(ix: FoodImageIndex): Promise<FoodImageIndex> {
  if (!ix.off || ix.offIds) return ix;
  const res = await fetch(fileUrl(`off.json?v=${encodeURIComponent(ix.off)}`));
  if (!res.ok) throw new Error(`food-img/off.json: ${res.status}`);
  return { ...ix, offIds: ((await res.json()) as { ids: Record<string, number> }).ids };
}

/** The index let go of (~2 MB of JS heap: ごはん unmounted, components/food/dbHold.svelte.ts holdFoodDb); fetched again next. */
export const dropFoodImages = (): void => void (loading = null);

/** A custom food's own picture (components/food/customPics.svelte.ts: its live foods'), none till that registers. */
let ownOf: (id: string) => FoodImg | null = () => null;
export const ownPics = (f: (id: string) => FoodImg | null): void => void (ownOf = f);

/** A food's two cells (its thumbnail's, its detail's) as an index gave them, null: no picture. */
type Cells = { t: FoodImg | null; d: FoodImg | null } | null;
/** The cells looked up so far this page's life (at most CELLS_KEPT, the least recent out): a food's picture on the next
 *  opening, the index let go of meanwhile (dbHold.svelte.ts primeFoodPics, after the launch), at once and with no index. */
const seen = new Map<string, Cells>();
const CELLS_KEPT = 2_000;
/** Whether the index's answer for `id` is final: a product's waits for loadProductImages' ids (when cut from it). */
const settled = (ix: FoodImageIndex, id: string): boolean => !id.startsWith('off:') || !ix.off || !!ix.offIds;
const same = (a: FoodImg | null, b: FoodImg | null): boolean => a === b || (!!a && !!b && a.url === b.url && a.x === b.x && a.y === b.y && a.size === b.size);
function cellsOf(ix: FoodImageIndex, id: string): Cells {
  const k = ix.ids[id] ?? ix.offIds?.[id];
  const c = k === undefined ? undefined : ix.keys[k];
  if (!c) return null;
  const ts = ix.sheets[c[0]], ds = ix.sheets[c[3]];
  return { t: ts ? { url: fileUrl(ts), x: c[1], y: c[2], size: ix.t } : null, d: ds ? { url: fileUrl(ds), x: c[4], y: c[5], size: ix.d } : null };
}
/** `id`'s cells from the index (kept in `seen`; the very objects kept before when they are the same, so a box isn't
 *  drawn again as the index comes in), else as seen before (undefined: never seen). */
function lookup(ix: FoodImageIndex | null | undefined, id: string): Cells | undefined {
  const was = seen.get(id);
  if (!ix || !settled(ix, id)) return was;
  const now = cellsOf(ix, id);
  const out = was && now && same(was.t, now.t) && same(was.d, now.d) ? was : now;
  if (was !== undefined) seen.delete(id); // (to the end: the most recent)
  seen.set(id, out);
  if (seen.size > CELLS_KEPT) seen.delete(seen.keys().next().value!);
  return out;
}
/** Whether `id`'s picture is known without the index (a custom food's never needs it). */
export const imgKnown = (id: string): boolean => id.startsWith('custom:') || seen.has(id);
/** The cells seen let go of (tests). */
export const forgetCells = (): void => seen.clear();

/** A food's picture for a box of `px` CSS px, or null (its tile): from the index, or (none in, or let go) as seen
 *  before. Every picture but a custom food's own photo
 *  (customPics isOwnPhoto) is generated: show the イメージ badge where the design asks for one (the enlarged view). */
export function imgOf(index: FoodImageIndex | null | undefined, id: string, px: number): FoodImg | null {
  if (id.startsWith('custom:')) return ownOf(id);
  const c = lookup(index, id);
  return c ? (px <= THUMB_MAX ? c.t : c.d) : null;
}

/** A chain menu's picture (Kalori's generated one, `img`) for a box of `px` CSS px: its 200 px file for a row, the
 *  400 px one above THUMB_MAX; null without one. Hotlinked as a plain <img> (FoodThumb `src`): assets.kalori.jp sends
 *  no CORS headers, so never through cells.ts. */
export function kaloriImg(it: Pick<Item, 'shop' | 'img'> | undefined, px: number): string | null {
  return it?.shop && it.img ? `https://assets.kalori.jp/products/${encodeURIComponent(it.shop)}/generated/g/${it.img}_${px <= THUMB_MAX ? 200 : 400}.webp` : null;
}
