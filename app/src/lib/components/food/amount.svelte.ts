// ごはん's amount, its state (docs/design.md "Gohan" Amount): the food's states (じょうたい), the portion picked (by its
// label), ×n, typed grams, and what that holds. One picker for the amount level (FoodAmount) and a search row opened in
// place (FoodOpen); FoodPortion draws its controls. Made in a component's setup (its effects are the component's).
import { untrack } from 'svelte';
import { FOOD_GRAMS, round1 } from '#lib/contract/food.ts';
import { nutrientsFor, portionsOf, unitOf, variantsOf, type FoodDb, type Item } from '#lib/food/index.ts';
import { t } from '#lib/i18n/index.ts';
import { inState, stateGroups } from './foodUi.ts';
import { gramsText, MULT, nextMult, portionLabel, startOf, stepOf } from './portions.ts';
import { parseAmount } from './drafts.ts';
import { foodDb, foodDbNow } from './dbHold.ts';

interface AmountProps {
  item: Item;
  /** The grams and portion label to start from (an entry's, a recent one's); else the default portion. */
  g0?: number;
  u0?: string;
  /** A serving with no known weight (FoodSnap `sv`): half servings and up, no grams. */
  serving?: boolean;
  /** Another state of the food picked (じょうたい): log that one instead (none: no states offered). */
  onitem?: (it: Item) => void;
}

export class AmountPick {
  #p: () => AmountProps;
  readonly ps = $derived.by(() => {
    const { item, serving } = this.#p();
    return serving && !item.sv ? (item.portions?.length ? item.portions : [{ label: t('food.my.one'), g: 100 }]) : portionsOf(item);
  });
  /** g or ml: a drink's portions are in ml (100 ml counts as 100 g). */
  readonly unit = $derived(this.ps.some((p) => unitOf(p.label) === 'ml') ? 'ml' : 'g');
  /** The portion picked, by its label (an index would point elsewhere once the catalog's portions are in). */
  pl = $state('');
  mult = $state(1);
  custom = $state(false);
  typed = $state('');
  /** Anything changed by hand (then a swapped item keeps the pick). */
  #touched = false;
  /** The catalog (the food's states); in already, mostly. */
  db = $state.raw<FoodDb | null>(foodDbNow());

  constructor(p: () => AmountProps) {
    this.#p = p;
    // (the picker is keyed: a new food or entry makes a new one, so the start is read once)
    const s0 = untrack(() => {
      const { g0, u0 } = p();
      return { ...startOf(this.ps, g0, u0), typed: g0 === undefined ? '' : gramsText(g0), ps: this.ps };
    });
    this.pl = s0.ps[s0.pi].label;
    this.mult = s0.mult;
    this.custom = s0.custom;
    this.typed = s0.custom ? s0.typed : '';
    let seen = s0.ps;
    // the item swapped while open (an entry's catalog portions arriving): untouched, start again from the same grams
    $effect.pre(() => {
      const now = this.ps;
      if (now === seen) return;
      seen = now;
      if (this.#touched) return;
      const { g0, u0 } = untrack(p);
      const s = startOf(now, g0, u0);
      this.pl = now[s.pi].label;
      this.mult = s.mult;
      this.custom = s.custom;
      this.typed = s.custom ? s0.typed : '';
    });
    $effect(() => {
      let live = true;
      if (!this.db) foodDb().then((d) => live && (this.db = d), () => {});
      return () => void (live = false);
    });
  }

  get item(): Item {
    return this.#p().item;
  }
  get serving(): boolean {
    return !!this.#p().serving;
  }
  readonly pi = $derived(Math.max(0, this.ps.findIndex((p) => p.label === this.pl)));
  /** Typed grams as the editors read them (parseAmount: 「1,200」 is 1,200 g, 「150g」 150; out of range or not a number: 0). */
  readonly g = $derived(this.custom ? (parseAmount(this.typed, FOOD_GRAMS.min, FOOD_GRAMS.max) ?? 0) : round1(this.ps[this.pi].g * this.mult));
  readonly ok = $derived(this.g >= FOOD_GRAMS.min && this.g <= FOOD_GRAMS.max);
  readonly n = $derived(nutrientsFor(this.item, this.ok ? this.g : 0));
  /** The label the entry keeps (none for typed grams or 100 g). */
  readonly u = $derived(this.custom ? null : portionLabel(this.ps[this.pi], this.mult));
  /** −/＋ can't go further (×0.5, ×20; typed grams step on). */
  readonly atFloor = $derived(!this.custom && this.mult <= MULT.min);
  readonly atCap = $derived(!this.custom && this.mult >= MULT.max);
  /** The food's states (a catalog food's, a chain menu's too: by the serving), none for a custom food or a snapshot. */
  readonly states = $derived.by(() => {
    const { item, serving, onitem } = this.#p();
    return (serving && !item.sv) || !onitem ? [] : variantsOf(this.db, item);
  });
  /** A chain menu's states as サイズ and ミルク chips (stateGroups); null: one 状態 group. */
  readonly groups = $derived(this.item.shop && this.states.length ? stateGroups(this.states, this.item) : null);
  /** The line under the state chips, for the state picked: why that one (none for the rest). */
  readonly why = $derived.by(() => {
    const states = this.states;
    const item = this.#p().item;
    if (!states.length) return null;
    const has = (s: string) => states.some((x) => x.st === s);
    // a pack's weight is raw meat's or fish's (a vegetable's is weighed as it comes)
    if (item.st === '生' && (item.cat === '肉' || item.cat === '魚介') && states.some((x) => x.st !== '生' && x.st !== '乾')) return t('food.st.rawWhy');
    if (item.st === '乾' && has('ゆで')) return t('food.st.dryWhy');
    return null;
  });

  portion(i: number) {
    this.#touched = true;
    this.pl = this.ps[i].label;
    this.mult = 1;
    this.custom = false;
  }
  step(d: -1 | 1) {
    this.#touched = true;
    if (this.custom) {
      this.typed = gramsText(Math.max(0, Math.min(FOOD_GRAMS.max, Math.round(this.g + d * 10))));
      return;
    }
    // (a chain menu's serving is counted, 1食 by 1食 past ×2; a custom food's or a recipe's by halves)
    const chain = this.item.sv || this.item.id.startsWith('kal:');
    this.mult = nextMult(this.mult, d, this.serving ? (chain ? 'count' : 'half') : stepOf(this.ps[this.pi].label, this.item.name));
  }
  grams(v: string) {
    this.#touched = true;
    this.typed = v;
    this.custom = true;
  }
  /** What picking state `v` keeps: the portion of the same label at its own grams, typed grams as typed, else its
   *  default; and its grams. */
  keepIn(v: Item): { label: string; mult: number; custom: boolean; g: number } {
    const vp = portionsOf(inState(this.db, v));
    const same = !this.custom ? vp.find((p) => p.label === this.pl) : undefined;
    if (same) return { label: same.label, mult: this.mult, custom: false, g: round1(same.g * this.mult) };
    if (this.custom) return { label: vp[0].label, mult: 1, custom: true, g: this.g };
    return { label: vp[0].label, mult: 1, custom: false, g: vp[0].g };
  }
  pickState(v: Item) {
    if (v.id === this.item.id) return;
    const k = this.keepIn(v);
    this.#touched = true;
    this.pl = k.label;
    this.mult = k.mult;
    if (!k.custom) this.custom = false;
    this.#p().onitem?.(inState(this.db, v));
  }
}
