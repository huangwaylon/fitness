// ごはん's food catalog, held for the session (docs/design.md "Gohan"): loaded once when the search or an amount first
// needs it (or at idle once a day is up), and the pictures' index; let go
// with the sheet. What the components render from is `held` (runes): never a copy of their own, so a let-go catalog
// is let go everywhere at once.
import { quiet } from '#lib/quiet.ts';
import { loadFoodDb, NewerFoodData, type FoodDb } from '#lib/food/index.ts';
import { dropFoodImages, imgKnown, imgOf, loadFoodImages, loadProductImages, type FoodImageIndex } from '#lib/food/images.ts';
import { warmCell } from '#lib/food/cells.ts';
import { nextChance } from '#lib/ui-state/retry.ts';
import { log } from '#lib/sync/log.ts';

/** The log's perf.food: each load's ms to searchable (lib/food/load.ts `timed`), by what it loaded. */
const SETS = new Set(['core', 'off', 'kalori', 'jan']);
const timed = (set: string, ms: number): void => log('perf.food', { set: SETS.has(set) ? set : 'other', ms: Math.round(ms) });

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
  const p: Promise<FoodDb> = (dbP ??= loadFoodDb(nextChance, timed).then(
    (db) => {
      if (dbP === p) held.db = db;
      return db;
    },
    (e: unknown) => {
      if (dbP === p) dbP = null;
      // (data newer than this build: Kit asked for the deployed one now, taken at the next safe moment: ui-state/update.ts)
      if (e instanceof NewerFoodData) void import('$app/state').then(({ updated }) => updated.check()).catch(() => {});
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
  // (its loads still in flight dropped: the chain menus' parse would otherwise hold its items till it ended)
  if (held.db) held.db.close();
  else void dbP?.then((db) => db.close(), () => {});
  dbP = null;
  held.db = held.images = null;
  imagesP = offP = null;
  soonOff?.();
  soonOff = null;
  soonIds = new Set();
  dropFoodImages();
}
/** After the sheet's open (its 90 ms wait and 280 ms zoom) and once the page is idle (Safari: no requestIdleCallback):
 *  what is never on the open's path. */
const OPEN_MS = 600;
function afterOpen(go: () => void): () => void {
  let idle = 0;
  const wait = setTimeout(() => (typeof requestIdleCallback === 'function' ? (idle = requestIdleCallback(go, { timeout: 2000 })) : go()), OPEN_MS);
  return () => {
    clearTimeout(wait);
    if (idle) cancelIdleCallback(idle);
  };
}
/** The catalog after the open: the rows' tiles and 最新の値にする come with it, and it is the search's. */
export function foodDbSoon(): () => void {
  if (held.db || dbP) return () => {};
  return afterOpen(() => void quiet(foodDb(), 'food.db'));
}
let imagesP: Promise<unknown> | null = null;
let offP: Promise<unknown> | null = null;
/** The ids asked for while the index waits for after the open (every one's picture known already), and that wait. */
let soonIds = new Set<string>();
let soonOff: (() => void) | null = null;
/** The pictures' index asked for, into `held.images` once in (none: every food keeps its tile); a component's $effect.
 *  With a product among `ids` (the rows it draws), the products' part too (images.ts loadProductImages). Like the
 *  catalog, one let go mid-load never lands. When every one of `ids` has its picture known already (images.ts imgKnown:
 *  seen before, primeFoodPics), the boxes draw from that and the index (~770 KB of JSON with the products') waits till
 *  after the open, while ごはん is held. */
export function wantImages(ids?: Iterable<string>): void {
  const list = ids ? [...ids] : undefined;
  if (!imagesP && list?.length && list.every(imgKnown)) {
    for (const id of list) soonIds.add(id);
    soonOff ??= afterOpen(() => {
      const all = soonIds;
      soonOff = null;
      soonIds = new Set();
      if (holders) loadImages(all);
    });
    return;
  }
  loadImages(list);
}
function loadImages(ids?: Iterable<string>): void {
  const p = (imagesP ??= loadFoodImages().then((ix) => void (imagesP === p && ix && (held.images = ix)), () => void (imagesP === p && (imagesP = null))));
  if (offP || !ids || ![...ids].some((id) => id.startsWith('off:'))) return;
  const q: Promise<unknown> = (offP = p.then(() => held.images && loadProductImages(held.images)).then(
    (ix) => void (offP === q && ix && imagesP === p && (held.images = ix)),
    () => void (offP === q && (offP = null))
  ));
}

/** Pictures the box sizes the day draws at (FoodMeal's 40 px, a thumbnail cell). */
const ROW_PX = 40;
/** ごはん's next opening made ready ahead, at a quiet moment (prime.ts, after the launch and each return to the app):
 *  the pictures of `ids` (the day's foods) looked up once in the index (then let go of unless ごはん holds it: images.ts
 *  keeps the cells seen) and their sheets' bytes fetched (cells.ts warmCell), so the opening draws them with no fetch. */
export async function primeFoodPics(ids: readonly string[]): Promise<void> {
  const want = ids.filter((id) => !imgKnown(id));
  if (want.length) {
    const ix = await loadFoodImages();
    if (!ix) return;
    const all = want.some((id) => id.startsWith('off:')) ? await loadProductImages(ix).catch(() => ix) : ix;
    for (const id of want) imgOf(all, id, ROW_PX);
    if (!imagesP) dropFoodImages();
  }
  await Promise.all(ids.map((id) => imgOf(null, id, ROW_PX)?.url).filter((u): u is string => !!u).map(warmCell));
}
