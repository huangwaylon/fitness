// トレイル's own hikes (docs/hiking.md, docs/backend.md#events `hike`, `hike_trk`): the hikes the players register
// (a YAMAP link, a GPX, or typed in) beside the baked trails. Built like やること (contract/todo.ts): one op per hike,
// its whole state, the latest `at` wins (then G over B over A), a removal is final.
// - `hike` `{id, at, name, area, status, date?, src, ref?, km?, gainM?, downM?, time?, diff?, notes?}`, a removal
//   `{id, at, rm: true}`. Anyone writes any hike (the guest too: contract/guest.ts). At most HIKE_MAX standing.
// - `hike_trk` `{id, v: 1, len, pts, wpts}`: a hike's track (contract/hikeTrack.ts TrackFile, made by fitTrack), sent
//   once (a second is acked, nothing kept), only for a hike the record holds; its own cap, HIKE_TRK_CHARS. The hike's
//   removal drops it. The model keeps these rows raw (model/state.ts RAW_EVENTS): hikeTrackOf reads one when shown.
// Shared by the record (relay/src/store.ts), the model (model/state.ts) and the sheet; pure and dependency-free.
import type { Who } from '../types.ts';
import { isLocalDate, type EventRow } from './api.ts';
import { BREAKS, cleanLine, STRIP } from './text.ts';
import { AHEAD_MS, isInt, isMs, newOpId, only } from './ops.ts';
import { beats, Book, foldOnce, type Queued, type Verdict } from './book.ts';
import type { TrackFile } from './hikeTrack.ts';

type Rec = Record<string, unknown>;

/** A hike's name and area at most, its notes (characters: code points; the name and area one clean line each).
 *  @public (the hike sheet's fields) */
export const HIKE_NAME = 60;
/** @public (the hike sheet's fields) */
export const HIKE_AREA = 60;
/** @public (the hike sheet's fields) */
export const HIKE_NOTES = 2000;
/** At most this many hikes standing (a removal's row uncounted): a new one past them is refused (`hike full`). */
const HIKE_MAX = 300;
/** A hike's status, source and difficulty, each one of these. @public (the hike sheet's choices) */
export const HIKE_STATUS = ['done', 'planned', 'want'] as const;
/** @public (the hike sheet) */
export const HIKE_SRC = ['yamap', 'gpx', 'manual'] as const;
/** @public (the hike sheet's choices) */
export const HIKE_DIFF = ['easy', 'moderate', 'hard', 'veryhard'] as const;
/** @public (the hike sheet) */
export type HikeStatus = (typeof HIKE_STATUS)[number];
/** @public (the hike sheet) */
export type HikeSrc = (typeof HIKE_SRC)[number];
export type HikeDiff = (typeof HIKE_DIFF)[number];

const ID = /^h[0-9a-z]{6,24}$/;
/** A YAMAP activity's (`a`) or model course's (`m`) id (contract/yamap.ts YamapMeta `ref`). */
const REF = /^[am][1-9][0-9]{0,11}$/;
const TIME = /^[0-9]{1,2}:[0-5][0-9]$/;
const KEYS = ['id', 'at', 'name', 'area', 'status', 'date', 'src', 'ref', 'km', 'gainM', 'downM', 'time', 'diff', 'notes'];
const isHikeId = (v: unknown): v is string => typeof v === 'string' && ID.test(v);

/** A new hike's id. */
export const newHikeId = (at: number): string => newOpId('h', at);

type HikeSet = {
  id: string; at: number; name: string; area: string; status: HikeStatus; date?: string; src: HikeSrc; ref?: string;
  km?: number; gainM?: number; downM?: number; time?: string; diff?: HikeDiff; notes?: string; rm?: undefined;
};
type HikeRm = { id: string; at: number; rm: true };
export type HikeOp = HikeSet | HikeRm;
/** A `hike` row as the record holds it, with who sent it. */
export type HikeRow = { type: 'hike'; who: Who; op: HikeOp };

/** Notes as the record keeps them: STRIP stripped, line breaks one kind, each line's end trimmed, no runs of blank
 *  lines, trimmed, at most HIKE_NOTES characters. Idempotent. */
function cleanNotes(raw: string): string {
  const lines = raw.normalize('NFC').replace(BREAKS, '\n').replace(STRIP, '').replace(/\t/g, ' ').split('\n').map((l) => l.replace(/\s+$/u, ''));
  const s = lines.filter((l, i) => l !== '' || (i > 0 && lines[i - 1] !== '')).join('\n').replace(/^\s+|\s+$/gu, '');
  const cps = Array.from(s);
  return cps.length > HIKE_NOTES ? cps.slice(0, HIKE_NOTES).join('').replace(/\s+$/u, '') : s;
}

/** An op's data with its texts cleaned as the record keeps them (the name and area one clean line, the notes
 *  cleanNotes, empty notes left out): the record cleans what it's sent, then checks it (hikeOpOf). */
export function hikeClean(d: Rec): Rec {
  if (d.rm !== undefined) return d;
  const out: Rec = { ...d };
  if (typeof d.name === 'string') out.name = cleanLine(d.name, HIKE_NAME);
  if (typeof d.area === 'string') out.area = cleanLine(d.area, HIKE_AREA);
  if (typeof d.notes === 'string') {
    const n = cleanNotes(d.notes);
    if (n) out.notes = n;
    else delete out.notes;
  }
  return out;
}

const isLine = (v: unknown, max: number, empty = false): v is string => typeof v === 'string' && (empty || v !== '') && cleanLine(v, max) === v;
const oneOf = <T extends string>(v: unknown, xs: readonly T[]): v is T => (xs as readonly unknown[]).includes(v);
const isKm = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 1000;

/** A `hike` op's data, its known keys only, each well-formed (texts already clean), or null. `now`: the record's
 *  clock (an `at` more than a day past it is refused); omitted, no bound. */
export function hikeOpOf(d: Rec, now?: number): HikeOp | null {
  if (!isHikeId(d.id) || !isMs(d.at) || (now !== undefined && d.at > now + AHEAD_MS)) return null;
  const id = d.id, at = d.at;
  if (d.rm !== undefined) return d.rm === true && only(d, ['id', 'at', 'rm']) ? { id, at, rm: true } : null;
  if (!only(d, KEYS) || !isLine(d.name, HIKE_NAME) || !isLine(d.area, HIKE_AREA, true) || !oneOf(d.status, HIKE_STATUS) || !oneOf(d.src, HIKE_SRC)) return null;
  if (d.date !== undefined && !isLocalDate(d.date)) return null;
  if (d.ref !== undefined && (d.src !== 'yamap' || typeof d.ref !== 'string' || !REF.test(d.ref))) return null;
  if (d.km !== undefined && !isKm(d.km)) return null;
  if ((d.gainM !== undefined && !isInt(d.gainM, 0, 20_000)) || (d.downM !== undefined && !isInt(d.downM, 0, 20_000))) return null;
  if (d.time !== undefined && (typeof d.time !== 'string' || !TIME.test(d.time))) return null;
  if (d.diff !== undefined && !oneOf(d.diff, HIKE_DIFF)) return null;
  if (d.notes !== undefined && (typeof d.notes !== 'string' || d.notes === '' || cleanNotes(d.notes) !== d.notes)) return null;
  const op: HikeSet = { id, at, name: d.name, area: d.area, status: d.status, src: d.src };
  for (const k of ['date', 'ref', 'km', 'gainM', 'downM', 'time', 'diff', 'notes'] as const) if (d[k] !== undefined) (op as Rec)[k] = d[k];
  return op;
}

/** A row read from its type, data and sender (null: not a `hike`, or malformed). */
export const hikeRowOf = (type: string, d: Rec, who: Who): HikeRow | null => {
  if (type !== 'hike') return null;
  const op = hikeOpOf(d);
  return op ? { type, who, op } : null;
};

/** The slot a `hike` row fills: its id's. */
export const hikeSlot = (d: Rec): string | null => (isHikeId(d.id) ? `hike|${d.id}` : null);
/** The slot a `hike_trk` row fills: its hike's id's. */
export const hikeTrkSlot = (d: Rec): string | null => (isHikeId(d.id) ? `hike_trk|${d.id}` : null);

/** What the record does with a `hike` row (contract/book.ts Verdict): `append` (a removal drops its track's slot),
 *  `stale` or `full` (HIKE_MAX standing). */
export type HikeVerdict = Verdict<HikeRow, 'full'>;

/** The hikes as the record holds them (each id's latest row). */
export class HikeBook extends Book<HikeRow, 'full'> {
  protected slotOf(r: HikeRow): string {
    return `hike|${r.op.id}`;
  }
  protected countOf(r: HikeRow): string | null {
    return r.op.rm ? null : 'n';
  }

  accept(r: HikeRow): HikeVerdict {
    const held = this.rows.get(this.slotOf(r)) ?? null;
    // a removal is final: whatever comes after it changes nothing
    if (held?.op.rm || (held && !beats(r, held))) return { v: 'stale' };
    // only a creation makes a row (an edit's or a removal's hike is gone, or never was)
    if (!held && (r.op.rm || this.count('n') >= HIKE_MAX)) return { v: r.op.rm ? 'stale' : 'full' };
    return { v: 'append', row: r, drop: r.op.rm ? [`hike_trk|${r.op.id}`] : [] };
  }
}

/** A row as the model holds it: the record's, or this phone's not yet sent (`queued`). */
export type HikeEntry = Queued<HikeRow>;
/** The rows as the record keeps them (contract/book.ts Book.fold). */
export const hikeFold = (rows: Iterable<HikeEntry>): HikeBook => new HikeBook().fold(rows);
/** A model's list folded, once per list. @public (the hike sheet's store) */
export const hikeBookOf = foldOnce(hikeFold);

/** A standing hike as the sheet shows it: its op, and who last changed it. */
export type HikeView = Omit<HikeSet, 'rm'> & { who: Who };

/** The standing hikes: by date, the latest first (undated after the dated, then by name). */
export function hikesOf(book: HikeBook): HikeView[] {
  const out: HikeView[] = [];
  for (const { who, op } of book.rows.values()) if (!op.rm) out.push({ ...op, who });
  return out.sort((a, b) => (a.date === b.date ? (a.name < b.name ? -1 : a.name > b.name ? 1 : 0) : !a.date ? 1 : !b.date ? -1 : a.date < b.date ? 1 : -1));
}

// ---------------------------------------------------------------- the track

const LON = 180, LAT = 90;
const isCoord = (v: unknown, max: number): v is number => typeof v === 'number' && Number.isFinite(v) && Math.abs(v) <= max;
const isEle = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v >= -1000 && v <= 10_000;

/** A `hike_trk`'s data, its known keys only, each well-formed (at least two points, at most 30 waypoints), or null. */
export function hikeTrkOf(d: Rec): (TrackFile & { id: string }) | null {
  if (!isHikeId(d.id) || !only(d, ['id', 'v', 'len', 'pts', 'wpts']) || d.v !== 1 || !isInt(d.len, 0, 1e7)) return null;
  if (!Array.isArray(d.pts) || d.pts.length < 2 || !Array.isArray(d.wpts) || d.wpts.length > 30) return null;
  for (const p of d.pts as unknown[]) if (!Array.isArray(p) || p.length !== 3 || !isCoord(p[0], LON) || !isCoord(p[1], LAT) || !isEle(p[2])) return null;
  for (const w of d.wpts as unknown[]) {
    const x = w as Rec;
    if (typeof w !== 'object' || w === null || !only(x, ['lon', 'lat', 'name']) || !isCoord(x.lon, LON) || !isCoord(x.lat, LAT) || !isLine(x.name, HIKE_NAME, true)) return null;
  }
  return { id: d.id, v: 1, len: d.len, pts: d.pts as TrackFile['pts'], wpts: d.wpts as TrackFile['wpts'] };
}

/** Whether the record keeps a `hike_trk`: only for a hike it holds standing, and only the first. */
export const hikeTrkAccept = (hike: HikeRow | null, had: boolean): 'append' | 'stale' => (hike && !hike.op.rm && !had ? 'append' : 'stale');

/** Each hike's track row's data (unparsed), by its hike's id, once per list: its id read off the raw JSON (a track's
 *  only other strings are its waypoints' names, where a quote is escaped). */
const trackIndex = foldOnce((rows: readonly EventRow[]): Map<string, string> => {
  const m = new Map<string, string>();
  for (const r of rows) {
    const id = /"id":"(h[0-9a-z]{6,24})"/.exec(r[4])?.[1];
    if (id && !m.has(id)) m.set(id, r[4]);
  }
  return m;
});

/** A hike's track from the model's raw `hike_trk` rows (model/state.ts `hikeTrk`), or null: none, or unreadable. */
export function hikeTrackOf(rows: readonly EventRow[], id: string): TrackFile | null {
  const raw = trackIndex(rows).get(id);
  if (raw === undefined) return null;
  let d: unknown;
  try {
    d = JSON.parse(raw);
  } catch {
    return null;
  }
  const t = typeof d === 'object' && d !== null && !Array.isArray(d) ? hikeTrkOf(d as Rec) : null;
  if (!t || t.id !== id) return null;
  const { id: _, ...track } = t;
  return track;
}
