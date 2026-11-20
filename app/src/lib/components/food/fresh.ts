// 「最新の値にする」 (docs/design.md "Gohan"): an entry keeps the food as it was logged (a snapshot per 100 g), so a later
// fix of the food data, or an edit of the recipe or custom food it came from, never changes it. When its food has
// since changed beyond rounding, the entry offers the food's values now: the catalogue item with the same id
// (toSnap; a barcode-only product's from its shard, fetched for it: shardsFor), the recipe (recipeSnap) or the custom
// food (customSnap) as it is now, its portion label kept, and with that label one of the food's portions now (「1杯」,
// 「1人前×2」) its grams that portion's now (eatout:reimen's 1杯 606 → 556 g). A logged entry is never updated by
// itself: the owner taps a day's 「この日の記録を最新の値にする」 or, saving a マイ食品 or recipe, 以前の記録にも反映する
// (store/meals.ts refreshFood, an ordinary edit). A いつもの's items are, from today on (repeatPlan, below).
import {
  customPortions, customSnap, FOOD_GRAMS, recipePortions, recipeSnap, round1, snapSalt, type FoodCustom, type FoodEntry,
  type FoodSnap, type RepeatItem
} from '#lib/contract/food.ts';
import { itemById, itemsKcal, janItem, portionsOf, toSnap, type FoodDb, type Portion } from '#lib/food/index.ts';
import { formatNum, t } from '#lib/i18n/index.ts';
import { weighItem } from './portions.ts';

/** Differences within these are rounding (kcal: the data's whole kcal, a recipe's or custom food's tenth; grams: a
 *  tenth), not a fix. */
const EPS = { k: 0.5, g: 0.05 } as const;

const near = (a: number, b: number, eps: number) => Math.abs(a - b) <= eps + 1e-9;

/**
 * Whether snapshot `now` (the food as it is now) differs from `was` (as logged) beyond rounding: kcal, or protein,
 * fat, carbs, salt or fibre (a value become unknown, or known, counts: fibre newly known on an entry from before it,
 * 2026-11-05, too, but not as 0: no row or total shows a fibre of 0, so the offer would change nothing one sees). The
 * name, the portion label the values' trust (`est`) and スープ半分 (`hs`, how it was eaten) are not values.
 */
export function snapDiffers(was: FoodSnap, now: FoodSnap): boolean {
  if (!near(was.k, now.k, EPS.k)) return true;
  for (const k of ['p', 'fa', 'c', 's', 'fi'] as const) {
    const a = was[k] ?? null, b = now[k] ?? null;
    if (k === 'fi' && a === null && b !== null && near(b, 0, EPS.g)) continue;
    if ((a === null) !== (b === null) || (a !== null && b !== null && !near(a, b, EPS.g))) return true;
  }
  return false;
}

/** Where the foods are now: the catalogue (null: not loaded yet), the recipes and custom foods. */
export interface FoodSources { db: FoodDb | null; recipes: readonly { id: string; n: string; sv: number; it: readonly RepeatItem[] }[]; customs: readonly FoodCustom[] }

/** The food of snapshot `f` as it is now (its portion label kept) and its portions now, or null: gone or not loaded. */
function sourceOf(f: FoodSnap, src: FoodSources): { now: FoodSnap; ps: readonly Portion[] } | null {
  if (f.id.startsWith('recipe:')) {
    const r = src.recipes.find((x) => `recipe:${x.id}` === f.id);
    if (!r) return null;
    return { now: recipeSnap(r, f.u), ps: recipePortions(r) };
  }
  if (f.id.startsWith('custom:')) {
    const c = src.customs.find((x) => `custom:${x.id}` === f.id);
    return c ? { now: customSnap(c, f.u), ps: customPortions(c) } : null;
  }
  const it = itemById(src.db, f.id);
  return it ? { now: toSnap(it, f.u), ps: portionsOf(it) } : null;
}

/** The grams portion label `u` (「1杯」, 「1杯×2」: portions.ts portionLabel) is among `ps` now, or null: no label, not
 *  one of them, past an entry's grams. */
function labelGrams(u: string | undefined, ps: readonly Portion[]): number | null {
  if (!u) return null;
  const [base, x] = u.split('×');
  const n = x === undefined ? 1 : Number(x);
  const p = ps.find((q) => q.label === base);
  if (!p || !(n > 0)) return null;
  const g = round1(p.g * n);
  return g >= FOOD_GRAMS.min && g <= FOOD_GRAMS.max ? g : null;
}

/** An entry's (a いつもの item's) food as it is now, and its grams then. */
export interface Fresh { g: number; f: FoodSnap }

/**
 * Entry (or いつもの item) `x` as it would be now, or null: its food gone, not loaded, or the same within rounding at
 * the same grams; or now logged otherwise (a serving with no weight become one with a weight, or back) with no
 * portion label to carry its grams over (they would mean something else).
 */
export function latestFood(x: { g: number; f: FoodSnap }, src: FoodSources): Fresh | null {
  const s = sourceOf(x.f, src);
  if (!s) return null;
  const lg = labelGrams(x.f.u, s.ps);
  if (lg === null && (s.now.sv === true) !== (x.f.sv === true)) return null;
  const g = lg ?? x.g;
  // スープ半分 is how it was eaten, not a value: kept
  const now = x.f.hs === undefined ? s.now : { ...s.now, hs: x.f.hs };
  return snapDiffers(x.f, now) || !near(g, x.g, EPS.g) ? { g, f: now } : null;
}

/**
 * A recipe's ingredient as it would be now (the editor's 材料を最新の値にする), or null: the same within rounding, gone
 * or not loaded. Its grams are the user's, kept (a label's portion weighing otherwise now never rescales them: a
 * recipe's grams are what went in the pot); but one by the serving whose food now has a weight takes its label's
 * grams (latestFood), and one weighed in the editor (its food by the serving, given a weight: weighItem) is its food's
 * serving now at the same weight a serving (its servings from its label, 「1食×2」).
 */
export function latestIngredient(x: RepeatItem, src: FoodSources): Fresh | null {
  const s = sourceOf(x.f, src);
  if (!s) return null;
  const was = x.f.sv === true, now = s.now.sv === true;
  if (!was && now) {
    const n = Number(x.f.u?.split('×')[1] ?? 1);
    const y = n > 0 ? weighItem({ g: round1(100 * n), f: s.now }, x.g / n) : null;
    return y && snapDiffers(x.f, y.f) ? { g: x.g, f: y.f } : null;
  }
  if (was !== now) return latestFood(x, src);
  return snapDiffers(x.f, s.now) ? { g: x.g, f: s.now } : null;
}

/** A change too big to take unasked (a data fix gone wrong, a different food under the same id): an ingredient's kcal
 *  by more than BIG.share of its own, or its salt by more than BIG.salt g. */
const BIG = { share: 0.3, salt: 1 } as const;
export function bigChange(was: RepeatItem, now: RepeatItem): boolean {
  const k0 = (was.f.k * was.g) / 100, k1 = (now.f.k * now.g) / 100;
  const salt = (x: RepeatItem) => ((snapSalt(x.f) ?? 0) * x.g) / 100;
  return Math.abs(k1 - k0) > BIG.share * Math.max(k0, 1) || Math.abs(salt(now) - salt(was)) > BIG.salt;
}

/** A recipe's ingredients as it is used now (shown, logged): `it` each as its food is now (latestIngredient: the user's
 *  grams kept), else as kept (the same, gone, not loaded); `auto` how many were taken so; `big` by index the ones
 *  whose change is too big to take unasked (bigChange: kept as they were, offered in the editor), null elsewhere. */
export interface Resolved { it: RepeatItem[]; auto: number; big: (Fresh | null)[] }
export function resolveItems(it: readonly RepeatItem[], src: FoodSources): Resolved {
  let auto = 0;
  const big: (Fresh | null)[] = [];
  const out = it.map((x, i) => {
    const y = latestIngredient(x, src);
    big[i] = y && bigChange(x, y) ? y : null;
    if (!y || big[i]) return x;
    auto++;
    return y;
  });
  return { it: auto ? out : [...it], auto, big };
}

// ---- いつもの's own update (the user and the team, 2026-11-20): a repeat's items whose foods changed are taken from today
// on by its owner's phone, unasked (Food.svelte), when the change is known to be the newer one: each food's values carry
// a time (`Stamp`: the catalogue's shipping, index.json `at`; a custom food's or recipe's last edit), and a repeat's
// snapshot its own (repeatStamp: the time in its id). Only a food whose values are newer than the snapshot is taken,
// so a phone on an older catalogue never takes a newer snapshot back (no loop between phones); one too big to take
// unasked (bigChange), or of unknown time, stays for the link (Food.svelte's いつものを更新).

/** When a repeat's snapshot was taken (ms): the time in its id (contract/ops.ts newOpId's; repeatAutoId's the values'
 *  own), 0 for one that holds none. */
export function repeatStamp(id: string): number {
  const n = parseInt(id.slice(1, -4), 36);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/** The repeat that takes over repeat `old` with values of time `at`: the same id on every phone that takes the same
 *  (two of the owner's phones at once make one repeat, not two), `at` its stamp (repeatStamp). */
export function repeatAutoId(old: string, at: number): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < old.length; i++) h = Math.imul(h ^ old.charCodeAt(i), 0x01000193) >>> 0;
  return `r${Math.round(at).toString(36)}${(h % 36 ** 4).toString(36).padStart(4, '0')}`;
}

/** When the food of an id took the values it has now (ms), or null: not in (the catalogue not loaded, the food gone)
 *  or of no known time (an older index without `at`). */
export type Stamp = (id: string) => number | null;

/** A repeat's update: `auto` its items with each change taken unasked (null: none to take, or one of its foods not
 *  in), under the id `id`; `ask` its items with every change (null: none left to ask: all taken unasked, or none). */
export interface RepeatPlan { auto: RepeatItem[] | null; id: string; ask: RepeatItem[] | null }
export function repeatPlan(r: { id: string; it: readonly RepeatItem[] }, src: FoodSources, stamp: Stamp): RepeatPlan {
  const t0 = repeatStamp(r.id);
  let all = true, top = t0, took = 0, asked = 0;
  const auto: RepeatItem[] = [], ask: RepeatItem[] = [];
  for (const x of r.it) {
    const s = stamp(x.f.id);
    if (s === null) all = false;
    else top = Math.max(top, s);
    const y = latestFood(x, src);
    ask.push(y ?? x);
    if (y && s !== null && s > t0 && !bigChange(x, y)) took++, auto.push(y);
    else auto.push(x), (asked += y ? 1 : 0);
  }
  // (one food not in: nothing taken, its changes asked, never half a meal's update)
  const go = all && took > 0;
  return { auto: go ? auto : null, id: repeatAutoId(r.id, top), ask: asked > 0 || (took > 0 && !go) ? ask : null };
}

/** My entries (`es`: real ones) a food's edit would change (its save's 以前の記録にも反映する): each with its food as it
 *  would be, by `src` (the edit's food in it). */
export function pastFresh(es: readonly FoodEntry[], id: string, src: FoodSources): { e: FoodEntry; x: Fresh }[] {
  const out: { e: FoodEntry; x: Fresh }[] = [];
  for (const e of es) {
    const x = e.f.id === id && !e.rep ? latestFood(e, src) : null;
    if (x) out.push({ e, x });
  }
  return out;
}

/** The barcode shards' items of `ids` that our products haven't (a scan's barcode-only product, the 2026-11-19 cone's
 *  kind), fetched into `db.shard` once the products are in (theirs come first, as a scan's); true when any came. A
 *  shard that won't load (offline): none, asked again next time. A product Open Food Facts gave online is in neither:
 *  no fresher values to offer. */
export async function shardsFor(db: FoodDb, ids: Iterable<string>): Promise<boolean> {
  const want = [...new Set(ids)].filter((id) => /^off:\d{8,13}$/.test(id));
  if (!want.length || !db.jan) return false;
  await db.wantMore(['off']).catch(() => {});
  const got = await Promise.all(want.filter((id) => !itemById(db, id)).map((id) => janItem(db, id.slice(4)).catch(() => null)));
  return got.some((it) => !!it);
}

/** What an update changes most, for its button (「最新の値にする（塩分 3.1→1.4 g）」): kcal by KCAL_SHARE and more, else
 *  salt, else fibre (g, one decimal; `from` null: newly known), else kcal at all; null: nothing shown changes. */
export interface FreshChange { k: 'k' | 's' | 'fi'; from: number | null; to: number }
const KCAL_SHARE = 0.05;
type Items = readonly { g: number; f: FoodSnap }[];
function sumOf(xs: Items, of: (f: FoodSnap) => number | null | undefined): number | null {
  let t: number | null = null;
  for (const { g, f } of xs) {
    const v = of(f);
    if (v !== null && v !== undefined) t = (t ?? 0) + (v * g) / 100;
  }
  return t === null ? null : round1(t);
}
export function freshChange(was: Items, now: Items): FreshChange | null {
  const k0 = itemsKcal(was), k1 = itemsKcal(now);
  if (Math.abs(k1 - k0) >= KCAL_SHARE * Math.max(k0, 1)) return { k: 'k', from: k0, to: k1 };
  for (const k of ['s', 'fi'] as const) {
    const of = k === 's' ? snapSalt : (f: FoodSnap) => f.fi;
    const a = sumOf(was, of), b = sumOf(now, of);
    if (b !== null && a !== b) return { k, from: a, to: b };
  }
  return k0 === k1 ? null : { k: 'k', from: k0, to: k1 };
}

/** An update's link: plain (`key`), or with what changes most (`key`K: 「（塩分 3.1→1.4 g）」). */
export function freshText(key: string, c: FreshChange | null): string {
  if (!c) return t(key);
  const what = t(`food.${c.k}`);
  const one = (n: number) => n.toFixed(1);
  const text = c.k === 'k' ? t('food.fresh.chgK', { from: formatNum(c.from!), to: formatNum(c.to) })
    : c.from === null ? t('food.fresh.chgNew', { what, to: one(c.to) }) : t('food.fresh.chg', { what, from: one(c.from), to: one(c.to) });
  return t(`${key}K`, { c: text });
}
