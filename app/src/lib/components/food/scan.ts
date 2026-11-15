// ごはん's barcode scan, what a code is (docs/food-data.md "Barcodes"): our products first (products.json, its ids
// the codes: barcode.ts barcodeKeys; lazy, so waited for: PRODUCTS_WAIT_MS), then the barcode shards
// (static/food/jan/: load.ts janItem), else Open Food Facts online (off.ts), else nothing. Each outcome is one usage
// counter (`act:scan.<outcome>`: found, found.jan, fallback, miss, offline, late), never the code or the food
// (docs/ops/observability.md).
import { itemById, janItem, type FoodDb, type Item } from '#lib/food/index.ts';
import { barcodeKeys, type Format } from '#lib/scan/barcode.ts';
import { offLookup, type OffAnswer } from '#lib/scan/off.ts';
import { count } from '#lib/sync/log.ts';

/** A code's food: ours (`ours`), Open Food Facts' (`off`), none anywhere (`miss`), or unknown: OFF unreached
 *  (`offline`), or our products still loading past PRODUCTS_WAIT_MS and OFF without it or unreached (`late`). */
export type ScanHit = { k: 'ours' | 'off'; item: Item } | { k: 'miss' | 'offline' | 'late' };

/** How long a lookup waits for our products (lazy: products.json, ~0.8 MB gzipped, then indexed in slices) before it
 *  goes on without them; a wait past LOADING_MS calls `loading` (読み込み中; shorter: no flash). */
export const PRODUCTS_WAIT_MS = 20_000;
export const LOADING_MS = 300;

/** `db`'s products in (wantMore settles once they're indexed, or failed: a failed one is no wait), false past
 *  PRODUCTS_WAIT_MS. Never `db.sets`: a dataset is listed there before its items are indexed. */
async function productsIn(db: FoodDb, loading?: () => void): Promise<boolean> {
  let shown: ReturnType<typeof setTimeout> | undefined;
  let late: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      db.wantMore(['off']).then(() => true, () => true),
      new Promise<boolean>((ok) => {
        shown = setTimeout(() => loading?.(), LOADING_MS);
        late = setTimeout(() => ok(false), PRODUCTS_WAIT_MS);
      })
    ]);
  } finally {
    clearTimeout(shown);
    clearTimeout(late);
  }
}

/** OFF's answers this session, by code: a code scanned again (or ‹ and back) is not asked twice. Only found ones. */
const asked = new Map<string, Item>();

/**
 * A code read or typed (`raw`, `format` the decoder's) as a food. `db` the catalog (null: it can't load, offline), its
 * products waited for here; `note` an OFF item's trust line; `loading` a long wait for the products begun. Null for
 * what isn't a code (its check digit wrong: the sheet asks again), counted as nothing.
 */
export async function lookupCode(raw: string, db: FoodDb | null, note: string, format?: Format, ask: (code: string) => Promise<OffAnswer> = (c) => offLookup(c, note), loading?: () => void): Promise<ScanHit | null> {
  const keys = barcodeKeys(raw, format);
  if (!keys.length) return null;
  const inTime = !db || (await productsIn(db, loading));
  for (const k of keys) {
    const it = itemById(db, `off:${k}`);
    if (it) return counted({ k: 'ours', item: it });
  }
  // (a shard that won't load, offline: on to OFF, which says offline)
  for (const k of db ? keys : []) {
    const it = await janItem(db!, k).catch(() => null);
    if (it) return counted({ k: 'ours', item: it }, 'found.jan');
  }
  const code = keys[0];
  const had = asked.get(code);
  if (had) return counted({ k: 'off', item: had });
  const a = await ask(code);
  if (a.k === 'item') {
    asked.set(code, a.item);
    return counted({ k: 'off', item: a.item });
  }
  // (our products not in yet: OFF's none or silence says nothing of them)
  return counted({ k: !inTime ? 'late' : a.k === 'none' ? 'miss' : 'offline' });
}

const counted = (h: ScanHit, as?: string): ScanHit => (count(`act:scan.${as ?? (h.k === 'ours' ? 'found' : h.k === 'off' ? 'fallback' : h.k)}`), h);

/** Forget OFF's answers (tests). */
export const forgetAsked = (): void => asked.clear();
