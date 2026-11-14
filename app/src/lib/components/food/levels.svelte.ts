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
/** A search's own state, kept on its level (the search unmounts under a level over it; ‹ brings it back as left): the
 *  query, the row open in place (its key; once くわしく was tapped, the food and amount it had), the rows as listed (`ids`:
 *  a dataset come in meanwhile never moves them) and every row drawn. A
 *  food logged from it starts it afresh (newKept). */
export type Kept = { q: string; open: { key: string; id?: string; g?: number; u?: string | null } | null; all: boolean; ids?: string[] };
export const newKept = (): Kept => ({ q: '', open: null, all: false });
/** The recipe and custom food levels: whose, from what opened them (deleted meanwhile, it stays theirs: read-only). */
export type Level =
  | { k: 'search'; meal: Meal; added: string[]; s: Kept }
  | ({ k: 'amount'; meal: Meal; g0?: number; u0?: string; entry?: FoodEntry } & Picked)
  | { k: 'custom'; id: string | null; then: Then; who?: Who }
  | { k: 'quick'; meal: Meal }
  | { k: 'repeat'; meal: Meal }
  | { k: 'recipe'; id: string | null; who?: Who }
  | { k: 'rsearch'; from: number; s: Kept }
  | ({ k: 'ritem'; g0?: number; u0?: string; i?: number } & Picked)
  | { k: 'rlog'; r: Recipe; meal: Meal };
export type LevelOf<K extends Level['k']> = Extract<Level, { k: K }>;

export class Levels {
  stack = $state<Level[]>([]);
  readonly top = $derived(this.stack.at(-1) ?? null);
  /** Under each level: where the one below was scrolled, what opened it (`[data-add="b"]`) and how far down the
   *  scroller's view that was (`y`), restored on ‹. */
  #under: { top: number; focus: string | null; y: number | null }[] = [];
  readonly #o: { scroller: () => Element | null; root: () => HTMLElement | undefined; leave: () => void };

  /** `scroller`: the sheet's; `leave`: a level left by hand (its banner goes with it). */
  constructor(o: { scroller: () => Element | null; root: () => HTMLElement | undefined; leave: () => void }) {
    this.#o = o;
  }

  /** Push a level; `focus`: what opened it (a selector, found again once the level below is back: Safari never
   *  focuses a tapped button, so it is named, not read off document.activeElement). */
  go(l: Level, focus: string | null = null): void {
    this.#o.leave();
    const sc = this.#o.scroller(), el = focus ? this.#o.root()?.querySelector(focus) : null;
    const y = sc && el ? el.getBoundingClientRect().top - sc.getBoundingClientRect().top : null;
    this.#under = [...this.#under.slice(0, this.stack.length), { top: sc?.scrollTop ?? 0, focus, y }];
    this.stack = [...this.stack, l];
    void tick().then(() => this.#o.scroller()?.scrollTo({ top: 0 }));
  }
  /** Back to the level `n` deep (0: the day), the focus on what opened the one left and that where it was on the screen,
   *  though what's over it changed meanwhile (a search's chain menus come in: their shop chips over the rows); else
   *  where it was scrolled (`refocus` false: the caller's own focus, e.g. a search's field for the next food). */
  backTo(n: number, refocus = true): void {
    const was = this.#under[n];
    this.stack = this.stack.slice(0, n);
    this.#under = this.#under.slice(0, n);
    if (!was) return;
    void tick().then(() => {
      const sc = this.#o.scroller(), el = refocus && was.focus ? this.#o.root()?.querySelector<HTMLElement>(was.focus) : null;
      const at = sc && el && was.y !== null ? el.getBoundingClientRect().top - sc.getBoundingClientRect().top + sc.scrollTop - was.y : null;
      sc?.scrollTo({ top: at ?? was.top });
      el?.focus({ preventScroll: true });
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
