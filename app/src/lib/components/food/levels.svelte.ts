// ごはん's level stack (Food.svelte): what each level is, and the push / back that keeps where the one under it was
// scrolled and what opened it (HealthSheet's title bar: its ‹; back where it was scrolled, the focus on what opened it).
import { tick } from 'svelte';
import type { FoodEntry, FoodSnap, Meal } from '#lib/contract/food.ts';
import type { Who } from '#lib/types.ts';
import type { Item } from '#lib/food/index.ts';
import type { Recipe } from '#lib/model/food.ts';

/** A food picked: a custom food still there logs afresh (`cid`); a serving with no weight (`sv`) by the serving; an
 *  `sv` snapshot whose food is gone (or a recipe's) logs from that snapshot (`snap`). */
export type Picked = { item: Item; cid?: string; sv?: boolean; snap?: FoodSnap };
/** Where the custom food editor goes on to once saved: a meal's amount, a recipe's ingredient, or back (to the search). */
export type Then = { meal: Meal } | { ingredient: true } | null;
/** The recipe and custom food levels: whose, from what opened them (deleted meanwhile, it stays theirs: read-only). */
export type Level =
  | { k: 'search'; meal: Meal; added: string[] }
  | ({ k: 'amount'; meal: Meal; g0?: number; u0?: string; entry?: FoodEntry } & Picked)
  | { k: 'custom'; id: string | null; then: Then; who?: Who }
  | { k: 'quick'; meal: Meal }
  | { k: 'repeat'; meal: Meal }
  | { k: 'recipe'; id: string | null; who?: Who }
  | { k: 'rsearch'; from: number }
  | ({ k: 'ritem'; g0?: number; u0?: string; i?: number } & Picked)
  | { k: 'rlog'; r: Recipe; meal: Meal };
export type LevelOf<K extends Level['k']> = Extract<Level, { k: K }>;

export class Levels {
  stack = $state<Level[]>([]);
  readonly top = $derived(this.stack.at(-1) ?? null);
  /** Under each level: where the one below was scrolled and what opened it (`[data-add="b"]`), restored on ‹. */
  #under: { top: number; focus: string | null }[] = [];
  readonly #o: { scroller: () => Element | null; root: () => HTMLElement | undefined; leave: () => void };

  /** `scroller`: the sheet's; `leave`: a level left by hand (its banner goes with it). */
  constructor(o: { scroller: () => Element | null; root: () => HTMLElement | undefined; leave: () => void }) {
    this.#o = o;
  }

  /** Push a level; `focus`: what opened it (a selector, found again once the level below is back: Safari never
   *  focuses a tapped button, so it is named, not read off document.activeElement). */
  go(l: Level, focus: string | null = null): void {
    this.#o.leave();
    this.#under = [...this.#under.slice(0, this.stack.length), { top: this.#o.scroller()?.scrollTop ?? 0, focus }];
    this.stack = [...this.stack, l];
    void tick().then(() => this.#o.scroller()?.scrollTo({ top: 0 }));
  }
  /** Back to the level `n` deep (0: the day), where it was scrolled, the focus on what opened the one left. */
  backTo(n: number): void {
    const was = this.#under[n];
    this.stack = this.stack.slice(0, n);
    this.#under = this.#under.slice(0, n);
    if (!was) return;
    void tick().then(() => {
      this.#o.scroller()?.scrollTo({ top: was.top });
      if (was.focus) this.#o.root()?.querySelector<HTMLElement>(was.focus)?.focus({ preventScroll: true });
    });
  }
  /** Swap the level on top for another (the editor for the amount it goes on to, a copy's editor). */
  swap(l: Level): void {
    this.stack = [...this.stack.slice(0, -1), l];
    void tick().then(() => this.#o.scroller()?.scrollTo({ top: 0 }));
  }
  /** Back to just over the first level of kind `k` (none: the day). */
  backOver(k: Level['k']): void {
    this.backTo(this.stack.findIndex((l) => l.k === k) + 1);
  }
  find<K extends Level['k']>(k: K): LevelOf<K> | undefined {
    return this.stack.find((l): l is LevelOf<K> => l.k === k);
  }
  has(k: Level['k']): boolean {
    return this.stack.some((l) => l.k === k);
  }
  reset(): void {
    this.stack = [];
    this.#under = [];
  }
}
