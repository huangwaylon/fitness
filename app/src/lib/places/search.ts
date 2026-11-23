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
import { catWords } from './cats.ts';
import type { DescTable, FacetTable } from './facets.ts';
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
  /** The keys: name, category and kind words, area names, note, description ('\u0001' between words); the area
   *  names' keys one by one. */
  n: string;
  c: string;
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
  /** Whether the descriptions are in (a word none has may yet be in one). */
  descs: boolean;
}

const SEP = '\u0001';
/** The rating's prior: q = (r·rn + PRIOR·PRIOR_N) / (rn + PRIOR_N). */
const PRIOR = 4.2, PRIOR_N = 50;
/** 近い順's tie: places within this of each other by distance are ordered by q. */
const TIE_M = 200;

const quality = (r: number | null, rn: number): number => (r ? (r * rn + PRIOR * PRIOR_N) / (rn + PRIOR_N) : 0);

export function buildIndex(rows: readonly Place[], facets?: FacetTable | null, descs?: DescTable | null, people: readonly string[] = []): Index {
  const sums = new Map<string, [number, number, number]>();
  const entries = rows.map((p): Entry => {
    const area = areaOf(p.addr);
    for (const nm of area.names) {
      const s = sums.get(nm) ?? [0, 0, 0];
      ((s[0] += p.lng), (s[1] += p.lat), s[2]++);
      sums.set(nm, s);
    }
    const f = facets?.get(p.id);
    const cat = p.cat, sub = p.sub;
    const cw = [...catWords(cat), ...(sub ? catWords(cat, sub) : [])];
    const kind = f?.kind ?? '';
    if (kind) cw.push(kind);
    const as = area.names.map(placeKey);
    const r = f?.r ?? null, rn = f?.rn ?? 0;
    return {
      p, area, cat, sub, alt: null, kind, r, rn, q: quality(r, rn), hours: p.hours ?? f?.hours ?? null,
      n: placeKey(p.name), c: cw.map(placeKey).join(SEP), a: as.join(SEP), t: placeKey(p.note), d: placeKey(descs?.get(p.id)), as
    };
  });
  const areas = new Map([...sums].map(([k, s]) => [k, { at: [s[0] / s[2], s[1] / s[2]] as LL, n: s[2] }]));
  return { entries, areas, vocab: vocab(areas.keys(), { people }), descs: !!descs };
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

/** The free text's tier for an entry: 0 a name's prefix, 1 its substring, 2 a category or kind word, 3 an area name,
 *  4 the note, 5 the description, 6 a fuzzy name hit; -1 none. Several words: each must hit, the worst tier counts. */
function tierOf(e: Entry, ws: readonly string[]): number {
  let worst = 0;
  for (const w of ws) {
    let t = -1;
    const at = e.n.indexOf(w);
    if (at === 0) t = 0;
    else if (at > 0) t = 1;
    else if (e.c.includes(w)) t = 2;
    else if (e.a.includes(w)) t = 3;
    else if (e.t.includes(w)) t = T_NOTE;
    else if (e.d.includes(w)) t = T_DESC;
    else if (subseq(e.n, w)) t = T_FUZZY;
    if (t < 0) return -1;
    if (t > worst) worst = t;
  }
  return worst;
}

const hitsAny = (ix: Index, w: string): boolean => ix.entries.some((e) => tierOf(e, [w]) >= 0);

/** The chips' filter for one search (everything but the free text and the category chips, which perCat counts
 *  before): built once a search. */
interface Plan {
  ws: string[];
  ignored: string[];
  cats: Extract<Chip, { k: 'cat' }>[];
  nots: Extract<Chip, { k: 'not' }>[];
  days: number[];
  ats: Extract<Chip, { k: 'at' }>[];
  areaChips: Extract<Chip, { k: 'area' }>[];
  areaKeys: string[];
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
  const ws: string[] = [], ignored: string[] = [];
  raw.forEach((w, i) => {
    const k = keys[i];
    if (!k || (glue && STOP.has(k))) return;
    if (SOFT_KEYS.has(k)) return void ignored.push(w);
    if (hitsAny(ix, k)) return void ws.push(k);
    // a Latin plural (cafes, temples, dumplings): its singular
    const one = /^[a-z]{4,}s$/.test(k) ? [k.slice(0, -1), ...(k.endsWith('es') ? [k.slice(0, -2)] : [])].find((x) => hitsAny(ix, x)) : undefined;
    if (one) ws.push(one);
    // a word nothing has is let go (shown), not zeroing the list; with the descriptions still out, kept
    else if (ix.descs) ignored.push(w);
    else ws.push(k);
  });
  const areaChips = chips.filter((c) => c.k === 'area');
  const areaAt = areaChips.map((c) => ix.areas.get(c.name)?.at ?? null);
  const where = chips.find((c) => c.k === 'point' || c.k === 'centre');
  const box = ctx.box ?? null;
  const boxAt: LL | null = box ? [box[0] <= box[2] ? (box[0] + box[2]) / 2 : ((box[0] + box[2] + 360) / 2) % 360, (box[1] + box[3]) / 2] : null;
  const near = chips.some((c) => c.k === 'near');
  return {
    ws, ignored,
    cats: chips.filter((c) => c.k === 'cat'),
    nots: chips.filter((c) => c.k === 'not'),
    days: chips.filter((c) => c.k === 'day').map((c) => c.d),
    ats: chips.filter((c) => c.k === 'at'),
    areaChips, areaKeys: areaChips.map((c) => placeKey(c.name)), areaAt,
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

function catChipHit(e: Entry, c: Extract<Chip, { k: 'cat' }>): boolean {
  if (c.w && e.n.includes(c.w)) return true;
  return catHit(e, c);
}

function notHit(e: Entry, c: Extract<Chip, { k: 'not' }>): boolean {
  if (c.cat && catHit(e, { cat: c.cat, sub: c.sub })) return true;
  const w = placeKey(c.w);
  return !!w && (e.n.includes(w) || e.c.includes(w));
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
  if (pl.areaChips.length && !pl.areaChips.some((c, k) => e.as.includes(pl.areaKeys[k]) || (c.w && e.n.includes(c.w)) || (pl.areaAt[k] && distM(pl.areaAt[k]!, [p.lng, p.lat]) <= NEAR_M))) return false;
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
  for (let i = 0; i < n; i++) {
    const e = ix.entries[i], p = e.p;
    if (box && !inBox(box, p.lng, p.lat)) continue;
    if (anchor) dist[i] = distM(anchor, [p.lng, p.lat]);
    if (!passes(e, pl, ctx, minOf, dist[i])) continue;
    let t = 0;
    if (ws.length && (t = tierOf(e, ws)) < 0) continue;
    perCat.set(e.cat, perCat.get(e.cat)! + 1);
    if (cats.length && !cats.some((c) => catChipHit(e, c))) continue;
    tiers[i] = t;
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
  const by = ctx.sort === 'near' && anchor ? (a: number, b: number) => (Math.abs(dist[a] - dist[b]) <= TIE_M ? byQ(a, b) || dist[a] - dist[b] : dist[a] - dist[b])
    : ctx.sort === 'rate' ? (a: number, b: number) => byQ(a, b) || byNew(a, b)
    : (a: number, b: number) => byNew(a, b) || byQ(a, b);
  // (近い順's tie is no total order: sorted by distance first, then each run within TIE_M of its start by q)
  if (ctx.sort === 'near' && anchor) {
    hits.sort(ws.length ? (a, b) => tiers[a] - tiers[b] || dist[a] - dist[b] : (a, b) => dist[a] - dist[b]);
    tieRuns(hits, dist, tiers, ws.length > 0, byQ);
  } else hits.sort(ws.length ? (a, b) => tiers[a] - tiers[b] || by(a, b) : by);
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
