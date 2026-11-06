// ごはん's small helpers (docs/design.md "Gohan"): the catalog loaded once a session, an entry's amount in words, the
// food an entry was logged from (its catalog item when the catalog has it, for its portions; else its own portion), a
// row's everyday name, the さいきん list, a portion's start and step, whose day kept for the session, a repeat's weekdays in words, and a recipe
// as a food (マイレシピ: its portions), and a custom food as a food and its editor's fields (マイ食品).
import type { Who } from '#lib/types.ts';
import {
  CUSTOM, customDensityOk, customPortions, customSnap, FOOD_GRAMS, recipePortion, recipeSnap, type FoodCustom,
  type FoodEntry, type FoodSnap, type RepeatItem
} from '#lib/contract/food.ts';
import type { Recipe } from '#lib/model/food.ts';
import { loadFoodDb, portionsOf, type FoodDb, type Item, type Portion } from '#lib/food/index.ts';
import { loadFoodImages, type FoodImageIndex } from '#lib/food/images.ts';
import { searchKey } from '#lib/food/text.ts';
import { formatNum, t } from '#lib/i18n/index.ts';
import { nextChance } from '#lib/ui-state/retry.ts';

let dbP: Promise<FoodDb> | null = null;
let ready: FoodDb | null = null;
/** The food catalog, fetched on the first search of the session (a failure lets the next one try again). */
export function foodDb(): Promise<FoodDb> {
  return (dbP ??= loadFoodDb(nextChance).then(
    (db) => (ready = db),
    (e: unknown) => {
      dbP = null;
      throw e;
    }
  ));
}
/** The pictures' index into `set` once it is in (none: every food keeps its tile); a component's $effect. */
export function withImages(set: (ix: FoodImageIndex) => void): () => void {
  let live = true;
  void loadFoodImages().then((ix) => live && ix && set(ix));
  return () => void (live = false);
}
/** The catalog if it is in already (else null: open from the snapshot, swap the catalog's portions in later). */
export const foodDbNow = (): FoodDb | null => ready;

/** Whose day ごはん shows (null: this phone's person), kept for the session as けんこう's (healthLast). */
export const foodLast: { who: Who | null } = { who: null };

/** Grams as typed: one decimal at most, no trailing `.0`. */
export const gramsText = (g: number): string => String(Math.round(g * 10) / 10);

/** Whether a portion label already says its weight (「1枚(60g)」, 「200ml」): no second （Ng） after it. */
export const hasWeight = (label: string): boolean => /\d\s*(g|ml|グラム)/i.test(label.normalize('NFKC'));

/** A portion label's measure: ml for a drink's (「中ジョッキ（350ml）」, 「200ml」), else g. */
export const unitOf = (label: string | null | undefined): 'g' | 'ml' => (label && /\d\s*ml|ミリリットル/i.test(label.normalize('NFKC')) ? 'ml' : 'g');

/** A label's own weight in brackets (「（110g）」, 「(350ml)」), dropped when a ×n makes it wrong. */
const OWN_WEIGHT = /[（(][^（）()]*\d\s*(g|ml|グラム)[^（）()]*[）)]/gi;

/** A portion in words, the one format everywhere: its label and its weight once (「茶碗1杯（150g）」, 「中ジョッキ（350ml）」,
 *  「1パック（110g）」), ×n with the total (「1パック×2（220g）」), never a weight twice; no label: the weight alone. */
export function portionText(label: string | null | undefined, g: number, unit: 'g' | 'ml' = unitOf(label)): string {
  const w = `${gramsText(g)}${unit}`;
  if (!label) return w;
  const [base, x] = label.split('×');
  if (!x) return hasWeight(label) ? label : `${label}（${w}）`;
  const bare = base.replace(OWN_WEIGHT, '').trim();
  return !bare || /^\d+(\.\d+)?\s*(g|ml)$/i.test(bare.normalize('NFKC')) ? w : `${bare}×${x}（${w}）`;
}

/** A snapshot of a serving with no known weight (a custom food's, `sv`): its grams are a nominal 100 per serving,
 *  shown as servings, never as grams. */
export const servingOnly = (f: Pick<FoodSnap, 'sv'>): boolean => f.sv === true;

/** An entry's amount: the portion it was picked by and its weight (portionText), or the weight alone; a serving with
 *  no weight: its label alone (「1食」, 「1食×2」). */
export const amountText = (e: Pick<FoodEntry, 'g' | 'f'>): string =>
  servingOnly(e.f) ? (e.f.u ?? `×${gramsText(e.g / 100)}`) : portionText(e.f.u, e.g);

/** Full-width digits, point and comma typed on a Japanese keyboard (「６５０」, 「１２．５」) as ASCII. */
export const halfWidth = (text: string): string => text.replace(/[０-９．，]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0));

/** A logged snapshot as a catalog item: the catalog's own when it has it (its portions), else the snapshot's values
 *  and, with its grams `g`, the portion it was logged by (「茶碗1杯」 of 150 g; offline, a recipe's 1人前). */
export function itemOf(f: FoodSnap, db: FoodDb | null, g?: number): Item {
  const it = catalogOf(db, f.id);
  const own = it ? null : snapPortion(f.u, g);
  return { ...(it ?? {}), ...(own ? { portions: [own] } : {}), id: f.id, name: f.n, ...snapValues(f) };
}
/** The catalog's item of an id, if the catalog is in and has it. */
export const catalogOf = (db: FoodDb | null, id: string): Item | undefined => db?.entries.find((e) => e.it.id === id)?.it;

/** A food's category tile (FoodThumb) by its id: the catalog item's, a recipe's レシピ (`c…`), else none (その他). */
export const catOf = (db: FoodDb | null, id: string): string | undefined => catalogOf(db, id)?.cat ?? (/^c[0-9a-z]+$/.test(id) ? 'レシピ' : undefined);

/** A name's head: up to its first space or bracket (「鶏もも肉 皮つき 生」 → 鶏もも肉). */
const headOf = (s: string): string => s.trim().split(/[\s　（(［[]/)[0];
/** Dakuten and small っ folded, so a reading matches with its sounds voiced or not (もめんどうふ holds とうふ). */
const fold = (k: string): string => k.normalize('NFD').replace(/[\u3099\u309a]/g, '').replace(/っ/g, 'つ');
const READING = /^[ぁ-ゖー\s　（）()・]+$/;
/** Whether a name says something the shown one doesn't: not it or a part of it, nor holding its head (生うどん), nor a
 *  kana spelling of it (ウドン, トウフ: within one of its readings), nor mostly the head's own characters (焼鮭, お握り). */
function says(a: string, name: string, readings: readonly string[]): boolean {
  const k = searchKey(a), nk = searchKey(name), hk = searchKey(headOf(name));
  if (!k || nk.includes(k) || (hk && k.includes(hk)) || readings.some((r) => r.includes(fold(k)))) return false;
  return [...k].filter((c) => hk.includes(c)).length * 2 < k.length;
}

/** A row's everyday name under its own, in Japanese (docs/design.md "Gohan"), never repeating it: the catalog's current
 *  name when the row shows an older one (a snapshot's 「若どり もも 皮つき 生」 → 鶏もも肉), else the food data's vetted
 *  `gloss` once it ships one (an alias at least two sources back), else nothing: the aliases themselves are search terms,
 *  readings and spellings mostly, so none is shown. `it` is the catalog's item (or the row's own), `name` what the row
 *  shows. */
export function glossOf(it: Item & { gloss?: string }, name = it.name): string | null {
  const readings = [name, ...(it.aliases ?? []).filter((a) => READING.test(a))].map((r) => fold(searchKey(r)));
  const now = headOf(it.name);
  if (name !== it.name && says(now, name, readings)) return now;
  return it.gloss && says(it.gloss, name, readings) ? it.gloss : null;
}

/** A state's word as a MEXT name writes it (its chip says レンジ, いため). */
const STATE_WORD: Record<string, string> = { レンジ: '電子レンジ調理', いため: '油いため' };
/** A food's name without its state, for its one row (「豚ロース 脂身つき 生」 → 豚ロース 脂身つき, 「うどん（ゆで）」 →
 *  うどん); a name with no state word of its own (焼きいも, ゆで卵, バナナ) as it is. */
export function stemName(it: Pick<Item, 'name' | 'st'>): string {
  if (!it.st) return it.name;
  const w = STATE_WORD[it.st] ?? it.st;
  for (const end of [` ${w}`, `（${w}）`]) if (it.name.endsWith(end) && it.name.length > end.length) return it.name.slice(0, -end.length);
  return it.name;
}

/** A snapshot's values as an item's (fibre and alcohol only when known). */
function snapValues(f: FoodSnap): Pick<Item, 'kcal' | 'p' | 'f' | 'c' | 'salt' | 'fib' | 'alc'> {
  return { kcal: f.k, p: f.p, f: f.fa, c: f.c, salt: f.s, ...(typeof f.fi === 'number' ? { fib: f.fi } : {}), ...(typeof f.al === 'number' ? { alc: f.al } : {}) };
}
/** The portion an entry's label and grams name (「茶碗1杯×2」 of 300 g → 茶碗1杯 of 150 g); none for 100 g or typed grams. */
function snapPortion(u: string | undefined, g: number | undefined): Portion | null {
  if (!u || g === undefined) return null;
  const [label, x] = u.split('×');
  const n = x ? Number(x) : 1;
  if (!label || !(n > 0) || /^100\s*(g|ml)$/i.test(label.normalize('NFKC'))) return null;
  return { label, g: Math.round((g / n) * 10) / 10 };
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

/** Where the amount starts: the portion named by the label (「茶碗1杯×2」) when it makes the grams, else one that makes
 *  them, else typed grams; no grams: the default portion. */
export function startOf(ps: readonly Portion[], g0?: number, u0?: string): { pi: number; mult: number; custom: boolean } {
  if (g0 === undefined) return { pi: 0, mult: 1, custom: false };
  const [label, x] = (u0 ?? '').split('×');
  const pi = ps.findIndex((p) => p.label === label);
  const n = Number(x) || 1;
  if (pi >= 0 && Math.abs(ps[pi].g * n - g0) < 0.05) return { pi, mult: n, custom: false };
  const m = matchPortion(ps, g0);
  return m ? { ...m, custom: false } : { pi: 0, mult: 1, custom: true };
}

/** Foods eaten by the piece whose data gives a serving (「1人前」): おにぎり, 目玉焼き, ゆで卵 … step whole pieces too. */
const PIECE = /おにぎり|むすび|天むす|ゆで卵|温泉卵|目玉焼き|ハンバーグ|ホットドッグ|コロッケ|メンチカツ|まんじゅう|大福|ドーナツ|バーガー|梅干し/;

/** −/＋'s step for a portion: a whole one for the things you count (本 · 個 · 杯 · 缶 · 枚 · 切れ · 貫 · パック …, and a
 *  piece food's 1人前: `name` PIECE), a half for 茶碗 (rice), 人前 and the rest (a weight). */
export function stepOf(label: string, name = ''): 0.5 | 1 {
  const l = label.normalize('NFKC');
  if (/人前/.test(l) && PIECE.test(name)) return 1;
  if (/茶碗|人前|^\s*[\d.]+\s*(g|ml)\s*$/i.test(l)) return 0.5;
  return /本|個|杯|缶|枚|切れ|貫|パック|ジョッキ|袋|粒|尾|丁|玉|カップ|皿/.test(label) ? 1 : 0.5;
}

/** The label an entry keeps for a picked portion (「茶碗1杯」, 「茶碗1杯×2」); none for 100 g or typed grams. */
export function portionLabel(p: Portion | null, mult: number): string | null {
  if (!p || /^100\s*(g|ml)$/i.test(p.label.normalize('NFKC'))) return null;
  return mult === 1 ? p.label : `${p.label}×${mult}`;
}

/** An item's default portion in a few words and its kcal (search rows: 「茶碗1杯 150g」 234 kcal): its label without
 *  its notes in brackets (「1枚（とんかつ用）」 → 1枚), then its weight. */
export function defaultPortion(it: Item): { label: string; kcal: number } {
  const ps = portionsOf(it);
  const p = ps[0];
  const w = `${gramsText(p.g)}${ps.some((q) => unitOf(q.label) === 'ml') ? 'ml' : 'g'}`;
  const base = p.label.replace(/[（(][^（）()]*[）)]/g, '').trim();
  return { label: !base || /^\d+(\.\d+)?\s*(g|ml)$/i.test(base.normalize('NFKC')) ? w : `${base} ${w}`, kcal: Math.round((it.kcal * p.g) / 100) };
}

/** The search's rows with the true duplicates gone (the same name, brand and kcal: the products' copies of one). */
export function uniqueItems(items: readonly Item[]): Item[] {
  const seen = new Set<string>();
  return items.filter((it) => {
    const k = `${it.name}\u0001${it.brand ?? ''}\u0001${it.kcal}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

/** The day's kcal against the goal, in words and tone: today 「あと N kcal」 / 「N kcal オーバー」, a past day
 *  「目標より N kcal 少なめ / 多め」; coral only past 20 % over (the lifter eating to a surplus is not told off). */
export function goalChip(kcal: number, goal: number, today: boolean): { text: string; over: boolean } {
  const left = goal - kcal;
  const over = kcal > goal * 1.2;
  if (today) return { text: left >= 0 ? t('food.left', { n: formatNum(left) }) : t('food.over', { n: formatNum(-left) }), over };
  return { text: t(left >= 0 ? 'food.under' : 'food.overBy', { n: formatNum(Math.abs(left)) }), over };
}

/** Whether a day's meal is its repeat's: the same foods in the same amounts, in order (not the entries' ids: a day
 *  whose repeat was replaced from tomorrow still carries the old one's). */
export function sameItems(a: readonly { g: number; f: { id: string } }[], b: readonly { g: number; f: { id: string } }[]): boolean {
  return a.length === b.length && a.every((e, i) => e.f.id === b[i].f.id && Math.abs(e.g - b[i].g) < 0.05);
}

/** いつもの's weekday masks (bit 0 Monday … bit 6 Sunday): 毎日 · 平日 · 週末, the presets of the repeat level. */
export const DAYS = { every: 0b1111111, weekdays: 0b0011111, weekends: 0b1100000 } as const;

/** A repeat's weekdays in words: 毎日, 平日, 週末, else the days themselves (「月水金」, 「Mon Wed Fri」). */
export function daysText(w: number): string {
  for (const [k, v] of Object.entries(DAYS)) if (w === v) return t(`food.rep.${k}`);
  const days: string[] = [];
  for (let i = 0; i < 7; i++) if (w & (1 << i)) days.push(t(`food.rep.d${i}`));
  return days.join(t('food.rep.join'));
}

/** A recipe as a food to log (its values per 100 g: recipeSnap), its portions 1人前 (recipePortion) and, making more
 *  than one, ぜんぶ (its grams, within an entry's). With an ingredient of no known weight (`sv`) a serving is a nominal
 *  100 g (FoodAmount's `serving` mode: recipeServing), ぜんぶ its servings × 100. */
export function recipeItem(r: Recipe): Item {
  const f = recipeSnap(r);
  const one = recipePortion(r);
  const portions: Portion[] = [{ label: one.label, g: one.g }];
  const all = f.sv ? one.g * r.sv : r.total.g;
  if (r.sv > 1 && all <= FOOD_GRAMS.max) portions.push({ label: 'ぜんぶ', g: all });
  return { id: f.id, name: f.n, ...snapValues(f), portions };
}

/** Whether a recipe logs by the serving (an ingredient of no known weight: its snapshot `sv`). */
export const recipeServing = (r: Recipe): boolean => recipeSnap(r).sv === true;

/** A recipe as its editor changes it: the name, the servings, the ingredients. */
export interface RecipeDraft { n: string; sv: number; it: RepeatItem[] }

// ---- マイ食品: a food typed in by someone as one serving (contract/food.ts FoodCustom)

/** A custom food as a food to log: its values per 100 g (customSnap) and its portions (its serving first; 100g after
 *  it when its weight is known). With no weight its one portion is a nominal 100 g: FoodAmount's `serving` mode. */
export function customItem(c: FoodCustom): Item {
  const f = customSnap(c);
  return { id: f.id, name: f.n, ...snapValues(f), portions: customPortions(c) };
}

/** A custom food's serving in words: 「1食」, 「1パック（120g）」. */
export const servingText = (c: Pick<FoodCustom, 'u' | 'g'>): string => (c.g === undefined ? c.u : portionText(c.u, c.g));

/** The custom food editor's fields, as typed (numbers as text: full-width digits welcome). */
export interface CustomDraft { n: string; u: string; g: string; k: string; p: string; fa: string; c: string; s: string; fi: string; al: string }
/** The editor's nutrients: the four, then fibre and alcohol (each may stay blank: unknown). */
export const CUSTOM_NUTS = ['p', 'fa', 'c', 's', 'fi', 'al'] as const;
const NUTS = CUSTOM_NUTS;
const num1 = (v: number | null | undefined): string => (v === null || v === undefined ? '' : gramsText(v));

/** A new custom food's fields (the name: what was typed in the search; the serving's label blank: 「1食」 is its field's
 *  placeholder, never a value typed after), or a saved one's. */
export function customDraft(c: FoodCustom | null, name = ''): CustomDraft {
  if (!c) return { n: name.trim().slice(0, CUSTOM.nameChars), u: '', g: '', k: '', p: '', fa: '', c: '', s: '', fi: '', al: '' };
  return { n: c.n, u: c.u, g: num1(c.g), k: String(c.k), p: num1(c.p), fa: num1(c.fa), c: num1(c.c), s: num1(c.s), fi: num1(c.fi), al: num1(c.al) };
}

/** A typed amount → a number to one decimal within [min, max]; '' → null (left blank); undefined when it isn't one.
 *  Full-width digits, thousands commas (1,200: as parseKcalGoal reads them), else a decimal comma, and a trailing unit
 *  (g, kcal) are fine. */
export function parseAmount(text: string, min: number, max: number): number | null | undefined {
  const t = halfWidth(text.trim()).replace(/\s*(g|kcal|グラム)$/i, '');
  const s = /^\d{1,3}(,\d{3})+(\.\d+)?$/.test(t) ? t.replace(/,/g, '') : t.replace(',', '.');
  if (!s) return null;
  if (!/^\d{1,5}(\.\d+)?$/.test(s)) return undefined;
  const v = Math.round(Number(s) * 10) / 10;
  return v >= min && v <= max ? v : undefined;
}

/** Which of the editor's fields don't read (the name and kcal are needed; the rest may be blank). A serving whose
 *  weight is too light for what it holds (more than any food per 100 g: the record refuses it) marks the weight. */
export function customErrors(d: CustomDraft): Set<keyof CustomDraft> {
  const bad = new Set<keyof CustomDraft>();
  if (!d.n.trim()) bad.add('n');
  const k = parseAmount(d.k, 0, CUSTOM.kcalMax);
  if (k === null || k === undefined) bad.add('k');
  if (parseAmount(d.g, CUSTOM.grams.min, CUSTOM.grams.max) === undefined) bad.add('g');
  for (const x of NUTS) if (parseAmount(d[x], 0, CUSTOM.nutrientMax) === undefined) bad.add(x);
  if (!bad.size && !customDensityOk(customOf(d))) bad.add('g');
  return bad;
}

/** The editor's fields as saveCustom takes them (customErrors empty first): kcal whole, a blank label 1食; fibre and
 *  alcohol only when typed. */
export function customOf(d: CustomDraft): { n: string; u: string; g?: number; k: number; p: number | null; fa: number | null; c: number | null; s: number | null; fi?: number; al?: number } {
  const g = parseAmount(d.g, CUSTOM.grams.min, CUSTOM.grams.max) ?? undefined;
  const nut = (x: (typeof NUTS)[number]) => parseAmount(d[x], 0, CUSTOM.nutrientMax) ?? null;
  const fi = nut('fi'), al = nut('al');
  return {
    n: d.n.trim(), u: d.u.trim() || t('food.my.one'), ...(g === undefined ? {} : { g }), k: Math.round(parseAmount(d.k, 0, CUSTOM.kcalMax) ?? 0),
    p: nut('p'), fa: nut('fa'), c: nut('c'), s: nut('s'), ...(fi === null ? {} : { fi }), ...(al === null ? {} : { al })
  };
}

// ---- クイック (quick add: eating out): kcal, and whatever else is known, as one entry; no food saved

/** A quick entry's fields: the custom food editor's (FoodCustom `quick`), its serving and weight unused; `k` the kcal
 *  to start from (typed in the search). */
export const quickDraft = (k = ''): CustomDraft => ({ ...customDraft(null), k });

/** Which of a quick entry's fields don't read: kcal is needed, the name may stay blank (then クイック). */
export function quickErrors(d: CustomDraft): Set<keyof CustomDraft> {
  return customErrors({ ...d, n: d.n.trim() || 'x', u: '', g: '' });
}

/** A quick entry's snapshot: one serving (`sv`: a nominal 100 g, shown as 「1食」) as typed, customSnap's form with no
 *  food saved, its id `quick:<id>` (its own), its name クイック unless typed. The record takes it as any custom food's
 *  (contract/food.ts snapOf: `sv`'s limits), so nothing new on the relay. */
export function quickSnap(d: CustomDraft, id: string): FoodSnap {
  const v = customOf({ ...d, n: d.n.trim() || t('food.quick.name'), u: '', g: '' });
  return { ...customSnap({ ...v, id }, v.u), id: `quick:${id}` };
}

/** A kcal typed in the search (「650」, 「６５０kcal」, 「1,200」): offered as a quick entry; null for anything else. */
export function typedKcal(q: string): number | null {
  const s = q.trim();
  if (!/^[\d０-９][\d０-９,，.．]*\s*(kcal)?$/i.test(s)) return null;
  const v = parseAmount(s, 1, CUSTOM.kcalMax);
  return v ? Math.round(v) : null;
}
