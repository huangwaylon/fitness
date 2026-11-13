// ごはん's food catalog, held for the session (docs/design.md "Gohan"): loaded once when the search or an amount first
// needs it (or at idle once a day is up), the members' chain menus (Kalori) with it, and the pictures' index; let go
// with the sheet.
import { quiet } from '#lib/quiet.ts';
import { loadFoodDb, type FoodDb, type KaloriSource } from '#lib/food/index.ts';
import { dropFoodImages, loadFoodImages, type FoodImageIndex } from '#lib/food/images.ts';
import { nextChance } from '#lib/ui-state/retry.ts';
import { getKey } from '#lib/sync/storage.ts';
import { relayUrl } from '#lib/sync/transport.ts';
import { week } from '#lib/store/week.svelte.ts';

/** The members' chain menus (Kalori): the relay's `/food/kalori` with this phone's key; none in the
 *  demo, for the guest, unpaired or with no relay. */
function kaloriSource(): KaloriSource | null {
  const key = getKey(), href = relayUrl('/food/kalori');
  return week.demo || week.guest || !key || !href ? null : { href, key };
}

let dbP: Promise<FoodDb> | null = null;
let ready: FoodDb | null = null;
const waiting = new Set<(db: FoodDb) => void>();
/** The food catalog, fetched when the search or an amount first needs it, or at idle once a day is up (foodDbSoon); a
 *  failure lets the next call try again. */
export function foodDb(): Promise<FoodDb> {
  const p: Promise<FoodDb> = (dbP ??= loadFoodDb(nextChance, kaloriSource).then(
    (db) => {
      if (dbP === p) ready = db;
      for (const f of waiting) f(db);
      waiting.clear();
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
/** ごはん mounted (Food.svelte's $effect): the catalog (~15 MB of JS heap with the products) and the pictures' index
 *  kept while it is, let go with it (its sheet closed and let go: keptSheets, a hidden page among them); the next
 *  opening reads them again from the service worker's cache, at idle (foodDbSoon). */
export function holdFoodDb(): () => void {
  holders++;
  return () => {
    if (--holders) return;
    dbP = ready = null;
    dropFoodImages();
  };
}
/** The catalog into `set` once it is in, whoever loads it (never loading it itself); a component's $effect. */
export function whenFoodDb(set: (db: FoodDb) => void): () => void {
  if (ready) {
    set(ready);
    return () => {};
  }
  waiting.add(set);
  return () => void waiting.delete(set);
}
/** After the sheet's open (its 90 ms wait and 280 ms zoom) and once the page is idle (Safari: no requestIdleCallback),
 *  the catalog, never on the open's path: the rows' tiles and 最新の値にする come with it, and it is the search's. */
const OPEN_MS = 600;
export function foodDbSoon(): () => void {
  if (ready || dbP) return () => {};
  let idle = 0;
  const go = () => void quiet(foodDb(), 'food.db');
  const wait = setTimeout(() => (typeof requestIdleCallback === 'function' ? (idle = requestIdleCallback(go, { timeout: 2000 })) : go()), OPEN_MS);
  return () => {
    clearTimeout(wait);
    if (idle) cancelIdleCallback(idle);
  };
}
/** The pictures' index into `set` once it is in (none: every food keeps its tile); a component's $effect. */
export function withImages(set: (ix: FoodImageIndex) => void): () => void {
  let live = true;
  void loadFoodImages().then((ix) => live && ix && set(ix));
  return () => void (live = false);
}
/** The catalog if it is in already (else null: open from the snapshot, swap the catalog's portions in later). */
export const foodDbNow = (): FoodDb | null => ready;
