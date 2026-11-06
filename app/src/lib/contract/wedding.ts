// けっこんしき, the wedding board (docs/wedding.md "The record (relay)", docs/backend.md#events `wtask`, `wdone`,
// `wconf`, `wnote`). Built like the packing list (contract/pack.ts): one op per thing, the latest `at` wins (then G
// over B over A), a purge is final, so the record and every phone reach the same board whatever order the ops come in.
// - `wtask` sets a task or a subtask (its whole state: title, category, dates, parent, soft-deleted or not) or purges
//   it (`rm`, final). A subtask names its parent (one level: the parent has none) and has no dates.
// - `wdone` is a task's tick, shared (either member ticks, as the old board).
// - `wconf` is one setting (WCONF_KEYS).
// - `wnote` is the one shared markdown document. A save names the note it was edited from (`base`: that note's `at`);
//   one that doesn't match the held note is kept, and the record keeps the note it replaced beside it (`was`), so the
//   phones show both until someone saves again from the new one. A save that loses on `at` to a note it wasn't
//   edited from (an offline save, two crossing in flight) is kept the same way, restamped just after the held one.
// The members write all four; the guest reads them and writes none (contract/guest.ts guestMayWrite). `imported`
// marks a row the admin's load brought from the old Sheet (docs/wedding.md#migration): never sent by a phone.
// Shared by the record (relay/src/store.ts), the model (model/state.ts) and the board's store
// (components/wedding/board.svelte.ts); pure and dependency-free (the plain text rules: contract/text.ts).
import { cleanLine } from './text.ts';
import { isLocalDate, isWho, type Who } from './api.ts';
import { AHEAD_MS, isMs, newOpId, only } from './ops.ts';

// (who wrote it: the merge's tie-break is a fixed order, A < B < G)
type Rec = Record<string, unknown>;

/** The four event types. */
const WED_TYPES = ['wtask', 'wdone', 'wconf', 'wnote'] as const;
type WedType = (typeof WED_TYPES)[number];
/** @public (relay/src/store.ts) */
export const isWedType = (t: unknown): t is WedType => (WED_TYPES as readonly unknown[]).includes(t);

/** A task's title at most (characters: code points; the old Sheet's longest, a subtask with a link, is 269), a
 *  category's. */
export const WTASK_TITLE = 500;
export const WTASK_CAT = 40;
/** At most this many `wtask` rows (tasks, subtasks, the deleted and the purged): a new one past them is refused. */
export const WTASK_MAX = 2000;
/** The note's markdown at most (UTF-16 code units, as the old board's 50,000). */
export const WNOTE_CHARS = 64_000;
/** A sent note's data at most as JSON (its own cap: every other event's is the record's 20,000, MAX_EVENT_DATA_CHARS). */
export const WNOTE_DATA_CHARS = 140_000;
/** The settings: the two names, the date, the time (`HH:MM`, the old board's `wedding_time`), the venue, the time zone
 *  (IANA), the categories. */
const WCONF_KEYS = ['p1', 'p2', 'date', 'time', 'venue', 'tz', 'cats'] as const;
export type WConfKey = (typeof WCONF_KEYS)[number];
/** A name's characters at most, the venue's (code points). @public (Settings' fields) */
export const NAME_CHARS = 40;
/** @public (Settings' fields) */
export const VENUE_CHARS = 200;
/** The categories at most, and each one's characters (WTASK_CAT). */
export const WCATS_MAX = 30;
const TZ = /^[A-Za-z][A-Za-z0-9_+-]*(?:\/[A-Za-z0-9_+-]+){0,2}$/;
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

/** A task's id: the old Sheet's (UUIDs) or one a phone made (newTaskId). */
const ID = /^[A-Za-z0-9_-]{1,64}$/;
const isTaskId = (v: unknown): v is string => typeof v === 'string' && ID.test(v);
const isClean = (v: unknown, max: number): v is string => typeof v === 'string' && cleanLine(v, max) === v;

/** A new task's id. */
export const newTaskId = (at: number): string => newOpId('t', at);

/** A task set: `c` when it was created (ms: a checklist reads in the order it was typed), `del` when it was
 *  soft-deleted (restorable: a set without it), `parent` a subtask's task. */
export type WTaskSet = { id: string; at: number; c: number; title: string; cat: string; due?: string; start?: string; parent?: string; del?: number; imported?: true; rm?: undefined };
type WTaskRm = { id: string; at: number; rm: true };
export type WTaskOp = WTaskSet | WTaskRm;
export type WDone = { id: string; at: number; v: 0 | 1; imported?: true };
export type WConf = { k: WConfKey; at: number; v: string | string[]; imported?: true };
/** The note the record replaced with this one when this one's `base` didn't match it (never sent). */
type WNoteWas = { at: number; md: string; who: Who };
export type WNote = { at: number; md: string; base?: number; was?: WNoteWas; imported?: true };

/** A row of one of the four types as the record holds it, with who sent it. */
export type WedRow =
  | { type: 'wtask'; who: Who; op: WTaskOp }
  | { type: 'wdone'; who: Who; op: WDone }
  | { type: 'wconf'; who: Who; op: WConf }
  | { type: 'wnote'; who: Who; op: WNote };

/**
 * An op's data with its texts cleaned as the record keeps them (a title and a category one clean line; a setting's
 * text one clean line, its categories each, the empty ones and the repeats dropped). The note's markdown is kept exactly as sent. What
 * it can't read is passed back as it came (and refused by wedOpOf).
 */
export function wedClean(type: string, d: Rec): Rec {
  if (type === 'wtask' && d.rm === undefined) {
    const out: Rec = { ...d };
    if (typeof d.title === 'string') out.title = cleanLine(d.title, WTASK_TITLE);
    if (typeof d.cat === 'string') out.cat = cleanLine(d.cat, WTASK_CAT);
    return out;
  }
  if (type === 'wconf') {
    if (typeof d.v === 'string') return { ...d, v: cleanLine(d.v, d.k === 'venue' ? VENUE_CHARS : NAME_CHARS) };
    if (Array.isArray(d.v)) {
      const v = d.v.map((x) => (typeof x === 'string' ? cleanLine(x, WTASK_CAT) : x)).filter((x) => x !== '');
      return { ...d, v: v.filter((x, i) => typeof x !== 'string' || v.indexOf(x) === i) };
    }
  }
  return d;
}

/** Whether a setting's value is one its key takes ('' clears a text one; [] the categories: the defaults). */
function confValueOk(k: WConfKey, v: unknown): boolean {
  switch (k) {
    case 'p1':
    case 'p2':
      return isClean(v, NAME_CHARS);
    case 'venue':
      return isClean(v, VENUE_CHARS);
    case 'date':
      return v === '' || isLocalDate(v);
    case 'time':
      return v === '' || (typeof v === 'string' && TIME.test(v));
    case 'tz':
      return v === '' || (typeof v === 'string' && v.length <= 64 && TZ.test(v));
    case 'cats':
      return Array.isArray(v) && v.length <= WCATS_MAX && v.every((x) => isClean(x, WTASK_CAT) && x !== '') && new Set(v).size === v.length;
  }
}

/**
 * One of the four types' data, its known keys only, each well-formed (texts already clean), or null. `sent`: a phone's
 * op (the record's live path): its `at` at most a day past `now`, never `imported` (the admin's load's) or `was` (the
 * record's own). Otherwise as the record kept it (the model's read, the admin's load).
 */
export function wedOpOf(type: string, d: Rec, sent?: { now: number }): WTaskOp | WDone | WConf | WNote | null {
  if (!isMs(d.at) || (sent && d.at > sent.now + AHEAD_MS)) return null;
  if (d.imported !== undefined && (sent || d.imported !== true)) return null;
  const at = d.at, imp = d.imported === true ? { imported: true as const } : {};
  switch (type) {
    case 'wtask': {
      if (!isTaskId(d.id)) return null;
      if (d.rm !== undefined) return d.rm === true && only(d, ['id', 'at', 'rm']) ? { id: d.id, at, rm: true } : null;
      if (!only(d, ['id', 'at', 'c', 'title', 'cat', 'due', 'start', 'parent', 'del', 'imported'])) return null;
      if (!isMs(d.c) || !isClean(d.title, WTASK_TITLE) || d.title === '' || !isClean(d.cat, WTASK_CAT)) return null;
      const op: WTaskSet = { id: d.id, at, c: d.c, title: d.title, cat: d.cat };
      if (d.parent !== undefined) {
        // one level, no dates
        if (!isTaskId(d.parent) || d.parent === d.id || d.due !== undefined || d.start !== undefined) return null;
        op.parent = d.parent;
      }
      if (d.due !== undefined) {
        if (!isLocalDate(d.due)) return null;
        op.due = d.due;
      }
      if (d.start !== undefined) {
        if (!isLocalDate(d.start)) return null;
        op.start = d.start;
      }
      if (d.del !== undefined) {
        if (!isMs(d.del)) return null;
        op.del = d.del;
      }
      return { ...op, ...imp };
    }
    case 'wdone':
      return isTaskId(d.id) && (d.v === 0 || d.v === 1) && only(d, ['id', 'at', 'v', 'imported']) ? { id: d.id, at, v: d.v, ...imp } : null;
    case 'wconf': {
      if (!only(d, ['k', 'at', 'v', 'imported']) || !(WCONF_KEYS as readonly unknown[]).includes(d.k)) return null;
      const k = d.k as WConfKey;
      if (!confValueOk(k, d.v)) return null;
      return { k, at, v: Array.isArray(d.v) ? [...(d.v as string[])] : (d.v as string), ...imp };
    }
    case 'wnote': {
      if (!only(d, ['at', 'md', 'base', 'was', 'imported']) || typeof d.md !== 'string' || d.md.length > WNOTE_CHARS) return null;
      const op: WNote = { at, md: d.md };
      if (d.base !== undefined) {
        if (!isMs(d.base)) return null;
        op.base = d.base;
      }
      if (d.was !== undefined) {
        const w = d.was as Rec;
        if (sent || typeof w !== 'object' || w === null || Array.isArray(w) || !only(w, ['at', 'md', 'who'])) return null;
        if (!isMs(w.at) || typeof w.md !== 'string' || w.md.length > WNOTE_CHARS || !isWho(w.who)) return null;
        op.was = { at: w.at, md: w.md, who: w.who };
      }
      return { ...op, ...imp };
    }
    default:
      return null;
  }
}

/** A row read from its type, data and sender (null: not one of the four, or malformed). */
export function wedRowOf(type: string, d: Rec, who: Who): WedRow | null {
  if (!isWedType(type)) return null;
  const op = wedOpOf(type, d);
  return op ? ({ type, who, op } as WedRow) : null;
}

/** The slot a row fills (the record keeps one row a slot): a task's op and its tick by id, a setting by key, the note
 *  one. Null for data without its id or key. */
export function wedSlot(type: string, d: Rec): string | null {
  switch (type) {
    case 'wtask':
    case 'wdone':
      return isTaskId(d.id) ? `${type}|${d.id}` : null;
    case 'wconf':
      return (WCONF_KEYS as readonly unknown[]).includes(d.k) ? `wconf|${String(d.k)}` : null;
    case 'wnote':
      return 'wnote';
    default:
      return null;
  }
}
const slotOf = (r: WedRow): string => wedSlot(r.type, r.op as unknown as Rec)!;

/** Whether row `a` beats `b` (the same slot): a purge beats a set; else the later `at`, then G over B over A. */
function wedBeats(a: WedRow, b: WedRow): boolean {
  if (a.type === 'wtask' && b.type === 'wtask' && !!a.op.rm !== !!b.op.rm) return !!a.op.rm;
  if (a.op.at !== b.op.at) return a.op.at > b.op.at;
  return a.who > b.who;
}

/** What the record does with a row: `append` (its slot's row replaced by `row`, the slots in `drop` deleted with it: a
 *  purged task's tick), `stale` (acknowledged, nothing kept), `forbidden` (the guest), `full` (WTASK_MAX) or `parent`
 *  (a subtask whose parent isn't a task the record holds, or is itself a subtask; a set keeping its held `parent`
 *  passes, so a subtask whose parent was purged stays editable). */
export type WedVerdict = { v: 'append'; row: WedRow; drop: string[] } | { v: 'stale' | 'forbidden' | 'full' | 'parent' };

/**
 * The wedding rows as the record holds them (each slot's latest): the record builds one from the slots an op touches
 * (wedNeeds) for each op it's sent, the phone folds every row into one (wedFold).
 */
export class WedBook {
  readonly rows = new Map<string, WedRow>();
  #tasks = 0;

  /** A row taken as it is (the record's own, read back), replacing its slot's. */
  put(r: WedRow): void {
    const s = slotOf(r);
    if (this.rows.get(s)?.type === 'wtask') this.#tasks--;
    this.rows.set(s, r);
    if (r.type === 'wtask') this.#tasks++;
  }
  /** A row the record kept: in its slot unless the one there beats it (true: taken). */
  merge(r: WedRow): boolean {
    const held = this.rows.get(slotOf(r));
    if (held && !wedBeats(r, held)) return false;
    this.put(r);
    return true;
  }
  delete(slot: string): void {
    if (this.rows.get(slot)?.type === 'wtask') this.#tasks--;
    this.rows.delete(slot);
  }

  /** A task's op the book holds (null: none). */
  task(id: string): WTaskOp | null {
    const r = this.rows.get(`wtask|${id}`);
    return r?.type === 'wtask' ? r.op : null;
  }

  /** The record's rules for a new row (see WedVerdict). `tasks`: the record's `wtask` rows (it reads only the slots an
   *  op needs, and counts them only for a task it doesn't hold; the phone's book holds them all). */
  accept(r: WedRow, tasks = this.#tasks): WedVerdict {
    if (r.who === 'G') return { v: 'forbidden' };
    const slot = slotOf(r);
    const held = this.rows.get(slot) ?? null;
    if (held && !wedBeats(r, held)) return r.type === 'wnote' && held.type === 'wnote' ? this.#crossed(r, held) : { v: 'stale' };
    switch (r.type) {
      case 'wtask': {
        const h = held?.type === 'wtask' ? held.op : null;
        // a purge is final (wedBeats: nothing beats it); a purge of a task the record doesn't hold changes nothing
        if (r.op.rm) return h ? { v: 'append', row: r, drop: this.rows.has(`wdone|${r.op.id}`) ? [`wdone|${r.op.id}`] : [] } : { v: 'stale' };
        if (r.op.parent !== undefined && !(h && !h.rm && h.parent === r.op.parent)) {
          const p = this.task(r.op.parent);
          if (!p || p.rm || p.parent !== undefined) return { v: 'parent' };
        }
        if (!h && tasks >= WTASK_MAX) return { v: 'full' };
        return { v: 'append', row: r, drop: [] };
      }
      case 'wdone': {
        // a tick of a purged task, or of one the record doesn't hold
        const t = this.task(r.op.id);
        return !t || t.rm ? { v: 'stale' } : { v: 'append', row: r, drop: [] };
      }
      case 'wconf':
        return { v: 'append', row: r, drop: [] };
      case 'wnote':
        return { v: 'append', row: noteOver(r, held?.type === 'wnote' ? held : null), drop: [] };
    }
  }

  /** A note save the held one beats: one edited from it (or the same text) changes nothing; else (saved offline, or
   *  crossing another in flight) it's kept, restamped just after the held one, with the held one beside it, so neither
   *  is lost and both phones show the conflict. */
  #crossed(r: WedRow & { type: 'wnote' }, held: WedRow & { type: 'wnote' }): WedVerdict {
    if (r.op.base === held.op.at || r.op.md === held.op.md) return { v: 'stale' };
    return { v: 'append', row: noteOver({ ...r, op: { ...r.op, at: held.op.at + 1 } }, held), drop: [] };
  }

  /** A row through the rules, kept if they take it: its verdict. */
  apply(r: WedRow): WedVerdict {
    const v = this.accept(r);
    if (v.v === 'append') {
      for (const s of v.drop) this.delete(s);
      this.put(v.row);
    }
    return v;
  }
}

/** A note save as the record keeps it: over a note it wasn't edited from, that one beside it (`was`). */
function noteOver(r: WedRow & { type: 'wnote' }, held: (WedRow & { type: 'wnote' }) | null): WedRow & { type: 'wnote' } {
  const { was: _was, ...op } = r.op;
  return { type: 'wnote', who: r.who, op: held && op.base !== held.op.at ? { ...op, was: { at: held.op.at, md: held.op.md, who: held.who } } : op };
}

/** The slots the record reads for an op (accept's): its own, a task's tick, a subtask's parent, a tick's task.
 *  @public (relay/src/store.ts) */
export function wedNeeds(type: string, d: Rec): string[] {
  const own = wedSlot(type, d);
  if (!own) return [];
  if (type === 'wtask') return [own, `wdone|${String(d.id)}`, ...(isTaskId(d.parent) ? [`wtask|${d.parent}`] : [])];
  if (type === 'wdone') return [own, `wtask|${String(d.id)}`];
  return [own];
}

/** A row as the model holds it: the record's, or this phone's not yet sent (`queued`). */
export type WedEntry = WedRow & { queued?: true };

/**
 * The rows as the record keeps them, from the model's in the order they came: the record's own taken as they are (each
 * slot's latest), this phone's queued ones through the record's rules (accept), so a phone shows what the record will.
 */
export function wedFold(rows: Iterable<WedEntry>): WedBook {
  const b = new WedBook();
  for (const r of rows) {
    if (r.queued) b.apply(r);
    else b.merge(r);
  }
  return b;
}

/** A model's list folded (wedFold), once per list: a model's lists are replaced, never mutated (the board's store and
 *  the wedding day share it). */
const folds = new WeakMap<readonly WedEntry[], WedBook>();
export function wedBookOf(rows: readonly WedEntry[]): WedBook {
  let b = folds.get(rows);
  if (!b) folds.set(rows, (b = wedFold(rows)));
  return b;
}

/** The wedding day the board's settings name ('YYYY-MM-DD'; '' : none, or cleared). */
export function wedDate(book: WedBook): string {
  const r = book.rows.get('wconf|date');
  return r?.type === 'wconf' && typeof r.op.v === 'string' ? r.op.v : '';
}

/** A task as the old board's rows read (its `schema.js` rowToTask: the strings lib/wedding/progress.ts works on), with
 *  who ticked it. */
export interface WedTask {
  id: string;
  title: string;
  category: string;
  due: string;
  start: string;
  /** ISO of its tick's `at` ('' : not done). */
  doneAt: string;
  /** Who ticked it ('' : not done, or the tick came from the old Sheet, which never recorded who). */
  doneBy: Who | '';
  createdAt: string;
  /** ISO of `del` ('' : live). */
  deletedAt: string;
  parentId: string;
}

const iso = (ms: number): string => new Date(ms).toISOString();

/** Every task the book holds but the purged, deleted ones too, in no order. */
export function wedTasks(book: WedBook): WedTask[] {
  const out: WedTask[] = [];
  for (const r of book.rows.values()) {
    if (r.type !== 'wtask' || r.op.rm) continue;
    const op = r.op, d = book.rows.get(`wdone|${op.id}`);
    const done = d?.type === 'wdone' && d.op.v === 1 ? d : null;
    out.push({
      id: op.id, title: op.title, category: op.cat, due: op.due ?? '', start: op.start ?? '',
      doneAt: done ? iso(done.op.at) : '', doneBy: done && !done.op.imported ? done.who : '',
      createdAt: iso(op.c), deletedAt: op.del !== undefined ? iso(op.del) : '', parentId: op.parent ?? ''
    });
  }
  return out;
}

/** The settings the book holds, by key (a key never set is absent). */
export function wedConfig(book: WedBook): Partial<Record<WConfKey, string | string[]>> {
  const out: Partial<Record<WConfKey, string | string[]>> = {};
  for (const r of book.rows.values()) if (r.type === 'wconf') out[r.op.k] = r.op.v;
  return out;
}

/** The note the book holds, with who saved it, or null: none yet. */
export function wedNote(book: WedBook): (WNote & { who: Who }) | null {
  const r = book.rows.get('wnote');
  return r?.type === 'wnote' ? { ...r.op, who: r.who } : null;
}
