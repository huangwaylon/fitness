// A review list's state (frame/ReviewList.svelte): 「まちがえた だけ」 and the rows open. With misses it opens on them,
// the first one open; read once, as the results open (the filter and the rows are mine after).
import { untrack } from 'svelte';

export class Review {
  missedOnly = $state(false);
  #open = $state<number[]>([]);

  /** `misses`: the rows' keys not right, in the list's order. */
  constructor(misses: () => readonly number[]) {
    const m = untrack(misses);
    this.missedOnly = m.length > 0;
    this.#open = m.slice(0, 1);
  }
  /** The rows the list shows: only the missed ones while 「まちがえた だけ」. */
  shown = <T extends { ok: boolean }>(rows: readonly T[]): readonly T[] => (this.missedOnly ? rows.filter((r) => !r.ok) : rows);
  isOpen = (i: number): boolean => this.#open.includes(i);
  toggle = (i: number): void => void (this.#open = this.#open.includes(i) ? this.#open.filter((x) => x !== i) : [...this.#open, i]);
}
