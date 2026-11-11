// A last-writer-wins book: the packing list's (contract/pack.ts PackBook) and the wedding board's (contract/wedding.ts
// WedBook). One row a slot, the slot's latest kept: a removal (`rm`) beats a set, else the later `at`, then G over B
// over A, so the record and every phone reach the same rows whatever order they come in. Each book's own rules decide
// whether a new row is kept (its `accept`); `apply` keeps what they take. Pure and dependency-free.
import type { Who } from '../types.ts';

/** A row as a book holds it: its type, sender and op (`rm`: a removal, final). */
type BookRow = { type: string; who: Who; op: { at: number; rm?: true } };
/** A row as the model holds it: the record's, or this phone's not yet sent (`queued`). */
export type Queued<R> = R & { queued?: true };

/** What the record does with a row: `append` (its slot's row replaced by `row`, the slots in `drop` deleted with it),
 *  `stale` (acknowledged, nothing kept) or one of the book's refusals `F`. */
export type Verdict<R, F extends string> = { v: 'append'; row: R; drop: string[] } | { v: 'stale' | F };

/** Whether row `a` beats `b` (the same slot): a removal beats a set; else the later `at`, then G over B over A. */
export const beats = (a: BookRow, b: BookRow): boolean =>
  !!a.op.rm !== !!b.op.rm ? !!a.op.rm : a.op.at !== b.op.at ? a.op.at > b.op.at : a.who > b.who;

export abstract class Book<R extends BookRow, F extends string> {
  readonly rows = new Map<string, R>();
  /** The rows each counter holds (countOf). */
  #n = new Map<string, number>();

  /** The slot a row fills. */
  protected abstract slotOf(r: R): string;
  /** The counter a row adds to (null: none). */
  protected abstract countOf(r: R): string | null;
  /** The record's rules for a new row. */
  abstract accept(r: R): Verdict<R, F>;

  /** The rows a counter holds. */
  protected count(k: string): number {
    return this.#n.get(k) ?? 0;
  }
  #bump(r: R, by: number): void {
    const k = this.countOf(r);
    if (k) this.#n.set(k, this.count(k) + by);
  }

  /** A row taken as it is (the record's own, read back), replacing its slot's. */
  put(r: R): void {
    const s = this.slotOf(r);
    const was = this.rows.get(s);
    if (was) this.#bump(was, -1);
    this.rows.set(s, r);
    this.#bump(r, 1);
  }
  /** A row the record kept: in its slot unless the one there beats it (true: taken). */
  merge(r: R): boolean {
    const held = this.rows.get(this.slotOf(r));
    if (held && !beats(r, held)) return false;
    this.put(r);
    return true;
  }
  delete(slot: string): void {
    const was = this.rows.get(slot);
    if (!was) return;
    this.#bump(was, -1);
    this.rows.delete(slot);
  }

  /** A row through the rules, kept if they take it: its verdict. */
  apply(r: R): Verdict<R, F> {
    const v = this.accept(r);
    if ('row' in v) {
      for (const s of v.drop) this.delete(s);
      this.put(v.row);
    }
    return v;
  }

  /**
   * The rows as the record keeps them, from the model's in the order they came: the record's own taken as they are
   * (each slot's latest: one that an older row beats is skipped), this phone's queued ones through the record's rules
   * (accept), so a phone shows what the record will. (The record's rows aren't judged again: it keeps a slot's latest
   * row only, so what its rules need, a packing item's creation, may be long gone from them.)
   */
  fold(rows: Iterable<Queued<R>>): this {
    for (const r of rows) {
      if (r.queued) this.apply(r);
      else this.merge(r);
    }
    return this;
  }
}

/** A fold of a model's list, once per list: a model's lists are replaced, never mutated (its identity is the key). */
export function foldOnce<E extends object, B>(fold: (rows: readonly E[]) => B): (rows: readonly E[]) => B {
  const folds = new WeakMap<readonly E[], B>();
  return (rows) => {
    let b = folds.get(rows);
    if (!b) folds.set(rows, (b = fold(rows)));
    return b;
  };
}
