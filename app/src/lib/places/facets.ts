// 保存した場所's search facets (docs/places.md "Search"): what the vendored shards (static/places/d/, vendored.ts) say
// about every place that a search filters or ranks by — Google's kind, the rating and its count, the hours, whether
// there's a website or a phone — packed at build time by scripts/places-facets.ts into one file (data/places-facets.json,
// ~60 KB gzipped), and the descriptions into a second (data/places-descs.json, ~290 KB). Both are hashed build assets
// (`new URL(…, import.meta.url)`: Vite emits them, node reads the file), never in the first load nor precached (the
// worker carries them once used: service-worker/caches.ts isFeatureChunk); the facets are fetched when the sheet
// opens, the descriptions on the first free-text word. Keyed by fnv1a(id) (vendored.ts's own hash; sorted,
// delta-coded: a collision fails the pack). Pure but for the two fetches.
import { quiet } from '#lib/quiet.ts';
import { isRec } from '../contract/guards.ts';
import type { Period } from '../contract/places.ts';
import type { VendoredPlace } from './vendored.ts';

/** One place's facets. hours: null unknown (or Google's explicit none). */
interface Facet {
  kind: string | null;
  r: number | null;
  rn: number;
  hours: Period[] | null;
  web: boolean;
  tel: boolean;
}

export interface FacetTable {
  get(id: string): Facet | undefined;
  readonly size: number;
}
export interface DescTable {
  get(id: string): string | undefined;
  readonly size: number;
}

/** The facets file: hashes delta-coded (h), per place a kind index (k, -1 none), r×10 (0 none), rn, flags (f: 1 web,
 *  2 tel), an hours pattern index (hz, -1 none) into hp ('d.o.c' periods joined by ','). */
export interface FacetsFile {
  v: 1;
  kinds: string[];
  h: number[];
  k: number[];
  r: number[];
  rn: number[];
  f: number[];
  hp: string[];
  hz: number[];
}
/** The descriptions file: the places with one, keyed the same way. */
export interface DescsFile {
  v: 1;
  h: number[];
  d: string[];
}

/** A string's 32-bit FNV-1a hash by UTF-16 code unit (vendored.ts's, copied: that file is a peer's; facets.test pins
 *  them equal through its shardOf). */
export function fnv1a(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 0x01000193);
  return h >>> 0;
}

/** Sorted hashes of `ids` with each id's place in that order; throws on a collision. */
function keyed(ids: readonly string[]): { h: number[]; order: number[] } {
  const hs = ids.map(fnv1a);
  const order = ids.map((_, i) => i).sort((a, b) => hs[a] - hs[b]);
  for (let i = 1; i < order.length; i++) if (hs[order[i]] === hs[order[i - 1]]) throw new Error('places facets: two ids share a hash');
  const sorted = order.map((i) => hs[i]);
  return { h: sorted.map((x, i) => (i ? x - sorted[i - 1] : x)), order };
}

const hoursKey = (h: readonly Period[]): string => [...h].sort((a, b) => a.d - b.d || a.o - b.o).map((p) => `${p.d}.${p.o}.${p.c}`).join(',');

/** The two files from the shards' places (id → entry). Deterministic: the same places give the same bytes. */
export function packFacets(all: Record<string, VendoredPlace>): { facets: FacetsFile; descs: DescsFile } {
  const ids = Object.keys(all);
  const { h, order } = keyed(ids);
  const kinds = [...new Set(ids.map((id) => all[id].kind).filter((k): k is string => !!k))].sort();
  const kIx = new Map(kinds.map((k, i) => [k, i]));
  const hp: string[] = [], hIx = new Map<string, number>();
  const f: FacetsFile = { v: 1, kinds, h, k: [], r: [], rn: [], f: [], hp, hz: [] };
  for (const i of order) {
    const e = all[ids[i]];
    f.k.push(e.kind ? kIx.get(e.kind)! : -1);
    f.r.push(e.r ? Math.round(e.r * 10) : 0);
    f.rn.push(e.rn ?? 0);
    f.f.push((e.web ? 1 : 0) | (e.tel ? 2 : 0));
    let z = -1;
    if (e.hours?.length) {
      const key = hoursKey(e.hours);
      z = hIx.get(key) ?? -1;
      if (z < 0) hIx.set(key, (z = hp.push(key) - 1));
    }
    f.hz.push(z);
  }
  const withDesc = ids.filter((id) => all[id].desc);
  const d = keyed(withDesc);
  return { facets: f, descs: { v: 1, h: d.h, d: d.order.map((i) => all[withDesc[i]].desc!) } };
}

const isInts = (v: unknown, n: number): v is number[] => Array.isArray(v) && v.length === n && v.every(Number.isInteger);
const isStrs = (v: unknown): v is string[] => Array.isArray(v) && v.every((x) => typeof x === 'string');

/** Delta-coded hashes back to a sorted Uint32Array (null: not ascending). */
function undelta(h: number[]): Uint32Array | null {
  const out = new Uint32Array(h.length);
  let x = 0;
  for (let i = 0; i < h.length; i++) {
    x += h[i];
    if ((i && h[i] <= 0) || x > 0xffffffff || x < 0) return null;
    out[i] = x;
  }
  return out;
}

function find(hs: Uint32Array, id: string): number {
  const x = fnv1a(id);
  let lo = 0, hi = hs.length - 1;
  while (lo <= hi) {
    const m = (lo + hi) >> 1;
    if (hs[m] < x) lo = m + 1;
    else if (hs[m] > x) hi = m - 1;
    else return m;
  }
  return -1;
}

const periodsOf = (s: string): Period[] => s.split(',').map((p) => {
  const [d, o, c] = p.split('.').map(Number);
  return { d, o, c };
});

/** The facets file read (every column the hashes' length, the indexes in range), or null. A hash not in it (a k: id,
 *  a place scraped since) has no facet; one that collides with a vendored one is read as that place (1 in ~10⁶ at
 *  3.5k: the search's only cost is one wrong facet). */
export function facetTableOf(json: unknown): FacetTable | null {
  if (!isRec(json) || json.v !== 1 || !Array.isArray(json.h) || !isInts(json.h, json.h.length)) return null;
  const x = json as unknown as FacetsFile, n = x.h.length;
  if (!isStrs(x.kinds) || !isStrs(x.hp) || !isInts(x.k, n) || !isInts(x.r, n) || !isInts(x.rn, n) || !isInts(x.f, n) || !isInts(x.hz, n)) return null;
  if (x.k.some((k) => k >= x.kinds.length) || x.hz.some((z) => z >= x.hp.length)) return null;
  const hs = undelta(x.h);
  if (!hs) return null;
  const hours = x.hp.map(periodsOf);
  if (!hours.every((h) => h.every((p) => p.d >= 0 && p.d <= 6 && p.o >= 0 && p.c > p.o))) return null;
  const memo = new Map<number, Facet>();
  return {
    size: n,
    get(id) {
      const i = find(hs, id);
      if (i < 0) return undefined;
      let f = memo.get(i);
      if (!f) memo.set(i, (f = { kind: x.k[i] >= 0 ? x.kinds[x.k[i]] : null, r: x.r[i] ? x.r[i] / 10 : null, rn: x.rn[i], hours: x.hz[i] >= 0 ? hours[x.hz[i]] : null, web: !!(x.f[i] & 1), tel: !!(x.f[i] & 2) }));
      return f;
    }
  };
}

/** The descriptions file read, or null. */
export function descTableOf(json: unknown): DescTable | null {
  if (!isRec(json) || json.v !== 1 || !Array.isArray(json.h) || !isInts(json.h, json.h.length) || !isStrs(json.d) || json.d.length !== json.h.length) return null;
  const hs = undelta(json.h as number[]), d = json.d as string[];
  if (!hs) return null;
  return { size: d.length, get: (id) => { const i = find(hs, id); return i < 0 ? undefined : d[i]; } };
}

const FACETS_URL = new URL('./data/places-facets.json', import.meta.url).href;
const DESCS_URL = new URL('./data/places-descs.json', import.meta.url).href;
let facets: Promise<FacetTable | null> | null = null;
let descs: Promise<DescTable | null> | null = null;

const fetchOf = <T>(url: string, read: (j: unknown) => T | null): Promise<T | null> =>
  quiet(fetch(url).then(async (r) => (r.ok ? read(await r.json()) : null)), 'places.facets', null);

/** The facets, fetched once a session (a failure is null and kept: the next page load retries). */
export const loadFacets = (): Promise<FacetTable | null> => (facets ??= fetchOf(FACETS_URL, facetTableOf));
/** The descriptions, likewise. */
export const loadDescs = (): Promise<DescTable | null> => (descs ??= fetchOf(DESCS_URL, descTableOf));
