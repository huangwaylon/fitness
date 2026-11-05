// The period paging both chart screens share (けんこう, ごはん's グラフ): the last day shown (null: today, following the
// clock), one period older or newer at a time (‹ ›, a swipe), きょう back to today, which way the last turn went (the
// charts' slide) and the one open callout (a card's bucket). A new period, person or group closes the callout.
import { canShift, rangeFor, shiftAnchor, type Period, type Range } from '#lib/model/health.ts';
import type { LocalDate } from '#lib/types.ts';
import { cue } from '#lib/sound/cues.ts';

export class RangePager {
  /** The last day shown (null: today). */
  anchor = $state<LocalDate | null>(null);
  slide = $state<-1 | 0 | 1>(0);
  /** The open callout: whose card (its id) and which bucket. */
  sel = $state<{ k: string; i: number } | null>(null);
  #src: () => { period: Period; today: LocalDate; first: LocalDate };

  /** `src`: the period, today and the first day with a record (‹ goes back while there's an older one). */
  constructor(src: () => { period: Period; today: LocalDate; first: LocalDate }) {
    this.#src = src;
  }

  readonly range: Range | null = $derived.by(() => {
    const { period, today } = this.#src();
    return today ? rangeFor(period, this.anchor ?? today) : null;
  });
  readonly can = $derived.by(() => {
    const { today, first } = this.#src();
    return this.range ? canShift(this.range, first, today) : { back: false, on: false };
  });

  /** ‹ / ›, a swipe: one whole period older (−1) or newer (+1). */
  go(dir: -1 | 1, swiped = false): void {
    const { period, today } = this.#src();
    if (!this.range || !(dir < 0 ? this.can.back : this.can.on)) return;
    const next = shiftAnchor(period, this.anchor ?? today, dir, today);
    this.anchor = next >= today ? null : next;
    this.slide = dir < 0 ? -1 : 1;
    this.sel = null;
    if (swiped) cue('tick');
  }
  readonly swipe = (dir: -1 | 1): void => this.go(dir, true);
  jumpToday(): void {
    if (this.anchor === null) return;
    this.anchor = null;
    this.slide = 1;
    this.sel = null;
  }
  /** Another period (or group, or person): no slide, no callout. */
  reset(): void {
    this.slide = 0;
    this.sel = null;
  }
  /** A card's bucket picked (null: closed). */
  pick(k: string, i: number | null): void {
    this.sel = i === null ? null : { k, i };
    if (i !== null) cue('tick');
  }
  /** The open bucket of card `k`, or null. */
  selected(k: string): number | null {
    return this.sel?.k === k ? this.sel.i : null;
  }
}
