// やること on this phone (docs/todo.md): the one list folded from the model's `todo` rows by the record's rules
// (contract/todo.ts todoBookOf, todoItems), and my changes, each one `todo` event sent at once (queued offline), its
// texts cleaned as the record keeps them. Anyone changes anything (the guest too). A removal is held for its 取り消す.
//   todo.items                                   the items by ord
//   todo.add / edit / tick / move / removeHeld / clearDoneHeld
// Every write sends the item's whole state: note, due, rem and to carried forward (the latest op wins whole).
import type { Rem } from '#lib/contract/todoDue.ts';
import type { Who } from '#lib/types.ts';
import { cleanNote, newTodoId, TODO_TEXT, todoBookOf, todoItems, type TodoBook, type TodoEntry, type TodoItemView } from '#lib/contract/todo.ts';
import { ordBetween } from '#lib/contract/pack.ts';
import { cleanLine } from '#lib/contract/text.ts';
import type { SendResult } from '#lib/store/backend.ts';
import { week } from '#lib/store/week.svelte.ts';
import { opClock } from '#lib/store/world.svelte.ts';

const EMPTY: readonly TodoEntry[] = [];

/** An item's due, reminder and who gets it, as sent (contract/todo.ts: a `rem` only with a due, `to` only with a rem). */
interface Due { due?: string | null; rem?: Rem | null; to?: readonly Who[] | null }
function dueOp(x: Due): { due?: string; rem?: Rem; to?: Who[] } {
  if (!x.due) return {};
  if (!x.rem || !x.to?.length) return { due: x.due };
  return { due: x.due, rem: x.rem, to: [...x.to] };
}
const sameDue = (a: Due, b: Due): boolean => a.due === b.due && a.rem === b.rem && (a.to ?? []).join() === (b.to ?? []).join();

class Todo {
  #last = 0;

  get #book(): TodoBook {
    return todoBookOf(week.model?.state.todo ?? EMPTY);
  }
  get items(): TodoItemView[] {
    return todoItems(this.#book);
  }
  /** Whether this phone can write yet (the week's view says who I am). */
  get ready(): boolean {
    return !!week.view?.viewer;
  }

  /** A change's time: the relay's clock, never twice the same, after the op it replaces. */
  #now(id?: string): number {
    this.#last = opClock(this.#last, id ? (this.#book.rows.get(`todo|${id}`)?.op.at ?? 0) : 0);
    return this.#last;
  }
  #find(id: string): TodoItemView | null {
    return this.ready ? (this.items.find((i) => i.id === id) ?? null) : null;
  }
  #set(x: TodoItemView, ch: Partial<Omit<TodoItemView, 'id'>>, holdMs = 0): SendResult {
    const v = { ...x, ...ch };
    return week.send('todo', { id: x.id, at: this.#now(x.id), text: v.text, ...(v.note && { note: v.note }), ord: v.ord, done: v.done ? 1 : 0, ...dueOp(v) }, holdMs > 0 ? { holdMs } : {});
  }
  #held(id: string, holdMs: number): SendResult {
    return week.send('todo', { id, at: this.#now(id), rm: true }, holdMs > 0 ? { holdMs } : {});
  }

  /** A new item, last (`due`: the quick chip's date; never a reminder): its id, or null (no text, or can't send). */
  add(text: string, due?: string): string | null {
    const t = cleanLine(text, TODO_TEXT);
    if (!t || !this.ready) return null;
    const at = this.#now(), id = newTodoId(at);
    return week.send('todo', { id, at, text: t, ord: ordBetween(this.items.at(-1)?.ord, undefined), done: 0, ...(due && { due }) }).ok ? id : null;
  }
  /** 編集's 保存: the text, the note ('' none) and the due (`due` null: none; `rem` without a due, or `to` without a
   *  `rem`, dropped). */
  edit(id: string, text: string, note: string, due?: Due): boolean {
    const x = this.#find(id), t = cleanLine(text, TODO_TEXT), n = cleanNote(note);
    if (!x || !t) return false;
    const d = due === undefined ? dueOp(x) : dueOp(due);
    if (t === x.text && n === (x.note ?? '') && sameDue(d, dueOp(x))) return true;
    return this.#set(x, { text: t, note: n || undefined, due: d.due, rem: d.rem, to: d.to }).ok;
  }

  /** Done or not: shared (anyone's tick is everyone's). `holdMs`: sent after it (the peek's 取り消す), else at once. */
  tick(id: string, done: boolean, holdMs = 0): SendResult {
    const x = this.#find(id);
    if (!x) return { ok: false };
    return x.done === done ? { ok: true } : this.#set(x, { done }, holdMs);
  }
  /** An item to `index`, by a fractional `ord` between its new neighbours; none left between them, every item is
   *  renumbered 0, 1, 2 … with it. */
  move(id: string, index: number): boolean {
    const x = this.#find(id);
    if (!x) return false;
    const sibs = this.items.filter((s) => s.id !== id);
    const i = Math.max(0, Math.min(index, sibs.length));
    const ord = ordBetween(sibs[i - 1]?.ord, sibs[i]?.ord);
    if (ord !== null) return ord === x.ord || this.#set(x, { ord }).ok;
    sibs.splice(i, 0, x);
    sibs.forEach((s, n) => s.ord !== n && this.#set(s, { ord: n }));
    return true;
  }
  removeHeld(id: string, holdMs: number): SendResult {
    return this.#find(id) ? this.#held(id, holdMs) : { ok: false };
  }
  /** Every done item removed, held `holdMs` as one (one 取り消す for all). */
  clearDoneHeld(holdMs: number): SendResult {
    if (!this.ready) return { ok: false };
    const sent = this.items.filter((i) => i.done).map((i) => this.#held(i.id, holdMs));
    if (!sent.length) return { ok: false };
    // (one refused: the ones already held come back, so nothing goes without its 取り消す)
    if (!sent.every((r) => r.ok)) return (sent.forEach((r) => r.ok && r.undo?.()), { ok: false });
    return {
      ok: true,
      undo: () => sent.map((r) => r.undo?.() ?? false).every(Boolean),
      hold: (ms) => Math.min(...sent.map((r) => r.hold?.(ms) ?? 0))
    };
  }
}

/** やること's one list: one per phone. */
export const todo = new Todo();
