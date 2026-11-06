// A trip's packing list on this phone (docs/travel.md "Packing list (relay)"): the trip's seed with the record's ops
// over it and this phone's queued ones (the model's `pack` rows folded by the record's rules: contract/pack.ts
// packFold, packList), each item's ticks (each person's own, after their own reset), and my changes (each one event,
// sent at once, its names cleaned as the record keeps them; the record's notice brings them to every open phone). The
// trip's private values (its `trip_note`) too. Nothing is mine to change until the week's view says who I am (`me`).
//   packing.list(trip, seed)          categories (by ord), each with its items (by ord)
//   packing.addItem / addCat / rename / move              the ✎ edits (the guest: only what it added: packMayEdit)
//   packing.removeHeld(trip, seed, id, ms)                a removal held for its とりけす
//   packing.tick(trip, id, on) / resetHeld(trip, ms)      my own ticks
//   packing.note(trip)                the trip note's values by key (null: not on the record, or not loaded yet)
import {
  newPackId, ordBetween, PACK_NAME, packFold, packList, packMayEdit, tripNoteOf, type L, type PackBook, type PackCat,
  type PackEntry, type PackItem, type PackSeed
} from '#lib/contract/pack.ts';
import { cleanLine } from '#lib/contract/text.ts';
import type { Locale } from '#lib/i18n/index.ts';
import type { SendResult } from '#lib/store/backend.ts';
import { week } from '#lib/store/week.svelte.ts';
import { world } from '#lib/store/world.svelte.ts';
import type { Who } from '#lib/types.ts';

/** The fold of a State's rows (a State is never mutated: its list's identity is the cache key). */
const books = new WeakMap<readonly PackEntry[], PackBook>();
const bookOf = (rows: readonly PackEntry[]): PackBook => {
  let b = books.get(rows);
  if (!b) books.set(rows, (b = packFold(rows)));
  return b;
};

class Packing {
  #last = 0;

  /** Who I am (the guest's phone: G); null until the week's view is in (nothing is mine to change before). */
  get me(): Who | null {
    return week.view?.viewer ?? null;
  }

  get #book(): PackBook {
    return bookOf(week.model?.state.pack ?? []);
  }

  list(trip: string, seed: PackSeed | null | undefined): PackCat[] {
    return packList(trip, seed, this.#book);
  }

  /** The trip note's values by key (`{p:key}` tokens in the guide), or null: none yet. */
  note(trip: string): Record<string, string> | null {
    return tripNoteOf(trip, this.#book);
  }

  #may(x: PackItem | PackCat): boolean {
    const me = this.me;
    return !!me && packMayEdit(me, x);
  }

  /** A change's time: the relay's clock, never twice the same, after the op it replaces. */
  #now(after = 0): number {
    this.#last = Math.max(Math.round(world.now()), this.#last + 1, after + 1);
    return this.#last;
  }
  #heldAt(trip: string, id: string): number {
    return this.#book.item(trip, id)?.op.at ?? 0;
  }
  #find(trip: string, seed: PackSeed | null | undefined, id: string): { cat: PackCat; item: PackItem | null; list: PackCat[] } | null {
    const list = this.list(trip, seed);
    for (const cat of list) {
      if (cat.id === id) return { cat, item: null, list };
      const item = cat.items.find((i) => i.id === id);
      if (item) return { cat, item, list };
    }
    return null;
  }
  /** A set op's data for a listed category or item with its changes (its whole state, as the record keeps it). */
  #setOf(trip: string, x: PackCat | PackItem, ch: { name?: L; ord?: number; cat?: string }): Record<string, unknown> {
    const isCat = 'items' in x;
    const data: Record<string, unknown> = {
      trip, id: x.id, at: this.#now(this.#heldAt(trip, x.id)), kind: isCat ? 'cat' : 'item', ord: ch.ord ?? x.ord, name: ch.name ?? x.name
    };
    if (isCat) data.icon = x.icon || 'shopping-bag';
    else {
      data.cat = ch.cat ?? x.cat;
      if (x.note) data.note = x.note;
    }
    if (x.by) data.by = x.by;
    return data;
  }

  /** Add an item at the end of a category: its id, or null (nothing to add, or the phone can't send). */
  addItem(trip: string, seed: PackSeed | null | undefined, cat: string, text: string, locale: Locale): string | null {
    const c = this.list(trip, seed).find((x) => x.id === cat);
    const name = cleanLine(text, PACK_NAME), me = this.me;
    if (!c || !name || !me) return null;
    const at = this.#now(), id = newPackId(at);
    const ok = week.send('pack', { trip, id, at, kind: 'item', cat, ord: ordBetween(c.items.at(-1)?.ord, undefined), name: { [locale]: name }, by: me }).ok;
    return ok ? id : null;
  }

  /** Add a category at the end: its id, or null. */
  addCat(trip: string, seed: PackSeed | null | undefined, text: string, locale: Locale): string | null {
    const name = cleanLine(text, PACK_NAME), me = this.me;
    if (!name || !me) return null;
    const at = this.#now(), id = newPackId(at);
    const ok = week.send('pack', { trip, id, at, kind: 'cat', ord: ordBetween(this.list(trip, seed).at(-1)?.ord, undefined), name: { [locale]: name }, icon: 'shopping-bag', by: me }).ok;
    return ok ? id : null;
  }

  /** Rename a category or an item (in my language: the other side of its name goes, it would say the old one). */
  rename(trip: string, seed: PackSeed | null | undefined, id: string, text: string, locale: Locale): boolean {
    const f = this.#find(trip, seed, id);
    const x = f?.item ?? f?.cat;
    const name = cleanLine(text, PACK_NAME);
    if (!x || !name || !this.#may(x)) return false;
    if (x.name[locale] === name) return true;
    return week.send('pack', this.#setOf(trip, x, { name: { [locale]: name } })).ok;
  }

  /** Move a category to `index` among the categories, or an item to `index` among its category's items (another
   *  category's with `cat`), by a fractional `ord` between its new neighbours; no room left between them, the siblings
   *  are renumbered 0, 1, 2 … with it (all of them mine to change, else the move is refused). */
  move(trip: string, seed: PackSeed | null | undefined, id: string, index: number, cat?: string): boolean {
    const f = this.#find(trip, seed, id);
    if (!f) return false;
    const x = f.item ?? f.cat;
    if (!this.#may(x)) return false;
    const to = f.item ? (cat ? f.list.find((c) => c.id === cat) : f.cat) : null;
    if (f.item && !to) return false;
    const sibs: (PackCat | PackItem)[] = (to ? to.items : f.list).filter((s) => s.id !== id);
    const i = Math.max(0, Math.min(index, sibs.length));
    const ord = ordBetween(sibs[i - 1]?.ord, sibs[i]?.ord);
    const move = to ? { cat: to.id } : {};
    if (ord !== null) {
      if (ord === x.ord && (!to || to.id === f.cat.id)) return true;
      return week.send('pack', this.#setOf(trip, x, { ord, ...move })).ok;
    }
    if (!sibs.every((s) => this.#may(s))) return false;
    sibs.splice(i, 0, x);
    week.sendMany('pack', sibs.flatMap((s, n) => (s === x ? [this.#setOf(trip, x, { ord: n, ...move })] : s.ord === n ? [] : [this.#setOf(trip, s, { ord: n })])));
    return true;
  }

  /** Remove a category (its items with it) or an item, final; gone from the list at once but sent only after `holdMs`
   *  (the 🗑's とりけす: the result's `undo` takes it back meanwhile, as store/look.ts deleteLook). */
  removeHeld(trip: string, seed: PackSeed | null | undefined, id: string, holdMs: number): SendResult {
    const f = this.#find(trip, seed, id);
    if (!f || !this.#may(f.item ?? f.cat)) return { ok: false };
    return week.send('pack', { trip, id, at: this.#now(this.#heldAt(trip, id)), rm: true }, holdMs > 0 ? { holdMs } : {});
  }

  /** Tick (or untick) an item: mine only. */
  tick(trip: string, id: string, on: boolean): boolean {
    const me = this.me;
    if (!me) return false;
    // after my last tick of it and my reset (a tick no later than the reset would be off)
    const b = this.#book, held = b.rows.get(`pack_chk|${trip}|${id}|${me}`), reset = b.rows.get(`pack_reset|${trip}|${me}`);
    return week.send('pack_chk', { trip, id, at: this.#now(Math.max(held?.op.at ?? 0, reset?.op.at ?? 0)), v: on ? 1 : 0 }).ok;
  }

  /** Untick all of mine (the others' ticks stay), held `holdMs` for its とりけす as removeHeld. */
  resetHeld(trip: string, holdMs: number): SendResult {
    const me = this.me;
    if (!me) return { ok: false };
    const held = this.#book.rows.get(`pack_reset|${trip}|${me}`);
    return week.send('pack_reset', { trip, at: this.#now(held?.op.at ?? 0) }, holdMs > 0 ? { holdMs } : {});
  }
}

/** The trips' packing lists: one per phone. */
export const packing = new Packing();
