// A trip's packing list on this phone (docs/travel.md "Packing list (relay)"): the trip's seed with the record's ops
// over it and this phone's queued ones (the model's `pack` rows folded by the record's rules: contract/pack.ts
// packBookOf, packList), each item's ticks (each person's own, after their own reset), and my changes (each one event,
// sent at once, its names cleaned as the record keeps them; the record's notice brings them to every open phone). The
// trip's private values (its `trip_note`) too. Nothing is mine to change until the week's view says who I am (`me`),
// and nothing at all on a trip that's over (when.ts readOnly: its final list, the same fold, read-only: nothing sent).
//   packing.frozen(trip)              the trip is over: read-only
//   packing.list(trip, seed)          categories (by ord), each with its items (by ord)
//   packing.addItem / addCat / rename / move              the ✎ edits (the guest: only what it added: packMayEdit)
//   packing.removeHeld(trip, seed, id, ms)                a removal held for its とりけす
//   packing.tick(trip, id, on) / resetHeld(trip, ms)      my own ticks
//   packing.note(trip)                the trip note's values by key (null: not on the record, or not loaded yet)
import {
  newPackId, ordBetween, PACK_NAME, packBookOf, packList, packMayEdit, tripNoteOf, type L, type PackBook, type PackCat,
  type PackEntry, type PackItem, type PackSeed
} from '#lib/contract/pack.ts';
import { cleanLine } from '#lib/contract/text.ts';
import type { Locale } from '#lib/i18n/index.ts';
import type { SendResult } from '#lib/store/backend.ts';
import { week } from '#lib/store/week.svelte.ts';
import { opClock, world } from '#lib/store/world.svelte.ts';
import type { Who } from '#lib/types.ts';
import { TRIP_META } from '#lib/travel/trips/meta.ts';
import { readOnly } from './when.ts';

const EMPTY: readonly PackEntry[] = [];

class Packing {
  #last = 0;

  /** Who I am (the guest's phone: G); null until the week's view is in (nothing is mine to change before). */
  get me(): Who | null {
    return week.view?.viewer ?? null;
  }

  get #book(): PackBook {
    return packBookOf(week.model?.state.pack ?? EMPTY);
  }

  /** The trip is over (on the relay's clock, or a `?date=` preview's): its list frozen as everyone left it. */
  frozen(trip: string): boolean {
    const m = TRIP_META.find((x) => x.id === trip);
    return !!m && readOnly(m, world.now());
  }

  list(trip: string, seed: PackSeed | null | undefined): PackCat[] {
    return packList(trip, seed, this.#book);
  }

  /** The trip note's values by key (`{p:key}` tokens in the guide), or null: none yet. */
  note(trip: string): Record<string, string> | null {
    return tripNoteOf(trip, this.#book);
  }

  /** Who may change the trip's list: me, once known, unless it's over. */
  #me(trip: string): Who | null {
    return this.frozen(trip) ? null : this.me;
  }
  #may(trip: string, x: PackItem | PackCat): boolean {
    const me = this.#me(trip);
    return !!me && packMayEdit(me, x);
  }

  /** A change's time: the relay's clock (never a `?date=` preview's), never twice the same, after the op it replaces. */
  #now(after = 0): number {
    this.#last = opClock(this.#last, after);
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
  #setOf(trip: string, x: PackCat | PackItem, ch: { name?: L; ord?: number }): Record<string, unknown> {
    const isCat = 'items' in x;
    const data: Record<string, unknown> = {
      trip, id: x.id, at: this.#now(this.#heldAt(trip, x.id)), kind: isCat ? 'cat' : 'item', ord: ch.ord ?? x.ord, name: ch.name ?? x.name
    };
    if (isCat) data.icon = x.icon || 'shopping-bag';
    else {
      data.cat = x.cat;
      if (x.note) data.note = x.note;
    }
    if (x.by) data.by = x.by;
    return data;
  }

  /** Add an item at the end of a category: its id, or null (nothing to add, or the phone can't send). */
  addItem(trip: string, seed: PackSeed | null | undefined, cat: string, text: string, locale: Locale): string | null {
    const c = this.list(trip, seed).find((x) => x.id === cat);
    const name = cleanLine(text, PACK_NAME), me = this.#me(trip);
    if (!c || !name || !me) return null;
    const at = this.#now(), id = newPackId(at);
    const ok = week.send('pack', { trip, id, at, kind: 'item', cat, ord: ordBetween(c.items.at(-1)?.ord, undefined), name: { [locale]: name }, by: me }).ok;
    return ok ? id : null;
  }

  /** Add a category at the end: its id, or null. */
  addCat(trip: string, seed: PackSeed | null | undefined, text: string, locale: Locale): string | null {
    const name = cleanLine(text, PACK_NAME), me = this.#me(trip);
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
    if (!x || !name || !this.#may(trip, x)) return false;
    if (x.name[locale] === name) return true;
    return week.send('pack', this.#setOf(trip, x, { name: { [locale]: name } })).ok;
  }

  /** Move a category to `index` among the categories, or an item to `index` among its category's items, by a
   *  fractional `ord` between its new neighbours; no room left between them, the siblings are renumbered 0, 1, 2 …
   *  with it (all of them mine to change, else the move is refused). */
  move(trip: string, seed: PackSeed | null | undefined, id: string, index: number): boolean {
    const f = this.#find(trip, seed, id);
    if (!f) return false;
    const x = f.item ?? f.cat;
    if (!this.#may(trip, x)) return false;
    const sibs: (PackCat | PackItem)[] = (f.item ? f.cat.items : f.list).filter((s) => s.id !== id);
    const i = Math.max(0, Math.min(index, sibs.length));
    const ord = ordBetween(sibs[i - 1]?.ord, sibs[i]?.ord);
    if (ord !== null) {
      if (ord === x.ord) return true;
      return week.send('pack', this.#setOf(trip, x, { ord })).ok;
    }
    if (!sibs.every((s) => this.#may(trip, s))) return false;
    sibs.splice(i, 0, x);
    week.sendMany('pack', sibs.flatMap((s, n) => (s.ord === n ? [] : [this.#setOf(trip, s, { ord: n })])));
    return true;
  }

  /** Remove a category (its items with it) or an item, final; gone from the list at once but sent only after `holdMs`
   *  (the 🗑's とりけす: the result's `undo` takes it back meanwhile, as store/look.ts deleteLook). */
  removeHeld(trip: string, seed: PackSeed | null | undefined, id: string, holdMs: number): SendResult {
    const f = this.#find(trip, seed, id);
    if (!f || !this.#may(trip, f.item ?? f.cat)) return { ok: false };
    return week.send('pack', { trip, id, at: this.#now(this.#heldAt(trip, id)), rm: true }, holdMs > 0 ? { holdMs } : {});
  }

  /** Tick (or untick) an item: mine only. */
  tick(trip: string, id: string, on: boolean): boolean {
    const me = this.#me(trip);
    if (!me) return false;
    // after my last tick of it and my reset (a tick no later than the reset would be off)
    const b = this.#book, held = b.rows.get(`pack_chk|${trip}|${id}|${me}`), reset = b.rows.get(`pack_reset|${trip}|${me}`);
    return week.send('pack_chk', { trip, id, at: this.#now(Math.max(held?.op.at ?? 0, reset?.op.at ?? 0)), v: on ? 1 : 0 }).ok;
  }

  /** Untick all of mine (the others' ticks stay), held `holdMs` for its とりけす as removeHeld. */
  resetHeld(trip: string, holdMs: number): SendResult {
    const me = this.#me(trip);
    if (!me) return { ok: false };
    // after my last reset and every tick of mine it clears (one stamped ahead of this clock, by another phone of mine
    // or the demo's preview day, would outlive a reset stamped on it)
    let after = 0;
    for (const r of this.#book.rows.values())
      if ((r.type === 'pack_reset' || r.type === 'pack_chk') && r.who === me && r.op.trip === trip) after = Math.max(after, r.op.at);
    return week.send('pack_reset', { trip, at: this.#now(after) }, holdMs > 0 ? { holdMs } : {});
  }
}

/** The trips' packing lists: one per phone. */
export const packing = new Packing();
