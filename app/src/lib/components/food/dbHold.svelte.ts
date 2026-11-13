// ごはん's food catalog, held for the session (docs/design.md "Gohan"): loaded once when the search or an amount first
// needs it (or at idle once a day is up), and the pictures' index; let go
// with the sheet. What the components render from is `held` (runes): never a copy of their own, so a let-go catalog
// is let go everywhere at once.
import { quiet } from '#lib/quiet.ts';
import { loadFoodDb, type FoodDb } from '#lib/food/index.ts';
import { dropFoodImages, loadFoodImages, type FoodImageIndex } from '#lib/food/images.ts';
import { nextChance } from '#lib/ui-state/retry.ts';

/** The catalog and the pictures' index while held (null: not in yet, or let go): what ごはん's components read. A load
 *  let go before it came in never lands here (the next one does: one catalog at a time). */
export const held = new (class {
  db = $state.raw<FoodDb | null>(null);
  images = $state.raw<FoodImageIndex | null>(null);
})();

let dbP: Promise<FoodDb> | null = null;
/** The food catalog, fetched when the search or an amount first needs it, or at idle once a day is up (foodDbSoon); a
 *  failure lets the next call try again. */
export function foodDb(): Promise<FoodDb> {
  const p: Promise<FoodDb> = (dbP ??= loadFoodDb(nextChance).then(
    (db) => {
      if (dbP === p) held.db = db;
      return db;
    },
    (e: unknown) => {
      if (dbP === p) dbP = null;
      throw e;
    }
  ));
  return p;
}
let holders = 0;
let dropT: ReturnType<typeof setTimeout> | undefined;
/** How long the catalog outlives ごはん's close: a quick reopen stays instant. */
export const FOOD_KEEP_MS = 5 * 60_000;
/** ごはん open (Food.svelte's $effect): the catalog (~18 MB of JS heap with the products, ~35 MB more with the chain
 *  menus' 54k items: measured in V8, 2026-11-13) and the pictures' index kept while it is, and FOOD_KEEP_MS after its close (a reopen cancels that);
 *  the next opening reads them again from the service worker's cache, at idle (foodDbSoon). */
export function holdFoodDb(): () => void {
  holders++;
  clearTimeout(dropT);
  return () => {
    if (!--holders) dropT = setTimeout(dropFoodDb, FOOD_KEEP_MS);
  };
}
/** ごはん unmounted (keptSheets let it go, a hidden page among them): the catalog let go at once if nobody holds it
 *  (after this teardown's other cleanups, the hold's among them). */
export const letGoFoodDb = (): void => queueMicrotask(() => void (holders || dropFoodDb()));
function dropFoodDb() {
  clearTimeout(dropT);
  dbP = null;
  held.db = held.images = null;
  imagesP = null;
  dropFoodImages();
}
/** After the sheet's open (its 90 ms wait and 280 ms zoom) and once the page is idle (Safari: no requestIdleCallback),
 *  the catalog, never on the open's path: the rows' tiles and 最新の値にする come with it, and it is the search's. */
const OPEN_MS = 600;
export function foodDbSoon(): () => void {
  if (held.db || dbP) return () => {};
  let idle = 0;
  const go = () => void quiet(foodDb(), 'food.db');
  const wait = setTimeout(() => (typeof requestIdleCallback === 'function' ? (idle = requestIdleCallback(go, { timeout: 2000 })) : go()), OPEN_MS);
  return () => {
    clearTimeout(wait);
    if (idle) cancelIdleCallback(idle);
  };
}
let imagesP: Promise<unknown> | null = null;
/** The pictures' index asked for, into `held.images` once in (none: every food keeps its tile); a component's $effect.
 *  Like the catalog, one let go mid-load never lands. */
export function wantImages(): void {
  const p = (imagesP ??= loadFoodImages().then((ix) => void (imagesP === p && ix && (held.images = ix)), () => void (imagesP === p && (imagesP = null))));
}
