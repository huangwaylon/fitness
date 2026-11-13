<script lang="ts">
  // いつもの (a level over the day, for one meal of mine; docs/design.md "Gohan"): the weekdays it comes on (毎日 · 平日 ·
  // 週末, or each day on its own), then what it holds (each food, its amount and kcal; the sum). New: 「いつものに する」
  // (from the shown day, its items). A repeat: 「この日の内容を いつものに する」 (the shown day's items from tomorrow;
  // only when that day's foods or amounts differ: sameItems), 「いつものを やめる」 (tapped twice: the board's
  // ほんとうに？), 「曜日を ほぞん」. One name for it everywhere: いつもの (the title, the chip, the marks, the verbs).
  import { untrack } from 'svelte';
  import type { FoodSnap, Meal } from '#lib/contract/food.ts';
  import { formatNum, t } from '#lib/i18n/index.ts';
  import { DAYS, daysText } from './foodUi.ts';
  import { amountText } from './portions.ts';
  import { entryKcal, itemsKcal } from '#lib/food/index.ts';

  interface Props {
    meal: Meal;
    /** What it holds: the repeat's items, or (new) the meal's entries that day. */
    items: readonly { g: number; f: FoodSnap }[];
    /** The weekday mask to start from (bit 0 Monday). */
    w0: number;
    /** A repeat (manage), not a new one. */
    live: boolean;
    /** 「この日の内容を いつものに する」 is offered: the shown day's meal isn't the repeat's. */
    fromDay?: boolean;
    onstart?: (w: number) => void;
    onsavedays?: (w: number) => void;
    onfromday?: () => void;
    onstop?: () => void;
  }
  let { meal, items, w0, live, fromDay = false, onstart, onsavedays, onfromday, onstop }: Props = $props();

  let w = $state(untrack(() => w0));
  let stopping = $state(false);
  const kcal = entryKcal;
  const total = $derived(itemsKcal(items));
  const presets = Object.entries(DAYS) as [keyof typeof DAYS, number][];

  /** A day on or off; the last one stays on (a repeat comes on some day). */
  function toggle(i: number) {
    const next = w ^ (1 << i);
    if (next) w = next;
  }
  function stop() {
    if (!stopping) return void (stopping = true);
    onstop?.();
  }
</script>

<div class="rep-lv" data-food-repeat={meal}>
  <section class="card form">
    <h4>{t('food.rep.days')}</h4>
    <div class="chips" role="group" aria-label={t('food.rep.days')}>
      {#each presets as [k, v] (k)}
        <button type="button" class="chip big" aria-pressed={w === v} data-sfx={w === v ? 'none' : 'tick'} data-days={k} onclick={() => (w = v)}>{t(`food.rep.${k}`)}</button>
      {/each}
    </div>
    <div class="week" role="group" aria-label={daysText(w)}>
      {#each Array.from({ length: 7 }, (_, i) => i) as i (i)}
        {@const on = (w & (1 << i)) !== 0}
        <button type="button" class="sb" aria-pressed={on} aria-disabled={on && w === 1 << i} data-sfx={on ? 'toggle-off' : 'toggle-on'} data-day={i} onclick={() => toggle(i)}>{t(`food.rep.d${i}`)}</button>
      {/each}
    </div>
  </section>

  <section class="card form">
    <header class="ih"><h4>{t('food.rep.items')}</h4><b class="money">{t('kiroku.kcal', { n: formatNum(total) })}</b></header>
    <ul>
      {#each items as it, i (i)}
        <li class="row"><span class="nm">{it.f.n}</span><small class="amt">{amountText(it)}</small><b class="kc money">{formatNum(kcal(it))}</b></li>
      {/each}
    </ul>
  </section>
  {#if live && fromDay}
    <!-- under what it holds: what this day had instead, from tomorrow -->
    <button type="button" class="btn paper small wide" data-sfx="confirm" data-rep-fromday onclick={() => onfromday?.()}>{t('food.rep.fromDay')}</button>
  {/if}
  <p class="note">{t('food.rep.hint')}</p>

  <div class="acts level-acts">
    {#if live}
      <!-- FoodAmount's order: the one that takes away first, the primary last -->
      <button type="button" class="btn paper small" data-sfx={stopping ? 'undo' : 'tick'} data-rep-stop onclick={stop}>{t(stopping ? 'food.rep.stopSure' : 'food.rep.stop')}</button>
      <button type="button" class="btn small" data-sfx="confirm" data-rep-save aria-disabled={w === w0} onclick={() => onsavedays?.(w)}>{t('food.rep.saveDays')}</button>
    {:else}
      <button type="button" class="btn small" data-sfx="confirm" data-rep-start onclick={() => onstart?.(w)}>{t('food.rep.start')}</button>
    {/if}
  </div>
</div>

<style>
  /* FoodAmount's level: one minmax(0, 1fr) column (never wider than the sheet), its cards, chips and segments */
  .rep-lv { display: grid; grid-template-columns: minmax(0, 1fr); gap: 12px; padding-bottom: 8px; }
  h4 { margin: 0; font-size: var(--fs-s); font-weight: 700; color: var(--text-soft); }
  /* 毎日 · 平日 · 週末: theme.css .chip.big */
  .sb {
    appearance: none; border: 0; cursor: pointer; min-height: var(--hit); border-radius: var(--r-pill);
    font: 700 var(--fs-body)/1 var(--font-ui); color: var(--text); background: var(--ctl); box-shadow: var(--sh-ctl);
  }
  .sb[aria-pressed='true'] { background: var(--ctl-sel); color: var(--c-ink); box-shadow: inset 0 0 0 2px var(--c-edge), 0 var(--lip-h) 0 var(--c-edge); }
  .sb:active { transform: translateY(2px); box-shadow: var(--sh-ctl-press); }
  .week { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 4px; }
  .sb { padding: 0; font-size: var(--fs-s); white-space: nowrap; }
  .ih { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; }
  .ih b { font-size: var(--fs-body); }
  ul { list-style: none; margin: 0; padding: 0; }
  li + li { border-top: 1.5px dashed var(--stitch); }
  /* FoodMeal's rows, not tappable */
  .row {
    display: grid; grid-template-columns: minmax(0, 1fr) auto; grid-template-areas: 'nm kc' 'amt kc'; align-items: center;
    column-gap: 10px; padding: 6px 2px;
  }
  .nm { grid-area: nm; font-weight: 700; font-size: var(--fs-body); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .amt { grid-area: amt; font-size: var(--fs-s); font-weight: 700; color: var(--text-soft); }
  .kc { grid-area: kc; font-size: var(--fs-body); }
  .note { margin: 0 2px; font-size: var(--fs-s); font-weight: 700; color: var(--text-soft); line-height: var(--lh); }
  .wide { width: 100%; margin: 0; }
</style>
