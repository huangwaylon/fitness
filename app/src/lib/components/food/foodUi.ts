// ごはん's foods as rows show them (docs/design.md "Gohan"): the food an entry was logged from (its catalog item when the
// catalog has it, for its portions; else its own portion), a row's tile, picture box and everyday name, a food's
// states, the さいきん list and the shops, the goal's chip, a repeat's weekdays in words, and a recipe as a food
// (マイレシピ: its portions). The catalog itself: dbHold.svelte.ts; portions: portions.ts; マイ食品 and クイック: drafts.ts.
import { FOOD_GRAMS, recipePortion, recipeSnap, round1, type FoodEntry, type FoodSnap, type RepeatItem } from '#lib/contract/food.ts';
import type { Recipe } from '#lib/model/food.ts';
import { itemById, type FoodDb, type Item, type Portion } from '#lib/food/index.ts';
import { imgOf, type FoodImageIndex, type FoodImg } from '#lib/food/images.ts';
import { searchKey } from '#lib/food/text.ts';
import { formatNum, t } from '#lib/i18n/index.ts';
import { bareLabel } from './portions.ts';
import { DEVICE, localKV, readJson, writeJson } from '#lib/sync/storage.ts';

/** The summary's くわしく open or not, kept for the session (whose day: health/whose.svelte.ts). */
export const foodLast: { more: boolean } = { more: false };

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
  return chainStem(it.name, it.st);
}

/** A chain menu's takeout / all-you-can-eat marks (kalori_convert.py TAKEOUT_MARKS) and the eat-in states beside them. */
const MARKS = new Set(['持ち帰り', '食べ放題', '店内', '単品']);
const MARKED = [/^(?:T[Oo](?:[ 　]+|(?=[【\u3040-\u30ff\u4e00-\u9fff]))|[［[【](?:お持ち帰り|持ち帰り|テイクアウト|持帰り?)[］\]】][ 　]*|(?:お持ち帰り|テイクアウト)用?(?:[ 　]+|[）)][ 　]*))/, /[ 　]*[（(](?:お持ち帰り|持ち帰り|テイクアウト用?|持帰り?|TO|(?:よりどり)?食べ放題)[)）]$/];
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
/** A chain menu's name without the words its `st` shows (kalori_convert.py variant_of): each part bracketed (ココア
 *  （アイス）（Tall・豆乳）, ライス「中」), spaced (牛丼 並盛) or glued to a Japanese stem (ライス中), and a takeout mark (TO,
 *  （お持ち帰り）); the name as it is when they aren't all there. */
function chainStem(name: string, st: string): string {
  let s = name;
  let words = st.split('・');
  if (MARKS.has(words[words.length - 1])) {
    for (const re of MARKED) s = s.replace(re, '').trim() || s;
    words = words.slice(0, -1);
  }
  while (words.length) {
    let k = words.length;
    for (; k >= 1; k--) {
      const p = esc(words.slice(-k).join('・'));
      const m = s.match(new RegExp(`^(.+?)(?:\\s*[（(「【]${p}[)）」】]|[ 　]+${p}|(?<=[^\\x00-\\x7f])${p})$`));
      if (m) {
        s = m[1].trimEnd();
        break;
      }
    }
    if (!k) return name;
    words = words.slice(0, -k);
  }
  return s || name;
}

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
export function snapValues(f: FoodSnap): Pick<Item, 'kcal' | 'p' | 'f' | 'c' | 'salt' | 'fib' | 'alc'> {
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

const TRUST = { p: 'food.kal.pfc', s: 'food.kal.fibsalt', e: 'food.kal.est' } as const;
/** A chain menu's trust line (the amount's head): how far its values are the shop's own (公式の値, PFCは推定, 食物繊維・
 *  塩分は推定, 推定の値（AI）) and, one Kalori says may be gone (`ended`), 販売終了かも; null for any other food. */
export function kaloriTrust(it: Pick<Item, 'id' | 'shop' | 'est' | 'ended'>): string | null {
  if (!kaloriPage(it)) return null;
  const est = t(it.est ? TRUST[it.est] : 'food.kal.official');
  return it.ended ? `${est} · ${t('food.kal.ended')}` : est;
}

/** Fibre in `g` grams of a food (or servings' worth, an `sv` one's), when it knows it and has some: else null (shown
 *  only then: the amount's head, a row opened in place). */
export const fibreAt = (it: Pick<Item, 'fib'>, g: number): number | null => (typeof it.fib === 'number' && it.fib > 0 ? round1((it.fib * g) / 100) : null);

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
