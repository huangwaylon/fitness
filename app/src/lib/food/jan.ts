// The barcode shards (static/food/jan/, docs/food-data.md "Barcodes"): the Open Food Facts codes beyond products.json
// (no Japanese name or a value missing, so not searchable, yet a scan's answer), by their last 3 digits. Pure: which
// codes ship (scripts/food-data.ts) and where one is (load.ts janItem).
import type { Item } from './types.ts';

/** A shard's name: a code's last 3 digits (food-data's lib.py shard_key; unchanged by a UPC-A's zero padding). */
export const janShard = (code: string): string => code.slice(-3);

/** A code a shop prints for itself (GS1's in-store ranges: 02 and 20–29; an EAN-8's 2): never one product across shops. */
export const storeCode = (code: string): boolean => /^(02|2)/.test(code);

/** A name too weak to show as a scan's food: under 2 letters (digits and marks alone, a lone character). */
export const weakName = (name: string | undefined): boolean => ((name ?? '').match(/\p{L}/gu)?.length ?? 0) < 2;

/** The shard items that ship: not in products.json (`have`: its codes), no store code, no weak name. */
export const janShips = (it: Item, have: ReadonlySet<string>): boolean => !!it.jan && !have.has(it.jan) && !storeCode(it.jan) && !weakName(it.name);
