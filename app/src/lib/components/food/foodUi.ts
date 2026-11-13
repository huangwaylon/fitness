// ごはん's small helpers (docs/design.md "Gohan"): the catalog loaded once a session, an entry's amount in words, the
// food an entry was logged from (its catalog item when the catalog has it, for its portions; else its own portion), a
// row's everyday name, the さいきん list, a portion's start and step, a repeat's weekdays in words, and a recipe
// as a food (マイレシピ: its portions), and a custom food as a food and its editor's fields (マイ食品).
import {
  CUSTOM, customDensityOk, customPortions, customSnap, FOOD_GRAMS, recipePortion, recipeSnap, round1, type FoodCustom,
  type FoodEntry, type FoodSnap, type RepeatItem
} from '#lib/contract/food.ts';
import { quiet } from '#lib/quiet.ts';
import { parseTyped } from '#lib/math.ts';
import type { Recipe } from '#lib/model/food.ts';
import { itemById, loadFoodDb, portionsOf, unitOf, type FoodDb, type Item, type KaloriSource, type Portion } from '#lib/food/index.ts';
import { dropFoodImages, imgOf, loadFoodImages, type FoodImageIndex, type FoodImg } from '#lib/food/images.ts';
import { searchKey } from '#lib/food/text.ts';
import { formatNum, t } from '#lib/i18n/index.ts';
import { nextChance } from '#lib/ui-state/retry.ts';
import { DEVICE, getKey, localKV, readJson, writeJson } from '#lib/sync/storage.ts';
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

/** The summary's くわしく open or not, kept for the session (whose day: health/whose.svelte.ts). */
export const foodLast: { more: boolean } = { more: false };

/** Grams as typed: one decimal at most, no trailing `.0`. */
export const gramsText = (g: number): string => String(round1(g));

/** Whether a portion label already says its weight (「1枚(60g)」, 「200ml」): no second （Ng） after it. */
export const hasWeight = (label: string): boolean => /\d\s*(g|ml|グラム)/i.test(label.normalize('NFKC'));


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


/** A logged snapshot as a catalog item: the catalog's own when it has it (its portions), else the snapshot's values
 *  and, with its grams `g`, the portion it was logged by (「茶碗1杯」 of 150 g; offline, a recipe's 1人前). */
export function itemOf(f: FoodSnap, db: FoodDb | null, g?: number): Item {
  const c = itemById(db, f.id);
  const it = c && inState(db, c);
  const own = it ? null : snapPortion(f.u, g);
  return { ...(it ?? {}), ...(own ? { portions: [own] } : {}), id: f.id, name: f.n, ...snapValues(f) };
}

/** A food's category tile (FoodThumb) by its id: the catalog item's, a recipe's レシピ (`c…`, or as logged `recipe:c…`),
 *  else none (その他). */
export const catOf = (db: FoodDb | null, id: string): string | undefined => itemById(db, id)?.cat ?? (/^(recipe:)?c[0-9a-z]+$/.test(id) ? 'レシピ' : undefined);

/** The recipe a logged food is (its snapshot's id `recipe:<recipe id>`: contract/food.ts recipeSnap), or null. */
export const recipeIdOf = (foodId: string): string | null => (foodId.startsWith('recipe:') ? foodId.slice(7) : null);
/** The recipe an entry was logged from, if it's still there (`byId`: the recipes by id). */
export const recipeOfEntry = <R,>(byId: ReadonlyMap<string, R> | undefined, e: { f: { id: string } }): R | undefined => {
  const id = recipeIdOf(e.f.id);
  return id ? byId?.get(id) : undefined;
};

/** Cells a recipe's picture box holds at most (FoodThumb's `plate`: 1 the whole box, 2 halves, 3 a half and two
 *  quarters, 4 a 2 × 2). */
const PLATE_MAX = 4;
/**
 * Which of a recipe's ingredients its picture box shows (docs/design.md "Gohan" マイレシピ): a food once (its grams
 * summed), those with a picture (`pictured`) before those without (theirs is their category's tile), then the most
 * grams first (a tie: as listed), at most PLATE_MAX; drawn in that order, the biggest first, so the box reads as the
 * dish (the rice and the onion of a curry before its roux).
 */
export function recipePlate(it: readonly { g: number; f: { id: string } }[], pictured: (id: string) => boolean, max = PLATE_MAX): { id: string; g: number }[] {
  const by = new Map<string, { id: string; g: number; i: number; pic: boolean }>();
  it.forEach(({ g, f }, i) => {
    const x = by.get(f.id);
    if (x) x.g += g;
    else by.set(f.id, { id: f.id, g, i, pic: pictured(f.id) });
  });
  const all = [...by.values()];
  const take = all.sort((a, b) => Number(b.pic) - Number(a.pic) || b.g - a.g || a.i - b.i).slice(0, max);
  return take.sort((a, b) => b.g - a.g || a.i - b.i).map(({ id, g }) => ({ id, g }));
}
/** A recipe's picture box (FoodThumb `plate`) for a box of `px`: its recipePlate's cells, each its picture (images.ts
 *  imgOf) or, with none, its category (catOf: その他 till the catalog is in). */
export function plateOf(r: { it: readonly RepeatItem[] }, imgs: FoodImageIndex | null, db: FoodDb | null, px: number): PlatePart[] {
  return recipePlate(r.it, (id) => !!imgOf(imgs, id, px)).map(({ id }) => ({ img: imgOf(imgs, id, px), cat: catOf(db, id) }));
}
/** One cell of a recipe's picture box: an ingredient's picture, else its category's tile. */
export interface PlatePart { img: FoodImg | null; cat?: string }

/** The latest logged foods' categories this phone has seen in the catalog (sync/storage.ts DEVICE.foodCats), at most: a
 *  logged row's tile on open, before the catalog is in. */
const CATS_KEPT = 500;
let cats: Map<string, string> | null = null;
let catsSave: ReturnType<typeof setTimeout> | undefined;
function seenCats(): Map<string, string> {
  if (cats) return cats;
  const kept = readJson<unknown>(localKV(), DEVICE.foodCats);
  cats = new Map(kept && typeof kept === 'object' ? Object.entries(kept).filter((e): e is [string, string] => typeof e[1] === 'string') : []);
  return cats;
}
/** A logged row's tile: catOf, remembered on this phone; the catalog not in yet, as remembered (none: その他 till it is). */
export function loggedCat(db: FoodDb | null, id: string): string | undefined {
  const c = catOf(db, id), seen = seenCats();
  if (!db || !c || seen.get(id) === c) return c ?? seen.get(id);
  seen.delete(id);
  seen.set(id, c);
  for (const k of seen.keys()) if (seen.size > CATS_KEPT) seen.delete(k);
  catsSave ??= setTimeout(() => {
    catsSave = undefined;
    writeJson(localKV(), DEVICE.foodCats, Object.fromEntries(seenCats()));
  }, 1000);
  return c;
}

/** A name's head: up to its first space or bracket (「鶏もも肉 皮つき 生」 → 鶏もも肉). */
const nameHead = (s: string): string => s.trim().split(/[\s　（(［[]/)[0];
/** Whether a name says something the shown one doesn't: not it or a part of it, nor holding its head (生うどん), nor
 *  mostly the head's own characters (焼鮭 beside 焼き鮭). */
function says(a: string, name: string): boolean {
  const k = searchKey(a), nk = searchKey(name), hk = searchKey(nameHead(name));
  if (!k || nk.includes(k) || (hk && k.includes(hk))) return false;
  return [...k].filter((c) => hk.includes(c)).length * 2 < k.length;
}

/** A row's everyday name under its own, in Japanese (docs/design.md "Gohan"), never repeating it: the catalog's current
 *  name when the row shows an older one (a snapshot's 「若どり もも 皮つき 生」 → 鶏もも肉), else the food data's vetted
 *  `gloss`, else nothing. `it` is the catalog's item (or the row's own), `name` what the row shows. */
export function glossOf(it: Item, name = it.name): string | null {
  const now = nameHead(it.name);
  if (name !== it.name && says(now, name)) return now;
  return it.gloss && says(it.gloss, name) ? it.gloss : null;
}
/** A logged food's everyday name (glossOf against the catalog's item; none until the catalog is in). */
export function snapGloss(db: FoodDb | null, f: Pick<FoodSnap, 'id' | 'n'>): string | null {
  const c = itemById(db, f.id);
  return c ? glossOf(c, f.n) : null;
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

/** A portion label without its notes in brackets (「1枚（とんかつ用）」 → 1枚). */
const bareLabel = (label: string): string => label.replace(/[（(][^（）()]*[）)]/g, '').trim();
const is100 = (p: Portion): boolean => /^100\s*(g|ml)$/i.test(p.label.normalize('NFKC'));

/** A food in one of its states as the amount shows it (`d` its group's default, the raw one mostly): the default's
 *  name with this state's word (「豚ロース 焼き」 → 豚ロース 脂身つき 焼き: MEXT drops the cut's words on some states), and
 *  the default's portions carried over (「1枚（とんかつ用）」 120 g → 90 g 焼き): a label the state has by itself, or by its
 *  bare label (1枚), at the state's grams; the rest scaled by that pair's yield (薄切り1枚 20 g → 15 g); without such a
 *  pair, the state's own portions only (its weight after cooking is unknown). */
export function stateItem(d: Item, v: Item): Item {
  if (d.id === v.id) return v;
  const sv = stemName(v), sd = stemName(d);
  const name = sv !== v.name && sd.startsWith(sv) ? sd + v.name.slice(sv.length) : v.name;
  const own = (v.portions ?? []).filter((p) => !is100(p));
  const match = (p: Portion) => own.find((q) => q.label === p.label) ?? own.find((q) => bareLabel(q.label) === bareLabel(p.label));
  const pair = (d.portions ?? []).find((p) => !is100(p) && match(p));
  const k = pair ? match(pair)!.g / pair.g : null;
  const used = new Set<Portion>();
  const portions: Portion[] = [];
  for (const p of d.portions ?? []) {
    if (is100(p)) continue;
    const q = match(p);
    if (q) used.add(q);
    if (q || k) portions.push({ label: p.label, g: q ? q.g : round1(p.g * k!) });
  }
  portions.push(...own.filter((q) => !used.has(q)));
  return { ...v, name, portions: portions.length ? portions : v.portions };
}
/** A milk's word in a chain menu's state (ミルク, 豆乳, 低脂肪乳, ブレベ: food-data's kalori_convert.py MILKS). */
const MILK = /ミルク|乳|ブレベ/;
/** A chip group of a chain menu's states: its words of one kind, each the state it picks. */
export interface StateGroup { head: 'size' | 'milk'; chips: { label: string; to: Item; on: boolean }[] }
/** A chain menu's states (Kalori's `st`: 「Grande・豆乳」, 「大盛」) as chip groups, サイズ before ミルク: each word of
 *  `st` (split on ・) a chip, the sizes smallest first (by kcal), the milks the group's default's first; a pick keeps
 *  the other words (no such state: the first with that word). Null when the states don't split alike. */
export function stateGroups(states: readonly Item[], it: Item): StateGroup[] | null {
  const parts = states.map((v) => (v.st ?? '').split('・'));
  const n = parts[0]?.length ?? 0;
  if (!n || parts.some((p) => p.length !== n || p.some((w) => !w))) return null;
  const mine = (it.st ?? '').split('・');
  const dflt = (states.find((v) => v.id === v.vg)?.st ?? '').split('・');
  const groups = Array.from({ length: n }, (_, gi): StateGroup => {
    const words = [...new Set(parts.map((p) => p[gi]))];
    const milk = words.some((w) => MILK.test(w));
    const low = (w: string) => Math.min(...states.filter((_, i) => parts[i][gi] === w).map((v) => v.kcal));
    words.sort((a, b) => (milk ? Number(b === dflt[gi]) - Number(a === dflt[gi]) : 0) || low(a) - low(b));
    const chips = words.map((w) => {
      const want = mine.map((x, j) => (j === gi ? w : x));
      const i = parts.findIndex((p) => p.every((x, j) => x === want[j]));
      return { label: w, to: states[i >= 0 ? i : parts.findIndex((p) => p[gi] === w)], on: mine[gi] === w };
    });
    return { head: milk ? 'milk' : 'size', chips };
  });
  return groups.sort((a, b) => Number(a.head === 'milk') - Number(b.head === 'milk'));
}

/** An item as the amount shows it: a state of a food in its states through stateItem (else as it is). */
export function inState(db: FoodDb | null, it: Item): Item {
  const d = it.vg && it.id !== it.vg ? db?.variants.get(it.vg)?.find((x) => x.id === it.vg) : undefined;
  return d ? stateItem(d, it) : it;
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
  return { label, g: round1(g / n) };
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

/** A chain menu's page on kalori.jp (its shop and number: `kal:<n>`), for the amount's link; null for any other food. */
export function kaloriPage(it: Pick<Item, 'id' | 'shop'>): string | null {
  const n = /^kal:(\d+)$/.exec(it.id)?.[1];
  return n && it.shop ? `https://kalori.jp/ja/shops/${encodeURIComponent(it.shop)}/products/${n}/` : null;
}

/** The chips under the search's field (FoodSearch): at most 6 while typing, the shops of the results (shopsFor) when
 *  two or more hold some and none is named. */
const SHOP_CHIPS = 6;
export const shopChips = <S,>(shops: readonly S[]): S[] => (shops.length >= 2 ? shops.slice(0, SHOP_CHIPS) : []);

/** よく行く店 (the search's empty query): the chain shops of my entries (`mine`, newest first) since `since` (30 days
 *  back), the most entries first, a tie the latest; at most 4, none without the catalog's chain menus. */
export function recentShops(mine: readonly FoodEntry[], db: FoodDb | null, since: string, max = 4): { shop: string; name: string }[] {
  const by = new Map<string, { shop: string; name: string; n: number; i: number }>();
  mine.forEach((e, i) => {
    const it = e.d >= since && e.f.id.startsWith('kal:') ? itemById(db, e.f.id) : undefined;
    if (!it?.shop) return;
    const s = by.get(it.shop) ?? by.set(it.shop, { shop: it.shop, name: it.brand ?? it.shop, n: 0, i }).get(it.shop)!;
    s.n++;
  });
  return [...by.values()].sort((a, b) => b.n - a.n || a.i - b.i).slice(0, max).map(({ shop, name }) => ({ shop, name }));
}

/** The portion and ×multiplier (a multiple of 0.5, ×0.5 to ×20) whose grams, saved to one decimal, are `g`, ×1 first;
 *  null when none does. */
export function matchPortion(ps: readonly Portion[], g: number): { pi: number; mult: number } | null {
  let best: { pi: number; mult: number } | null = null;
  ps.forEach((p, pi) => {
    const mult = Math.round((g / p.g) * 2) / 2;
    if (mult < MULT.min || mult > MULT.max || round1(p.g * mult) !== g) return;
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
  if (pi >= 0 && round1(ps[pi].g * n) === g0) return { pi, mult: n, custom: false };
  const m = matchPortion(ps, g0);
  return m ? { ...m, custom: false } : { pi: 0, mult: 1, custom: true };
}

/** Foods eaten by the piece whose data gives a serving (「1人前」): おにぎり, 目玉焼き, ゆで卵 … counted too. */
const PIECE = /おにぎり|むすび|天むす|ゆで卵|温泉卵|目玉焼き|ハンバーグ|ホットドッグ|コロッケ|メンチカツ|まんじゅう|大福|ドーナツ|バーガー|梅干し/;

export type StepKind = 'count' | 'half';
/** −/＋'s ladder for a portion: 'count' for the things you count (本 · 個 · 杯 · 缶 · 枚 · 切れ · 貫 · パック …, and a
 *  piece food's 1人前: `name` PIECE), 'half' for 茶碗 (rice), 人前 and the rest (a weight). */
export function stepOf(label: string, name = ''): StepKind {
  const l = label.normalize('NFKC');
  if (/人前/.test(l) && PIECE.test(name)) return 'count';
  if (/茶碗|人前|^\s*[\d.]+\s*(g|ml)\s*$/i.test(l)) return 'half';
  return /本|個|杯|缶|枚|切れ|貫|パック|ジョッキ|袋|粒|尾|丁|玉|カップ|皿/.test(label) ? 'count' : 'half';
}

/** ×n's floor and cap. */
export const MULT = { min: 0.5, max: 20 } as const;
/** The rungs: halves all the way for 'half'; for 'count' halves up to 2 (½ an apple, 1½ toast), then whole ones. */
const RUNGS: Record<StepKind, readonly number[]> = {
  half: Array.from({ length: 40 }, (_, i) => (i + 1) / 2),
  count: [0.5, 1, 1.5, ...Array.from({ length: 19 }, (_, i) => i + 2)]
};

/** −/＋ from ×m: the next rung down or up (from a value off the ladder, a saved ×2.5, the nearest one that way); held
 *  at the floor and the cap. */
export function nextMult(m: number, d: -1 | 1, kind: StepKind): number {
  const r = RUNGS[kind];
  return (d > 0 ? r.find((x) => x > m) : r.findLast((x) => x < m)) ?? (d > 0 ? MULT.max : MULT.min);
}

/** The label an entry keeps for a picked portion (「茶碗1杯」, 「茶碗1杯×2」); none for 100 g or typed grams. */
export function portionLabel(p: Portion | null, mult: number): string | null {
  if (!p || /^100\s*(g|ml)$/i.test(p.label.normalize('NFKC'))) return null;
  return mult === 1 ? p.label : `${p.label}×${mult}`;
}

/** An item's default portion in a few words and its kcal (search rows: 「茶碗1杯 150g」 234 kcal): its label without
 *  its notes in brackets (「1枚（とんかつ用）」 → 1枚), then its weight; a serving with no weight (`sv`): its label. */
export function defaultPortion(it: Item): { label: string; kcal: number } {
  const ps = portionsOf(it);
  const p = ps[0];
  if (it.sv) return { label: p.label, kcal: Math.round((it.kcal * p.g) / 100) };
  const w = `${gramsText(p.g)}${ps.some((q) => unitOf(q.label) === 'ml') ? 'ml' : 'g'}`;
  const base = bareLabel(p.label);
  return { label: !base || /^\d+(\.\d+)?\s*(g|ml)$/i.test(base.normalize('NFKC')) ? w : `${base} ${w}`, kcal: Math.round((it.kcal * p.g) / 100) };
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
  if (r.sv > 1 && all <= FOOD_GRAMS.max) portions.push({ label: '全部', g: all });
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

/** A typed amount (math.ts parseTyped: full-width digits, 1,200, a decimal comma, a trailing g, ml or kcal) → a number
 *  to one decimal within [min, max]; '' → null (left blank); undefined when it isn't one. */
export function parseAmount(text: string, min: number, max: number): number | null | undefined {
  const n = parseTyped(text, 'g|ml|kcal|グラム');
  if (n == null) return n;
  const v = round1(n);
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
