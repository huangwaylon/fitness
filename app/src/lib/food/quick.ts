// ごはん's one-tap adds (FoodMeal's 「＋飲み物」 · 「＋間食」 · 「＋油・ドレッシング」 · 「＋お酒」, review 11-24 T2: the items
// most often left out). A tap logs that person's own most-logged food of the kind (QUICK_DAYS back: the most entries, the
// latest a tie's winner) at their most-logged amount for it; with none, the kind's everyday generic (QUICK_GENERIC).
// Pure: the caller passes the entries and how a food id's category is known (the catalog's, else as this phone remembers
// it), the name the fallback when neither knows it.
import type { FoodEntry, FoodSnap, Meal } from '#lib/contract/food.ts';

/** A Tokyo date, YYYY-MM-DD. */
type LocalDate = string;

export type QuickKind = 'drink' | 'snack' | 'oil' | 'alcohol';
/** The kinds, in the row's order. */
export const QUICK_KINDS: readonly QuickKind[] = ['drink', 'snack', 'oil', 'alcohol'];
/** Each meal's own kinds (a person's history adds any they have logged in it: quickKinds). */
const MEAL_KINDS: Record<Meal, readonly QuickKind[]> = { b: ['drink', 'oil'], l: ['drink', 'oil'], d: ['drink', 'oil', 'alcohol'], s: ['drink', 'snack'] };
/** Days of history a pick reads (today included): what someone has now, not a habit long dropped. */
const QUICK_DAYS = 90;

/** With no history of the kind: a common catalog food (MEXT) at its everyday portion (its label and grams as the food
 *  data has them; `n` its name, for the chip's label before the catalog is in). */
export const QUICK_GENERIC: Record<QuickKind, { id: string; n: string; u: string; g: number }> = {
  drink: { id: 'mext:16055', n: '麦茶', u: 'コップ1杯', g: 200 },
  snack: { id: 'mext:15060', n: 'しょうゆせんべい', u: '1枚', g: 15 },
  oil: { id: 'mext:14006', n: 'サラダ油（調合油）', u: '小さじ1', g: 4 },
  alcohol: { id: 'mext:16006', n: 'ビール', u: '350ml缶', g: 353 }
};

const NON_ALC = /ノンアル|ノンアルコール|アルコールフリー/;
/** By name, for a category none knows (a custom food, クイック, the catalog not in yet). */
const NAME_KIND: [QuickKind, RegExp][] = [
  ['alcohol', /ビール|ワイン|日本酒|焼酎|ハイボール|サワー|チューハイ|酎ハイ|ウイスキー|ウィスキー|梅酒|カクテル|ハイ$|^酒|清酒|紹興酒|マッコリ/],
  ['oil', /ドレッシング|マヨネーズ|サラダ油|オリーブ(オイル|油)|ごま油|ゴマ油|なたね油|菜種油|米油|バター|マーガリン|ラード|^油$/],
  ['drink', /茶$|茶（|ティー|コーヒー|珈琲|ラテ|カフェオレ|ジュース|スムージー|牛乳|豆乳|ミルク$|ソーダ|コーラ|サイダー|スポーツドリンク|ドリンク|飲むヨーグルト|プロテイン|ココア/],
  ['snack', /チョコ|クッキー|ビスケット|せんべい|煎餅|ポテトチップ|スナック|アイス|ケーキ|プリン|グミ|キャンディ|飴|ナッツ|アーモンド|和菓子|大福|ドーナツ|まんじゅう|饅頭|羊羹|ようかん|クラッカー/]
];
/** Words that say a dish, not the kind (抹茶アイス is a snack, not a drink; 茶碗蒸し, お茶漬け neither). */
const NOT_DRINK = /茶碗|茶漬|茶そば|アイス|ケーキ|プリン|ゼリー|チョコ|クッキー/;

/**
 * A food's kind, if one of the four: by its category (docs/food-data.md `cat`) and, where the category is broad (調味料's
 * dressings, 乳製品's milk) or unknown, its name. ノンアルコール is a drink whatever its category (the catalog files some under 酒).
 */
export function kindOf(cat: string | undefined, name: string): QuickKind | null {
  const n = name.normalize('NFKC');
  if (NON_ALC.test(n)) return 'drink';
  switch (cat) {
    case '酒': return 'alcohol';
    case '飲料': return 'drink';
    case '油脂': return 'oil';
    case '菓子・デザート': case 'ナッツ・種': return 'snack';
    case '調味料': return /ドレッシング|マヨネーズ/.test(n) ? 'oil' : null;
    case '乳製品': return /牛乳|ミルク|ラテ|ドリンク|飲む/.test(n) && !NOT_DRINK.test(n) ? 'drink' : null;
    case undefined: case 'その他': case 'コンビニ': case '外食': case 'レシピ': break;
    default: return null;
  }
  for (const [k, re] of NAME_KIND) if (re.test(n) && !(k === 'drink' && NOT_DRINK.test(n))) return k;
  return null;
}

/** How a food id's category is known (the catalog's, or as remembered; undefined: unknown). */
export type CatOf = (id: string) => string | undefined;

/** The days a pick reads: `today` and QUICK_DAYS − 1 before it (Tokyo dates compare as text). */
function recent(entries: readonly FoodEntry[], today: LocalDate, days: number): FoodEntry[] {
  const t = Date.parse(`${today}T00:00:00Z`) - (days - 1) * 86_400_000;
  const from = new Date(t).toISOString().slice(0, 10);
  return entries.filter((e) => !e.rep && e.d >= from && e.d <= today);
}

/** An entry later than another: by its day, then by when it was logged (a back-filled one is its day's). */
const later = (a: FoodEntry, b: FoodEntry) => a.d > b.d || (a.d === b.d && a.at > b.at);

/** The most-counted key, the latest (`later`) breaking a tie, and that key's latest row. */
function top(rows: readonly FoodEntry[], key: (r: FoodEntry) => string): { key: string; last: FoodEntry } | null {
  const by = new Map<string, { n: number; last: FoodEntry }>();
  for (const r of rows) {
    const k = key(r), c = by.get(k);
    if (!c) by.set(k, { n: 1, last: r });
    else {
      c.n++;
      if (later(r, c.last)) c.last = r;
    }
  }
  let best: { key: string; n: number; last: FoodEntry } | null = null;
  for (const [k, c] of by) if (!best || c.n > best.n || (c.n === best.n && later(c.last, best.last))) best = { key: k, ...c };
  return best && { key: best.key, last: best.last };
}

/**
 * The person's usual food of `kind` (their `entries`, real ones), as a new entry would log it: the food they logged
 * most often in the window (the latest a tie's winner), its latest snapshot, at the amount (grams and portion label)
 * they logged it most at (the latest a tie's). Null: none of the kind.
 */
export function usualOf(entries: readonly FoodEntry[], kind: QuickKind, catOf: CatOf, today: LocalDate, days = QUICK_DAYS): { f: FoodSnap; g: number } | null {
  const mine = recent(entries, today, days).filter((e) => kindOf(catOf(e.f.id), e.f.n) === kind);
  const food = top(mine, (e) => e.f.id);
  if (!food) return null;
  const amt = top(mine.filter((e) => e.f.id === food.key), (e) => `${e.g}|${e.f.u ?? ''}`)!.last;
  const { u: _, ...rest } = food.last.f;
  return { f: amt.f.u ? { ...rest, u: amt.f.u } : rest, g: amt.g };
}

/** A meal's kinds, in the row's order: its own (MEAL_KINDS) and any the person has logged in it in the window. */
export function quickKinds(meal: Meal, entries: readonly FoodEntry[], catOf: CatOf, today: LocalDate, days = QUICK_DAYS): QuickKind[] {
  const has = new Set<QuickKind>(MEAL_KINDS[meal]);
  for (const e of recent(entries, today, days)) {
    if (e.m !== meal) continue;
    const k = kindOf(catOf(e.f.id), e.f.n);
    if (k) has.add(k);
  }
  return QUICK_KINDS.filter((k) => has.has(k));
}
