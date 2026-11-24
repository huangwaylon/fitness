// 保存した場所's search (docs/places.md "Search"): the index built once per payload and per facets/descriptions file
// (each place's name, category words, kind, area names, note and description keyed: text.ts; its effective category,
// hours, rating), and one search per keystroke over it: the chips filter (a kind's chips any of them, the kinds all;
// a `not` chip excludes), the free text's words each matched (a name's prefix, then its substring, a category or
// kind word, an area name, the note, the description; a name's fuzzy hit last; a word nothing has is ignored, not
// zeroing the list), ranked by that tier, then the sort (近い順 from the anchor, ties within 200 m by rating; 評価順
// by the prior-weighted rating; 保存が新しい順). Each search ~1 ms over 3,500 places (places.test.ts' perf check,
// PLACES_PERF=1); typed arrays a search, nothing per place. Pure.
import { PLACE_CAT_KEYS, WEEK_MIN, type Period, type Place, type PlaceCat } from '../contract/places.ts';
import { areaOf, type Area } from './area.ts';
import { catTerms, catWords, FEATURES, textKeys, textWords } from './cats.ts';
import type { DescTable, FacetTable } from './facets.ts';
import { kindInfo, type KindInfo } from './kinds.ts';
import { areaAliases, areaGroup } from './romaji.ts';
import { openIn, opensOn, weekMin } from './hours.ts';
import { NEAR_M, SOFT_KEYS, STOP, vocab, type Chip, type Meal, type Vocab } from './query.ts';
import { placeKey, subseq } from './text.ts';
import { distM, type LL } from './geo.ts';

export type Sort = 'near' | 'rate' | 'new';
export const SORTS: readonly Sort[] = ['near', 'rate', 'new'];

export interface Entry {
  p: Place;
  area: Area;
  /** The effective category (Google's kind over the relay's where the kind is sure: kinds.ts) and the relay's pair
   *  when it differs (a chip matches either). */
  cat: PlaceCat;
  sub: string;
  alt: { cat: PlaceCat; sub: string } | null;
  /** Google's kind (Japanese, '' none), the rating (null none) and its count, the prior-weighted rating (0 unrated). */
  kind: string;
  r: number | null;
  rn: number;
  q: number;
  /** The vendored hours (the facets'; null unknown: 営業時間は不明, never open in a chip). */
  hours: Period[] | null;
  /** Whether the kind is a sure one (kinds.ts hard: it set the category). */
  hard: boolean;
  /** The keys: name, category words, the kind's words, area names, note, description ('\u0001' between words); the
   *  area names' keys one by one. */
  n: string;
  /** The name's words keyed one by one, SEP-bounded (a Latin word matched whole: park isn't parking). */
  nw: string;
  /** Category words and the kind's words, SEP-bounded (a word matched whole: そば isn't 中華そば). */
  c: string;
  k: string;
  a: string;
  t: string;
  d: string;
  as: string[];
  /** All of the keys above, joined (a word's first look). */
  all: string;
}

const allOf = (e: Entry): string => [e.n, e.nw, e.c, e.k, e.a, e.t, e.d].join(SEP);

export interface Index {
  entries: Entry[];
  /** Each area name's centre (the mean of its places) and count. */
  areas: Map<string, { at: LL; n: number }>;
  vocab: Vocab;
  /** The descriptions (null till they're in: a word none has may yet be in one). */
  descs: DescTable | null;
  /** Their fetch failed: words nothing has are let go as when they're in. */
  descsOut: boolean;
  /** An area chip's reach: the area names (keyed) it stands for (its other spellings, the places in it: romaji.ts;
   *  a romanised one within 2 km of a kanji one) and their centre; computed once a name. */
  reach(name: string): Reach;
}

/** The area names (keyed) an area chip matches, their places' centre (its own spellings' places, else the group's;
 *  null: none). */
interface Reach {
  keys: Set<string>;
  at: LL | null;
  /** How far about the centre it reaches (its places' 90th percentile distance, NEAR_M to SPREAD_MAX_M). */
  m: number;
}

const SEP = '\u0001';
/** The rating's prior: q = (r·rn + PRIOR·PRIOR_N) / (rn + PRIOR_N). */
const PRIOR = 4.2, PRIOR_N = 50;
/** 近い順's tie: places within this of each other by distance are ordered by q. */
const TIE_M = 200;
/** A romanised area name (Shibuya, from Google's romanised addresses) is a kanji one's when their centres are this
 *  close (and the gazetteer didn't say). */
const ALIAS_M = 2000;
/** An area's reach about its centre at most (a city's suburbs: Auckland's, Seattle's). */
const SPREAD_MAX_M = 20_000;
/** Me this near an area (past its spread): its places sorted from me. */
const NEAR_AREA_M = 10_000;
/** A city with this many places stands for its name over its prefecture (京都 = 京都市, not 京都府). */
const CITY_MIN = 10;

/** A text's words keyed, SEP-bounded. */
const wordsKey = (s: string): string => SEP + s.normalize('NFKC').split(/[\s,.・/()&'’-]+/).map(placeKey).filter(Boolean).join(SEP) + SEP;
/** `w` a whole word of a SEP-bounded key (a Latin one's plural too: cafes). */
const token = (key: string, w: string): boolean => key.includes(SEP + w + SEP) || (isLatin(w) && key.includes(SEP + w + 's' + SEP));

const quality = (r: number | null, rn: number): number => (r ? (r * rn + PRIOR * PRIOR_N) / (rn + PRIOR_N) : 0);
const isLatin = (k: string): boolean => /^[a-z0-9]+$/.test(k);

/** The effective category: a sure kind's (hard) over the relay's, the relay's pair kept as the alt (matched after the
 *  effective ones: a 中華料理店 it filed as 居酒屋 ranks after the izakayas); a vague kind's (soft) only into an empty sub
 *  of the same top or an その他 top, else its pick the alt. */
function catOf(p: Place, k: KindInfo | undefined): { cat: PlaceCat; sub: string; alt: { cat: PlaceCat; sub: string } | null } {
  const own = { cat: p.cat, sub: p.sub };
  if (!k) return { ...own, alt: null };
  if (k.hard) return k.cat !== p.cat || (k.sub && k.sub !== p.sub) ? { cat: k.cat, sub: k.sub, alt: own } : { ...own, alt: null };
  if (p.cat === 'その他') return { cat: k.cat, sub: k.sub, alt: null };
  if (!p.sub && k.cat === p.cat && k.sub) return { cat: p.cat, sub: k.sub, alt: null };
  return { ...own, alt: k.cat !== p.cat || (k.sub && k.sub !== p.sub) ? { cat: k.cat, sub: k.sub } : null };
}

export function buildIndex(rows: readonly Place[], facets?: FacetTable | null, descs?: DescTable | null, people: readonly string[] = []): Index {
  const sums = new Map<string, [number, number, number]>();
  /** Each kind's info and its words keyed (one lookup per kind, not per place). */
  const kinds = new Map<string, { info: KindInfo | undefined; words: string[] }>();
  /** The category words keyed per (top, sub), the area names keyed per name: a handful and a few hundred of each over
   *  3,400 places (track C: placeKey on them was most of the build). */
  const catKeys = new Map<string, string>(), areaKeys = new Map<string, string>();
  const areaKey = (nm: string) => {
    let k = areaKeys.get(nm);
    if (k === undefined) areaKeys.set(nm, (k = placeKey(nm)));
    return k;
  };
  const entries = rows.map((p): Entry => {
    const area = areaOf(p.addr);
    for (const nm of area.names) {
      const s = sums.get(nm) ?? [0, 0, 0];
      ((s[0] += p.lng), (s[1] += p.lat), s[2]++);
      sums.set(nm, s);
    }
    const f = facets?.get(p.id);
    const kind = f?.kind ?? '';
    let ki = kind ? kinds.get(kind) : undefined;
    if (kind && !ki) {
      const info = kindInfo(kind);
      kinds.set(kind, (ki = { info, words: [...new Set([kind, ...(info?.words ?? [])].map(placeKey))] }));
    }
    const { cat, sub, alt } = catOf(p, ki?.info);
    const ck = `${cat}\u0001${sub}`;
    let c = catKeys.get(ck);
    if (c === undefined) catKeys.set(ck, (c = [...catWords(cat), ...(sub ? catWords(cat, sub) : [])].map(placeKey).join(SEP)));
    const as = area.names.map(areaKey);
    const r = f?.r ?? null, rn = f?.rn ?? 0;
    return {
      p, area, cat, sub, alt, kind, hard: !!ki?.info?.hard, r, rn, q: quality(r, rn), hours: f?.hours ?? null,
      n: placeKey(p.name), nw: wordsKey(p.name), c: SEP + c + SEP, k: ki ? SEP + ki.words.join(SEP) + SEP : '', a: as.join(SEP), t: placeKey(p.note),
      d: placeKey(descs?.get(p.id)), as, all: ''
    };
  });
  for (const e of entries) e.all = allOf(e);
  const areas = new Map([...sums].map(([k, s]) => [k, { at: [s[0] / s[2], s[1] / s[2]] as LL, n: s[2] }]));
  // one spelling an area is shown by: its Japanese one when the gazetteer knows it (Shibuya → 渋谷, Seattle → シアトル)
  const shown = new Map<string, string>();
  const display = (name: string): string => {
    let d = shown.get(name);
    if (d === undefined) {
      const ja = /[一-鿿ぁ-ゖァ-ヺ]/.test(name) ? [] : areaAliases(name);
      d = ja.find((x) => /[一-鿿]/.test(x)) ?? ja.find((x) => /[ァ-ヺ]/.test(x)) ?? name;
      // (as a row says it: a ward or city without its 区/市 when that's a name too, 渋谷区 → 渋谷)
      if (d.length >= 3 && /[市区町村]$/.test(d) && areas.has(d.slice(0, -1))) d = d.slice(0, -1);
      shown.set(name, d);
    }
    return d;
  };
  for (const e of entries) if (e.area.label) e.area = { ...e.area, label: display(e.area.label) };
  // the area names the places have, keyed; every other spelling of each (romaji.ts)
  const byKey = new Set([...areas.keys()].map(placeKey).filter(Boolean));
  /** The prefectures' names, keyed (each address's last name: area.ts). */
  const prefs = new Set(entries.map((e) => e.area.names.at(-1) ?? '').filter((n) => /[都道府県]$/.test(n) && n.length >= 3).map(placeKey));
  const aliases: [string, string][] = [];
  for (const a of areas.keys()) for (const w of areaAliases(a)) aliases.push([w, a]);
  // a romanised name whose centre is within ALIAS_M of a kanji one's (the most places of those near): the same area
  const near = new Map<string, string>();
  const kanji = [...areas].filter(([a, x]) => !isLatin(placeKey(a)) && x.n >= 3);
  for (const [a, x] of areas) {
    if (!isLatin(placeKey(a)) || areaAliases(a).length) continue;
    let best: [string, number] | null = null;
    for (const [b, y] of kanji) if (distM(x.at, y.at) <= ALIAS_M && (!best || y.n > best[1])) best = [b, y.n];
    if (best) (near.set(placeKey(a), placeKey(best[0])), near.set(placeKey(best[0]), placeKey(a)), aliases.push([a, best[0]]));
  }
  const reaches = new Map<string, Reach>();
  const reach = (name: string): Reach => {
    let r = reaches.get(name);
    if (r) return r;
    let own = new Set([name, ...areaAliases(name)].map(placeKey).filter((k) => k && byKey.has(k)));
    own.add(placeKey(name));
    for (const k of [...own]) if (near.has(k)) own.add(near.get(k)!);
    // (a name that's a city and its prefecture, 京都: the city, when it has places enough; else the prefecture's all)
    const city = new Set([...own].filter((k) => !prefs.has(k)));
    const inCity = city.size < own.size ? entries.reduce((c, e) => c + (e.as.some((k) => city.has(k)) ? 1 : 0), 0) : 0;
    const narrow = inCity >= CITY_MIN;
    if (narrow) own = city;
    const keys = new Set([...own, ...(narrow ? [] : areaGroup(name).map(placeKey).filter((k) => k && byKey.has(k)))]);
    // (the centre the area's own places', not the group's: Seattle's, not Redmond's with it)
    let x = 0, y = 0, n = 0, gx = 0, gy = 0, gn = 0;
    for (const e of entries) {
      if (e.as.some((k) => own.has(k))) ((x += e.p.lng), (y += e.p.lat), n++);
      else if (e.as.some((k) => keys.has(k))) ((gx += e.p.lng), (gy += e.p.lat), gn++);
    }
    const at: LL | null = n ? [x / n, y / n] : gn ? [gx / gn, gy / gn] : null;
    // (its places' spread about it: a city's suburbs, a ward's edges; 1.5 to 20 km)
    const ds: number[] = [];
    if (at) for (const e of entries) if (e.as.some((k) => (n ? own : keys).has(k))) ds.push(distM(at, [e.p.lng, e.p.lat]));
    ds.sort((a, b) => a - b);
    const m = Math.min(SPREAD_MAX_M, Math.max(NEAR_M, ds[Math.floor(ds.length * 0.9)] ?? 0));
    reaches.set(name, (r = { keys, at, m }));
    return r;
  };
  // a sub's word naming a sure kind narrower than the sub (神社 of 寺社, not 宿 of 泊まる): the kind its places have most
  const kindByWord = new Map<string, Map<string, number>>();
  for (const e of entries) if (e.kind) for (const w of kinds.get(e.kind)!.words) {
    const m = kindByWord.get(w) ?? new Map<string, number>();
    kindByWord.set(w, m.set(e.kind, (m.get(e.kind) ?? 0) + 1));
  }
  /** The kind a word names: the one it's earliest a word of (フォー レストラン for pho, not ベトナム料理店 that lists it),
   *  then the most places'. */
  const topKind = (w: string): string => {
    const at = (k: string) => kinds.get(k)!.words.indexOf(w);
    return [...kindByWord.get(w)!].sort((a, b) => at(a[0]) - at(b[0]) || b[1] - a[1] || (a[0] < b[0] ? -1 : 1))[0][0];
  };
  const specific = new Map<string, string>();
  for (const { word, pick } of catTerms()) {
    const w = placeKey(word), own = placeKey(pick.sub || pick.cat);
    if (!kindByWord.has(w) || w === own || !pick.sub) continue;
    const top = [...kindByWord.get(w)!].sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1))[0][0], k = kinds.get(top)!; // (the most places')
    // (and no other sure kind of the sub has the word: museum is 博物館's and 美術館's, temple only 仏教寺院's)
    const rivals = [...kindByWord.get(w)!.keys()].some((x) => x !== top && kinds.get(x)!.info?.hard && kinds.get(x)!.info?.sub === pick.sub);
    if (k.info?.hard && k.info.sub === pick.sub && !k.words.includes(own) && !rivals) specific.set(w, top);
  }
  // every kind word (thai, 韓国料理, 水族館, 城, hot spring) a chip of its kind (the one its places have most), and the
  // whole words a name or description holds that are never split into terms (パンケーキ)
  const kindTerms: [string, Chip][] = [];
  // (not a word with other spellings: brunch, dumpling stay text, matched with ブランチ, 餃子 in descriptions too)
  for (const w of kindByWord.keys()) {
    const top = topKind(w), info = kinds.get(top)!.info;
    if (info && !textWords(w).length && !(/^[a-z]{4,}s$/.test(w) && textWords(w.slice(0, -1)).length)) kindTerms.push([w, { k: 'cat', cat: info.cat, sub: info.sub, w, kind: top }]);
  }
  const known = new Set([...textKeys(), ...[...kindByWord.keys()].filter((w) => w.length >= 3)]);
  // a word the vocabulary hasn't but the gazetteer has, with places of the list in it (Seoul, ベトナム, Tokyo)
  const gazetteer = (word: string): string | null => {
    const k = placeKey(word);
    // (a glue word only capitalised: Nice, not nice)
    if (k.length < 2 || (STOP.has(k) && !/^[A-Z]/.test(word)) || (isLatin(k) && k.length < 4) || (/^[ぁ-ゖ]+$/.test(k) && k.length < 3)) return null;
    // (only a name the gazetteer knows: a junk word costs no pass over the places)
    if (!byKey.has(k) && !areaAliases(word).length && !areaGroup(word).length) return null;
    return reach(word).at ? word : null;
  };
  return { entries, areas, vocab: vocab(areas.keys(), { people, aliases, specific, gazetteer, kinds: kindTerms, known, display }), descs: descs ?? null, descsOut: false, reach };
}

/** The index with the descriptions in (each entry's key set in place: no vocabulary or areas rebuilt), or with their
 *  fetch given up (`null`: a word nothing has is then let go as when they're in). A new object (the sheet re-searches). */
export function withDescs(ix: Index, descs: DescTable | null): Index {
  if (descs) for (const e of ix.entries) ((e.d = placeKey(descs.get(e.p.id))), (e.all = allOf(e)));
  return { ...ix, descs, descsOut: !descs };
}

export interface Ctx {
  /** Epoch ms (the hours' now). */
  now: number;
  /** My location, if known. */
  me: LL | null;
  /** The map's centre (近い順's last resort). */
  view: LL | null;
  sort: Sort;
  /** Browse mode's box, [west, south, east, north] (PlacesView: the map above the sheet's peek): only the places in it,
   *  counted per category in it, 近い順 from its centre (not shown as a distance). */
  box?: Box | null;
}

export type Box = readonly [number, number, number, number];
/** In the box (west > east: across the antimeridian). */
export const inBox = (b: Box, lng: number, lat: number): boolean =>
  lat >= b[1] && lat <= b[3] && (b[0] <= b[2] ? lng >= b[0] && lng <= b[2] : lng >= b[0] || lng <= b[2]);

export interface Result {
  /** Entry indexes in order. */
  list: number[];
  /** Metres from the anchor, by entry index (NaN: no anchor). */
  dist: Float64Array;
  /** What 近い順 measured from, and whether it's shown as a distance (not the map's centre). */
  anchor: LL | null;
  shown: boolean;
  /** The matches per top category before the category chips (their chips' counts). */
  perCat: Map<PlaceCat, number>;
  /** 現在地周辺 is asked for but there is no location yet. */
  needMe: boolean;
  /** The free words nothing has (dropped from the search, shown: 「“デート”は無視しました」), as typed. */
  ignored: string[];
  /** Why a listed entry matched when it's only by its note or description (the row's 「メモ：…」/「説明：…」). */
  why: Map<number, 'note' | 'desc'>;
  /** What the quick chips would give with these: 営業中 added, ★4.5以上 added (their counts). */
  quick: { open: number; rate: number };
  /** The area chips found none, so these are within this many metres of the area (WIDE_M; 0: not widened). */
  wide: number;
}

/** The quick rating chip's floor (★4.5以上). */
export const QUICK_RATE = 4.5;

const T_NOTE = 4, T_DESC = 5, T_FUZZY = 6;

/** One free word's tier for an entry: 0 a name's prefix, 1 its substring, 2 a category or kind word, 3 an area name,
 *  4 the note, 5 the description, 6 a fuzzy name hit; -1 none. A word's other spellings (`alts`: arashiyama's 嵐山,
 *  matcha's 抹茶) count as it, but never fuzzily. */
function wordTier(e: Entry, xs: readonly Probe[], fuzzy: boolean): number {
  let best = -1;
  for (const p of xs) {
    const x = p.x;
    // (most places have none of it: one look over all their text first)
    if (!e.all.includes(x) && !(fuzzy && p.own)) continue;
    let t = -1;
    const at = p.lat ? (e.n.startsWith(x) ? 0 : e.nw.includes(p.start) ? 1 : -1) : e.n.indexOf(x);
    if (at === 0) t = 0;
    else if (at > 0) t = 1;
    else if (p.own && (e.c.includes(p.tok) || (p.lat && e.c.includes(p.toks)))) t = 2;
    else if (e.k && (e.k.includes(p.tok) || (p.lat && e.k.includes(p.toks)))) t = e.k.startsWith(p.tok) ? 2 : 3; // (the kind itself, then its other words)
    else if (p.long && e.k.includes(x)) t = 3;
    else if (p.own && (x.length >= 3 ? e.a.includes(x) : e.as.includes(x))) t = 3; // (海 isn't 熱海)
    else if (e.t.includes(x)) t = T_NOTE;
    else if (p.desc && e.d.includes(x)) t = T_DESC;
    else if (fuzzy && p.own && subseq(e.n, x)) t = T_FUZZY;
    if (t >= 0 && (best < 0 || t < best)) best = t;
    if (best === 0) break;
  }
  return best;
}

/** A spelling of a free word, ready to look for (its whole-word forms built once a search, not once a place). */
interface Probe {
  x: string;
  /** The word as typed (not another spelling: only it matches categories, areas, fuzzily). */
  own: boolean;
  lat: boolean;
  tok: string;
  toks: string;
  start: string;
  long: boolean;
  desc: boolean;
}
const probe = (x: string, own: boolean): Probe => {
  const lat = isLatin(x);
  return { x, own, lat, tok: SEP + x + SEP, toks: SEP + x + 's' + SEP, start: SEP + x, long: !lat && x.length >= 3, desc: lat ? x.length >= 4 : nameWord(x) };
};

/** The free text's tier for entry `i`: every word must hit, the worst tier counts (each word's tiers read once an
 *  index: Word.tiers). */
function tierOf(i: number, ws: readonly Word[]): number {
  let worst = 0;
  for (const w of ws) {
    const t = w.tiers[i];
    if (t < 0) return -1;
    if (t > worst) worst = t;
  }
  return worst;
}

/** A free word, keyed, with its other spellings keyed. */
interface Word {
  k: string;
  alts: string[];
  xs: Probe[];
  /** A fuzzy name hit counts (only for a word nothing has as it is: a typo). */
  fuzzy: boolean;
  /** Each entry's tier for it (-1 none): one pass over the places a word, not one a keystroke. */
  tiers: Int8Array;
  /** Whether any entry has it. */
  any: boolean;
}

function wordOf(ix: Index, k: string, raw: string): Word {
  const one = /^[a-z]{4,}s$/.test(k) ? k.slice(0, -1) : '';
  const alts = [...new Set([...areaAliases(raw), ...textWords(k), ...(one ? textWords(one) : [])].map(placeKey))].filter((x) => x.length >= 2 && x !== k);
  const xs = [probe(k, true), ...alts.map((x) => probe(x, false))];
  const tiersOf = (fuzzy: boolean) => {
    const t = new Int8Array(ix.entries.length);
    let any = false;
    ix.entries.forEach((e, i) => ((t[i] = wordTier(e, xs, fuzzy)), (any ||= t[i] >= 0)));
    return { t, any };
  };
  const exact = tiersOf(false);
  if (exact.any) return { k, alts, xs, fuzzy: false, tiers: exact.t, any: true };
  const fz = tiersOf(true);
  return { k, alts, xs, fuzzy: true, tiers: fz.t, any: fz.any };
}
const hitsAny = (_ix: Index, w: Word): boolean => w.any;
/** Each index's free words as read (a word typed stays the same over the keystrokes after it), and the pieces each
 *  let go. */
const reads = new WeakMap<Index, Map<string, Word[] | null>>();
const drops = new Map<string, string[]>();
const count = (ix: Index, ws: readonly Word[]): number => ix.entries.reduce((n, _, i) => n + (tierOf(i, ws) >= 0 ? 1 : 0), 0);
/** The n-element subsets of xs, in order. */
function choose<T>(xs: readonly T[], n: number): T[][] {
  if (n === 0) return [[]];
  if (xs.length < n) return [];
  const [h, ...t] = xs;
  return [...choose(t, n - 1).map((c) => [h, ...c]), ...choose(t, n)];
}
/** A Japanese word nothing has, in pieces: at particles (海が見える), at a katakana run's ends (見えるカフェ), and around
 *  the terms inside it, longest first (雨でも行ける美術館 → 雨, 行ける, 美術館). */
function pieces(raw: string, v: Vocab): string[] {
  return around(raw, v).flatMap((x) => (STOP.has(placeKey(x)) ? [x] : x.split(/[がをはもにでのと]/).flatMap((y) => y.split(/(?<=[ァ-ヺー])(?=[^ァ-ヺー])|(?<=[^ァ-ヺー])(?=[ァ-ヺー])/)))).filter(Boolean);
}

/** A compound nothing has whole: a term and kanji words (古民家カフェ: 古民家 + カフェ; not パン屋まるき, a name's kana). */
function compound(raw: string, v: Vocab): boolean {
  const ps = around(raw, v);
  return ps.length > 1 && ps.some((x) => !!v.terms.get(placeKey(x))?.chips.length) && ps.every((x) => v.terms.has(placeKey(x)) || /^[一-鿿]{2,}$/.test(x));
}

/** A line cut around the terms and glue words of 2 characters or more inside it, longest first (ところ whole, not と +
 *  ころ; the rest cut again). */
function around(part: string, v: Vocab): string[] {
  for (let i = 0; i < part.length; i++) for (let n = Math.min(part.length - i, 8); n >= 2; n--) {
    if (i === 0 && n === part.length) continue;
    const k = placeKey(part.slice(i, i + n));
    if (k.length >= 2 && (v.terms.get(k)?.chips.length || STOP.has(k))) return [...(i ? around(part.slice(0, i), v) : []), part.slice(i, i + n), ...around(part.slice(i + n), v)];
  }
  return part ? [part] : [];
}

/** The chips' filter for one search (everything but the free text and the category chips, which perCat counts
 *  before): built once a search. */
interface Plan {
  ws: Word[];
  ignored: string[];
  cats: CatQ[];
  /** A meal's minute (its places open then first; -1 none, or a time chip set). */
  mealAt: number;
  features: FeatureQ[];
  nots: Extract<Chip, { k: 'not' }>[];
  days: number[];
  ats: Extract<Chip, { k: 'at' }>[];
  areas: AreaQ[];
  areaAt: (LL | null)[];
  open: boolean;
  today: boolean;
  near: boolean;
  rate: number;
  recent: number;
  by: number[];
  memo: boolean;
  radius: number;
  where: Extract<Chip, { k: 'point' | 'centre' }> | undefined;
  whereR: number;
  anchor: LL | null;
  radiusAt: LL | null;
  shown: boolean;
}

function planOf(ix: Index, chips: readonly Chip[], text: string, ctx: Ctx, wide = 0): Plan {
  const raw = text.split(/[\s　]+/).filter(Boolean);
  const keys = raw.map(placeKey);
  // glue (in, the, の) let go beside anything else; a soft word (デート, cheap) always, said
  const glue = keys.some((k) => k && !STOP.has(k)) || chips.length > 0;
  const ws: Word[] = [], ignored: string[] = [];
  /** A word as it is, else its Latin singular (cafes, temples, dumplings), else (Japanese) its pieces; null: none hits. */
  const read = (w: string, k: string): Word[] | null => {
    const one = wordOf(ix, k, w);
    if (!one.fuzzy) {
      // (a compound: its pieces, all kept, when they find more: 古民家カフェ is every 古民家's カフェ, a name holding it
      // whole still first)
      if (!compound(w.normalize('NFKC'), ix.vocab)) return [one];
      const all = pieces(w.normalize('NFKC'), ix.vocab).map((x) => wordOf(ix, placeKey(x), x));
      return all.length > 1 && all.every((x) => !x.fuzzy) && count(ix, all) > count(ix, [one]) ? all : [one];
    }
    if (/^[a-z]{4,}s$/.test(k)) for (const x of [k.slice(0, -1), ...(k.endsWith('es') ? [k.slice(0, -2)] : [])]) {
      const s1 = wordOf(ix, x, w.slice(0, w.length - (k.length - x.length)));
      if (!s1.fuzzy) return [s1];
    }
    // (a Japanese line: its pieces that say something, all of them that together hit)
    // (a line, with a particle in it: パン屋まるき is a name, not パン + 屋まるき)
    const ps = /[ぁ-ゖァ-ヺ一-鿿]/.test(w) && (/[がをはもにでのと]/.test(w) || compound(w.normalize('NFKC'), ix.vocab)) ? pieces(w.normalize('NFKC'), ix.vocab).map((x) => [x, placeKey(x)] as const).filter(([, x]) => x && !STOP.has(x)) : [];
    if (ps.length && ps.length <= 4 && (ps.length > 1 || ps[0][1] !== k)) {
      const out = ps.map(([x, kx]) => wordOf(ix, kx, x)).filter((x) => !x.fuzzy);
      for (let n = out.length; n > 0; n--) {
        let best: Word[] | null = null, most = 0;
        for (const sub of choose(out, n)) {
          const c = count(ix, sub);
          if (c > most) ((most = c), (best = sub));
        }
        if (best) {
          // (the pieces let go are said: 雨でも行ける美術館 → 美術館, 「雨」は無視)
          for (const [x, kx] of ps) if (!best.some((b) => b.k === kx) && !SOFT_KEYS.has(kx)) dropped.push(x);
          return best;
        }
      }
    }
    return hitsAny(ix, one) ? [one] : null;
  };
  const dropped: string[] = [];
  raw.forEach((w, i) => {
    const k = keys[i];
    if (!k || (glue && STOP.has(k))) return;
    if (SOFT_KEYS.has(k)) return void ignored.push(w);
    let memo = reads.get(ix);
    if (!memo) reads.set(ix, (memo = new Map()));
    let r = memo.get(w);
    if (r === undefined) {
      dropped.length = 0;
      memo.set(w, (r = read(w, k)));
      if (dropped.length) drops.set(w, [...dropped]);
    }
    if (r) (ws.push(...r), ignored.push(...(drops.get(w) ?? [])));
    // a word nothing has is let go (shown), not zeroing the list; with the descriptions still out, kept
    else if (ix.descs || ix.descsOut) ignored.push(w);
    else ws.push(wordOf(ix, k, w));
  });
  const areaChips = chips.filter((c) => c.k === 'area');
  const reach = areaChips.map((c) => ix.reach(c.name));
  const areaAt = reach.map((r) => r.at);
  const where = chips.find((c) => c.k === 'point' || c.k === 'centre');
  const box = ctx.box ?? null;
  const boxAt: LL | null = box ? [box[0] <= box[2] ? (box[0] + box[2]) / 2 : ((box[0] + box[2] + 360) / 2) % 360, (box[1] + box[3]) / 2] : null;
  const near = chips.some((c) => c.k === 'near');
  const meals = chips.filter((c) => c.k === 'meal');
  // the area's anchor: my location when I'm in it (its places by their real distance), else its centre
  const areaAnchor = reach.map((r) => (r.at && ctx.me && distM(r.at, ctx.me) <= r.m + NEAR_AREA_M ? ctx.me : r.at)).find(Boolean) ?? null;
  return {
    ws, ignored,
    // (a meal's tops join the category chips: any of them)
    cats: [...chips.filter((c) => c.k === 'cat'), ...meals.flatMap((c) => MEAL_PICKS[c.meal].map((x) => ({ k: 'cat' as const, ...x })))].map(catQ),
    mealAt: meals.length && !chips.some((c) => c.k === 'at') ? meals[0].m : -1,
    features: chips.filter((c) => c.k === 'word').map(featureQ),
    // (widened: by the distance from its centre alone)
    areas: areaChips.map((c, k) => {
      const key = placeKey(c.name);
      return wide ? { r: { keys: new Set<string>(), at: reach[k].at, m: Math.max(wide, reach[k].m) }, town: '' } : { r: reach[k], town: key.length >= 3 && !isLatin(key) ? key : '' };
    }),
    nots: chips.filter((c) => c.k === 'not').map((c) => ({ ...c, w: placeKey(c.w) })), // (keyed once)
    days: chips.filter((c) => c.k === 'day').map((c) => c.d),
    ats: chips.filter((c) => c.k === 'at'),
    areaAt,
    open: chips.some((c) => c.k === 'open'),
    today: chips.some((c) => c.k === 'today'),
    near,
    rate: Math.max(0, ...chips.map((c) => (c.k === 'rate' ? c.min : 0))),
    recent: Math.max(0, ...chips.map((c) => (c.k === 'recent' ? c.days : 0))),
    by: chips.filter((c) => c.k === 'by').map((c) => c.who),
    memo: chips.some((c) => c.k === 'memo'),
    radius: Math.max(0, ...chips.map((c) => (c.k === 'radius' ? c.m : 0))),
    where, whereR: where?.k === 'centre' ? where.r : NEAR_M,
    anchor: where?.at ?? areaAnchor ?? boxAt ?? ctx.me ?? ctx.view,
    // (a radius measured from where the map's dots are too: a point, an area, me; never the browse box)
    radiusAt: where?.at ?? areaAnchor ?? ctx.me ?? ctx.view,
    shown: !!(where || areaAt.some(Boolean) || (!box && ctx.me))
  };
}

/** 0 the effective pick, 1 the alt, -1 neither. */
const pickTier = (e: Entry, c: { cat: PlaceCat; sub?: string }): number =>
  c.cat === e.cat && (!c.sub || c.sub === e.sub) ? 0 : e.alt && c.cat === e.alt.cat && (!c.sub || c.sub === e.alt.sub) ? 1 : -1;
const catHit = (e: Entry, c: { cat: PlaceCat; sub?: string }): boolean =>
  (c.cat === e.cat && (!c.sub || c.sub === e.sub)) || (!!e.alt && c.cat === e.alt.cat && (!c.sub || c.sub === e.alt.sub));

/** A category chip's tier for an entry (-1: no match). 0: its kind (a kind's chip: 仏教寺院, タイ料理店), its word
 *  whole in the name or among the kind's words (そば isn't 中華そば; park isn't parking; a 2-kana word, びる for ビール,
 *  only through the pick), or its pick when the word is the pick's own name or a translation (ラーメン, ramen). A
 *  synonym's (夜景 of 景色) or a kind's pick after the places saying the word (1 the description, 2 the pick; a kind's
 *  pick only for a place whose own kind isn't a sure one); the description saying the pick's own name last (T_DESC). */
function catTier(e: Entry, q: CatQ): number {
  const { c, w } = q;
  if (c.kind && e.kind === c.kind) return 0;
  // (a category's own word, typed in either language or tapped, is the category and its kinds: not a name's word)
  if (!q.own && w && q.inName && (q.lat ? e.nw.includes(q.tok) || e.nw.includes(q.toks) : e.n.includes(w))) return 0;
  // (a kind's chip: another kind that only lists the word after: pho's ベトナム料理店)
  if (w && q.inKind && e.k && (e.k.includes(q.tok) || (q.lat && e.k.includes(q.toks)))) return !c.kind || e.k.startsWith(q.tok) ? 0 : 1;
  const h = pickTier(e, c);
  // (a kind's chip through the pick: a place whose own kind is vague or none, and only when it says the kind: a
  // レストラン the relay filed under エスニック isn't a 韓国料理店 unless its name, description or note says 韓国)
  if (h >= 0 && c.kind && (e.hard || !q.kw.some((x) => e.n.includes(x) || e.d.includes(x) || e.t.includes(x)))) return -1;
  if (h >= 0) return q.own ? h : 2;
  if (!q.own && q.inDesc && e.d.includes(w)) return 1;
  return -1;
}

/** A name holds a word: a Latin one whole (ice isn't police), else anywhere. */
const nameHas = (e: Entry, w: string): boolean => (isLatin(w) ? token(e.nw, w) : e.n.includes(w));

/** A category chip read once a search: its word, whether that's the pick's own name (or a translation: Latin), and
 *  where the word may be looked for. */
interface CatQ {
  c: Extract<Chip, { k: 'cat' }>;
  w: string;
  own: boolean;
  inName: boolean;
  inKind: boolean;
  inDesc: boolean;
  lat: boolean;
  tok: string;
  toks: string;
  /** A kind's chip: its words a name, description or note may say (2 characters with a kanji, or 3). */
  kw: string[];
}
const catQ = (c: Extract<Chip, { k: 'cat' }>): CatQ => {
  const w = c.w ?? '', lat = isLatin(w);
  const own = !c.kind && (!w || w === placeKey(c.sub || c.cat) || lat);
  const ok = !!w && (lat ? w.length >= 3 : nameWord(w));
  const kw = c.kind ? [...new Set([w, ...(kindInfo(c.kind)?.words ?? [])].map(placeKey))].filter((x) => x && !isLatin(x) && nameWord(x)) : [];
  return { c, w, own, inName: ok, inKind: ok, inDesc: !!w && (lat ? w.length >= 5 : nameWord(w)), lat, tok: SEP + w + SEP, toks: SEP + w + 's' + SEP, kw };
};

/** The tops a meal is eaten at. */
const MEAL_PICKS: Record<Meal, { cat: PlaceCat; sub: string }[]> = {
  breakfast: [{ cat: 'カフェ', sub: '' }, { cat: '甘いもの', sub: 'パン' }],
  lunch: (['麺', '和食・寿司', '肉', '世界の料理', 'カフェ'] as const).map((cat) => ({ cat, sub: '' })),
  dinner: (['麺', '和食・寿司', '肉', '世界の料理', '居酒屋・バー'] as const).map((cat) => ({ cat, sub: '' }))
};

/** A feature chip read once a search (夜景): its spellings, its kinds. */
interface FeatureQ {
  xs: string[];
  kinds: ReadonlySet<string>;
}
const featureQ = (c: Extract<Chip, { k: 'word' }>): FeatureQ => {
  const f = FEATURES.find((x) => placeKey(x.label) === c.w);
  return { xs: [...new Set([c.w, ...(f?.words ?? []), ...textWords(c.w)].map(placeKey))].filter((x) => x.length >= 2), kinds: new Set(f?.kinds ?? []) };
};
/** 0 its name, description or note says it, 1 a place of its kinds, -1 neither. */
const featureTier = (e: Entry, f: FeatureQ): number =>
  f.xs.some((x) => e.n.includes(x) || e.d.includes(x) || e.t.includes(x)) ? 0 : f.kinds.has(e.kind) ? 1 : -1;

/** A word long enough to stand for itself inside a name (すし is in スシロー and in ハウスシック: 3 characters, or a
 *  kanji). */
const nameWord = (w: string): boolean => w.length >= 3 || /[一-鿿]/.test(w);

/** An area chip, by where a place is only: one of its reach's names (a town's name holding a 3-character kanji one:
 *  神田神保町 for 神保町), or within its spread of the reach's centre (a name holding 京都 in 新宿 isn't 京都's). */
function areaHit(e: Entry, q: AreaQ): boolean {
  const r = q.r;
  if (e.as.some((k) => r.keys.has(k))) return true;
  if (q.town && e.a.includes(q.town)) return true;
  return !!r.at && distM(r.at, [e.p.lng, e.p.lat]) <= r.m;
}

/** An area chip read once a search: its reach, its key when a town's may hold it. */
interface AreaQ {
  r: Reach;
  town: string;
}

/** A negated chip's hit: its category (the effective or the relay's pick), else its word whole among the category and
 *  kind words, or in the name (whole when Latin; 3 characters or a kanji else: 「-バー」 isn't every ば). */
function notHit(e: Entry, c: Extract<Chip, { k: 'not' }>): boolean {
  if (c.cat) return catHit(e, { cat: c.cat, sub: c.sub });
  const w = c.w;
  return !!w && (token(e.c, w) || (!!e.k && token(e.k, w)) || ((isLatin(w) || nameWord(w)) && nameHas(e, w)));
}

/** The minute of the week once per zone, not per place. */
function minutes(now: number): (tz: string) => number {
  const wm = new Map<string, number>();
  return (tz) => {
    let m = wm.get(tz);
    if (m === undefined) wm.set(tz, (m = weekMin(now, tz)));
    return m;
  };
}

/** Whether an entry passes the plan's chips but the categories (and the box, the text). `skip`: one chip kind let go
 *  (the quick counts, relax). */
function passes(e: Entry, pl: Plan, ctx: Ctx, minOf: (tz: string) => number): boolean {
  const p = e.p;
  if (pl.where && distM(pl.where.at, [p.lng, p.lat]) > pl.whereR) return false;
  if (pl.near && ctx.me && distM(ctx.me, [p.lng, p.lat]) > (pl.radius || NEAR_M)) return false;
  if (pl.radius && !pl.near && (!pl.radiusAt || distM(pl.radiusAt, [p.lng, p.lat]) > pl.radius)) return false;
  // (with a radius, an area only anchors it: 渋谷 1km以内 is a kilometre about 渋谷)
  if (pl.areas.length && !pl.radius && !pl.areas.some((q) => areaHit(e, q))) return false;
  if (pl.days.length && !pl.days.some((x) => opensOn(e.hours, x))) return false;
  if (pl.today && !opensOn(e.hours, Math.floor(minOf(p.tz) / 1440))) return false;
  if (pl.open && !openIn(e.hours, minOf(p.tz))) return false;
  // (25時 is the next day's 1:00; Saturday's past Sunday midnight)
  if (pl.ats.length && !pl.ats.some((a) => openIn(e.hours, ((a.d ?? Math.floor(minOf(p.tz) / 1440)) * 1440 + a.m) % WEEK_MIN))) return false;
  if (pl.rate && !((e.r ?? 0) >= pl.rate)) return false;
  if (pl.recent && ctx.now / 1000 - p.added > pl.recent * 86_400) return false;
  if (pl.by.length && !pl.by.includes(p.by ?? -1)) return false;
  if (pl.memo && !p.note) return false;
  if (pl.nots.some((c) => notHit(e, c))) return false;
  return true;
}

/** An area finding none of the outdoors (a mountain, a waterfall, an onsen) reaches its day trip: hikes near Seattle
 *  are an hour out (Result.wide). A town's sushi isn't (none found, and what to let go). */
const WIDE_M = 100_000;
const OUTDOORS: ReadonlySet<PlaceCat> = new Set(['自然・登山', '温泉']);

export function search(ix: Index, chips: readonly Chip[], text: string, ctx: Ctx): Result {
  const r = guarded(ix, chips, text, ctx, 0);
  const cats = chips.filter((c) => c.k === 'cat');
  if (r.list.length || ctx.box || !cats.length || !cats.every((c) => OUTDOORS.has(c.cat)) || !chips.some((c) => c.k === 'area') || chips.some((c) => c.k === 'radius')) return r;
  const w = guarded(ix, chips, text, ctx, WIDE_M);
  return w.list.length ? { ...w, wide: WIDE_M } : r;
}

function guarded(ix: Index, chips: readonly Chip[], text: string, ctx: Ctx, wide: number): Result {
  const r = searchOf(ix, chips, text, ctx, wide);
  // the chips find places but not with the words: words only a note or a description has let go, said (子連れ 公園 →
  // 公園, 「子連れ」は無視); a name's or a category's word stays (日曜 + a place's name: none found, and what to let go)
  if (r.list.length || !text.trim() || !chips.length) return r;
  const { ws } = planOf(ix, chips, text, ctx, wide);
  if (ws.some((w) => w.tiers.some((t) => t >= 0 && t < T_NOTE))) return r;
  const bare = searchOf(ix, chips, '', ctx, wide);
  if (!bare.list.length) return r;
  const words = text.split(/[\s　]+/).filter((w) => w && !STOP.has(placeKey(w)));
  return { ...bare, ignored: [...new Set([...r.ignored, ...words])] };
}

function searchOf(ix: Index, chips: readonly Chip[], text: string, ctx: Ctx, wide: number): Result {
  const pl = planOf(ix, chips, text, ctx, wide);
  // (words typed, every one let go and one not a mood word, nothing else: none found, not the whole list under
  // 「は無視しました」; デート alone keeps it)
  const none = !chips.length && !pl.ws.length && pl.ignored.some((w) => !SOFT_KEYS.has(placeKey(w)));
  const { ws, cats, anchor } = pl;
  const box = ctx.box ?? null;
  const n = ix.entries.length;
  const dist = new Float64Array(n).fill(NaN);
  const minOf = minutes(ctx.now);
  const perCat = new Map<PlaceCat, number>(PLACE_CAT_KEYS.map((c) => [c, 0]));
  const hits: number[] = [];
  const tiers = new Int8Array(n);
  const why = new Map<number, 'note' | 'desc'>();
  const quick = { open: 0, rate: 0 };
  const qOpen = !pl.open, qRate = pl.rate < QUICK_RATE;
  let top = 0;
  for (let i = 0; i < n && !none; i++) {
    const e = ix.entries[i], p = e.p;
    if (box && !inBox(box, p.lng, p.lat)) continue;
    if (anchor) dist[i] = distM(anchor, [p.lng, p.lat]);
    if (!passes(e, pl, ctx, minOf)) continue;
    let t = 0;
    if (ws.length && (t = tierOf(i, ws)) < 0) continue;
    // (each top a tap would give it under: its own and the relay's)
    perCat.set(e.cat, perCat.get(e.cat)! + 1);
    if (e.alt && e.alt.cat !== e.cat) perCat.set(e.alt.cat, perCat.get(e.alt.cat)! + 1);
    if (cats.length) {
      let ct = -1;
      for (const c of cats) {
        const x = catTier(e, c);
        if (x >= 0 && (ct < 0 || x < ct)) ct = x;
      }
      if (ct < 0) continue;
      if (ct > t) t = ct;
    }
    if (pl.features.length) {
      let ft = 0;
      for (const f of pl.features) ft = Math.max(ft, featureTier(e, f));
      if (ft < 0 || pl.features.some((f) => featureTier(e, f) < 0)) continue;
      if (ft > t) t = ft;
    }
    // (a meal: the places open at its hour first, the rest after, none left out)
    if (pl.mealAt >= 0 && !openIn(e.hours, (Math.floor(minOf(p.tz) / 1440) * 1440 + pl.mealAt) % WEEK_MIN) && t < 1) t = 1;
    tiers[i] = t;
    if (t > top) top = t;
    if (t === T_NOTE) why.set(i, 'note');
    else if (t === T_DESC) why.set(i, 'desc');
    if (qOpen && openIn(e.hours, minOf(p.tz))) quick.open++;
    if (qRate && (e.r ?? 0) >= QUICK_RATE) quick.rate++;
    hits.push(i);
  }
  if (!qOpen) quick.open = hits.length;
  if (!qRate) quick.rate = hits.length;
  const E = ix.entries;
  const byQ = (a: number, b: number) => E[b].q - E[a].q;
  const byNew = (a: number, b: number) => E[b].p.added - E[a].p.added;
  const byTier = top > 0;
  // 近い順: by distance, then each run within TIE_M of its start by q (no total order: two passes)
  if (ctx.sort === 'near' && anchor) {
    hits.sort(byTier ? (a, b) => tiers[a] - tiers[b] || dist[a] - dist[b] : (a, b) => dist[a] - dist[b]);
    tieRuns(hits, dist, tiers, byTier, byQ);
  } else {
    const by = ctx.sort === 'rate' ? (a: number, b: number) => byQ(a, b) || byNew(a, b) : (a: number, b: number) => byNew(a, b) || byQ(a, b);
    hits.sort(byTier ? (a, b) => tiers[a] - tiers[b] || by(a, b) : by);
  }
  const needMe = (pl.near || (pl.radius > 0 && !pl.where && !pl.areas.length)) && !ctx.me;
  return { list: hits, dist, anchor, shown: pl.shown, perCat, needMe, ignored: pl.ignored, why, quick, wide: 0 };
}

/** 近い順's tie: within each run of the same tier whose distances lie within TIE_M of its first, by q. */
function tieRuns(hits: number[], dist: Float64Array, tiers: Int8Array, byTier: boolean, byQ: (a: number, b: number) => number): void {
  for (let s = 0; s < hits.length;) {
    let e = s + 1;
    while (e < hits.length && dist[hits[e]] - dist[hits[s]] <= TIE_M && (!byTier || tiers[hits[e]] === tiers[hits[s]])) e++;
    if (e - s > 1) {
      const run = hits.slice(s, e).sort((a, b) => byQ(a, b) || dist[a] - dist[b]);
      for (let k = 0; k < run.length; k++) hits[s + k] = run[k];
    }
    s = e;
  }
}

/** The empty list's way out: each chip let go in turn (the map's where-chips and the browse box kept), with what it
 *  would give, the best two (most first); when no one chip does, the best two pairs (`also`: the second to let go).
 *  Only when the search gives none. */
export function relax(ix: Index, chips: readonly Chip[], text: string, ctx: Ctx): { drop: Chip; also?: Chip; n: number }[] {
  if (search(ix, chips, text, ctx).list.length) return [];
  const free = chips.filter((c) => c.k !== 'point' && c.k !== 'centre');
  const out: { drop: Chip; also?: Chip; n: number }[] = [];
  for (const c of free) {
    const n = search(ix, chips.filter((x) => x !== c), text, ctx).list.length;
    if (n) out.push({ drop: c, n });
  }
  if (!out.length) for (let i = 0; i < free.length; i++) for (let j = i + 1; j < free.length; j++) {
    const n = search(ix, chips.filter((x) => x !== free[i] && x !== free[j]), text, ctx).list.length;
    if (n) out.push({ drop: free[i], also: free[j], n });
  }
  return out.sort((a, b) => b.n - a.n).slice(0, 2);
}

/** Saved within the last 3 days (its NEW tag). */
export const isNew = (p: Place, now: number): boolean => now / 1000 - p.added < 3 * 86_400;
