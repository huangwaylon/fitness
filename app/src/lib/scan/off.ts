// ごはん's barcode scan, the online fallback (docs/food-data.md "Barcodes"): a code our products don't hold, asked of
// Open Food Facts' API (its barcode only, nothing else), its answer as one of our items (types.ts Item: per 100 g, its
// serving a 1食分 portion) (ODbL, as products.json's header). Pure but for `offLookup`'s fetch.
import type { Item, Portion } from '#lib/food/types.ts';

/** The API's product page for a code, with only the fields mapped (`OFF_FIELDS`). CSP connect-src names this path. */
const OFF_API = 'https://world.openfoodfacts.org/api/v2/product/';
const OFF_FIELDS = 'product_name,product_name_ja,generic_name,brands,nutriments,serving_size,serving_quantity';
export const offUrl = (code: string): string => `${OFF_API}${code}.json?fields=${OFF_FIELDS}`;
/** The answer awaited at most (a slow network: the sheet says so, never hangs). */
const OFF_TIMEOUT_MS = 6000;

/** Per 100 g at most (contract/food.ts KCAL_MAX, NUTRIENT_MAX: what a meal's snapshot may hold). */
const KCAL_MAX = 950;
const NUTRIENT_MAX = 100;
/** Per serving at most (contract/food.ts CUSTOM, an `sv` snapshot's). */
const SERVING_KCAL_MAX = 5000;
const SERVING_NUTRIENT_MAX = 500;
/** A portion's grams at most (contract/food.ts FOOD_GRAMS.max). */
const GRAMS_MAX = 5000;

/** What OFF's v2 answer carries of a product (the fields asked for). */
export interface OffProduct {
  product_name?: string;
  product_name_ja?: string;
  generic_name?: string;
  brands?: string;
  serving_size?: string;
  serving_quantity?: number | string;
  nutriments?: Record<string, unknown>;
}

const num = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : typeof v === 'string' && v.trim() !== '' && Number.isFinite(Number(v)) ? Number(v) : null);
const r1 = (v: number): number => Math.round(v * 10) / 10;
/** A label's weight in grams (「30 g」, 「500ml」, 「1本 (500 ml)」: 100 ml counts as 100 g), or null. */
export function gramsOf(s: string | undefined): number | null {
  const m = /([\d.]+)\s*(g|ml|グラム|ミリリットル)\b/i.exec((s ?? '').normalize('NFKC'));
  const g = m ? Number(m[1]) : NaN;
  return Number.isFinite(g) && g > 0 && g <= GRAMS_MAX ? r1(g) : null;
}
/** A first, non-empty text of these. */
const firstText = (...xs: (string | undefined)[]): string | undefined => xs.map((x) => x?.trim()).find((x) => !!x);

/**
 * An OFF product as an item (id `off:<code>`, as a product of ours: a later products.json holding it matches it), `note`
 * its trust line; null when it has no name or no usable energy (the sheet: not found). Per 100 g when OFF has it (kcal
 * from kJ if only that, ÷ 4.184); else per serving: by its weight when known, else as a serving (`sv`, values per
 * serving, as a chain menu's). A nutrient out of a snapshot's range: unknown (null), never clamped. The name: its
 * Japanese one, else its own, else its generic one; the brand its first. Its serving's weight a 1食分 portion (none:
 * 100 g only; never the pack's, often several servings).
 */
export function offItem(code: string, p: OffProduct, note: string): Item | null {
  const n = p.nutriments ?? {};
  const get = (k: string, per: '100g' | 'serving'): number | null => num(n[`${k}_${per}`]);
  const kcalOf = (per: '100g' | 'serving'): number | null => {
    const k = get('energy-kcal', per);
    if (k !== null) return k;
    const kj = get('energy-kj', per) ?? get('energy', per);
    return kj === null ? null : kj / 4.184;
  };
  const name = firstText(p.product_name_ja, p.product_name, p.generic_name);
  if (!name) return null;
  const sq = num(p.serving_quantity);
  const serving = sq !== null && sq > 0 && sq <= GRAMS_MAX ? r1(sq) : gramsOf(p.serving_size);
  const per: '100g' | 'serving' | null = kcalOf('100g') !== null ? '100g' : kcalOf('serving') !== null ? 'serving' : null;
  if (!per) return null;
  // a serving's values with its weight known: per 100 g, as every other product
  const scale = per === 'serving' && serving ? 100 / serving : 1;
  const sv = per === 'serving' && !serving;
  const [kMax, nMax] = sv ? [SERVING_KCAL_MAX, SERVING_NUTRIENT_MAX] : [KCAL_MAX, NUTRIENT_MAX];
  const kcal = Math.round(kcalOf(per)! * scale);
  if (!(kcal >= 0 && kcal <= kMax)) return null;
  const val = (k: string): number | null => {
    const v = get(k, per);
    return v === null || v * scale < 0 || v * scale > nMax ? null : r1(v * scale);
  };
  const sodium = val('sodium');
  const salt = val('salt') ?? (sodium === null ? null : r1(Math.min(nMax, sodium * 2.54)));
  const fib = val('fiber');
  const brand = firstText(p.brands?.split(',')[0]);
  const portions: Portion[] = serving && !sv ? [{ label: '1食分', g: serving }] : [];
  return {
    id: `off:${code}`, name, ...(brand && brand !== name ? { brand } : {}),
    kcal, p: val('proteins'), f: val('fat'), c: val('carbohydrates'), salt, ...(fib !== null ? { fib } : {}),
    ...(portions.length ? { portions } : {}), ...(sv ? { sv: true as const } : {}), note
  };
}

/** What OFF said of a code: its item; `none` (not there, or nothing usable); `off` (unreached: offline, slow, an error). */
export type OffAnswer = { k: 'item'; item: Item } | { k: 'none' } | { k: 'off' };

/** A code asked of OFF (the barcode only: no cookies, no referrer, nothing else sent). */
export async function offLookup(code: string, note: string, f: typeof fetch = fetch): Promise<OffAnswer> {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), OFF_TIMEOUT_MS);
  try {
    const res = await f(offUrl(code), { signal: ac.signal, credentials: 'omit', referrerPolicy: 'no-referrer', cache: 'no-store' });
    if (res.status === 404) return { k: 'none' };
    if (!res.ok) return { k: 'off' };
    const body = (await res.json()) as { status?: number; product?: OffProduct };
    const item = body.status === 1 && body.product ? offItem(code, body.product, note) : null;
    return item ? { k: 'item', item } : { k: 'none' };
  } catch {
    return { k: 'off' };
  } finally {
    clearTimeout(timer);
  }
}
