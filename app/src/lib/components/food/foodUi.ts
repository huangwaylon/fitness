// ごはん's small helpers (docs/design.md "Gohan"): the catalog loaded once a session, an entry's amount in words, the
// food an entry was logged from (its catalog item when the catalog has it, for its portions), and the 最近 list.
import { isKcalGoal, type FoodEntry, type FoodSnap } from '#lib/contract/food.ts';
import { loadFoodDb, portionsOf, type FoodDb, type Item, type Portion } from '#lib/food/index.ts';

let dbP: Promise<FoodDb> | null = null;
/** The food catalog, fetched on the first search of the session (a failure lets the next one try again). */
export function foodDb(): Promise<FoodDb> {
  return (dbP ??= loadFoodDb().catch((e: unknown) => {
    dbP = null;
    throw e;
  }));
}

/** Grams as typed: one decimal at most, no trailing `.0`. */
export const gramsText = (g: number): string => String(Math.round(g * 10) / 10);

/** An entry's amount: the portion it was picked by and its grams (「茶碗1杯（150g）」), or the grams alone. */
export const amountText = (e: Pick<FoodEntry, 'g' | 'f'>): string => (e.f.u ? `${e.f.u}（${gramsText(e.g)}g）` : `${gramsText(e.g)}g`);

/** A logged snapshot as a catalog item: the catalog's own when it has it (its portions), else the snapshot's values. */
export function itemOf(f: FoodSnap, db: FoodDb | null): Item {
  const it = db?.entries.find((e) => e.it.id === f.id)?.it;
  return { ...(it ?? {}), id: f.id, name: f.n, kcal: f.k, p: f.p, f: f.fa, c: f.c, salt: f.s };
}

/** My latest entry of each food, newest first: what the search shows before anything is typed. */
export function recentOf(mine: readonly FoodEntry[], limit = 20): FoodEntry[] {
  const seen = new Set<string>();
  const out: FoodEntry[] = [];
  for (const e of mine) {
    if (seen.has(e.f.id)) continue;
    seen.add(e.f.id);
    out.push(e);
    if (out.length >= limit) break;
  }
  return out;
}

/** The portion and ×multiplier (a multiple of 0.5, up to ×20) that make `g`, ×1 first; null when none does. */
export function matchPortion(ps: readonly Portion[], g: number): { pi: number; mult: number } | null {
  let best: { pi: number; mult: number } | null = null;
  ps.forEach((p, pi) => {
    const m2 = (g / p.g) * 2;
    if (Math.abs(m2 - Math.round(m2)) > 1e-6 || m2 < 1 || m2 > 40) return;
    const mult = Math.round(m2) / 2;
    if (!best || (mult === 1 && best.mult !== 1)) best = { pi, mult };
  });
  return best;
}

/** The label an entry keeps for a picked portion (「茶碗1杯」, 「茶碗1杯×2」); none for 100 g or typed grams. */
export function portionLabel(p: Portion | null, mult: number): string | null {
  if (!p || /^100\s*(g|ml)$/i.test(p.label.normalize('NFKC'))) return null;
  return mult === 1 ? p.label : `${p.label}×${mult}`;
}

/** An item's default portion and its kcal (search rows: 「茶碗1杯 234 kcal」). */
export function defaultPortion(it: Item): { label: string; kcal: number } {
  const p = portionsOf(it)[0];
  return { label: p.label, kcal: Math.round((it.kcal * p.g) / 100) };
}

/** What was typed as a daily kcal goal → kcal, or null: `1800`, `2,000`, full-width `１８００`, a trailing `kcal`;
 *  KCAL_GOAL's range in whole steps only. */
export function parseKcalGoal(text: string): number | null {
  const s = text.trim().replace(/[０-９，]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0)).replace(/\s*kcal$/i, '').replace(/,/g, '');
  if (!/^\d{1,4}$/.test(s)) return null;
  const n = Number(s);
  return isKcalGoal(n) ? n : null;
}
