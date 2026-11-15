// ごはん's barcode scan, what a code is (docs/food-data.md "Barcodes"): our products first (products.json, its ids
// the codes: barcode.ts barcodeKeys), then the barcode shards (static/food/jan/: load.ts janItem), else Open Food Facts
// online (off.ts), else nothing. Each outcome is one usage counter (`act:scan.<outcome>`: found, found.jan, fallback,
// miss, offline), never the code or the food (docs/ops/observability.md).
import { itemById, janItem, type FoodDb, type Item } from '#lib/food/index.ts';
import { barcodeKeys, type Format } from '#lib/scan/barcode.ts';
import { offLookup, type OffAnswer } from '#lib/scan/off.ts';
import { count } from '#lib/sync/log.ts';

/** A code's food: ours (`ours`), Open Food Facts' (`off`), none anywhere (`miss`), or unknown, OFF unreached (`offline`). */
export type ScanHit = { k: 'ours' | 'off'; item: Item } | { k: 'miss' | 'offline' };

/** OFF's answers this session, by code: a code scanned again (or ‹ and back) is not asked twice. Only found ones. */
const asked = new Map<string, Item>();

/**
 * A code read or typed (`raw`, `format` the decoder's) as a food. `db` the catalog with the products in (the caller's
 * foodDb() + wantMore(['off'])); `note` an OFF item's trust line. Null for what isn't a code (its check digit
 * wrong: the sheet asks again), counted as nothing.
 */
export async function lookupCode(raw: string, db: FoodDb | null, note: string, format?: Format, ask: (code: string) => Promise<OffAnswer> = (c) => offLookup(c, note)): Promise<ScanHit | null> {
  const keys = barcodeKeys(raw, format);
  if (!keys.length) return null;
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
  return counted({ k: a.k === 'none' ? 'miss' : 'offline' });
}

const counted = (h: ScanHit, as?: string): ScanHit => (count(`act:scan.${as ?? (h.k === 'ours' ? 'found' : h.k === 'off' ? 'fallback' : h.k)}`), h);

/** Forget OFF's answers (tests). */
export const forgetAsked = (): void => asked.clear();
