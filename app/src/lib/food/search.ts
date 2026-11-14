// The food search's index and ranking (ported from the calorie PoC's core/search.js). Pure: the caller owns the lists.
import { searchKey } from './text.ts';
import type { Item } from './types.ts';

/** An item as the search sees it: its name's and aliases' keys, every searchable field joined (`h`), its curated boost
 *  and its rank penalty. */
export interface Entry {
  it: Item;
  n: string;
  al: string[];
  h: string;
  pop: number;
  pen: number;
  /** The name's head as a key (headOf), built on its first prefix hit. */
  hd?: string;
  /** Its brand's keys, whole then each word (brandKeys): a query word matches a brand only from the start of one, never
   *  inside it (「ラテ」 is not 天ぷ「らて」んや's); `h` holds no brand. */
  b?: readonly string[];
}

/** Each curated pop level (1–3) outweighs a little over half a match tier, so 食パン (substring, pop 3) beats パン粉
 *  (prefix, pop 1). */
const POP_WEIGHT = 0.6;
/** A rare or lab form the data flags pop -1 (a cut vegetable's washes, grated juice, 素揚げ, a meat's 脂身 alone, a story-named
 *  school lunch): 2.5 tiers down, under the name substrings, so an exact head (キャベツ カット 常法洗浄 for キャベツ) never
 *  ranks with the food itself. */
const RARE_FORM = 2.5;
/** A `secondary` dataset's items (regional, school lunch, products) rank below a core item a curated alias matches. */
export const SECONDARY_PENALTY = 1.5;
/** A packaged product (db.ts PRODUCT_SOURCES) ranks a little below the other secondary items too: たまご finds 卵, not
 *  a brand called たまご. */
export const PRODUCT_PENALTY = 0.5;

/** An item's searchable fields as keys, in this order: its name, `full`, each alias, `en`, `brand`, the barcode
 *  (`jan`), `cat`. scripts/food-data.ts ships them joined by a space (`keys`: no key holds one, nor a query token),
 *  so loading the catalog builds none. */
export function keysOf(it: Item): string[] {
  return [searchKey(it.name), searchKey(it.full), ...(it.aliases ?? []).map(searchKey), searchKey(it.en), searchKey(it.brand), it.jan ?? '', searchKey(it.cat)];
}

/** A brand's keys (Entry `b`): its key, then its words' (split on spaces and ・: 「明治 ザ・チョコレート」 is found by
 *  ちょこ); once per brand in `pool` (a dataset's: a chain's 450 shops, the products' 11k makers, shared by their items). */
function brandKeys(brand: string, pool?: Map<string, readonly string[]>): readonly string[] {
  let b = pool?.get(brand);
  if (b) return b;
  b = [...new Set([brand, ...brand.split(/[\s　・･/／]+/)].map(searchKey).filter(Boolean))];
  pool?.set(brand, b);
  return b;
}

/** A query word (a key) in an entry: in its fields but the brand anywhere, or at the start of its brand or a word of it. */
export const holds = (e: Entry, t: string): boolean => e.h.includes(t) || (e.b?.some((k) => k.startsWith(t)) ?? false);

export function entryOf(it: Item, pen = 0, brands?: Map<string, readonly string[]>): Entry {
  const na = it.aliases?.length ?? 0;
  const shipped = typeof it.keys === 'string' ? it.keys.split(' ') : null;
  // the shipped keys, unless missing or not this item's (data cached before they were): built here then
  const keys = shipped?.length === na + 6 ? shipped : keysOf(it);
  // (the brand's key out of `h`: matched by `b` alone)
  const bi = na + 3;
  const h = keys[bi] ? keys.filter((_, i) => i !== bi).join(' ') : keys === shipped ? it.keys! : keys.join(' ');
  const e: Entry = { it, n: keys[0], al: na ? keys.slice(2, 2 + na) : [], h, pop: it.pop ?? 0, pen };
  if (keys[bi] && it.brand) e.b = brandKeys(it.brand, brands);
  return e;
}

/** A name up to its first bracket or space, as a key (「水（ミネラルウォーター）」 → 水, 「鮭（しろさけ） 生」 → 鮭). */
export const headOf = (name: string): string => searchKey(name.split(/[（(［[【\s　]/)[0]);
/** An alias exact: level with a name's prefix, a hair under it (鶏むね: 鶏むね肉 before サラダチキン, whose alias it is). */
const ALIAS_EXACT = 1.05;

/** Lower is better: the name exact (or its head: 水 finds 水（ミネラルウォーター）), then its prefix or an alias exact
 *  (level: たまご finds 卵 as ごはん finds ごはん（精白米）), a substring of the name, then an alias's prefix, a substring
 *  of one, then any other field. */
export function tierOf(e: Entry, q: string): number {
  if (e.n === q) return 0;
  if (e.n.startsWith(q)) return (e.hd ??= headOf(e.it.name)) === q ? 0 : 1;
  if (e.al.includes(q)) return ALIAS_EXACT;
  if (e.n.includes(q)) return 2;
  if (e.al.some((a) => a.startsWith(q))) return 4;
  if (e.al.some((a) => a.includes(q))) return 5;
  return 6;
}

/** MEXT's lookalikes a shopper never picks between (the lead): 豚 中型種 beside 大型種 (the supermarket's), 親鶏 beside
 *  若どり, 交雑牛 beside 国産牛; out of the results unless a word of the query names them (its kanji or reading). 和牛,
 *  国産牛 and 輸入牛 stay: they change what you buy. */
const LOOKALIKE: readonly [RegExp, readonly string[]][] = [
  [/（中型種）/, ['中型種', 'ちゅうがた']],
  [/^親鶏/, ['親鶏', '親どり', 'おやどり']],
  [/^交雑牛/, ['交雑', 'こうざつ']]
];
/** Parts seldom eaten alone (a meat's 脂身 by itself, a 皮): a tier under the usual cuts. */
const RARE_PART = /(^|\s)皮(\s|$)|(^|[\s（])脂身(\s|$)/;
const lookalike = (it: Item, q: string): boolean => LOOKALIKE.some(([re, words]) => re.test(it.name) && !words.some((w) => q.includes(searchKey(w))));
const rare = (it: Item): number => (RARE_PART.test(it.name) && (it.cat === '肉' || /(^|\s)皮(\s|$)/.test(it.name)) ? 1 : 0);

/** Every query token (split on spaces) in an item's text, best first. One row per normalized name + kcal, one per
 *  cross-source verify group (`groupOf`): a group shows its best non-secondary hit (else its best) at the place of its
 *  best hit, so a school lunch's closer name never hides the core item; and one per food in its states (`vg`): its
 *  best hit, the default state among the equally good (豚ロース: 生; 豚ロース 焼き: 焼き, the one holding every word). With
 *  `all`, an empty query finds every entry (a shop's whole menu: db.ts searchFoods); `onHit`, told each entry found
 *  (db.ts findFoods' shop chips, from this pass: never a second one). */
export function search(entries: readonly Entry[], query: string, limit = 60, groupOf: (id: string) => number | undefined = () => undefined, all = false, onHit?: (e: Entry) => void): Item[] {
  const tokens = query.trim().split(/[\s　]+/).map(searchKey).filter(Boolean);
  if (!tokens.length && !all) return [];
  const q = tokens.join('');
  type Hit = { e: Entry; s: number; i: number };
  const hits: Hit[] = [];
  for (let i = 0; i < entries.length; i++) {
    const e = entries[i];
    if (tokens.every((t) => holds(e, t)) && !lookalike(e.it, q)) {
      hits.push({ e, s: tierOf(e, q) + e.pen - (e.pop < 0 ? -RARE_FORM : e.pop * POP_WEIGHT) + rare(e.it), i });
      onHit?.(e);
    }
  }
  /** The ranking: score, then curated pop, then the shorter name, then the list's order. */
  const before = (a: Hit, b: Hit): number => a.s - b.s || b.e.pop - a.e.pop || a.e.n.length - b.e.n.length || a.i - b.i;
  // Each group's representative: its best non-secondary hit, else its best.
  const best = new Map<number, { any: Hit; core?: Hit }>();
  for (const h of hits) {
    const g = groupOf(h.e.it.id);
    if (g === undefined) continue;
    const r = best.get(g);
    if (!r) best.set(g, { any: h, core: h.e.pen <= 0 ? h : undefined });
    else {
      if (before(h, r.any) < 0) r.any = h;
      if (h.e.pen <= 0 && (!r.core || before(h, r.core) < 0)) r.core = h;
    }
  }
  // Each food's state to show: its best hit, the default (its own vg) at a tie.
  const state = new Map<string, Hit>();
  for (const h of hits) {
    const v = h.e.it.vg;
    if (!v) continue;
    const r = state.get(v);
    const dh = h.e.it.id === v, dr = r?.e.it.id === v;
    if (!r || (h.s !== r.s ? h.s < r.s : dh !== dr ? dh : before(h, r) < 0)) state.set(v, h);
  }
  // Ranked a score at a time (scores are a few discrete values): only as many hits sorted as the top `limit` need.
  const byScore = new Map<number, Hit[]>();
  for (const h of hits) (byScore.get(h.s) ?? byScore.set(h.s, []).get(h.s)!).push(h);
  const seen = new Set<string | number>();
  const out: Item[] = [];
  for (const score of [...byScore.keys()].sort((x, y) => x - y)) {
    for (const h of byScore.get(score)!.sort(before)) {
      const v = h.e.it.vg;
      if (v && seen.has(`v:${v}`)) continue;
      const hv = v ? state.get(v)! : h;
      const g = groupOf(hv.e.it.id);
      const r = g === undefined ? undefined : best.get(g)!;
      const e = r ? (r.core ?? r.any).e : hv.e;
      if (v) seen.add(`v:${v}`);
      const k = `${e.n}|${e.it.kcal}`;
      if (seen.has(k) || (g !== undefined && seen.has(g))) continue;
      seen.add(k);
      if (g !== undefined) seen.add(g);
      if (out.push(e.it) >= limit) return out;
    }
  }
  return out;
}

/** Spellings a menu writes one way and the catalog's names another, as keys: 近いもの looks for them as the catalog
 *  writes them (とんこつ醤油 → 豚骨醤油ラーメン). */
const SPELLINGS: readonly [RegExp, string][] = [[/とんこつ/g, '豚骨']];

/** How much of a query (a key) a name or alias holds (`n`): each run of it one holds (2 characters or more, 3 for
 *  kana alone: not 「めん」 of らーめん in メンマ), its length squared, so one long run beats two short ones; and where
 *  its first run starts (`at`: what's typed first is the dish, the toppings after it). */
function covered(names: readonly string[], q: string): { n: number; at: number } {
  const held = (p: string) => names.some((n) => n.includes(p));
  let n = 0, at = -1;
  for (let i = 0; i < q.length - 1; ) {
    let j = i + 2;
    // (no word starts with ー or a small kana: not 「ーめん」 of らーめん in チャーシューメンマ)
    if (/^[ーぁぃぅぇぉっゃゅょゎ]/.test(q[i]) || !held(q.slice(i, j))) {
      i++;
      continue;
    }
    while (j < q.length && held(q.slice(i, j + 1))) j++;
    if (!/^[ぁ-ゖー]{2}$/.test(q.slice(i, j))) (n += (j - i) ** 2), at < 0 && (at = i);
    i = j;
  }
  return { n, at };
}

/** A secondary dataset's item (a product, a regional dish) holds 4/5 as much in 近いもの: the generic food before a
 *  brand's whose name holds a little more of the query. */
const SECONDARY_NEAR = 0.8;

/** A chain's menu (Kalori: an item with a `shop`) takes at most this share of 近いもの's rows: its ~54k long dish names
 *  hold a run of most queries, and would push the generic foods (ラーメン（醤油）) out of sight. */
const CHAIN_NEAR_SHARE = 0.25;
/** The packaged products (Open Food Facts, `off:`) likewise at most half: their ~30k names (豚骨醤油ラーメン in five
 *  makers' spellings) would too. */
const PRODUCT_NEAR_SHARE = 0.5;

/** 近いもの, when search() finds nothing (「とんこつ醤油ラーメン味玉チャーシュー増し」): the items whose name or an alias
 *  holds the most of the query (covered: 豚骨醤油ラーメン first), then the earlier in it, a core, popular, shorter name
 *  first at a tie; one row per name + kcal and per food in its states, a chain's menu in a quarter of them at most, a
 *  product in half. */
export function nearby(entries: readonly Entry[], query: string, limit = 8): Item[] {
  const q = SPELLINGS.reduce((k, [re, to]) => k.replace(re, to), searchKey(query));
  if (q.length < 2) return [];
  const hits: { e: Entry; c: { n: number; at: number } }[] = [];
  for (const e of entries) {
    const c = covered([e.n, ...e.al], q);
    if (e.pen > 0) c.n *= SECONDARY_NEAR;
    if (c.n >= 9 && !lookalike(e.it, q)) hits.push({ e, c });
  }
  hits.sort((a, b) => b.c.n - a.c.n || a.c.at - b.c.at || a.e.pen - b.e.pen || b.e.pop - a.e.pop || a.e.n.length - b.e.n.length);
  const seen = new Set<string>();
  const out: Item[] = [];
  let chains = Math.max(1, Math.floor(limit * CHAIN_NEAR_SHARE));
  let products = Math.max(1, Math.floor(limit * PRODUCT_NEAR_SHARE));
  for (const { e } of hits) {
    const k = e.it.vg ? `v:${e.it.vg}` : `${e.n}|${e.it.kcal}`;
    const product = e.it.id.startsWith('off:');
    if (seen.has(k) || (e.it.shop && !chains) || (product && !products)) continue;
    seen.add(k);
    if (e.it.shop) chains--;
    if (product) products--;
    if (out.push(e.it) >= limit) break;
  }
  return out;
}
