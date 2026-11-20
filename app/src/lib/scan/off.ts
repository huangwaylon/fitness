// ごはん's barcode scan, the online fallback (docs/food-data.md "Barcodes"): a code our products don't hold, asked of
// Open Food Facts' API (its barcode only, nothing else), its answer as one of our items (types.ts Item: per 100 g, its
// serving a 1食分 portion) (ODbL, as products.json's header). Pure but for `offLookup`'s fetch.
import { FOOD_GRAMS, FOOD_NAME_CHARS, snapMax } from '#lib/contract/food.ts';
import { cleanLine } from '#lib/contract/text.ts';
import { plausible } from '#lib/food/plausible.ts';
import type { Item, Portion } from '#lib/food/types.ts';

/** The API's product page for a code, with only the fields mapped (`OFF_FIELDS`). CSP connect-src names this path. */
const OFF_API = 'https://world.openfoodfacts.org/api/v2/product/';
const OFF_FIELDS = 'product_name,product_name_ja,generic_name,brands,nutriments,serving_size,serving_quantity';
export const offUrl = (code: string): string => `${OFF_API}${code}.json?fields=${OFF_FIELDS}`;
/** The answer awaited at most (a slow network: the sheet says so, never hangs). */
const OFF_TIMEOUT_MS = 6000;

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
  return Number.isFinite(g) && g > 0 && g <= FOOD_GRAMS.max ? r1(g) : null;
}
/** The first of these non-empty once cleaned as the record cleans a food's name (contract/text.ts cleanLine: controls,
 *  zero-width and bidi characters gone, one line, FOOD_NAME_CHARS at most). */
const firstText = (...xs: unknown[]): string | undefined => xs.map((x) => cleanLine(x, FOOD_NAME_CHARS)).find((x) => !!x);

/** Whether OFF scaled some per-100 g fields by the serving and not others (off.py partial_scaling: salt / 2.5 sodium
 *  or kJ / 4.184 kcal at the serving factor ±4 %) while the energy is off 4P+9F+4C (> 12 % and ≥ 15 kcal): a mix of
 *  per serving and per 100 g (the Giant Cone's class), which the shipped data drops; so does the scan (not found). */
export function partialScaling(p: OffProduct, kcal: number, pr: number | null, f: number | null, c: number | null): boolean {
  const sq = num(p.serving_quantity);
  const k = sq !== null && sq >= 5 && sq <= 2000 && Math.abs(sq - 100) > 10 ? 100 / sq : null;
  if (!k || pr === null || f === null || c === null) return false;
  const est = 4 * pr + 9 * f + 4 * c;
  if (Math.abs(kcal - est) < 15 || Math.abs(kcal - est) <= 0.12 * Math.max(kcal, est)) return false;
  const n = p.nutriments ?? {};
  return ([['salt_100g', 'sodium_100g', 2.5], ['energy-kj_100g', 'energy-kcal_100g', 4.184]] as const).some(([a, b, unit]) => {
    const x = num(n[a]), y = num(n[b]);
    if (!x || !y || x < 0.02) return false;
    const q = x / y / unit;
    return Math.abs(q * k - 1) < 0.04 || Math.abs(q / k - 1) < 0.04;
  });
}

/**
 * An OFF product as an item (id `off:<code>`, as a product of ours: a later products.json holding it matches it), `note`
 * its trust line; null when it has no name (none left once cleaned: firstText), no usable energy, or its fields part
 * per serving (partialScaling) (the sheet: not found). Per 100 g when OFF has it (kcal
 * from kJ if only that, ÷ 4.184); else per serving: by its weight when known, else as a serving (`sv`, values per
 * serving, as a chain menu's). A nutrient out of a snapshot's range: unknown (null), never clamped. The name: its
 * Japanese one, else its own, else its generic one; the brand its first. Its serving's weight a 1食分 portion (none:
 * 100 g only; never the pack's, often several servings). Per 100 g, through the shipped data's rules (lib/food/plausible.ts:
 * kJ as kcal fixed, a salt copying a macro or energy far from 4P+9F+4C unknown, a serving of the kcal's grams gone; never
 * dropped).
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
  const serving = sq !== null && sq > 0 && sq <= FOOD_GRAMS.max ? r1(sq) : gramsOf(p.serving_size);
  const per: '100g' | 'serving' | null = kcalOf('100g') !== null ? '100g' : kcalOf('serving') !== null ? 'serving' : null;
  if (!per) return null;
  // a serving's values with its weight known: per 100 g, as every other product
  const scale = per === 'serving' && serving ? 100 / serving : 1;
  const sv = per === 'serving' && !serving;
  const [kMax, nMax] = snapMax(sv);
  const kcal = Math.round(kcalOf(per)! * scale);
  if (!(kcal >= 0 && kcal <= kMax)) return null;
  if (per === '100g' && partialScaling(p, kcalOf('100g')!, get('proteins', '100g'), get('fat', '100g'), get('carbohydrates', '100g'))) return null;
  const val = (k: string): number | null => {
    const v = get(k, per);
    return v === null || v * scale < 0 || v * scale > nMax ? null : r1(v * scale);
  };
  const sodium = val('sodium');
  const salt = val('salt') ?? (sodium === null ? null : r1(Math.min(nMax, sodium * 2.54)));
  const fib = val('fiber');
  const brand = firstText(p.brands?.split(',')[0]);
  const portions: Portion[] = serving && !sv ? [{ label: '1食分', g: serving }] : [];
  const item: Item = {
    id: `off:${code}`, name, ...(brand && brand !== name ? { brand } : {}),
    kcal, p: val('proteins'), f: val('fat'), c: val('carbohydrates'), salt, ...(fib !== null ? { fib } : {}),
    ...(portions.length ? { portions } : {}), ...(sv ? { sv: true as const } : {}), note
  };
  return sv ? item : (plausible(item).item ?? item);
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
