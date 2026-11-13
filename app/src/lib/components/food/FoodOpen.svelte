<script lang="ts">
  // ごはん: a food row of a meal's search opened in place (docs/design.md "Gohan" Search), under the row. First what the
  // food is, from the data only, each line only when it has one: its 「これは…」 line (`desc`, two lines at most; the
  // everyday name is the row's own), then one soft line for how its values were got (a chain menu's trust: 公式の値 /
  // 推定の値（AI）…, else the data's `note`: 廃棄率, 一般的な推定値…; two lines at most, whole on くわしく). Then the amount's
  // controls (FoodPortion over amount.svelte.ts's picker: the same 状態 swap, portions, −/＋ and grams), what that amount
  // holds (P · F · C · 塩分 as the amount level's head, 食物繊維 a fifth when known and above 0; its kcal on the row,
  // `kcal`), and the foot: くわしく › (the amount level at what is set: its picture, the 100 g values, another meal) and
  // 追加 with the kcal (logged in the search's meal), one 44 px row. Its height and fade come in over 150 ms (FoodSearch
  // closes it the same way); `still`: come back to from くわしく, already open.
  import type { Item } from '#lib/food/index.ts';
  import { itemById } from '#lib/food/index.ts';
  import { formatNum, t } from '#lib/i18n/index.ts';
  import FoodPortion from './FoodPortion.svelte';
  import { AmountPick } from './amount.svelte.ts';
  import { fibreAt, kaloriTrust } from './foodUi.ts';

  export type Set = { item: Item; g: number; u: string | null };
  interface Props {
    id: string;
    item: Item;
    g0?: number;
    u0?: string;
    /** A serving with no known weight: half servings and up, no grams. */
    serving?: boolean;
    /** Its states offered (a catalog food; not a custom food or a snapshot). */
    swap?: boolean;
    onadd: (v: Set) => void;
    onmore: (v: Set) => void;
    /** Closing: its height and fade play back, then `onclosed`. */
    closing?: boolean;
    onclosed?: () => void;
    /** Open at once, no height or fade (come back to). */
    still?: boolean;
    /** The kcal at what is set (the row shows it). */
    kcal?: number | null;
  }
  let { id, item, g0, u0, serving = false, swap = false, onadd, onmore, closing = false, onclosed, still = false, kcal = $bindable(null) }: Props = $props();

  /** The food as set: the row's (the catalog's once it's in), another state picked swaps it. */
  let it = $derived(item);
  const a = new AmountPick(() => ({ item: it, g0, u0, serving, onitem: swap ? (x: Item) => (it = x) : undefined }));
  const set = (): Set => ({ item: it, g: a.g, u: a.u });
  $effect(() => void (kcal = a.n.kcal));
  /** What the catalog says about it (a recent row's food is its snapshot: the catalog's item for its lines). */
  const info = $derived(itemById(a.db, it.id) ?? it);
  const how = $derived(kaloriTrust(info) ?? info.note ?? null);
  /** Fibre at this amount, when the food knows it and has some. */
  const fib = $derived(fibreAt(it, a.ok ? a.g : 0));
</script>

<div class="ex" class:shut={closing} class:still {id} role="group" aria-label={it.name} data-food-open={it.id} onanimationend={(e) => closing && e.target === e.currentTarget && onclosed?.()}>
  <div class="in card">
    {#if info.desc || how}
      <div class="ab">
        {#if info.desc}<p class="ds" data-food-open-desc>{info.desc}</p>{/if}
        {#if how}<p class="how" data-food-open-how>{how}</p>{/if}
      </div>
    {/if}
    <FoodPortion {a} />
    <dl class="nut" data-food-open-live>
      <div><dt>{t('food.p')}</dt><dd class="money">{a.n.p.toFixed(1)}<small>g</small></dd></div>
      <div><dt>{t('food.fa')}</dt><dd class="money">{a.n.fa.toFixed(1)}<small>g</small></dd></div>
      <div><dt>{t('food.c')}</dt><dd class="money">{a.n.c.toFixed(1)}<small>g</small></dd></div>
      <div><dt>{t('food.s')}</dt><dd class="money">{a.n.s.toFixed(1)}<small>g</small></dd></div>
      {#if fib !== null}<div data-food-open-fib><dt>{t('food.fi')}</dt><dd class="money">{fib.toFixed(1)}<small>g</small></dd></div>{/if}
    </dl>
    <div class="foot">
      <button type="button" class="btn paper small more" data-sfx="page" data-food-open-more aria-label={t('food.detailsOf', { name: it.name })} onclick={() => a.ok && onmore(set())}>{t('food.details')}<span aria-hidden="true">›</span></button>
      <button type="button" class="btn small add" data-sfx="confirm" data-food-open-add aria-disabled={!a.ok} onclick={() => a.ok && onadd(set())}>
        {t('food.addOk')}<small class="money" data-food-open-kcal>{formatNum(a.n.kcal)} kcal</small>
      </button>
    </div>
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
  .ex.still { animation: none; }
  @media (prefers-reduced-motion: reduce) { .ex, .ex.shut { animation: none; } }
  /* what it is: the 「これは…」 line, then how its values were got (soft), each two lines at most */
  .ab { display: grid; gap: 4px; padding-bottom: 10px; border-bottom: 1.5px dashed var(--stitch); }
  .ab p { margin: 0; font-size: var(--fs-s); font-weight: 700; line-height: 1.4; overflow: hidden; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; line-clamp: 2; }
  .ds { color: var(--text); }
  .how { color: var(--text-soft); }
  /* what the amount holds: label over value, as the amount level's head */
  .nut { display: grid; grid-auto-flow: column; grid-auto-columns: minmax(0, 1fr); gap: 6px; margin: 0; padding-top: 10px; border-top: 1.5px dashed var(--stitch); }
  .nut div { min-width: 0; }
  /* five (fibre too): each as wide as its label, spread (たんぱく質 whole on an iPhone 15) */
  .nut:has(> :nth-child(5)) { display: flex; justify-content: space-between; }
  .nut:has(> :nth-child(5)) div { min-width: auto; }
  .nut dt { font-size: var(--fs-s); font-weight: 700; color: var(--text-soft); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .nut dd { margin: 2px 0 0; font-size: var(--fs-body); }
  .nut small { margin-left: 2px; font-size: var(--fs-s); color: var(--text-soft); }
  /* the foot: くわしく › (paper) and 追加 (the wider), one 44 px row */
  .foot { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 2fr); gap: 8px; }
  .foot .btn { margin: 0 0 var(--lip-h); width: 100%; padding-inline: 10px; white-space: nowrap; }
  .more span { margin-left: 4px; }
  .add small { margin-left: 8px; font-size: var(--fs-s); opacity: .8; }
</style>
