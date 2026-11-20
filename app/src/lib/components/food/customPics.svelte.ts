// マイ食品's own pictures (docs/food-data.md "Pictures": `food_custom` `img`, the relay's /img/<id>): the live custom
// foods' (Food.svelte setCustomPics, as they fold), so imgOf (images.ts) finds a custom food's picture as it finds a
// sheet's cell (the whole 384 px file; cells.ts draws it), for every row, the amount, FoodPhoto and a recipe's plate. A
// deleted food or picture is gone from here, so its rows fall back to the tile. The photo cache (service worker:
// OWN_PHOTO_CACHE) is pruned to what a live food names; a picture still waiting to upload (photoUpload.ts) is kept apart.
import { relayUrl } from '#lib/sync/transport.ts';
import { OWN_PHOTO_CACHE } from '../../../service-worker/caches.ts';
import { ownPics, type FoodImg } from '#lib/food/images.ts';

/** The pictures' size (the relay takes only this: relay/src/img.ts). */
export const OWN_PX = 384;
/** A custom food's picture as the record names it (CustomOp `img`, `ig`). */
type Pic = { img: string; ig: boolean };
let pics = $state.raw(new Map<string, Pic>());

/** A picture's URL (the relay's), '' in a build with no relay. */
const ownPicUrl = (img: string): string => relayUrl(`/img/${img}`);

/** The live custom foods (all of them, once the record is in): their pictures, by food id `custom:<id>`. */
export function setCustomPics(cs: readonly { id: string; img?: string; ig?: true }[]): void {
  const next = new Map<string, Pic>();
  for (const c of cs) if (c.img) next.set(`custom:${c.id}`, { img: c.img, ig: c.ig === true });
  if (next.size === pics.size && [...next].every(([k, v]) => pics.get(k)?.img === v.img && pics.get(k)?.ig === v.ig)) return;
  pics = next;
  prune();
}

/** A custom food's picture as a cell (the whole file), or null. */
function customPic(id: string): FoodImg | null {
  const p = pics.get(id);
  const url = p ? ownPicUrl(p.img) : '';
  return url ? { url, x: 0, y: 0, size: OWN_PX } : null;
}

ownPics(customPic);

/** Whether a food's picture is its owner's photo (no イメージ badge, no 「生成」 line); an illustration (`ig`) is not. */
export const isOwnPhoto = (id: string): boolean => pics.get(id)?.ig === false;

let pruning: ReturnType<typeof setTimeout> | undefined;
/** The cached pictures no live custom food names, deleted a moment after the foods change (none while none has one:
 *  the record not in yet). */
function prune(): void {
  if (!pics.size || typeof caches === 'undefined') return;
  clearTimeout(pruning);
  pruning = setTimeout(async () => {
    const named = new Set([...pics.values()].map((p) => ownPicUrl(p.img)));
    try {
      const c = await caches.open(OWN_PHOTO_CACHE);
      for (const k of await c.keys()) if (/\/img\/[0-9a-f]{32}$/.test(k.url) && !named.has(k.url)) await c.delete(k);
    } catch {
      /* (a private window's caches: nothing kept to prune) */
    }
  }, 2000);
}
