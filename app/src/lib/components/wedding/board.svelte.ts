// The wedding board on this phone (docs/wedding.md): the model's wedding rows (the record's, then this phone's queued
// ones, marked) folded by the record's rules (contract/wedding.ts wedFold), read as the old board read its Sheet
// (lib/wedding/progress.ts, its today in the board's time zone), and my changes (each one event, sent at once; the
// record's notice brings them to every open phone). The guest reads it all and changes nothing: its methods refuse.
//   board.tasks / overall / countdown / today      the plan: live top-level tasks with their subtasks and progress
//   board.config / note / conflict / deleted       the settings, the notes (both versions when two saves crossed), the
//                                                  deleted tasks (restorable)
//   board.addTask / editTask / addSub / tick / remove / restore / purge / setConfig / saveNote
import {
  newTaskId, wedClean, wedConfig, wedFold, wedNote, wedOpOf, wedTasks, WNOTE_CHARS, type WConfKey, type WedBook, type WedEntry,
  type WedTask, type WTaskSet
} from '#lib/contract/wedding.ts';
import { overallProgress, withProgress, type Overall, type WithProgress } from '#lib/wedding/progress.ts';
import { daysBetween, isValidDay, todayIn } from '#lib/wedding/time.ts';
import { boardConfig, type BoardConfig } from '#lib/wedding/config.ts';
import { week } from '#lib/store/week.svelte.ts';
import { world } from '#lib/store/world.svelte.ts';
import type { Who } from '#lib/types.ts';

/** A version of the notes: its text, when it was saved and by whom, and whether it came from the old Sheet.
 *  @public (the board's notes) */
export interface NoteVersion { md: string; at: number; who: Who; imported: boolean }

/** The fold of a State's rows (a State is never mutated: its list's identity is the cache key). */
const books = new WeakMap<readonly WedEntry[], WedBook>();
const bookOf = (rows: readonly WedEntry[]): WedBook => {
  let b = books.get(rows);
  if (!b) books.set(rows, (b = wedFold(rows)));
  return b;
};

class WeddingBoard {
  #last = 0;

  /** Who I am (the guest's phone: G). */
  get me(): Who {
    return week.view?.viewer ?? 'A';
  }

  /** The guest's phone: it reads the board, never changes it (the record refuses its ops). */
  get readOnly(): boolean {
    return this.me === 'G';
  }

  /** A member's phone with its week loaded: it edits (the guest's, and a phone with nothing loaded yet, read only). */
  get canEdit(): boolean {
    return !!week.view && week.view.viewer !== 'G';
  }

  get #book(): WedBook {
    return bookOf(week.model?.state.wedding ?? []);
  }

  /** Every task held but the purged (the deleted too), as the old board's rows. */
  get #all(): WedTask[] {
    return wedTasks(this.#book);
  }

  get config(): BoardConfig {
    return boardConfig(wedConfig(this.#book));
  }

  /** The board's day (its time zone's), 'YYYY-MM-DD'. */
  get today(): string {
    return todayIn(this.config.tz, world.now());
  }

  /** The live top-level tasks, each with its subtasks (in the order typed) and progress, by due date. */
  get tasks(): WithProgress<WedTask>[] {
    return withProgress(this.#all, this.today);
  }

  /** The headline: the mean of the tasks' percents and a count per state. */
  get overall(): Overall {
    return overallProgress(this.tasks);
  }

  /** Days to the wedding in the board's time zone (null: no date). */
  get countdown(): number | null {
    return daysBetween(this.today, this.config.date);
  }

  /** The notes (null: none yet). */
  get note(): NoteVersion | null {
    const n = wedNote(this.#book);
    return n ? { md: n.md, at: n.at, who: n.who, imported: n.imported === true } : null;
  }

  /** Two saves crossed (the held one was saved over a version its writer hadn't seen): both, to choose from. Gone once
   *  someone saves from the held one (saveNote). */
  get conflict(): { current: NoteVersion; other: NoteVersion } | null {
    const n = wedNote(this.#book);
    if (!n?.was) return null;
    return { current: { md: n.md, at: n.at, who: n.who, imported: n.imported === true }, other: { md: n.was.md, at: n.was.at, who: n.was.who, imported: false } };
  }

  /** The deleted tasks and subtasks, the latest deleted first (Restore, Purge). */
  get deleted(): WedTask[] {
    return this.#all.filter((t) => t.deletedAt).sort((a, b) => (a.deletedAt < b.deletedAt ? 1 : a.deletedAt > b.deletedAt ? -1 : 0));
  }

  /** A task or subtask held (deleted too), or null. */
  task(id: string): WedTask | null {
    return this.#all.find((t) => t.id === id) ?? null;
  }

  /** A change's time: the relay's clock, never twice the same, after the op it replaces. */
  #now(after = 0): number {
    this.#last = Math.max(Math.round(world.now()), this.#last + 1, after + 1);
    return this.#last;
  }
  #set(id: string): WTaskSet | null {
    const op = this.#book.task(id);
    return op && !op.rm ? op : null;
  }
  /** An op cleaned and checked as the record will (refused here: never queued to fail there), then sent. */
  #send(type: 'wtask' | 'wdone' | 'wconf' | 'wnote', data: Record<string, unknown>): boolean {
    if (this.readOnly) return false;
    const d = wedClean(type, data);
    if (!wedOpOf(type, d, { now: world.now() })) return false;
    return week.send(type, d).ok;
  }
  /** A task's whole state again with `ch` (no longer marked `imported`: a phone changed it). */
  #put(op: WTaskSet, ch: Partial<Omit<WTaskSet, 'id' | 'c' | 'at' | 'imported'>> & { del?: number | undefined }): boolean {
    const { imported: _i, rm: _rm, ...rest } = op;
    const next: Record<string, unknown> = { ...rest, ...ch, at: this.#now(op.at) };
    for (const k of Object.keys(next)) if (next[k] === undefined) delete next[k];
    return this.#send('wtask', next);
  }

  /** A new task (a title and a due day; a start day optional): its id, or null. */
  addTask(t: { title: string; cat?: string; due: string; start?: string }): string | null {
    if (!isValidDay(t.due) || (t.start && !isValidDay(t.start))) return null;
    const at = this.#now(), id = newTaskId(at);
    const ok = this.#send('wtask', { id, at, c: at, title: t.title, cat: t.cat ?? '', due: t.due, ...(t.start ? { start: t.start } : {}) });
    return ok ? id : null;
  }

  /** A subtask under a live top-level task (a title, no date): its id, or null. */
  addSub(parent: string, title: string): string | null {
    const p = this.#set(parent);
    if (!p || p.parent !== undefined || p.del !== undefined) return null;
    const at = this.#now(), id = newTaskId(at);
    return this.#send('wtask', { id, at, c: at, title, cat: '', parent }) ? id : null;
  }

  /** Change a task's title, category or days (a subtask: its title only; `start: ''` clears the start day). */
  editTask(id: string, ch: { title?: string; cat?: string; due?: string; start?: string }): boolean {
    const op = this.#set(id);
    if (!op) return false;
    if (op.parent !== undefined && (ch.due !== undefined || ch.start !== undefined)) return false;
    if ((ch.due !== undefined && !isValidDay(ch.due)) || (ch.start && !isValidDay(ch.start))) return false;
    return this.#put(op, {
      ...(ch.title !== undefined ? { title: ch.title } : {}),
      ...(ch.cat !== undefined ? { cat: ch.cat } : {}),
      ...(ch.due !== undefined ? { due: ch.due } : {}),
      ...(ch.start !== undefined ? { start: ch.start || undefined } : {})
    });
  }

  /** Tick (or untick; omitted: toggle) a task or subtask. */
  tick(id: string, on?: boolean): boolean {
    if (!this.#set(id)) return false;
    const held = this.#book.rows.get(`wdone|${id}`);
    const was = held?.type === 'wdone' ? held.op : null;
    const v = (on ?? !(was?.v === 1)) ? 1 : 0;
    return this.#send('wdone', { id, at: this.#now(was?.at ?? 0), v });
  }

  /** Delete a task (its live subtasks with it): restorable. */
  remove(id: string): boolean {
    const op = this.#set(id);
    if (!op || op.del !== undefined) return false;
    const del = this.#now();
    let ok = this.#put(op, { del });
    for (const t of this.#all) {
      const sub = t.parentId === id && !t.deletedAt ? this.#set(t.id) : null;
      if (sub) ok = this.#put(sub, { del }) && ok;
    }
    return ok;
  }

  /** Restore a deleted task (and the subtasks deleted with it). */
  restore(id: string): boolean {
    const op = this.#set(id);
    if (!op || op.del === undefined) return false;
    const del = op.del;
    let ok = this.#put(op, { del: undefined });
    for (const t of this.#all) {
      const sub = t.parentId === id ? this.#set(t.id) : null;
      if (sub?.del === del) ok = this.#put(sub, { del: undefined }) && ok;
    }
    return ok;
  }

  /** Remove deleted tasks for good: one (and its deleted subtasks), or all of them (no id). Final. */
  purge(id?: string): boolean {
    const gone = this.deleted.filter((t) => id === undefined || t.id === id || t.parentId === id);
    if (id !== undefined && !gone.some((t) => t.id === id)) return false;
    let ok = gone.length > 0;
    for (const t of gone) ok = this.#send('wtask', { id: t.id, at: this.#now(this.#book.task(t.id)?.at ?? 0), rm: true }) && ok;
    return ok;
  }

  /** One setting ('' clears a text one; [] the categories: the starter list again). */
  setConfig(k: WConfKey, v: string | string[]): boolean {
    const held = this.#book.rows.get(`wconf|${k}`);
    return this.#send('wconf', { k, at: this.#now(held?.op.at ?? 0), v });
  }

  /** Save the notes. `from`: the `at` of the version the edit began from (note.at when the editor opened; null: there
   *  was none; omitted: the held one). A save that crossed another's is kept with that one beside it (conflict), both
   *  shown until the next save, which settles it. */
  saveNote(md: string, from?: number | null): boolean {
    if (md.length > WNOTE_CHARS) return false;
    const n = wedNote(this.#book);
    const base = from === undefined ? n?.at : from ?? undefined;
    if (n && n.md === md && !n.was && base === n.at) return true;
    return this.#send('wnote', { at: this.#now(n?.at ?? 0), md, ...(base !== undefined ? { base } : {}) });
  }
}

/** The wedding board: one per phone. */
export const board = new WeddingBoard();
