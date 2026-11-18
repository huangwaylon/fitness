// English Study's progress rows (docs/english.md "Progress", docs/backend.md "Events" `listen`): a row per clip's まとめ
// reached (`f`), or for the minutes studied in a clip left part-way, with my answers so far. The record checks the
// shape (validEventData) and sends a row whole to its owner only; everyone else gets its summary (that a clip was
// studied, when, how long, whether it was finished), the guest and the members alike (contract/guest.ts rowsFor). Pure,
// over the contract only (the relay imports it).
import { isLocalDate } from './api.ts';
import { isInt } from './ops.ts';
import type { LocalDate, Who } from '../types.ts';

/** One answer: the question's id, right (1) or not (0), the choice picked (a dictation's words heard; −1: none), the
 *  replays before it. */
type ListenAnswer = [id: string, ok: 0 | 1, pick: number, rp: number];

/** English Study's `gm` (the only kind of row: the retired ききみみ's others were deleted 2026-11-16). */
export const TV_GM = 'tv';

interface ListenRow {
  /** The Tokyo day it was studied. */
  d: LocalDate;
  /** The session's id. */
  g: string;
  gm: typeof TV_GM;
  /** The clip's id. */
  u: string;
  /** The active study time the row adds, ms (≤ 1 h). */
  ms: number;
  /** The clip's まとめ reached (a day of study); absent: the minutes of a clip left part-way. */
  f?: 1;
  /** My answers so far, in the lesson's order (maybe none). */
  r: ListenAnswer[];
}

/** What everyone else sees of a row: never the clip or the answers. */
type ListenSummary = Pick<ListenRow, 'd' | 'g' | 'ms' | 'gm' | 'f'>;

const LISTEN_MAX_Q = 12;
const LISTEN_MAX_RP = 99;
const LISTEN_MAX_MS = 60 * 60 * 1000;
const GAME_RE = /^[a-z0-9]{4,12}$/;
const CLIP_RE = /^[a-z0-9-]{1,12}$/;
const ITEM_ID_RE = /^[a-z0-9][a-z0-9-]{0,31}$/;
/** (`lv` and `n`, ききみみ's level and players, on the rows written before 2026-11-18: still accepted, never read.) */
const KEYS = new Set(['d', 'g', 'gm', 'u', 'lv', 'n', 'ms', 'f', 'r']);

function answerOf(a: unknown): ListenAnswer | null {
  if (!Array.isArray(a) || a.length !== 4) return null;
  const [id, ok, pick, rp] = a as unknown[];
  return typeof id === 'string' && ITEM_ID_RE.test(id) && (ok === 0 || ok === 1) && isInt(pick, -1, 4095) && isInt(rp, 0, LISTEN_MAX_RP) ? [id, ok, pick, rp] : null;
}

/** The summary's fields every row has: a day, a session, the minutes. */
const summaryFields = (o: Record<string, unknown>): boolean =>
  isLocalDate(o.d) && typeof o.g === 'string' && GAME_RE.test(o.g) && isInt(o.ms, 0, LISTEN_MAX_MS) && (o.f === undefined || o.f === 1);
/** An older row's `lv` / `n`, when it has them, in their old range. */
const oldFields = (o: Record<string, unknown>): boolean => (o.lv === undefined || isInt(o.lv, 1, 8)) && (o.n === undefined || isInt(o.n, 1, 3));

/** A row as sent or kept, or null when it isn't one (an unknown key, a field out of range, another game's). Its day's
 *  bound (not after tomorrow) is the record's check (contract/record.ts validEventData). */
export function listenOf(d: unknown): ListenRow | null {
  if (!d || typeof d !== 'object' || Array.isArray(d)) return null;
  const o = d as Record<string, unknown>;
  if (Object.keys(o).some((k) => !KEYS.has(k)) || o.gm !== TV_GM || !summaryFields(o) || !oldFields(o)) return null;
  if (typeof o.u !== 'string' || !CLIP_RE.test(o.u)) return null;
  if (!Array.isArray(o.r) || o.r.length > LISTEN_MAX_Q) return null;
  const r: ListenAnswer[] = [];
  for (const a of o.r) {
    const x = answerOf(a);
    if (!x) return null;
    r.push(x);
  }
  return { d: o.d as LocalDate, g: o.g as string, gm: TV_GM, u: o.u, ms: o.ms as number, ...(o.f === 1 && { f: 1 as const }), r };
}

/** A summary as anyone else's phone gets it, or null. */
export function listenSummaryOf(d: unknown): ListenSummary | null {
  if (!d || typeof d !== 'object') return null;
  const o = d as Record<string, unknown>;
  if (o.gm !== TV_GM || !summaryFields(o)) return null;
  return { d: o.d as LocalDate, g: o.g as string, ms: o.ms as number, gm: TV_GM, ...(o.f === 1 && { f: 1 as const }) };
}

/**
 * What `viewer` gets of a `listen` row `sender` wrote: its own whole (`all`), anyone else's summary (`summary`).
 * @public (contract/guest.ts)
 */
export function listenSeen(viewer: Who, sender: Who): 'all' | 'summary' {
  return viewer === sender ? 'all' : 'summary';
}

/** A row's summary as JSON (everyone else's copy), or null for a row that isn't one. */
export function listenSummaryJson(raw: string): string | null {
  try {
    const row = listenOf(JSON.parse(raw));
    return row ? JSON.stringify({ d: row.d, g: row.g, ms: row.ms, gm: TV_GM, ...(row.f === 1 && { f: 1 }) }) : null;
  } catch {
    return null;
  }
}
