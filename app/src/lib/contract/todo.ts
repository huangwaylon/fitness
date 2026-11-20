// やること, the shared to-do lists (docs/todo.md, docs/backend.md#events `todo`). One event type, built
// like the packing list (contract/pack.ts): one op per thing, its whole state, the latest `at` wins (then G over B over
// A), a removal is final, so the record and every phone reach the same lists whatever order the ops come in.
// - A list: `{id, at, title, ord}`; an item: `{id, at, list, text, ord, done}` (its list never changes); a removal
//   `{id, at, rm: true}` (a list's takes its items with it: the record drops their rows).
// - Anyone writes anything (the guest too: contract/guest.ts). At most TODO_MAX lists and items standing.
// Shared by the record (relay/src/store.ts), the model (model/state.ts) and the sheet's store
// (components/todo/todo.svelte.ts); pure and dependency-free (the plain text rules: contract/text.ts).
import type { Who } from '../types.ts';
import { cleanLine } from './text.ts';
import { AHEAD_MS, isMs, newOpId, only } from './ops.ts';
import { beats, Book, foldOnce, type Queued, type Verdict } from './book.ts';

type Rec = Record<string, unknown>;

/** A list's title at most, an item's text (characters: code points; one clean line each). */
export const TODO_TITLE = 40;
export const TODO_TEXT = 200;
/** At most this many lists and items standing (a removal's row uncounted): a new one past them is refused (`full`). */
const TODO_MAX = 500;
const ID = /^d[0-9a-z]{6,24}$/;
const ORD_MAX = 1e9;
const isTodoId = (v: unknown): v is string => typeof v === 'string' && ID.test(v);

/** A new list's or item's id. */
export const newTodoId = (at: number): string => newOpId('d', at);

type TodoList = { id: string; at: number; title: string; ord: number; list?: undefined; rm?: undefined };
type TodoItem = { id: string; at: number; list: string; text: string; ord: number; done: 0 | 1; rm?: undefined };
type TodoRm = { id: string; at: number; list?: undefined; rm: true };
type TodoOp = TodoList | TodoItem | TodoRm;
/** A `todo` row as the record holds it, with who sent it. */
export type TodoRow = { type: 'todo'; who: Who; op: TodoOp };

/** An op's data with its texts cleaned as the record keeps them (one clean line): the record cleans what it's sent,
 *  then checks it (todoOpOf). */
export function todoClean(d: Rec): Rec {
  if (d.rm !== undefined) return d;
  const out: Rec = { ...d };
  if (typeof d.title === 'string') out.title = cleanLine(d.title, TODO_TITLE);
  if (typeof d.text === 'string') out.text = cleanLine(d.text, TODO_TEXT);
  return out;
}

const isClean = (v: unknown, max: number): v is string => typeof v === 'string' && v !== '' && cleanLine(v, max) === v;
const isOrd = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && Math.abs(v) <= ORD_MAX;

/** A `todo` op's data, its known keys only, each well-formed (texts already clean), or null. `now`: the record's clock
 *  (an `at` more than a day past it is refused); omitted, no bound. */
export function todoOpOf(d: Rec, now?: number): TodoOp | null {
  if (!isTodoId(d.id) || !isMs(d.at) || (now !== undefined && d.at > now + AHEAD_MS)) return null;
  const id = d.id, at = d.at;
  if (d.rm !== undefined) return d.rm === true && only(d, ['id', 'at', 'rm']) ? { id, at, rm: true } : null;
  if (!isOrd(d.ord)) return null;
  if (d.list === undefined) return only(d, ['id', 'at', 'title', 'ord']) && isClean(d.title, TODO_TITLE) ? { id, at, title: d.title, ord: d.ord } : null;
  if (!only(d, ['id', 'at', 'list', 'text', 'ord', 'done']) || !isTodoId(d.list) || !isClean(d.text, TODO_TEXT) || (d.done !== 0 && d.done !== 1)) return null;
  return { id, at, list: d.list, text: d.text, ord: d.ord, done: d.done };
}

/** A row read from its type, data and sender (null: not a `todo`, or malformed). */
export const todoRowOf = (type: string, d: Rec, who: Who): TodoRow | null => {
  if (type !== 'todo') return null;
  const op = todoOpOf(d);
  return op ? { type, who, op } : null;
};

/** The slot a `todo` row fills: its id's. */
export const todoSlot = (d: Rec): string | null => (isTodoId(d.id) ? `todo|${d.id}` : null);

/** What the record does with a row (contract/book.ts Verdict): `append` (a list's removal drops its items' slots),
 *  `stale`, `full` (TODO_MAX standing) or `moved` (a set that turns a list into an item, or moves an item to another
 *  list: refused). */
export type TodoVerdict = Verdict<TodoRow, 'full' | 'moved'>;

/** The lists and items as the record holds them (each id's latest row). */
export class TodoBook extends Book<TodoRow, 'full' | 'moved'> {
  protected slotOf(r: TodoRow): string {
    return `todo|${r.op.id}`;
  }
  protected countOf(r: TodoRow): string | null {
    return r.op.rm ? null : 'n';
  }

  accept(r: TodoRow): TodoVerdict {
    const slot = this.slotOf(r), op = r.op;
    const held = this.rows.get(slot) ?? null;
    // a removal is final: whatever comes after it changes nothing
    if (held?.op.rm) return { v: 'stale' };
    if (held && !beats(r, held)) return { v: 'stale' };
    if (!held) {
      // only a creation makes a row (an edit's or a removal's thing is gone, or never was); an item only in a list held
      if (op.rm) return { v: 'stale' };
      if (op.list !== undefined) {
        const l = this.rows.get(`todo|${op.list}`);
        if (!l || l.op.rm || l.op.list !== undefined) return { v: 'stale' };
      }
      if (this.count('n') >= TODO_MAX) return { v: 'full' };
    } else if (!op.rm && op.list !== held.op.list) return { v: 'moved' };
    const drop: string[] = [];
    if (op.rm && held && held.op.list === undefined) for (const [s, x] of this.rows) if (x.op.list === op.id) drop.push(s);
    return { v: 'append', row: r, drop };
  }
}

/** A row as the model holds it: the record's, or this phone's not yet sent (`queued`). */
export type TodoEntry = Queued<TodoRow>;
/** The rows as the record keeps them (contract/book.ts Book.fold). */
export const todoFold = (rows: Iterable<TodoEntry>): TodoBook => new TodoBook().fold(rows);
/** A model's list folded, once per list (the sheet's store). */
export const todoBookOf = foldOnce(todoFold);

export interface TodoItemView { id: string; text: string; ord: number; done: boolean }
export interface TodoListView { id: string; title: string; ord: number; items: TodoItemView[] }

const byOrd = <T extends { ord: number; id: string }>(a: T, b: T): number => a.ord - b.ord || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);

/** The lists by `ord`, each with its items by `ord` (an item whose list is gone is hidden with it). */
export function todoLists(book: TodoBook): TodoListView[] {
  const lists = new Map<string, TodoListView>();
  const items: (TodoItemView & { list: string })[] = [];
  for (const { op } of book.rows.values()) {
    if (op.rm) continue;
    if (op.list === undefined) lists.set(op.id, { id: op.id, title: op.title, ord: op.ord, items: [] });
    else items.push({ id: op.id, list: op.list, text: op.text, ord: op.ord, done: op.done === 1 });
  }
  for (const { list, ...it } of items) lists.get(list)?.items.push(it);
  const out = [...lists.values()].sort(byOrd);
  for (const l of out) l.items.sort(byOrd);
  return out;
}
