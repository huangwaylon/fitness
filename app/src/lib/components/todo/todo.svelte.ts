// やること on this phone (docs/todo.md): the lists folded from the model's `todo` rows by the record's rules
// (contract/todo.ts todoBookOf, todoLists), and my changes, each one `todo` event sent at once (queued offline), its
// texts cleaned as the record keeps them. Anyone changes anything (the guest too). A removal is held for its 取り消す.
//   todo.lists                                   the lists by ord, each with its items by ord
//   todo.addList / renameList / removeListHeld   a list
//   todo.addItem / editItem / tick / move / removeItemHeld / clearDoneHeld   its items (editItem: its due, reminder, who)
// Every item write sends its whole state: due, rem and to carried forward (the latest op wins whole).
import type { Rem } from '#lib/contract/todoDue.ts';
import type { Who } from '#lib/types.ts';
import { newTodoId, TODO_TEXT, TODO_TITLE, todoBookOf, todoLists, type TodoBook, type TodoEntry, type TodoItemView, type TodoListView } from '#lib/contract/todo.ts';
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
  get lists(): TodoListView[] {
    return todoLists(this.#book);
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
  #find(id: string): { list: TodoListView; item: TodoItemView | null } | null {
    for (const list of this.lists) {
      if (list.id === id) return { list, item: null };
      const item = list.items.find((i) => i.id === id);
      if (item) return { list, item };
    }
    return null;
  }
  #setItem(list: string, x: TodoItemView, ch: Partial<Omit<TodoItemView, 'id'>>): boolean {
    const v = { ...x, ...ch };
    return week.send('todo', { id: x.id, at: this.#now(x.id), list, text: v.text, ord: v.ord, done: v.done ? 1 : 0, ...dueOp(v) }).ok;
  }
  #held(id: string, holdMs: number): SendResult {
    return week.send('todo', { id, at: this.#now(id), rm: true }, holdMs > 0 ? { holdMs } : {});
  }

  /** A new list, last: its id, or null (no title, or the phone can't send). */
  addList(title: string): string | null {
    const t = cleanLine(title, TODO_TITLE);
    if (!t || !this.ready) return null;
    const at = this.#now(), id = newTodoId(at);
    return week.send('todo', { id, at, title: t, ord: ordBetween(this.lists.at(-1)?.ord, undefined) }).ok ? id : null;
  }
  renameList(id: string, title: string): boolean {
    const l = this.#find(id)?.list, t = cleanLine(title, TODO_TITLE);
    if (!l || !t || !this.ready) return false;
    if (t === l.title) return true;
    return week.send('todo', { id, at: this.#now(id), title: t, ord: l.ord }).ok;
  }
  /** A list and its items gone at once, sent after `holdMs` (the banner's 取り消す takes it back meanwhile). */
  removeListHeld(id: string, holdMs: number): SendResult {
    return this.#find(id) && this.ready ? this.#held(id, holdMs) : { ok: false };
  }

  /** A new item, last in its list (`due`: the quick chip's date; never a reminder): its id, or null. */
  addItem(list: string, text: string, due?: string): string | null {
    const l = this.lists.find((x) => x.id === list), t = cleanLine(text, TODO_TEXT);
    if (!l || !t || !this.ready) return null;
    const at = this.#now(), id = newTodoId(at);
    return week.send('todo', { id, at, list, text: t, ord: ordBetween(l.items.at(-1)?.ord, undefined), done: 0, ...(due && { due }) }).ok ? id : null;
  }
  /** 編集's 保存: the text and the due (`due` null: none; `rem` without a due, or `to` without a `rem`, dropped). */
  editItem(id: string, text: string, due?: Due): boolean {
    const f = this.#find(id), t = cleanLine(text, TODO_TEXT);
    if (!f?.item || !t || !this.ready) return false;
    const d = due === undefined ? dueOp(f.item) : dueOp(due);
    if (t === f.item.text && sameDue(d, dueOp(f.item))) return true;
    return this.#setItem(f.list.id, f.item, { text: t, due: d.due, rem: d.rem, to: d.to });
  }

  /** Done or not: shared (anyone's tick is everyone's). */
  tick(id: string, done: boolean): boolean {
    const f = this.#find(id);
    if (!f?.item || !this.ready) return false;
    return f.item.done === done || this.#setItem(f.list.id, f.item, { done });
  }
  /** An item to `index` among its list's, by a fractional `ord` between its new neighbours; none left between them, the
   *  list's items are renumbered 0, 1, 2 … with it. */
  move(id: string, index: number): boolean {
    const f = this.#find(id);
    if (!f?.item || !this.ready) return false;
    const x = f.item, sibs = f.list.items.filter((s) => s.id !== id);
    const i = Math.max(0, Math.min(index, sibs.length));
    const ord = ordBetween(sibs[i - 1]?.ord, sibs[i]?.ord);
    if (ord !== null) return ord === x.ord || this.#setItem(f.list.id, x, { ord });
    sibs.splice(i, 0, x);
    sibs.forEach((s, n) => s.ord !== n && this.#setItem(f.list.id, s, { ord: n }));
    return true;
  }
  removeItemHeld(id: string, holdMs: number): SendResult {
    return this.#find(id)?.item && this.ready ? this.#held(id, holdMs) : { ok: false };
  }
  /** Every done item of a list removed, held `holdMs` as one (one 取り消す for all). */
  clearDoneHeld(list: string, holdMs: number): SendResult {
    const l = this.lists.find((x) => x.id === list);
    if (!l || !this.ready) return { ok: false };
    const sent = l.items.filter((i) => i.done).map((i) => this.#held(i.id, holdMs));
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

/** やること's lists: one per phone. */
export const todo = new Todo();
