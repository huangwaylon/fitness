// 保存した場所's vendored Google details and photos (static/places/, the scraper's output): what the relay's payload
// doesn't carry — Google's own hours, website, phone, a short description, the rating and its count, Google's kind —
// and each place's photos, packed into 2×3 sprite sheets (600 × 338 cells; up to three a place, one place's cells in
// one sheet, two places a sheet). index.json names the shard files (d/, a place's shard fnv1a(id) % their count) and
// the sheets; every file name carries its content hash, so a URL never changes once cached. Read beside the relay's
// rows, never instead: a missing or broken file, a place not scraped, an id that isn't a cid or an ftid — each is
// null and the card shows what the relay has. Pure but for the fetches (the index once a session, a shard once; a
// 404's null kept, a network miss retried by the next card — one offline open never poisons the session).
import { quiet } from '#lib/quiet.ts';
import { staticUrl } from '#lib/staticUrl.ts';
import { isNum, isRec } from '../contract/guards.ts';
import { WEEK_MIN, type Period } from '../contract/places.ts';

/** A string's 32-bit FNV-1a hash (by UTF-16 code unit): random.ts's own, duplicated — the places folder may not
 *  import random (deps.test) — and the scraper's shard packing; the test pins them equal. */
function fnv1a(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 0x01000193);
  return h >>> 0;
}

/** static/places/index.json: the scrape's counts (n places in, skipped without a page) and when (at, epoch seconds),
 *  the shard and sheet file names (a shard's n is its index in d), the cell size [w, h] and the sheet grid [cols,
 *  rows]. */
export interface VendoredIndex {
  v: 1;
  n: number;
  skipped: number;
  at: number;
  d: string[];
  sheets: string[];
  card: [number, number];
  grid: [number, number];
}

/** One place's vendored details (its shard entry, keyed by its place id). Optional keys are absent when Google
 *  showed none; hours: null is Google saying there are none. pics: cells [sheet, col, row] into the index's sheets,
 *  all in one sheet. */
export interface VendoredPlace {
  at: number;
  hours: Period[] | null;
  web?: string;
  tel?: string;
  desc?: string;
  r?: number;
  rn?: number;
  kind?: string;
  pics?: [number, number, number][];
}

/** The id forms the scraper vendors: a cid (digits) or an ftid pair. A k: id (a name-and-coords hash, no Google
 *  page) is never vendored and never even looked up. */
const ID = /^(\d+|f:0x[0-9a-f]+:0x[0-9a-f]+)$/;
const SHARD = /^\d+\.[0-9a-f]{8}\.json$/;
const SHEET = /^c\d+\.[0-9a-f]{8}\.webp$/;
const TEL = /^[+0-9 ()-]{5,20}$/;
const PICS_MAX = 3, DESC_MAX = 240, KIND_MAX = 100;

/** The contract's weekly period (contract/places.ts, its own guard unexported): d 0 Sunday…6, o minutes from the
 *  day's midnight, c past o up to the week's end (past 1440 past midnight). */
const isPeriod = (v: unknown): v is Period => isRec(v) && isNum(v.d) && isNum(v.o) && isNum(v.c) && v.d >= 0 && v.d <= 6 && v.o >= 0 && v.o < 1440 && v.c > v.o && v.c <= WEEK_MIN;
const isInt = (v: unknown, min = 0): v is number => Number.isInteger(v) && (v as number) >= min;
const isSize = (v: unknown): v is [number, number] => Array.isArray(v) && v.length === 2 && v.every((x) => Number.isInteger(x) && x > 0);
/** A sprite cell [sheet, col, row]: ints, the sheet any (bounded by the index's list at the cell's read), col and
 *  row inside the grid. */
const isCell = (v: unknown, grid: [number, number]): v is [number, number, number] =>
  Array.isArray(v) && v.length === 3 && v.every((x) => Number.isInteger(x) && x >= 0) && v[1] < grid[0] && v[2] < grid[1];
const isNames = (v: unknown, re: RegExp): v is string[] => Array.isArray(v) && v.every((f) => typeof f === 'string' && re.test(f));

/** index.json, checked (every file name in form, the sizes and grid positive), or null: anything off and nothing is
 *  read. */
export function vendoredIndexOf(json: unknown): VendoredIndex | null {
  if (!isRec(json) || json.v !== 1) return null;
  if (!isInt(json.n) || !isInt(json.skipped) || !isNum(json.at)) return null;
  if (!isNames(json.d, SHARD) || !isNames(json.sheets, SHEET)) return null;
  if (!isSize(json.card) || !isSize(json.grid)) return null;
  return json as unknown as VendoredIndex;
}

/** A shard entry, checked field by field. One broken entry refuses the shard whole: the scraper writes a shard in
 *  one pass, so a broken field says the build — every entry of it — is off. */
function entryOf(v: unknown, grid: [number, number]): VendoredPlace | null {
  if (!isRec(v) || !isNum(v.at)) return null;
  if (!(v.hours === null || (Array.isArray(v.hours) && v.hours.every(isPeriod)))) return null;
  if (v.web !== undefined && (typeof v.web !== 'string' || !v.web.startsWith('https://'))) return null;
  if (v.tel !== undefined && (typeof v.tel !== 'string' || !TEL.test(v.tel))) return null;
  if (v.desc !== undefined && (typeof v.desc !== 'string' || v.desc.length > DESC_MAX || v.desc.includes('<'))) return null;
  if (v.r !== undefined && (!isNum(v.r) || v.r < 0 || v.r > 5)) return null;
  if (v.rn !== undefined && !isInt(v.rn)) return null;
  if (v.kind !== undefined && (typeof v.kind !== 'string' || !v.kind.trim() || v.kind.length > KIND_MAX)) return null;
  if (v.pics !== undefined && (!Array.isArray(v.pics) || v.pics.length > PICS_MAX || !v.pics.every((c) => isCell(c, grid)))) return null;
  return v as unknown as VendoredPlace;
}

/** A shard's p map, checked against the index's grid: every key a cid or an ftid pair, every entry whole, or null. */
export function vendoredShardOf(json: unknown, grid: [number, number]): Record<string, VendoredPlace> | null {
  if (!isRec(json) || json.v !== 1 || !isRec(json.p)) return null;
  const out: Record<string, VendoredPlace> = {};
  for (const [id, v] of Object.entries(json.p)) {
    if (!ID.test(id)) return null;
    const e = entryOf(v, grid);
    if (!e) return null;
    out[id] = e;
  }
  return out;
}

/** A place id's shard: fnv1a(id) % n, the scraper's own packing. */
export function shardOf(id: string, n: number): number {
  return fnv1a(id) % n;
}

let index: Promise<VendoredIndex | null> | null = null;
const shards = new Map<number, Promise<Record<string, VendoredPlace> | null>>();

/** The index, fetched once for the session: a 404 (a pre-scrape build) is null and kept; a network miss or a broken
 *  body is null but forgotten at once, so the next card asks again (one offline open never poisons the session —
 *  E4). */
export function loadVendoredIndex(): Promise<VendoredIndex | null> {
  if (!index)
    index = fetch(staticUrl('places/index.json'))
      .then(async (r): Promise<VendoredIndex | null> => {
        if (r.status === 404) return null;
        if (!r.ok) throw new Error(`places index: ${r.status}`);
        const ix = vendoredIndexOf(await r.json());
        if (!ix) throw new Error('places index: broken');
        return ix;
      })
      .catch((e) => {
        index = null;
        return quiet(Promise.reject(e), 'places.vendored', null);
      });
  return index;
}

/** A place's vendored details, or null (no index, its shard missing or broken, it wasn't scraped). Only a cid or an
 *  ftid id is ever looked up — a k: id asks nothing; a shard's fetch misses retry like the index's. */
export async function loadPlaceDetail(id: string): Promise<VendoredPlace | null> {
  if (!ID.test(id)) return null;
  const ix = await loadVendoredIndex();
  if (!ix) return null;
  const s = shardOf(id, ix.d.length), f = ix.d[s];
  if (!f) return null;
  let shard = shards.get(s);
  if (!shard) {
    shard = fetch(staticUrl(`places/d/${f}`))
      .then(async (r): Promise<Record<string, VendoredPlace> | null> => {
        if (r.status === 404) return null;
        if (!r.ok) throw new Error(`places shard ${s}: ${r.status}`);
        const p = vendoredShardOf(await r.json(), ix.grid);
        if (!p) throw new Error(`places shard ${s}: broken`);
        return p;
      })
      .catch((e) => {
        shards.delete(s);
        return quiet(Promise.reject(e), 'places.vendored', null);
      });
    shards.set(s, shard);
  }
  return (await shard)?.[id] ?? null;
}

/** The i-th card photo's cell (pics[i]) in its sheet, or null (no i-th photo, or its sheet gone). */
export function cardCell(ix: VendoredIndex, e: VendoredPlace, i: number): { url: string; x: number; y: number; w: number; h: number } | null {
  const c = e.pics?.[i], f = c ? ix.sheets[c[0]] : undefined;
  return c && f ? { url: staticUrl(`places/img/${f}`), x: c[1] * ix.card[0], y: c[2] * ix.card[1], w: ix.card[0], h: ix.card[1] } : null;
}
