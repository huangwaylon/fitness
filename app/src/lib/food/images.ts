// ごはん's pictures (docs/food-data.md "Pictures"): AI-generated イメージ of generic foods and dishes (a product: its
// subcategory's, by the word its name ends with; never a package), packed into sprite sheets in static/food-img/ by
// food-data/images/fi.py pack. index.json maps a food id to its picture's two cells:
// a 128 px one in a thumbnail sheet (rows and lists, 40-64 px) and a 384 px one in a detail sheet (the amount's
// picture). Sheet names carry their content hash, so a URL never changes (cached on first use, service worker).
// A food without one (custom foods, a product no word names) gets none: FoodThumb shows its category's tile.
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

/** The index let go of (~2 MB of JS heap: ごはん unmounted, components/food/dbHold.svelte.ts holdFoodDb); fetched again next. */
export const dropFoodImages = (): void => void (loading = null);

/** A food's picture for a box of `px` CSS px, or null (its tile). Every picture is generated: show the イメージ badge
 *  where the design asks for one (the enlarged view). */
export function imgOf(index: FoodImageIndex | null | undefined, id: string, px: number): FoodImg | null {
  const k = index?.ids[id];
  if (k === undefined || !index) return null;
  const c = index.keys[k];
  const [s, x, y] = px <= THUMB_MAX ? c.slice(0, 3) : c.slice(3, 6);
  const sheet = index.sheets[s];
  return sheet ? { url: fileUrl(sheet), x, y, size: px <= THUMB_MAX ? index.t : index.d } : null;
}

/** A chain menu's picture (Kalori's generated one, `img`) for a box of `px` CSS px: its 200 px file for a row, the
 *  400 px one above THUMB_MAX; null without one. Hotlinked as a plain <img> (FoodThumb `src`): assets.kalori.jp sends
 *  no CORS headers, so never through cells.ts. */
export function kaloriImg(it: Pick<Item, 'shop' | 'img'> | undefined, px: number): string | null {
  return it?.shop && it.img ? `https://assets.kalori.jp/products/${encodeURIComponent(it.shop)}/generated/g/${it.img}_${px <= THUMB_MAX ? 200 : 400}.webp` : null;
}
