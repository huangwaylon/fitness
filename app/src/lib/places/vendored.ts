// 保存した場所's vendored Google details and photos (static/places/, the scraper's output): what the relay's payload
// doesn't carry — Google's own hours, website, phone, a short description, the rating and its count, Google's kind —
// and each place's photos, packed into sprite sheets (a card cell in sheets/, a thumbnail in tsheets/; up to three
// cards and one thumb a place). index.json names the shard files (d/, a place's shard fnv1a(id) % their count) and
// the sheets; every file name carries its content hash, so a URL never changes once cached. Read beside the relay's
// rows, never instead: a missing or broken file, a place not scraped, an id that isn't a cid or an ftid — each is
// null and the card shows what the relay has. Pure but for the fetches (the index once a session, a shard once).
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
 *  the shard and sheet file names (a shard's n is its index in d) and the cells' sizes [w, h]. */
export interface VendoredIndex {
  v: 1;
  n: number;
  skipped: number;
  at: number;
  d: string[];
  sheets: string[];
  tsheets: string[];
  card: [number, number];
  thumb: [number, number];
}

/** One place's vendored details (its shard entry, keyed by its place id). Optional keys are absent when Google
 *  showed none; hours: null is Google saying there are none. pics: cells [sheet, col, row] into the index's sheets,
 *  t: one into tsheets. */
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
  t?: [number, number, number];
}

/** The id forms the scraper vendors: a cid (digits) or an ftid pair. A k: id (a name-and-coords hash, no Google
 *  page) is never vendored and never even looked up. */
const ID = /^(\d+|f:0x[0-9a-f]+:0x[0-9a-f]+)$/;
const SHARD = /^\d+\.[0-9a-f]{8}\.json$/;
const SHEET = /^[ct]\d+\.[0-9a-f]{8}\.webp$/;
const TEL = /^[+0-9 ()-]{5,20}$/;
/** A sheet's grid: 4×4 cards, 10×10 thumbs; at most 3 cards a place; a description at most 240 chars, no markup. */
const CARD_GRID = 4, THUMB_GRID = 10, PICS_MAX = 3, DESC_MAX = 240, KIND_MAX = 100;

/** The contract's weekly period (contract/places.ts, its own guard unexported): d 0 Sunday…6, o minutes from the
 *  day's midnight, c past o up to the week's end (past 1440 past midnight). */
const isPeriod = (v: unknown): v is Period => isRec(v) && isNum(v.d) && isNum(v.o) && isNum(v.c) && v.d >= 0 && v.d <= 6 && v.o >= 0 && v.o < 1440 && v.c > v.o && v.c <= WEEK_MIN;
const isInt = (v: unknown, min = 0): v is number => Number.isInteger(v) && (v as number) >= min;
const isSize = (v: unknown): v is [number, number] => Array.isArray(v) && v.length === 2 && v.every((x) => Number.isInteger(x) && x > 0);
/** A sprite cell [sheet, col, row]: ints, the sheet any (bounded by the index's list at the cell's read), col and row
 *  inside the grid. */
const isCell = (v: unknown, grid: number): v is [number, number, number] =>
  Array.isArray(v) && v.length === 3 && v.every((x) => Number.isInteger(x) && x >= 0) && v[1] < grid && v[2] < grid;
const isNames = (v: unknown, re: RegExp): v is string[] => Array.isArray(v) && v.every((f) => typeof f === 'string' && re.test(f));

/** index.json, checked (every file name in form, the sizes positive), or null: anything off and nothing is read. */
export function vendoredIndexOf(json: unknown): VendoredIndex | null {
  if (!isRec(json) || json.v !== 1) return null;
  if (!isInt(json.n) || !isInt(json.skipped) || !isNum(json.at)) return null;
  if (!isNames(json.d, SHARD) || !isNames(json.sheets, SHEET) || !isNames(json.tsheets, SHEET)) return null;
  if (!isSize(json.card) || !isSize(json.thumb)) return null;
  return json as unknown as VendoredIndex;
}

/** A shard entry, checked field by field. One broken entry refuses the shard whole: the scraper writes a shard in
 *  one pass, so a broken field says the build — every entry of it — is off. */
function entryOf(v: unknown): VendoredPlace | null {
  if (!isRec(v) || !isNum(v.at)) return null;
  if (!(v.hours === null || (Array.isArray(v.hours) && v.hours.every(isPeriod)))) return null;
  if (v.web !== undefined && (typeof v.web !== 'string' || !v.web.startsWith('https://'))) return null;
  if (v.tel !== undefined && (typeof v.tel !== 'string' || !TEL.test(v.tel))) return null;
  if (v.desc !== undefined && (typeof v.desc !== 'string' || v.desc.length > DESC_MAX || v.desc.includes('<'))) return null;
  if (v.r !== undefined && (!isNum(v.r) || v.r < 0 || v.r > 5)) return null;
  if (v.rn !== undefined && !isInt(v.rn)) return null;
  if (v.kind !== undefined && (typeof v.kind !== 'string' || !v.kind.trim() || v.kind.length > KIND_MAX)) return null;
  if (v.pics !== undefined && (!Array.isArray(v.pics) || v.pics.length > PICS_MAX || !v.pics.every((c) => isCell(c, CARD_GRID)))) return null;
  if (v.t !== undefined && !isCell(v.t, THUMB_GRID)) return null;
  return v as unknown as VendoredPlace;
}

/** A shard's p map, checked: every key a cid or an ftid pair, every entry whole, or null. */
export function vendoredShardOf(json: unknown): Record<string, VendoredPlace> | null {
  if (!isRec(json) || json.v !== 1 || !isRec(json.p)) return null;
  const out: Record<string, VendoredPlace> = {};
  for (const [id, v] of Object.entries(json.p)) {
    if (!ID.test(id)) return null;
    const e = entryOf(v);
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

/** The index, fetched once for the session: a 404, a broken body, a refusal is null and kept (a retry is the next
 *  page load's, never a loop's). */
export function loadVendoredIndex(): Promise<VendoredIndex | null> {
  return (index ??= quiet(fetch(staticUrl('places/index.json')).then(async (r) => (r.ok ? vendoredIndexOf(await r.json()) : null)), 'places.vendored', null));
}

/** A place's vendored details, or null (no index, its shard missing or broken, it wasn't scraped). Only a cid or an
 *  ftid id is ever looked up — a k: id asks nothing; each shard is fetched once. */
export async function loadPlaceDetail(id: string): Promise<VendoredPlace | null> {
  if (!ID.test(id)) return null;
  const ix = await loadVendoredIndex();
  if (!ix) return null;
  const s = shardOf(id, ix.d.length), f = ix.d[s];
  if (!f) return null;
  let shard = shards.get(s);
  if (!shard) shards.set(s, (shard = quiet(fetch(staticUrl(`places/d/${f}`)).then(async (r) => (r.ok ? vendoredShardOf(await r.json()) : null)), 'places.vendored', null)));
  return (await shard)?.[id] ?? null;
}

function cellOf(sheets: string[], size: [number, number], c: [number, number, number] | undefined): { url: string; x: number; y: number; w: number; h: number } | null {
  const f = c ? sheets[c[0]] : undefined;
  return c && f ? { url: staticUrl(`places/img/${f}`), x: c[1] * size[0], y: c[2] * size[1], w: size[0], h: size[1] } : null;
}

/** The i-th card photo's cell (pics[i]) in its sheet, or null (no i-th photo, or its sheet gone). */
export function cardCell(ix: VendoredIndex, e: VendoredPlace, i: number): { url: string; x: number; y: number; w: number; h: number } | null {
  return cellOf(ix.sheets, ix.card, e.pics?.[i]);
}

/** The thumbnail's cell (t) in its sheet, or null (none, or its sheet gone). */
export function thumbCell(ix: VendoredIndex, e: VendoredPlace): { url: string; x: number; y: number; w: number; h: number } | null {
  return cellOf(ix.tsheets, ix.thumb, e.t);
}
