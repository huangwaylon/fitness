<script lang="ts">
  // ごはん: a food row of a meal's search opened in place (docs/design.md "Gohan" Search), under the row: the amount's
  // controls (FoodPortion over amount.svelte.ts's picker: the same 状態 swap, portions, −/＋ and grams), one live line of
  // P · F · C, くわしく (the amount level at what is set: its picture, the 100 g values, another meal) and 追加 with the
  // kcal (logged in the search's meal). Its height and fade come in over 150 ms (FoodSearch closes it the same way).
  import { untrack } from 'svelte';
  import type { Item } from '#lib/food/index.ts';
  import { formatNum, t } from '#lib/i18n/index.ts';
  import FoodPortion from './FoodPortion.svelte';
  import { AmountPick } from './amount.svelte.ts';

  export type Set = { item: Item; g: number; u: string | null };
  interface Props {
    id: string;
    item: Item;
    g0?: number;
    u0?: string;
    /** A serving with no known weight: whole servings, no grams. */
    serving?: boolean;
    /** Its states offered (a catalog food; not a custom food or a snapshot). */
    swap?: boolean;
    onadd: (v: Set) => void;
    onmore: (v: Set) => void;
    /** Closing: its height and fade play back, then `onclosed`. */
    closing?: boolean;
    onclosed?: () => void;
  }
  let { id, item, g0, u0, serving = false, swap = false, onadd, onmore, closing = false, onclosed }: Props = $props();

  /** The food as set (another state picked swaps it). */
  let it = $state.raw(untrack(() => item));
  const a = new AmountPick(() => ({ item: it, g0, u0, serving, onitem: swap ? (x: Item) => (it = x) : undefined }));
  const set = (): Set => ({ item: it, g: a.g, u: a.u });
</script>

<div class="ex" class:shut={closing} {id} role="group" aria-label={it.name} data-food-open={it.id} onanimationend={(e) => closing && e.target === e.currentTarget && onclosed?.()}>
  <div class="in card">
    <FoodPortion {a} />
    <div class="line">
      <p class="nl money" data-food-open-live><span aria-hidden="true">P {a.n.p.toFixed(1)}<small>g</small> F {a.n.fa.toFixed(1)}<small>g</small> C {a.n.c.toFixed(1)}<small>g</small></span><span class="sr-only">{t('food.p')} {a.n.p.toFixed(1)}g, {t('food.fa')} {a.n.fa.toFixed(1)}g, {t('food.c')} {a.n.c.toFixed(1)}g</span></p>
      <button type="button" class="more" data-sfx="page" data-food-open-more onclick={() => a.ok && onmore(set())}>{t('food.details')}<span aria-hidden="true">›</span></button>
    </div>
    <button type="button" class="btn small add" data-sfx="confirm" data-food-open-add aria-disabled={!a.ok} onclick={() => a.ok && onadd(set())}>
      {t('food.addOk')}<small class="money" data-food-open-kcal>{formatNum(a.n.kcal)} kcal</small>
    </button>
  </div>
</div>

<style>
  /* the row's own continuation: a card under it, its height and fade over 150 ms (grid rows 0fr → 1fr: WebKit animates
     them; `closing` plays it back) */
  .ex { display: grid; grid-template-rows: 1fr; animation: ex 150ms ease-out; }
  .in { min-height: 0; overflow: hidden; display: grid; grid-template-columns: minmax(0, 1fr); gap: 10px; padding: 12px 14px 10px; }
  @keyframes ex { from { grid-template-rows: 0fr; opacity: 0; } to { grid-template-rows: 1fr; opacity: 1; } }
  .ex.shut { animation: shut 150ms ease-in forwards; }
  @keyframes shut { from { grid-template-rows: 1fr; opacity: 1; } to { grid-template-rows: 0fr; opacity: 0; } }
  @media (prefers-reduced-motion: reduce) { .ex, .ex.shut { animation: none; } }
  .line { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin: -4px 0 -6px; }
  .nl { margin: 0; font-size: var(--fs-body); word-spacing: 4px; min-width: 0; }
  .nl small { margin-left: 1px; font-size: var(--fs-s); color: var(--text-soft); }
  .more {
    appearance: none; border: 0; background: none; cursor: pointer; min-height: var(--hit); padding: 0 2px 0 8px; flex: none;
    display: inline-flex; align-items: center; gap: 4px; font: 700 var(--fs-s)/1 var(--font-ui); color: var(--text);
  }
  .more span { font-size: var(--fs-body); }
  .more:focus-visible { outline: 3px solid var(--focus); outline-offset: -2px; border-radius: var(--r-chip); }
  .add { margin: 0 0 var(--lip-h); width: 100%; }
  .add small { margin-left: 8px; font-size: var(--fs-s); opacity: .8; }
</style>
