// The record's per-feature rules (store.ts keep): each op judged against the rows its slots hold (decor, board,
// packing, wedding, やること, hikes, food, tallies, island days), and the caps' counts.
import { isWho, type Who } from '../../app/src/lib/contract/api.ts';
import { isRec } from '../../app/src/lib/contract/guards.ts';
import { decorAccept, decorOpOf, type DecorEntry } from '../../app/src/lib/contract/decor.ts';
import { isTentPiece, tentAccept, tentOpOf, type TentEntry } from '../../app/src/lib/contract/tent.ts';
import { isRoomScope, isStanding, layoutAccept, layoutOpOf, type LayoutEntry } from '../../app/src/lib/contract/layout.ts';
import { TodoBook, todoItems, todoRowOf, type TodoItemView, type TodoVerdict } from '../../app/src/lib/contract/todo.ts';
import { HikeBook, hikeRowOf, hikeTrkAccept, type HikeVerdict } from '../../app/src/lib/contract/hike.ts';
import { boardAccept, boardOpOf, type BoardEntry } from '../../app/src/lib/contract/board.ts';
import { PackBook, packRowOf, PACK_TYPES, type PackVerdict } from '../../app/src/lib/contract/pack.ts';
import { WedBook, wedNeeds, wedRowOf, type WedVerdict } from '../../app/src/lib/contract/wedding.ts';
import { foodAccept, foodCustomOp, foodOp, foodRecipeOp, foodRepeatOp, repeatAccept, sharedAccept, type RepeatOpBy } from '../../app/src/lib/contract/food.ts';
import { isTally, mergeTally } from '../../app/src/lib/contract/tally.ts';
import { isIslandDay, mergeIslandDay } from '../../app/src/lib/contract/island.ts';
import { StoreBase, type Rec } from './storeBase.ts';

/** The meal log's events, each one's latest op per id kept by its owner's rule (contract/food.ts foodAccept; a recipe's
 *  and a custom food's by anyone, under its creator's name: sharedAccept). */
export const FOOD_PARSE = { food: foodOp, food_repeat: foodRepeatOp, food_recipe: foodRecipeOp, food_custom: foodCustomOp } as const;
export type FoodType = keyof typeof FOOD_PARSE;
export const isFoodType = (t: string): t is FoodType => Object.hasOwn(FOOD_PARSE, t);

export class StoreBooks {
  constructor(private readonly b: StoreBase) {}

  /** What a `spend_void` of `spendId` would undo: `missing`, `voided` (already undone) or `ok`. */
  voidTarget(spendId: string): 'missing' | 'voided' | 'ok' {
    let found = false;
    const rows = this.b.io.sql.exec<{ type: string; data: string }>(
      "SELECT type, data FROM events WHERE type IN ('spend', 'spend_void') AND instr(data, ?) > 0", JSON.stringify(spendId)
    ).toArray();
    for (const r of rows) {
      const d = this.b.rowRec(r.data, 'spend');
      if (!d || d.spendId !== spendId) continue;
      if (r.type === 'spend_void') return 'voided';
      found = true;
    }
    return found ? 'ok' : 'missing';
  }

  /** A decor op against the record's (each id's latest op, per scope): `stale`, `full` or `append` (contract/decor.ts
   *  decorAccept, contract/tent.ts tentAccept, contract/layout.ts layoutAccept). Only the op's own slots' rows are read
   *  (the piece's and its light switch's, the layout's reset) and the cap's count is the record's own (decorLive);
   *  until 2026-11-05 every op parsed every decor row. */
  decorTarget(me: Who, d: Rec): 'append' | 'stale' | 'full' {
    const kind = d.sc === undefined ? 'island' : isRoomScope(d.sc) ? 'room' : 'layout';
    const parse = (x: Rec) => (kind === 'room' ? tentOpOf(x) : kind === 'layout' ? layoutOpOf(x) : decorOpOf(x));
    const e = { ...parse(d)!, who: me };
    const sc = typeof d.sc === 'string' ? d.sc : '';
    const slots = kind === 'room' ? [`decor|${sc}|${String(d.id)}`, `decor|${sc}|${String(d.id)}|l`] : kind === 'layout' ? [`decor|${sc}|${String(d.id)}`, 'decor|r|reset'] : [`decor||${String(d.id)}`];
    const held: (DecorEntry | TentEntry | LayoutEntry)[] = [];
    for (const r of this.b.io.sql.exec<{ person: string; data: string }>(`SELECT person, data FROM events WHERE slot IN (${slots.map(() => '?').join(', ')})`, ...slots).toArray()) {
      const x = this.b.rowRec(r.data, 'decor');
      const op = x && isWho(r.person) ? parse(x) : null;
      if (op) held.push({ ...op, who: r.person } as DecorEntry | TentEntry | LayoutEntry);
    }
    const fam = kind === 'island' ? '' : kind === 'room' ? sc : sc === 'o' ? 'o' : null;
    const live = fam === null ? undefined : this.decorLive()[fam] ?? 0;
    if (kind === 'room') return tentAccept(held as TentEntry[], e as TentEntry, live);
    if (kind === 'layout') return layoutAccept(held as LayoutEntry[], e as LayoutEntry, live);
    return decorAccept(held as DecorEntry[], e as DecorEntry, live);
  }

  /** What counts toward a decor cap, per family (`''` the island's decorations, `t` `u` `v` the rooms' pieces, `o` the
   *  outdoors' pieces standing): meta `decor_live`, kept by each decor op (decorNote), counted from the rows when it
   *  isn't there (after a load or a reset). */
  decorLive(): Record<string, number> {
    const raw = this.b.meta('decor_live');
    if (raw) {
      try {
        const x = JSON.parse(raw) as unknown;
        if (isRec(x)) return x as Record<string, number>;
      } catch { /* counted again */ }
    }
    const n: Record<string, number> = { '': 0, t: 0, u: 0, v: 0, o: 0 };
    const reset = this.layoutReset();
    for (const r of this.decorRows()) {
      const f = this.decorFamily(r.d, r.person, reset);
      if (f?.live) n[f.fam]++;
    }
    this.b.setMeta('decor_live', JSON.stringify(n));
    return n;
  }

  /** The layout's reset in force (its `at`; 0: none). */
  layoutReset(): number {
    const r = this.b.io.sql.exec<{ data: string }>("SELECT data FROM events WHERE slot = 'decor|r|reset'").toArray()[0];
    const x = r ? this.b.rowRec(r.data, 'decor') : null;
    const op = x ? layoutOpOf(x) : null;
    return op?.sc === 'r' ? op.at : 0;
  }

  /** A decor row's cap family and whether it counts there (null: no cap of its own: a chunk, a reset, a home's look). */
  decorFamily(d: Rec, who: Who, reset: number): { fam: string; live: boolean } | null {
    if (d.sc === undefined) {
      const op = decorOpOf(d);
      return op ? { fam: '', live: !op.rm } : null;
    }
    if (isRoomScope(d.sc)) {
      const op = tentOpOf(d);
      return op ? { fam: d.sc, live: isTentPiece({ ...op, who } as TentEntry) } : null;
    }
    const op = d.sc === 'o' ? layoutOpOf(d) : null;
    return op ? { fam: 'o', live: isStanding({ ...op, who } as LayoutEntry, reset) } : null;
  }

  /** A kept decor op into the caps' counts (`was`: the row its slot held before): its family's count moves by what it
   *  stands for less what that row did. A reset lets the counts go (counted again, once, at the next op). */
  decorNote(me: Who, d: Rec, was: { person: string; data: string } | null): void {
    if (d.sc === 'r') return void this.b.io.sql.exec("DELETE FROM meta WHERE k = 'decor_live'");
    const raw = this.b.meta('decor_live');
    if (!raw) return;
    const reset = d.sc === 'o' ? this.layoutReset() : 0;
    const now = this.decorFamily(d, me, reset);
    const wx = was ? this.b.rowRec(was.data, 'decor') : null;
    const before = wx && was && isWho(was.person) ? this.decorFamily(wx, was.person, reset) : null;
    const delta = (now?.live ? 1 : 0) - (before?.live ? 1 : 0);
    if (!delta || !now) return;
    const n = JSON.parse(raw) as Record<string, number>;
    n[now.fam] = (n[now.fam] ?? 0) + delta;
    this.b.setMeta('decor_live', JSON.stringify(n));
  }

  /** The admin's `decorcheck`: the caps' kept counts against the rows' (`fix`: the rows' taken). */
  decorCheck(o: Rec = {}): Record<string, unknown> {
    const kept = this.b.meta('decor_live');
    this.b.io.sql.exec("DELETE FROM meta WHERE k = 'decor_live'");
    const counted = this.decorLive();
    if (kept && o.fix !== true) this.b.setMeta('decor_live', kept);
    return { ok: true, kept: kept ? JSON.parse(kept) : null, counted };
  }

  /** Every board row's op (each post's latest), with who sent it. */
  boardRows(): (BoardEntry & { seq: number })[] {
    const out: (BoardEntry & { seq: number })[] = [];
    for (const r of this.b.io.sql.exec<{ seq: number; person: string; data: string }>("SELECT seq, person, data FROM events WHERE type = 'board'").toArray()) {
      const x = this.b.rowRec(r.data, 'board');
      const op = x ? boardOpOf(x) : null;
      if (op && isWho(r.person)) out.push({ ...op, who: r.person, seq: r.seq });
    }
    return out;
  }

  /** A board op against the posts the record holds (contract/board.ts boardAccept): who may, and the cap. */
  boardTarget(me: Who, d: Rec): ReturnType<typeof boardAccept> {
    return boardAccept(this.boardRows(), { ...boardOpOf(d)!, who: me });
  }

  /** A trip's packing rows (its list's ops, everyone's ticks and resets, its note), each slot's latest. */
  packBook(trip: string): PackBook {
    const b = new PackBook();
    // (a trip id is [a-z0-9-]: nothing GLOB reads as a pattern)
    const rows = this.b.io.sql.exec<{ person: string; type: string; data: string }>(
      `SELECT person, type, data FROM events WHERE type IN (${PACK_TYPES.map(() => '?').join(', ')}) AND (slot GLOB ? OR slot GLOB ? OR slot GLOB ? OR slot = ?)`,
      ...PACK_TYPES, `pack|${trip}|*`, `pack_chk|${trip}|*`, `pack_reset|${trip}|*`, `trip_note|${trip}`
    ).toArray();
    for (const r of rows) {
      const x = this.b.rowRec(r.data, 'pack');
      const row = x && isWho(r.person) ? packRowOf(r.type, x, r.person) : null;
      if (row) b.put(row);
    }
    return b;
  }

  /** A packing op against the trip's rows the record holds (contract/pack.ts PackBook accept). */
  packTarget(me: Who, type: string, d: Rec): PackVerdict {
    const row = packRowOf(type, d, me);
    return row ? this.packBook(row.op.trip).accept(row) : { v: 'stale' };
  }

  /** A wedding op against the rows of the slots it touches (contract/wedding.ts wedNeeds, WedBook accept) and, for a
   *  task the record doesn't hold, its count of tasks. */
  wedTarget(me: Who, type: string, d: Rec): WedVerdict {
    const row = wedRowOf(type, d, me);
    if (!row) return { v: 'stale' };
    const b = new WedBook();
    const slots = wedNeeds(type, d);
    for (const r of this.b.io.sql.exec<{ person: string; type: string; data: string }>(`SELECT person, type, data FROM events WHERE slot IN (${slots.map(() => '?').join(', ')})`, ...slots).toArray()) {
      const x = this.b.rowRec(r.data, 'wedding');
      const held = x && isWho(r.person) ? wedRowOf(r.type, x, r.person) : null;
      if (held) b.put(held);
    }
    const isNew = row.type === 'wtask' && !b.rows.has(slots[0]);
    const tasks = isNew ? Number(this.b.io.sql.exec<{ n: number }>("SELECT count(*) AS n FROM events WHERE type = 'wtask'").toArray()[0]?.n ?? 0) : 0;
    return b.accept(row, tasks);
  }

  /** A `todo` op against every item the record holds (contract/todo.ts TodoBook accept: at most TODO_MAX
   *  standing, so the whole book is small). */
  todoTarget(me: Who, d: Rec): TodoVerdict {
    const row = todoRowOf('todo', d, me);
    return row ? this.todoBook().accept(row) : { v: 'stale' };
  }
  /** The items as the record holds them (やること's reminders: pusher.ts). */
  todoItems(): TodoItemView[] {
    return todoItems(this.todoBook());
  }
  todoBook(): TodoBook {
    const b = new TodoBook();
    for (const r of this.b.io.sql.exec<{ person: string; data: string }>("SELECT person, data FROM events WHERE type = 'todo'").toArray()) {
      const x = this.b.rowRec(r.data, 'todo');
      const row = x && isWho(r.person) ? todoRowOf('todo', x, r.person) : null;
      if (row) b.put(row);
    }
    return b;
  }

  /** A `hike` op against every hike the record holds (contract/hike.ts HikeBook accept: at most HIKE_MAX standing, so
   *  the whole book is small; their tracks are rows of their own, never read here). */
  hikeTarget(me: Who, d: Rec): HikeVerdict {
    const row = hikeRowOf('hike', d, me);
    if (!row) return { v: 'stale' };
    const b = new HikeBook();
    for (const r of this.b.io.sql.exec<{ person: string; data: string }>("SELECT person, data FROM events WHERE type = 'hike'").toArray()) {
      const x = this.b.rowRec(r.data, 'hike');
      const held = x && isWho(r.person) ? hikeRowOf('hike', x, r.person) : null;
      if (held) b.put(held);
    }
    return b.accept(row);
  }
  /** A `hike_trk` against its hike's row and any track held (contract/hike.ts hikeTrkAccept). */
  hikeTrkTarget(d: Rec): 'append' | 'stale' {
    const h = this.b.slotRow(`hike|${String(d.id)}`);
    const hx = h && isWho(h.person) ? this.b.rowRec(h.data, 'hike') : null;
    const had = this.b.io.sql.exec('SELECT 1 AS x FROM events WHERE slot = ?', `hike_trk|${String(d.id)}`).toArray().length > 0;
    return hikeTrkAccept(hx ? hikeRowOf('hike', hx, h!.person as Who) : null, had);
  }

  /** A meal, a repeat, a recipe or a custom food op against the entry's (the repeat's, the recipe's) latest op the record holds (its
   *  slot's row, with who sent it): `forbidden`, `stale` (nothing to keep), or the op its slot then keeps (a repeat's
   *  with every op's skipped days: contract/food.ts repeatAccept) and who it is kept under (the sender; a recipe's or a
   *  custom food's creator, whoever edited it: sharedAccept). */
  foodTarget(type: FoodType, me: Who, d: Rec): 'forbidden' | 'stale' | { op: Rec; who: Who } {
    const parse = FOOD_PARSE[type];
    const held = this.foodHeld(type, String(d.id));
    const e = { ...parse(d)!, who: me };
    if (type === 'food_repeat') {
      const { v, keep } = repeatAccept(held as RepeatOpBy | null, e as RepeatOpBy);
      if (v === 'forbidden') return v;
      if (!keep) return 'stale';
      const { who: _who, ...op } = keep;
      return { op, who: me };
    }
    const shared = type === 'food_recipe' || type === 'food_custom';
    const v = (shared ? sharedAccept : foodAccept)(held, e);
    return v === 'append' ? { op: parse(d)!, who: shared && held ? held.who : me } : v;
  }

  /** The op a meal's, a repeat's, a recipe's or a custom food's slot holds, with who sent it, or null. */
  foodHeld(type: FoodType, id: string): (NonNullable<ReturnType<(typeof FOOD_PARSE)[FoodType]>> & { who: Who }) | null {
    const r = this.b.io.sql.exec<{ person: string; data: string }>('SELECT person, data FROM events WHERE slot = ?', `${type}|${id}`).toArray()[0];
    if (!r || !isWho(r.person)) return null;
    const op = FOOD_PARSE[type](this.b.rowRec(r.data, 'food'));
    return op ? { ...op, who: r.person } : null;
  }

  /** A `tally` (or a `tally_back`) of `who`'s as its slot keeps it (JSON): merged with the day's row held
   *  (contract/tally.ts mergeTally). */
  tallyKept(who: Who, d: Rec, type: 'tally' | 'tally_back' = 'tally'): string {
    const held = this.b.io.sql.exec<{ data: string }>('SELECT data FROM events WHERE slot = ?', `${type}|${who}|${String(d.date)}`).toArray()[0];
    const h = held ? this.b.rowRec(held.data, 'tally') : null;
    if (!h || !isTally(h) || !isTally(d)) return JSON.stringify(d);
    return JSON.stringify({ date: d.date, counts: mergeTally(h.counts, d.counts) });
  }

  /** An island day as kept over the row of the same person and day it replaces (contract/island.ts mergeIslandDay:
   *  what only grows, merged). */
  islandKept(who: Who, d: Rec): string {
    const held = this.b.io.sql.exec<{ data: string }>('SELECT data FROM events WHERE slot = ?', `island|${who}|${String(d.date)}`).toArray()[0];
    const h = held ? this.b.rowRec(held.data, 'island') : null;
    if (!h || !isIslandDay(h) || !isIslandDay(d)) return JSON.stringify(d);
    return JSON.stringify(mergeIslandDay(h, d));
  }

  /** `who`'s tally of `date` the record holds (its counts; none: empty). */
  heldTally(who: Who, date: string): Record<string, number> {
    const held = this.b.io.sql.exec<{ data: string }>('SELECT data FROM events WHERE slot = ?', `tally|${who}|${date}`).toArray()[0];
    const h = held ? this.b.rowRec(held.data, 'tally') : null;
    return h && isTally(h) ? h.counts : {};
  }

  /** A tally slot's counts as held (none: empty). */
  slotTally(slot: string): Record<string, number> {
    const held = this.b.io.sql.exec<{ data: string }>('SELECT data FROM events WHERE slot = ?', slot).toArray()[0];
    const h = held ? this.b.rowRec(held.data, 'tally') : null;
    return h && isTally(h) ? h.counts : {};
  }

  /** Every decor row (its seq, sender and data). */
  decorRows(): { seq: number; person: Who; d: Rec }[] {
    const out: { seq: number; person: Who; d: Rec }[] = [];
    for (const r of this.b.io.sql.exec<{ seq: number; person: string; data: string }>("SELECT seq, person, data FROM events WHERE type = 'decor'").toArray()) {
      const x = this.b.rowRec(r.data, 'decor');
      if (x && isWho(r.person)) out.push({ seq: r.seq, person: r.person, d: x });
    }
    return out;
  }

  /** A layout reset's rows: the objects' and the chunks' ops it voids are dropped (their ids stay known): by their
   *  slots' range and their `at`, no row parsed here (a row that isn't JSON is left). */
  dropVoided(at: number): void {
    this.b.io.sql.exec(
      `DELETE FROM events WHERE type = 'decor' AND ((slot >= 'decor|o|' AND slot < 'decor|o}') OR (slot >= 'decor|c|' AND slot < 'decor|c}'))
       AND (CASE WHEN json_valid(data) THEN json_extract(data, '$.at') END) <= ?`, at
    );
  }
}
