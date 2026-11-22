// 保存した場所's search (docs/places.md "Search"): the index built once per payload (each place's name, category words,
// area names and note keyed: text.ts), and one search per keystroke over it: the chips filter (a kind's chips any of
// them, the kinds all), the free text's words each matched (a name's prefix, then its substring, a category word, an
// area name, the note; a name's fuzzy hit last), ranked by that tier, then the sort (近い順 from the anchor, 保存が新し
// い順, 名前順). A typed area or category chip also lets in a name with its word (横浜 typed: 横浜家系 in 渋谷). Each
// search well under 5 ms over 3,500 places (places.test.ts' perf check, PLACES_PERF=1); two typed arrays a search,
// nothing per place. Pure.
import { PLACE_CAT_KEYS, type Place, type PlaceCat } from '../contract/places.ts';
import { areaOf, type Area } from './area.ts';
import { catWords } from './cats.ts';
import { openIn, opensOn, weekMin } from './hours.ts';
import { NEAR_M, vocab, words, type Chip, type Vocab } from './query.ts';
import { placeKey, subseq } from './text.ts';
import { distM, type LL } from './geo.ts';

export type Sort = 'near' | 'new' | 'name';
export const SORTS: readonly Sort[] = ['near', 'new', 'name'];

export interface Entry {
  p: Place;
  area: Area;
  /** The keys: name, category words, area names, note ('\u0001' between words); the area names' keys one by one. */
  n: string;
  c: string;
  a: string;
  t: string;
  as: string[];
}

export interface Index {
  entries: Entry[];
  /** Each entry's place in 名前順. */
  nameRank: Int32Array;
  /** Each area name's centre (the mean of its places) and count. */
  areas: Map<string, { at: LL; n: number }>;
  vocab: Vocab;
}

const SEP = '\u0001';
const collator = new Intl.Collator('ja');

export function buildIndex(rows: readonly Place[]): Index {
  const sums = new Map<string, [number, number, number]>();
  const entries = rows.map((p): Entry => {
    const area = areaOf(p.addr);
    for (const nm of area.names) {
      const s = sums.get(nm) ?? [0, 0, 0];
      ((s[0] += p.lng), (s[1] += p.lat), s[2]++);
      sums.set(nm, s);
    }
    const cw = [...catWords(p.cat), ...(p.sub ? catWords(p.cat, p.sub) : [])];
    const as = area.names.map(placeKey);
    return { p, area, n: placeKey(p.name), c: cw.map(placeKey).join(SEP), a: as.join(SEP), t: placeKey(p.note), as };
  });
  const order = entries.map((_, i) => i).sort((a, b) => collator.compare(entries[a].p.name, entries[b].p.name));
  const nameRank = new Int32Array(entries.length);
  order.forEach((e, r) => (nameRank[e] = r));
  const areas = new Map([...sums].map(([k, s]) => [k, { at: [s[0] / s[2], s[1] / s[2]] as LL, n: s[2] }]));
  return { entries, nameRank, areas, vocab: vocab(areas.keys()) };
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
}

/** The free text's tier for an entry: 0 a name's prefix, 1 its substring, 2 a category word, 3 an area name, 4 the
 *  note, 5 a fuzzy name hit; -1 none. Several words: each must hit, the worst tier counts. */
function tierOf(e: Entry, ws: readonly string[]): number {
  let worst = 0;
  for (const w of ws) {
    let t = -1;
    const at = e.n.indexOf(w);
    if (at === 0) t = 0;
    else if (at > 0) t = 1;
    else if (e.c.includes(w)) t = 2;
    else if (e.a.includes(w)) t = 3;
    else if (e.t.includes(w)) t = 4;
    else if (subseq(e.n, w)) t = 5;
    if (t < 0) return -1;
    if (t > worst) worst = t;
  }
  return worst;
}

export function search(ix: Index, chips: readonly Chip[], text: string, ctx: Ctx): Result {
  const ws = words(text);
  const cats = chips.filter((c) => c.k === 'cat');
  const days = chips.filter((c) => c.k === 'day').map((c) => c.d);
  const areaChips = chips.filter((c) => c.k === 'area');
  const areas = areaChips.map((c) => c.name);
  const areaKeys = areas.map(placeKey);
  const areaAt = areas.map((a) => ix.areas.get(a)?.at ?? null);
  const open = chips.some((c) => c.k === 'open');
  const today = chips.some((c) => c.k === 'today');
  const near = chips.some((c) => c.k === 'near');
  const where = chips.find((c) => c.k === 'point' || c.k === 'centre');
  const whereR = where?.k === 'centre' ? where.r : NEAR_M;
  const box = ctx.box ?? null;
  const boxAt: LL | null = box ? [box[0] <= box[2] ? (box[0] + box[2]) / 2 : ((box[0] + box[2] + 360) / 2) % 360, (box[1] + box[3]) / 2] : null;
  const anchor: LL | null = where?.at ?? areaAt.find(Boolean) ?? boxAt ?? ctx.me ?? ctx.view;
  const shown = !!(where || areaAt.some(Boolean) || (!box && ctx.me));
  const n = ix.entries.length;
  const dist = new Float64Array(n).fill(NaN);
  // (the minute of the week once per zone, not per place)
  const wm = new Map<string, number>();
  const minOf = (tz: string) => {
    let m = wm.get(tz);
    if (m === undefined) wm.set(tz, (m = weekMin(ctx.now, tz)));
    return m;
  };
  const perCat = new Map<PlaceCat, number>(PLACE_CAT_KEYS.map((c) => [c, 0]));
  const hits: number[] = [];
  const tiers = new Int8Array(n);
  for (let i = 0; i < n; i++) {
    const e = ix.entries[i], p = e.p;
    if (box && !inBox(box, p.lng, p.lat)) continue;
    if (anchor) dist[i] = distM(anchor, [p.lng, p.lat]);
    if (where && distM(where.at, [p.lng, p.lat]) > whereR) continue;
    if (near && ctx.me && distM(ctx.me, [p.lng, p.lat]) > NEAR_M) continue;
    if (areas.length && !areaChips.some((c, k) => e.as.includes(areaKeys[k]) || (c.w && e.n.includes(c.w)) || (areaAt[k] && distM(areaAt[k]!, [p.lng, p.lat]) <= NEAR_M))) continue;
    if (days.length && !days.some((d) => opensOn(p.hours, d))) continue;
    if (today && !opensOn(p.hours, Math.floor(minOf(p.tz) / 1440))) continue;
    if (open && !openIn(p.hours, minOf(p.tz))) continue;
    let t = 0;
    if (ws.length && (t = tierOf(e, ws)) < 0) continue;
    perCat.set(p.cat, perCat.get(p.cat)! + 1);
    if (cats.length && !cats.some((c) => (c.cat === p.cat && (!c.sub || c.sub === p.sub)) || (c.w && e.n.includes(c.w)))) continue;
    tiers[i] = t;
    hits.push(i);
  }
  const by = ctx.sort === 'near' && anchor ? (a: number, b: number) => dist[a] - dist[b]
    : ctx.sort === 'name' ? (a: number, b: number) => ix.nameRank[a] - ix.nameRank[b]
    : (a: number, b: number) => ix.entries[b].p.added - ix.entries[a].p.added || ix.nameRank[a] - ix.nameRank[b];
  hits.sort(ws.length ? (a, b) => tiers[a] - tiers[b] || by(a, b) : by);
  return { list: hits, dist, anchor, shown, perCat, needMe: near && !ctx.me };
}

/** Saved within the last 3 days (its NEW tag). */
export const isNew = (p: Place, now: number): boolean => now / 1000 - p.added < 3 * 86_400;
