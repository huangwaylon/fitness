// 保存した場所's search (docs/places.md "Search"): the index built once per payload and per facets/descriptions file
// (each place's name, category words, kind, area names, note and description keyed: text.ts; its effective category,
// hours, rating), and one search per keystroke over it: the chips filter (a kind's chips any of them, the kinds all;
// a `not` chip excludes), the free text's words each matched (a name's prefix, then its substring, a category or
// kind word, an area name, the note, the description; a name's fuzzy hit last; a word nothing has is ignored, not
// zeroing the list), ranked by that tier, then the sort (近い順 from the anchor, ties within 200 m by rating; 評価順
// by the prior-weighted rating; 保存が新しい順). Each search ~1 ms over 3,500 places (places.test.ts' perf check,
// PLACES_PERF=1); typed arrays a search, nothing per place. Pure.
import { PLACE_CAT_KEYS, type Period, type Place, type PlaceCat } from '../contract/places.ts';
import { areaOf, type Area } from './area.ts';
import { catTerms, catWords, textWords } from './cats.ts';
import type { DescTable, FacetTable } from './facets.ts';
import { kindInfo, type KindInfo } from './kinds.ts';
import { areaAliases, areaGroup } from './romaji.ts';
import { openIn, opensOn, weekMin } from './hours.ts';
import { NEAR_M, SOFT_KEYS, STOP, vocab, type Chip, type Vocab } from './query.ts';
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
  /** The relay's hours, else the vendored ones. */
  hours: Period[] | null;
  /** Whether the kind is a sure one (kinds.ts hard: it set the category). */
  hard: boolean;
  /** The keys: name, category words, the kind's words, area names, note, description ('\u0001' between words); the
   *  area names' keys one by one. */
  n: string;
  c: string;
  k: string;
  a: string;
  t: string;
  d: string;
  as: string[];
}

export interface Index {
  entries: Entry[];
  /** Each area name's centre (the mean of its places) and count. */
  areas: Map<string, { at: LL; n: number }>;
  vocab: Vocab;
  /** The descriptions (null till they're in: a word none has may yet be in one). */
  descs: DescTable | null;
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

const quality = (r: number | null, rn: number): number => (r ? (r * rn + PRIOR * PRIOR_N) / (rn + PRIOR_N) : 0);
const isLatin = (k: string): boolean => /^[a-z0-9]+$/.test(k);

/** The effective category: a sure kind's (hard) over the relay's, the relay's kept as the alt; a vague kind's (soft)
 *  only into an empty sub of the same top or an その他 top. */
function catOf(p: Place, k: KindInfo | undefined): { cat: PlaceCat; sub: string; alt: { cat: PlaceCat; sub: string } | null } {
  const own = { cat: p.cat, sub: p.sub };
  if (!k) return { ...own, alt: null };
  if (k.hard) {
    if (k.cat !== p.cat) return { cat: k.cat, sub: k.sub, alt: own };
    if (k.sub && k.sub !== p.sub) return { cat: k.cat, sub: k.sub, alt: own };
    return { ...own, alt: null };
  }
  if (p.cat === 'その他') return { cat: k.cat, sub: k.sub, alt: null };
  if (!p.sub && k.cat === p.cat && k.sub) return { cat: p.cat, sub: k.sub, alt: null };
  return { ...own, alt: k.cat !== p.cat || (k.sub && k.sub !== p.sub) ? { cat: k.cat, sub: k.sub } : null };
}

export function buildIndex(rows: readonly Place[], facets?: FacetTable | null, descs?: DescTable | null, people: readonly string[] = []): Index {
  const sums = new Map<string, [number, number, number]>();
  /** Each kind's info and its words keyed (one lookup per kind, not per place). */
  const kinds = new Map<string, { info: KindInfo | undefined; words: string[] }>();
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
    const cw = [...catWords(cat), ...(sub ? catWords(cat, sub) : [])].map(placeKey);
    const as = area.names.map(placeKey);
    const r = f?.r ?? null, rn = f?.rn ?? 0;
    return {
      p, area, cat, sub, alt, kind, hard: !!ki?.info?.hard, r, rn, q: quality(r, rn), hours: p.hours ?? f?.hours ?? null,
      n: placeKey(p.name), c: cw.join(SEP), k: ki?.words.join(SEP) ?? '', a: as.join(SEP), t: placeKey(p.note), d: placeKey(descs?.get(p.id)), as
    };
  });
  const areas = new Map([...sums].map(([k, s]) => [k, { at: [s[0] / s[2], s[1] / s[2]] as LL, n: s[2] }]));
  // the area names the places have, keyed; every other spelling of each (romaji.ts)
  const byKey = new Set([...areas.keys()].map(placeKey).filter(Boolean));
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
    const own = new Set([name, ...areaAliases(name)].map(placeKey).filter((k) => k && byKey.has(k)));
    own.add(placeKey(name));
    for (const k of [...own]) if (near.has(k)) own.add(near.get(k)!);
    const keys = new Set([...own, ...areaGroup(name).map(placeKey).filter((k) => k && byKey.has(k))]);
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
  const specific = new Map<string, string>();
  for (const { word, pick } of catTerms()) {
    const w = placeKey(word), own = placeKey(pick.sub || pick.cat), m = kindByWord.get(w);
    if (!m || w === own || !pick.sub || isLatin(w)) continue;
    const top = [...m].sort((a, b) => b[1] - a[1])[0][0], k = kinds.get(top)!;
    if (k.info?.hard && k.info.sub === pick.sub && !k.words.includes(own)) specific.set(w, top);
  }
  // a word the vocabulary hasn't but the gazetteer has, with places of the list in it (Seoul, ベトナム, Tokyo)
  const gazetteer = (word: string): string | null => {
    const k = placeKey(word);
    if (k.length < 2 || STOP.has(k) || isLatin(k) && k.length < 4) return null;
    return reach(word).at ? word : null;
  };
  return { entries, areas, vocab: vocab(areas.keys(), { people, aliases, specific, gazetteer }), descs: descs ?? null, reach };
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
}

/** The quick rating chip's floor (★4.5以上). */
export const QUICK_RATE = 4.5;

const T_NOTE = 4, T_DESC = 5, T_FUZZY = 6;

/** One free word's tier for an entry: 0 a name's prefix, 1 its substring, 2 a category or kind word, 3 an area name,
 *  4 the note, 5 the description, 6 a fuzzy name hit; -1 none. A word's other spellings (`alts`: arashiyama's 嵐山,
 *  matcha's 抹茶) count as it, but never fuzzily. */
function wordTier(e: Entry, w: string, alts: readonly string[], fuzzy = true): number {
  let best = -1;
  for (const x of alts.length ? [w, ...alts] : [w]) {
    let t = -1;
    const at = e.n.indexOf(x);
    if (at === 0) t = 0;
    else if (at > 0) t = 1;
    else if ((x === w && e.c.includes(x)) || e.k.includes(x)) t = 2;
    else if (x === w && e.a.includes(x)) t = 3;
    else if (e.t.includes(x)) t = T_NOTE;
    else if (e.d.includes(x)) t = T_DESC;
    else if (fuzzy && x === w && subseq(e.n, x)) t = T_FUZZY;
    if (t >= 0 && (best < 0 || t < best)) best = t;
    if (best === 0) break;
  }
  return best;
}

/** The free text's tier: every word must hit, the worst tier counts. */
function tierOf(e: Entry, ws: readonly Word[]): number {
  let worst = 0;
  for (const w of ws) {
    const t = wordTier(e, w.k, w.alts, w.fuzzy);
    if (t < 0) return -1;
    if (t > worst) worst = t;
  }
  return worst;
}

/** A free word, keyed, with its other spellings keyed. */
interface Word {
  k: string;
  alts: string[];
  /** A fuzzy name hit counts (only for a word nothing has as it is: a typo). */
  fuzzy: boolean;
}

function wordOf(ix: Index, k: string, raw: string): Word {
  const one = /^[a-z]{4,}s$/.test(k) ? k.slice(0, -1) : '';
  const alts = [...new Set([...areaAliases(raw), ...textWords(k), ...(one ? textWords(one) : [])].map(placeKey))].filter((x) => x.length >= 2 && x !== k);
  const w = { k, alts, fuzzy: false };
  return ix.entries.some((e) => wordTier(e, k, alts, false) >= 0) ? w : { ...w, fuzzy: true };
}
const hitsAny = (ix: Index, w: Word): boolean => ix.entries.some((e) => wordTier(e, w.k, w.alts, w.fuzzy) >= 0);
/** Each index's free words as read (a word typed stays the same over the keystrokes after it). */
const reads = new WeakMap<Index, Map<string, Word[] | null>>();
const count = (ix: Index, ws: readonly Word[]): number => ix.entries.reduce((n, e) => n + (tierOf(e, ws) >= 0 ? 1 : 0), 0);
/** The n-element subsets of xs, in order. */
function choose<T>(xs: readonly T[], n: number): T[][] {
  if (n === 0) return [[]];
  if (xs.length < n) return [];
  const [h, ...t] = xs;
  return [...choose(t, n - 1).map((c) => [h, ...c]), ...choose(t, n)];
}
/** A Japanese word nothing has, in pieces: at particles (海が見える), then at a katakana run's ends (見えるカフェ). */
const pieces = (raw: string): string[] =>
  raw.split(/[がをはもにでのと]/).flatMap((x) => x.split(/(?<=[ァ-ヺー])(?=[^ァ-ヺー])|(?<=[^ァ-ヺー])(?=[ァ-ヺー])/)).filter(Boolean);

/** The chips' filter for one search (everything but the free text and the category chips, which perCat counts
 *  before): built once a search. */
interface Plan {
  ws: Word[];
  ignored: string[];
  cats: CatQ[];
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
  shown: boolean;
}

function planOf(ix: Index, chips: readonly Chip[], text: string, ctx: Ctx): Plan {
  const raw = text.split(/[\s　]+/).filter(Boolean);
  const keys = raw.map(placeKey);
  // glue (in, the, の) let go beside anything else; a soft word (デート, cheap) always, said
  const glue = keys.some((k) => k && !STOP.has(k)) || chips.length > 0;
  const ws: Word[] = [], ignored: string[] = [];
  /** A word as it is, else its Latin singular (cafes, temples, dumplings), else (Japanese) its pieces; null: none hits. */
  const read = (w: string, k: string): Word[] | null => {
    const one = wordOf(ix, k, w);
    if (!one.fuzzy) return [one];
    if (/^[a-z]{4,}s$/.test(k)) for (const x of [k.slice(0, -1), ...(k.endsWith('es') ? [k.slice(0, -2)] : [])]) {
      const s1 = wordOf(ix, x, w.slice(0, w.length - (k.length - x.length)));
      if (!s1.fuzzy) return [s1];
    }
    // (a Japanese line: its pieces that say something, all of them that together hit)
    const ps = /[ぁ-ゖァ-ヺ一-鿿]/.test(w) ? pieces(w.normalize('NFKC')).map((x) => [x, placeKey(x)] as const).filter(([, x]) => x && !STOP.has(x)) : [];
    if (ps.length && ps.length <= 4 && (ps.length > 1 || ps[0][1] !== k)) {
      const out = ps.map(([x, kx]) => wordOf(ix, kx, x)).filter((x) => !x.fuzzy);
      for (let n = out.length; n > 0; n--) {
        let best: Word[] | null = null, most = 0;
        for (const sub of choose(out, n)) {
          const c = count(ix, sub);
          if (c > most) ((most = c), (best = sub));
        }
        if (best) return best;
      }
    }
    return hitsAny(ix, one) ? [one] : null;
  };
  raw.forEach((w, i) => {
    const k = keys[i];
    if (!k || (glue && STOP.has(k))) return;
    if (SOFT_KEYS.has(k)) return void ignored.push(w);
    let memo = reads.get(ix);
    if (!memo) reads.set(ix, (memo = new Map()));
    let r = memo.get(w);
    if (r === undefined) memo.set(w, (r = read(w, k)));
    if (r) ws.push(...r);
    // a word nothing has is let go (shown), not zeroing the list; with the descriptions still out, kept
    else if (ix.descs) ignored.push(w);
    else ws.push(wordOf(ix, k, w));
  });
  const areaChips = chips.filter((c) => c.k === 'area');
  const reach = areaChips.map((c) => ix.reach(c.name));
  const areaAt = reach.map((r) => r.at);
  const where = chips.find((c) => c.k === 'point' || c.k === 'centre');
  const box = ctx.box ?? null;
  const boxAt: LL | null = box ? [box[0] <= box[2] ? (box[0] + box[2]) / 2 : ((box[0] + box[2] + 360) / 2) % 360, (box[1] + box[3]) / 2] : null;
  const near = chips.some((c) => c.k === 'near');
  return {
    ws, ignored,
    cats: chips.filter((c) => c.k === 'cat').map(catQ),
    areas: areaChips.map((c, k) => {
      const key = placeKey(c.name);
      return { r: reach[k], w: c.w && nameWord(c.w) ? c.w : '', town: key.length >= 3 && !isLatin(key) ? key : '' };
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
    anchor: where?.at ?? areaAt.find(Boolean) ?? boxAt ?? ctx.me ?? ctx.view,
    shown: !!(where || areaAt.some(Boolean) || (!box && ctx.me))
  };
}

const catHit = (e: Entry, c: { cat: PlaceCat; sub?: string }): boolean =>
  (c.cat === e.cat && (!c.sub || c.sub === e.sub)) || (!!e.alt && c.cat === e.alt.cat && (!c.sub || c.sub === e.alt.sub));

/** A category chip's tier for an entry (-1: no match): 0 its word in the name or the kind's words, or its pick when
 *  the word is the pick's own name (ラーメン); a synonym's (夜景 of 景色) pick after the places saying the word (1 the
 *  description, 2 the pick); the description saying the pick's own name last (T_DESC). A specific one (神社 of 寺社):
 *  by the kind's words, the name or the description; a place with no kind by its pick. */
function catTier(e: Entry, q: CatQ): number {
  const { c, w } = q;
  if (w && ((q.inName && e.n.includes(w)) || e.k.includes(w))) return 0;
  if (c.kind ? !e.kind && catHit(e, c) : catHit(e, c)) return q.own ? 0 : 2;
  if (q.inDesc && e.d.includes(w)) return q.own ? T_DESC : 1;
  return -1;
}

/** A category chip read once a search: its word, whether that's the pick's own name (or a translation: Latin), and
 *  where the word may be looked for. */
interface CatQ {
  c: Extract<Chip, { k: 'cat' }>;
  w: string;
  own: boolean;
  inName: boolean;
  inDesc: boolean;
}
const catQ = (c: Extract<Chip, { k: 'cat' }>): CatQ => {
  const w = c.w ?? '';
  return { c, w, own: !w || w === placeKey(c.sub || c.cat) || isLatin(w), inName: !!w && nameWord(w), inDesc: w.length >= (isLatin(w) ? 5 : 2) };
};

/** A word long enough to stand for itself inside a name (すし is in スシロー and in ハウスシック: 3 characters, or a
 *  kanji). */
const nameWord = (w: string): boolean => w.length >= 3 || /[一-鿿]/.test(w);

/** An area chip: a place with one of its reach's names (a town's name holding a 3-character kanji one: 神田神保町 for
 *  神保町), its word in the name (横浜 typed: 横浜家系), or within its spread of the reach's centre. */
function areaHit(e: Entry, q: AreaQ): boolean {
  const r = q.r;
  if (e.as.some((k) => r.keys.has(k)) || (q.w && e.n.includes(q.w))) return true;
  if (q.town && e.a.includes(q.town)) return true;
  return !!r.at && distM(r.at, [e.p.lng, e.p.lat]) <= r.m;
}

/** An area chip read once a search: its reach, its word when one a name may hold, its key when a town's may. */
interface AreaQ {
  r: Reach;
  w: string;
  town: string;
}

function notHit(e: Entry, c: Extract<Chip, { k: 'not' }>): boolean {
  if (c.cat && catHit(e, { cat: c.cat, sub: c.sub })) return true;
  const w = c.w;
  return !!w && (e.n.includes(w) || e.c.includes(w) || e.k.includes(w));
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
function passes(e: Entry, pl: Plan, ctx: Ctx, minOf: (tz: string) => number, d: number): boolean {
  const p = e.p;
  if (pl.where && distM(pl.where.at, [p.lng, p.lat]) > pl.whereR) return false;
  if (pl.near && ctx.me && distM(ctx.me, [p.lng, p.lat]) > (pl.radius || NEAR_M)) return false;
  if (pl.radius && !pl.near && Number.isFinite(d) && d > pl.radius) return false;
  // (with a radius, an area only anchors it: 渋谷 1km以内 is a kilometre about 渋谷)
  if (pl.areas.length && !pl.radius && !pl.areas.some((q) => areaHit(e, q))) return false;
  if (pl.days.length && !pl.days.some((x) => opensOn(e.hours, x))) return false;
  if (pl.today && !opensOn(e.hours, Math.floor(minOf(p.tz) / 1440))) return false;
  if (pl.open && !openIn(e.hours, minOf(p.tz))) return false;
  if (pl.ats.length && !pl.ats.some((a) => openIn(e.hours, (a.d ?? Math.floor(minOf(p.tz) / 1440)) * 1440 + a.m))) return false;
  if (pl.rate && !((e.r ?? 0) >= pl.rate)) return false;
  if (pl.recent && ctx.now / 1000 - p.added > pl.recent * 86_400) return false;
  if (pl.by.length && !pl.by.includes(p.by ?? -1)) return false;
  if (pl.memo && !p.note) return false;
  if (pl.nots.some((c) => notHit(e, c))) return false;
  return true;
}

export function search(ix: Index, chips: readonly Chip[], text: string, ctx: Ctx): Result {
  const pl = planOf(ix, chips, text, ctx);
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
  for (let i = 0; i < n; i++) {
    const e = ix.entries[i], p = e.p;
    if (box && !inBox(box, p.lng, p.lat)) continue;
    if (anchor) dist[i] = distM(anchor, [p.lng, p.lat]);
    if (!passes(e, pl, ctx, minOf, dist[i])) continue;
    let t = 0;
    if (ws.length && (t = tierOf(e, ws)) < 0) continue;
    perCat.set(e.cat, perCat.get(e.cat)! + 1);
    if (cats.length) {
      let ct = -1;
      for (const c of cats) {
        const x = catTier(e, c);
        if (x >= 0 && (ct < 0 || x < ct)) ct = x;
      }
      if (ct < 0) continue;
      if (ct > t) t = ct;
    }
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
  return { list: hits, dist, anchor, shown: pl.shown, perCat, needMe: pl.near && !ctx.me, ignored: pl.ignored, why, quick };
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
 *  would give, the best two (most first). Only when the search gives none. */
export function relax(ix: Index, chips: readonly Chip[], text: string, ctx: Ctx): { drop: Chip; n: number }[] {
  if (search(ix, chips, text, ctx).list.length) return [];
  const out: { drop: Chip; n: number }[] = [];
  for (const c of chips) {
    if (c.k === 'point' || c.k === 'centre') continue;
    const n = search(ix, chips.filter((x) => x !== c), text, ctx).list.length;
    if (n) out.push({ drop: c, n });
  }
  return out.sort((a, b) => b.n - a.n).slice(0, 2);
}

/** Saved within the last 3 days (its NEW tag). */
export const isNew = (p: Place, now: number): boolean => now / 1000 - p.added < 3 * 86_400;
