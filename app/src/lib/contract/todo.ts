// やること, the one shared to-do list (docs/todo.md, docs/backend.md#events `todo`). One event type, built like the
// packing list (contract/pack.ts): one op per item, its whole state, the latest `at` wins (then G over B over A), a
// removal is final, so the record and every phone reach the same list whatever order the ops come in.
// - An item: `{id, at, text, note?, ord, done, due?, rem?, to?}`; a removal `{id, at, rm: true}`.
// - `note`: free text under the item, line breaks kept (a migrated list's items, 2026-11-25: relay/src/todoMigrate.ts).
// - An item's optional due (`YYYY-MM-DD` or `YYYY-MM-DDTHH:MM`, Tokyo) and reminder (`rem`, fitting the due's kind, and
//   `to`, who gets it: 1–3 distinct people), contract/todoDue.ts. Whole state too: every write carries them forward,
//   one without them clears them.
// - Anyone writes anything (the guest too: contract/guest.ts). At most TODO_MAX items standing.
// - The lists before 2026-11-25 (a list `{id, at, title, ord}`, an item `{…, list}`): todoLegacy. The record
//   acknowledges an older build's op of that shape and drops it; the phones never read one.
// Shared by the record (relay/src/store.ts), the model (model/state.ts) and the sheet's store
// (components/todo/todo.svelte.ts); pure and dependency-free (the plain text rules: contract/text.ts).
import type { Who } from '../types.ts';
import { BREAKS, cleanLine, STRIP } from './text.ts';
import { AHEAD_MS, isMs, newOpId, only } from './ops.ts';
import { beats, Book, foldOnce, type Queued, type Verdict } from './book.ts';
import { dueOf, remFits, type Rem } from './todoDue.ts';

type Rec = Record<string, unknown>;

/** An item's text at most (characters: code points; one clean line), its note's (lines kept). */
export const TODO_TEXT = 200;
export const TODO_NOTE = 2000;
/** At most this many items standing (a removal's row uncounted): a new one past them is refused (`full`). */
const TODO_MAX = 500;
const ID = /^d[0-9a-z]{6,24}$/;
const ORD_MAX = 1e9;
const isTodoId = (v: unknown): v is string => typeof v === 'string' && ID.test(v);

/** A new item's id. */
export const newTodoId = (at: number): string => newOpId('d', at);

/** An item's op. @public (relay/src/todoMigrate.ts) */
export type TodoItem = { id: string; at: number; text: string; note?: string; ord: number; done: 0 | 1; due?: string; rem?: Rem; to?: Who[]; rm?: undefined };
type TodoRm = { id: string; at: number; rm: true };
type TodoOp = TodoItem | TodoRm;
/** A `todo` row as the record holds it, with who sent it. */
export type TodoRow = { type: 'todo'; who: Who; op: TodoOp };

/** A note as the record keeps it: line breaks `\n`, STRIP stripped, tabs a space, each line's end trimmed, no runs of
 *  blank lines, the whole trimmed, at most `max` characters. '' when nothing is left. Idempotent. */
export function cleanNote(raw: unknown, max = TODO_NOTE): string {
  if (typeof raw !== 'string') return '';
  const lines = raw.normalize('NFC').replace(BREAKS, '\n').replace(STRIP, '').replace(/\t/g, ' ').split('\n').map((l) => l.replace(/\s+$/u, ''));
  const s = lines.filter((l, i) => l !== '' || (i > 0 && lines[i - 1] !== '')).join('\n').replace(/^\s+|\s+$/gu, '');
  const cps = Array.from(s);
  return cps.length > max ? cps.slice(0, max).join('').replace(/\s+$/u, '') : s;
}

/** An op's data with its texts cleaned as the record keeps them (the text one clean line, the note cleanNote, an empty
 *  one gone): the record cleans what it's sent, then checks it (todoOpOf). */
export function todoClean(d: Rec): Rec {
  if (d.rm !== undefined) return d;
  const out: Rec = { ...d };
  if (typeof d.text === 'string') out.text = cleanLine(d.text, TODO_TEXT);
  if (typeof d.note === 'string') {
    const n = cleanNote(d.note);
    if (n) out.note = n;
    else delete out.note;
  }
  return out;
}

const isClean = (v: unknown, max: number): v is string => typeof v === 'string' && v !== '' && cleanLine(v, max) === v;
const isOrd = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && Math.abs(v) <= ORD_MAX;
/** A reminder's people: 1–3 distinct of A, B, G. */
const isTo = (v: unknown): v is Who[] => Array.isArray(v) && v.length >= 1 && v.length <= 3 && new Set(v).size === v.length && v.every((x) => x === 'A' || x === 'B' || x === 'G');

/** A `todo` op's data, its known keys only, each well-formed (texts already clean), or null. `now`: the record's clock
 *  (an `at` more than a day past it is refused); omitted, no bound. */
export function todoOpOf(d: Rec, now?: number): TodoOp | null {
  if (!isTodoId(d.id) || !isMs(d.at) || (now !== undefined && d.at > now + AHEAD_MS)) return null;
  const id = d.id, at = d.at;
  if (d.rm !== undefined) return d.rm === true && only(d, ['id', 'at', 'rm']) ? { id, at, rm: true } : null;
  if (!isOrd(d.ord) || !only(d, ['id', 'at', 'text', 'note', 'ord', 'done', 'due', 'rem', 'to']) || !isClean(d.text, TODO_TEXT) || (d.done !== 0 && d.done !== 1)) return null;
  if (d.note !== undefined && (typeof d.note !== 'string' || d.note === '' || cleanNote(d.note) !== d.note)) return null;
  const item: TodoItem = { id, at, text: d.text, ...(d.note !== undefined && { note: d.note as string }), ord: d.ord, done: d.done };
  if (d.due === undefined) return d.rem === undefined && d.to === undefined ? item : null;
  const due = dueOf(d.due);
  if (!due) return null;
  item.due = d.due as string;
  if (d.rem === undefined) return d.to === undefined ? item : null;
  if (!remFits(due, d.rem) || !isTo(d.to)) return null;
  return { ...item, rem: d.rem, to: [...d.to] };
}

/** An op of the lists before 2026-11-25 (a list `{title}`, an item `{list}`): an older build's, acknowledged and
 *  dropped by the record (contract/record.ts), never kept. */
export const todoLegacy = (d: Rec): boolean => isTodoId(d.id) && isMs(d.at) && d.rm === undefined && (typeof d.title === 'string' || typeof d.list === 'string');

/** A row read from its type, data and sender (null: not a `todo`, or malformed). */
export const todoRowOf = (type: string, d: Rec, who: Who): TodoRow | null => {
  if (type !== 'todo') return null;
  const op = todoOpOf(d);
  return op ? { type, who, op } : null;
};

/** The slot a `todo` row fills: its id's. */
export const todoSlot = (d: Rec): string | null => (isTodoId(d.id) ? `todo|${d.id}` : null);

/** What the record does with a row (contract/book.ts Verdict): `append`, `stale` or `full` (TODO_MAX standing). */
export type TodoVerdict = Verdict<TodoRow, 'full'>;

/** The items as the record holds them (each id's latest row). */
export class TodoBook extends Book<TodoRow, 'full'> {
  protected slotOf(r: TodoRow): string {
    return `todo|${r.op.id}`;
  }
  protected countOf(r: TodoRow): string | null {
    return r.op.rm ? null : 'n';
  }

  accept(r: TodoRow): TodoVerdict {
    const held = this.rows.get(this.slotOf(r)) ?? null;
    // a removal is final: whatever comes after it changes nothing
    if (held?.op.rm) return { v: 'stale' };
    if (held && !beats(r, held)) return { v: 'stale' };
    if (!held) {
      // only a creation makes a row (an edit's or a removal's item is gone, or never was)
      if (r.op.rm) return { v: 'stale' };
      if (this.count('n') >= TODO_MAX) return { v: 'full' };
    }
    return { v: 'append', row: r, drop: [] };
  }
}

/** A row as the model holds it: the record's, or this phone's not yet sent (`queued`). */
export type TodoEntry = Queued<TodoRow>;
/** The rows as the record keeps them (contract/book.ts Book.fold). */
export const todoFold = (rows: Iterable<TodoEntry>): TodoBook => new TodoBook().fold(rows);
/** A model's list folded, once per list (the sheet's store). */
export const todoBookOf = foldOnce(todoFold);

/** An item as the sheet shows it; `note`, `due`, `rem`, `to` only when set (contract/todoDue.ts). */
export interface TodoItemView { id: string; text: string; note?: string; ord: number; done: boolean; due?: string; rem?: Rem; to?: Who[] }

/** The items by `ord` (then id). */
export function todoItems(book: TodoBook): TodoItemView[] {
  const out: TodoItemView[] = [];
  for (const { op } of book.rows.values()) {
    if (op.rm) continue;
    out.push({
      id: op.id, text: op.text, ...(op.note !== undefined && { note: op.note }), ord: op.ord, done: op.done === 1,
      ...(op.due !== undefined && { due: op.due }), ...(op.rem !== undefined && { rem: op.rem, to: op.to })
    });
  }
  return out.sort((a, b) => a.ord - b.ord || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}
