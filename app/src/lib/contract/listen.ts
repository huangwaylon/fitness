// ききみみ クイズ's progress rows (docs/kikimimi.md "Progress & feedback", docs/backend.md "Events" `listen`): one row
// per person per game, written once at its results, with every answer of theirs. The record checks the shape
// (validEventData) and sends a row whole to its owner only; everyone else gets its summary (that a game was played,
// when, how long, with how many: the together summary), the guest and the members alike
// (contract/guest.ts rowsFor). Pure, over the contract only (the relay imports it).
import { isLocalDate } from './api.ts';
import type { LocalDate, Who } from '../types.ts';

/** One answer: the item's id, right (1) or not (0), the authored choice picked (−1: timed out; another game's, up to
 *  4095: a tile round's bitmask of wrong slots, a memo's per-slot result, docs/kikimimi-framework.md §4.4), the replays
 *  before it (🔁 and 🐢 alike; 0 is a first listen). */
type ListenAnswer = [id: string, ok: 0 | 1, pick: number, rp: number];

export interface ListenRow {
  /** The Tokyo day it was played. */
  d: LocalDate;
  /** The game (the session's id). */
  g: string;
  /** Which game (docs/kikimimi-framework.md §4.4, the protocol's `gm`); absent: the quiz. */
  gm?: string;
  /** Its unit, if the game has units (a ききみみ unit's lesson: docs/curriculum-units.md). */
  u?: string;
  /** The unit's lesson (docs/curriculum-units.md §3, §8): 1 であい, 2 ばめん, 3 チェック, 4 おと, 5 じっせん; only with `u`. */
  l?: number;
  /** The team's first-listen right answers in a co-op lesson (§10: the session's team tally, the same number on both
   *  phones), 0-6; only with `l`. */
  tm?: number;
  /** Its level (the protocol's 1-8: the stage, 5 the アナウンス pack). */
  lv: number;
  /** The players in it (1-3). */
  n: number;
  /** How long it took, ms (≤ 1 h). */
  ms: number;
  /** にがて れんしゅう (a solo deck of my weak spots), else absent. */
  p?: 1;
  /** My answers, in the game's order (the questions sat out aren't). */
  r: ListenAnswer[];
}

/** What the other member sees of a row (docs/kikimimi.md "Storage"): never the level, the answers or the score. A
 *  unit's passed チェック adds the unit and `stamped` (docs/curriculum-units.md §4: each person's stamps are the partner's
 *  to see, the answers never). */
export type ListenSummary = Pick<ListenRow, 'd' | 'g' | 'n' | 'ms'> & { u?: string; stamped?: 1 };

/** The lesson whose pass stamps a unit (チェック), and the first-listen rights it takes, own or the team's (§10). */
export const CHECK_LESSON = 3;
export const STAMP_MIN = 5;

/** Whether a row stamps its unit (docs/curriculum-units.md §3, §10): a チェック with ≥ 5 of my answers right on the
 *  first listen, or a co-op one whose team got ≥ 5. Derived, never stored. */
export const stampsUnit = (row: Pick<ListenRow, 'u' | 'l' | 'tm' | 'r'>): boolean =>
  row.u !== undefined && row.l === CHECK_LESSON && ((row.tm ?? 0) >= STAMP_MIN || row.r.filter(([, ok, , rp]) => ok === 1 && rp === 0).length >= STAMP_MIN);

/** The most answers a row holds (a game is 8). */
const LISTEN_MAX_Q = 12;
const LISTEN_MAX_MS = 60 * 60 * 1000;
const GAME_RE = /^[a-z0-9]{4,12}$/;
const ITEM_RE = /^[a-z0-9][a-z0-9-]{0,31}$/;
const GM_RE = /^[a-z][a-z0-9]{1,7}$/;
const UNIT_RE = /^[a-z0-9-]{1,12}$/;
const KEYS = new Set(['d', 'g', 'gm', 'u', 'l', 'tm', 'lv', 'n', 'ms', 'p', 'r']);

const int = (v: unknown, lo: number, hi: number): v is number => Number.isInteger(v) && (v as number) >= lo && (v as number) <= hi;

function answerOf(a: unknown): ListenAnswer | null {
  if (!Array.isArray(a) || a.length !== 4) return null;
  const [id, ok, pick, rp] = a as unknown[];
  return typeof id === 'string' && ITEM_RE.test(id) && (ok === 0 || ok === 1) && int(pick, -1, 4095) && int(rp, 0, 99) ? [id, ok, pick, rp] : null;
}

/** A row as sent or kept, or null when it isn't one (an unknown key, a field out of range). Its day's bound (not after
 *  tomorrow) is the record's check (contract/record.ts validEventData). */
export function listenOf(d: unknown): ListenRow | null {
  if (!d || typeof d !== 'object' || Array.isArray(d)) return null;
  const o = d as Record<string, unknown>;
  if (Object.keys(o).some((k) => !KEYS.has(k))) return null;
  if (!isLocalDate(o.d) || typeof o.g !== 'string' || !GAME_RE.test(o.g) || !int(o.lv, 1, 8) || !int(o.n, 1, 3) || !int(o.ms, 0, LISTEN_MAX_MS)) return null;
  if (o.p !== undefined && o.p !== 1) return null;
  if (o.gm !== undefined && (typeof o.gm !== 'string' || !GM_RE.test(o.gm))) return null;
  if (o.u !== undefined && (typeof o.u !== 'string' || !UNIT_RE.test(o.u))) return null;
  if (o.l !== undefined && (o.u === undefined || !int(o.l, 1, 5))) return null;
  if (o.tm !== undefined && (o.l === undefined || !int(o.tm, 0, 6))) return null;
  if (!Array.isArray(o.r) || o.r.length < 1 || o.r.length > LISTEN_MAX_Q) return null;
  const r: ListenAnswer[] = [];
  for (const a of o.r) {
    const x = answerOf(a);
    if (!x) return null;
    r.push(x);
  }
  return {
    d: o.d, g: o.g, ...(o.gm !== undefined && { gm: o.gm as string }), ...(o.u !== undefined && { u: o.u as string }), ...(o.l !== undefined && { l: o.l as number }),
    ...(o.tm !== undefined && { tm: o.tm as number }), lv: o.lv, n: o.n, ms: o.ms, ...(o.p === 1 && { p: 1 as const }), r
  };
}

/** A summary as the other member's phone gets it (`r` absent), or null. A stamp needs its unit (a bad one dropped). */
export function listenSummaryOf(d: unknown): ListenSummary | null {
  if (!d || typeof d !== 'object') return null;
  const o = d as Record<string, unknown>;
  if (!(isLocalDate(o.d) && typeof o.g === 'string' && GAME_RE.test(o.g) && int(o.n, 1, 3) && int(o.ms, 0, LISTEN_MAX_MS))) return null;
  const stamped = o.stamped === 1 && typeof o.u === 'string' && UNIT_RE.test(o.u);
  return { d: o.d, g: o.g, n: o.n, ms: o.ms, ...(stamped && { u: o.u as string, stamped: 1 as const }) };
}

/** A row's summary (the other member's copy): the game, and a stamped unit's id when it passed a チェック. */
const summaryOf = (row: ListenRow): ListenSummary =>
  ({ d: row.d, g: row.g, n: row.n, ms: row.ms, ...(stampsUnit(row) && { u: row.u, stamped: 1 as const }) });

/**
 * What `viewer` gets of a `listen` row `sender` wrote: its own whole (`all`), anyone else's summary (`summary`: the
 * other member's, and since 2026-11-06 the guest's to the members and theirs to the guest alike).
 * @public (contract/guest.ts)
 */
export function listenSeen(viewer: Who, sender: Who): 'all' | 'summary' {
  return viewer === sender ? 'all' : 'summary';
}

/** A row's summary as JSON (the other member's copy), or null for a row that isn't one. */
export function listenSummaryJson(raw: string): string | null {
  try {
    const row = listenOf(JSON.parse(raw));
    return row ? JSON.stringify(summaryOf(row)) : null;
  } catch {
    return null;
  }
}
