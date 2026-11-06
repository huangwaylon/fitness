// The island's bulletin board (docs/board.md, docs/backend.md#events `board`): short notes anyone on the island
// writes, kept in the record and shown on every phone. Each change is one op: a post set (`{id, at, p, t}`: posted or
// edited, its whole text; `p` when it was first posted, `p = at` for a new one) or removed (`{id, at, rm: true}`,
// final: an id never comes back). The posts are a merge of the ops by id (a removal beats everything, else the latest
// `at`, then G over B over A): commutative, so the record and every phone reach the same board whatever order the ops
// come in. Who may do what (`boardMayWrite`) and how many are kept (BOARD_MAX) are the record's rules, the phones apply
// the same. Text is plain text, sanitised the same way on the phone and in the record (`cleanText`), and only ever
// drawn as text. Shared by the record (relay/src/store.ts), the model and the board; pure and dependency-free (the plain text
// rules: contract/text.ts).
import { BREAKS, STRIP } from './text.ts';
import { isMs, newOpId } from './ops.ts';

/** Who wrote it: the merge's tie-break is a fixed order, A < B < G. */
type Who = 'A' | 'B' | 'G';

/** A post's length at most (characters: code points, so an emoji is one) and its lines at most. NH's board takes
 *  longer notes; on a phone's zoomed board four short lines read at a glance. */
export const BOARD_CHARS = 100;
export const BOARD_LINES = 4;
/** At most this many posts kept (the record and the phones): a new one past them drops the oldest (by `p`). */
export const BOARD_MAX = 50;

export type BoardOp =
  | { id: string; at: number; p: number; t: string; rm?: undefined }
  | { id: string; at: number; rm: true };
export type BoardEntry = BoardOp & { who: Who };
/** A post as the board shows it: its author is `who` (only the author edits, so the latest set is theirs). */
export interface Post {
  id: string;
  who: Who;
  t: string;
  /** First posted (ms). */
  p: number;
  /** Last changed (ms): later than `p` once edited. */
  at: number;
}

const ID = /^b[0-9a-z]{6,24}$/;

/**
 * A note's text as the board keeps it: line breaks made `\n` (also `\r\n`, `\r`, U+2028/9), the control characters
 * stripped, each line's trailing spaces and the whole's leading and trailing blank space trimmed, at most BOARD_LINES
 * lines (the rest joined onto the last with a space) and BOARD_CHARS characters. '' when nothing is left. Idempotent.
 */
export function cleanText(raw: unknown): string {
  if (typeof raw !== 'string') return '';
  let s = raw.normalize('NFC').replace(BREAKS, '\n').replace(STRIP, '').replace(/\t/g, ' ');
  let lines = s.split('\n').map((l) => l.replace(/\s+$/u, ''));
  // no runs of blank lines (they'd only push the note's text off its paper)
  lines = lines.filter((l, i) => l !== '' || (i > 0 && lines[i - 1] !== ''));
  if (lines.length > BOARD_LINES) lines = [...lines.slice(0, BOARD_LINES - 1), lines.slice(BOARD_LINES - 1).filter(Boolean).join(' ')];
  s = lines.join('\n').replace(/^\s+|\s+$/gu, '');
  const cps = Array.from(s);
  if (cps.length > BOARD_CHARS) s = cps.slice(0, BOARD_CHARS).join('').replace(/\s+$/u, '');
  return s;
}

/** How many characters a note's text is (code points). */
export const textLength = (s: string): number => Array.from(s).length;

/** A new post's id. */
export const newPostId = (at: number): string => newOpId('b', at);

/** A `board` op's data, its known keys only, each well-formed (the text clean and not empty), or null. */
export function boardOpOf(d: Record<string, unknown>): BoardOp | null {
  if (typeof d.id !== 'string' || !ID.test(d.id) || !isMs(d.at)) return null;
  const keys = Object.keys(d);
  if (d.rm !== undefined) {
    if (d.rm !== true || keys.some((k) => k !== 'id' && k !== 'at' && k !== 'rm')) return null;
    return { id: d.id, at: d.at, rm: true };
  }
  if (keys.some((k) => !['id', 'at', 'p', 't'].includes(k))) return null;
  if (!isMs(d.p) || d.p > d.at || typeof d.t !== 'string') return null;
  const t = cleanText(d.t);
  if (!t || t !== d.t) return null;
  return { id: d.id, at: d.at, p: d.p, t };
}

/** Whether entry `a` beats `b` (the same id): a removal beats a set; else the later `at`, then G over B over A. */
export function boardBeats(a: BoardEntry, b: BoardEntry): boolean {
  if (!!a.rm !== !!b.rm) return !!a.rm;
  if (a.at !== b.at) return a.at > b.at;
  return a.who > b.who;
}

/** Merge an entry into the map (id → its winning entry): true when it changed it. */
export function mergeBoard(m: Map<string, BoardEntry>, e: BoardEntry): boolean {
  const was = m.get(e.id);
  if (was && (was === e || !boardBeats(e, was))) return false;
  m.set(e.id, e);
  return true;
}

/** The posts: every one set and not removed, the newest BOARD_MAX by when they were first posted, newest first. */
export function boardPosts(entries: Iterable<BoardEntry>): Post[] {
  const out: Post[] = [];
  for (const e of entries) if (!e.rm) out.push({ id: e.id, who: e.who, t: e.t, p: e.p, at: e.at });
  out.sort((a, b) => b.p - a.p || (a.id < b.id ? 1 : a.id > b.id ? -1 : 0));
  return out.slice(0, BOARD_MAX);
}

/**
 * Whether `who` may write this op, given the post it changes as held (null: none): a new post anyone (the guest too);
 * an edit only its author; a removal anyone (everyone tidies the board, the guest as the members: 2026-11-06).
 */
export function boardMayWrite(who: Who, op: BoardOp, held: BoardEntry | null): boolean {
  if (!held || held.rm || op.rm) return true;
  return held.who === who;
}

/**
 * What the record does with a new op, given the posts it holds (each id's latest row, with who sent it):
 * - `forbidden`: `boardMayWrite` says no (an edit of someone else's);
 * - `stale`: acknowledged, nothing kept (an op that beats it is there; anything after a removal; an edit or a removal
 *   of a post it doesn't hold: dropped past the cap, or never seen; a post older than every one kept when it's full);
 * - `append`: kept (the same id's row replaced); `drop` names the post a new one pushes out (the oldest), if any.
 */
export function boardAccept(held: readonly BoardEntry[] | ReadonlyMap<string, BoardEntry>, e: BoardEntry): { v: 'append'; drop: string | null } | { v: 'stale' | 'forbidden' } {
  let m: ReadonlyMap<string, BoardEntry>;
  if (held instanceof Map) m = held;
  else {
    const mm = new Map<string, BoardEntry>();
    for (const h of held as readonly BoardEntry[]) mergeBoard(mm, h);
    m = mm;
  }
  const was = m.get(e.id) ?? null;
  // a removal is final: whatever comes after it changes nothing
  if (was?.rm) return { v: 'stale' };
  if (!boardMayWrite(e.who, e, was)) return { v: 'forbidden' };
  if (was && !boardBeats(e, was)) return { v: 'stale' };
  if (!was) {
    // only a new post makes a row of its own (an edit's or a removal's post is gone, or never was)
    if (e.rm || e.p !== e.at) return { v: 'stale' };
    const live = boardPosts(m.values());
    if (live.length >= BOARD_MAX) {
      const oldest = live[live.length - 1];
      if (e.p < oldest.p || (e.p === oldest.p && e.id < oldest.id)) return { v: 'stale' };
      return { v: 'append', drop: oldest.id };
    }
  } else if (!e.rm && !was.rm && e.p !== was.p) return { v: 'stale' };
  return { v: 'append', drop: null };
}

/** A row as the model holds it: the record's, or this phone's not yet sent (`queued`). */
export type BoardRow = BoardEntry & { queued?: true };

/** The board as the record keeps it, from the model's rows in the order they came: the record's own taken as they are
 *  (each post's latest: merged), this phone's queued ones through the record's rules (`boardAccept`), so a phone shows
 *  what the record will. (The record's rows aren't judged again: it keeps a post's latest row only, so an edited post's
 *  first posting, which the rules need, is gone from them.) */
export function boardFold(rows: Iterable<BoardRow>): Map<string, BoardEntry> {
  const m = new Map<string, BoardEntry>();
  for (const e of rows) {
    if (!e.queued) {
      mergeBoard(m, e);
      continue;
    }
    const r = boardAccept(m, e);
    if (r.v !== 'append') continue;
    if (r.drop) m.delete(r.drop);
    m.set(e.id, e);
  }
  return m;
}
