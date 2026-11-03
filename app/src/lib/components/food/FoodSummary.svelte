<script lang="ts">
  // ごはん's summary card for one person's day: the day's kcal large, against their daily goal when set (a bar in the
  // person's colour; beside it today あと N / N オーバー, a past day 目標より N 少なめ / 多め, coral only past 20 %
  // over: goalChip; ✎ on my own day), then protein (目標 N g 以上: 1.6 g × the latest weigh-in, members with a weight
  // only), fat, carbs and salt. MetricCard's layout and tokens, one row of four. A day with nothing logged: 「きろく
  // なし」 on a past one (not 0 kcal, which reads as eaten nothing), 0 kcal today; no nutrient tiles either way.
  import type { Who } from '#lib/types.ts';
  import type { FoodDay } from '#lib/model/food.ts';
  import { formatNum, t } from '#lib/i18n/index.ts';
  import Glyph from '../kiroku/Glyph.svelte';
  import { goalChip } from './foodUi.ts';

  interface Props {
    day: FoodDay;
    who: Who;
    goal: number | null;
    protein: number | null;
    /** The day against today: a past day's chip says 少なめ / 多め, tomorrow's (a いつもの's preview) none. */
    when: 'past' | 'today' | 'next';
    /** ✎ the kcal goal (my own day only). */
    onedit?: (() => void) | null;
  }
  let { day, who, goal, protein, when, onedit = null }: Props = $props();

  const kcal = (n: number) => t('kiroku.kcal', { n: formatNum(n) });
  const share = $derived(goal ? Math.min(1, day.kcal / goal) : 0);
  const empty = $derived(day.entries.length === 0);
  const chip = $derived(goal === null || when === 'next' || (empty && when === 'past') ? null : goalChip(day.kcal, goal, when === 'today'));
  const gText = (n: number) => t('food.g', { n: n.toFixed(1) });
  const cells = $derived([
    { k: 'p', v: day.p, goal: protein },
    { k: 'fa', v: day.fa, goal: null },
    { k: 'c', v: day.c, goal: null },
    { k: 's', v: day.s, goal: null }
  ] as const);
</script>

<section class="card sum p{who}" data-food-summary aria-labelledby="fs-h">
  <header>
    <h3 id="fs-h">{t('food.kcalHead')}</h3>
    <span class="goal" data-kcal-goal>
      {#if goal !== null}{t('food.goalOf', { g: kcal(goal) })}{:else}{t('food.noGoal')}{/if}
    </span>
    {#if onedit}<button type="button" class="pen-btn" data-sfx="page" data-focus="kcal-goal" aria-label={t('food.goalEdit')} onclick={onedit}><Glyph kind="pen" size={18} /></button>{/if}
  </header>
  <div class="srow">
    {#if empty && when === 'past'}
      <b class="total none" data-food-total data-food-none>{t('food.noLog')}</b>
    {:else}
      <b class="total money" data-food-total>{kcal(day.kcal)}</b>
    {/if}
    {#if chip}<span class="chg" class:over={chip.over} data-food-chip>{chip.text}</span>{/if}
  </div>
  {#if goal !== null && !(empty && when === 'past')}
    <div class="bar" role="presentation"><i style:width="{share * 100}%"></i></div>
  {/if}
  {#if !empty}<dl class="cells">
    {#each cells as c (c.k)}
      <div class="cell" data-nutrient={c.k}>
        <dt>{t(`food.${c.k}`)}</dt>
        <dd class="money">{gText(c.v)}{#if c.goal !== null}<small>{t('food.pGoal', { g: c.goal })}</small>{/if}</dd>
        {#if c.goal}<div class="bar mini" role="presentation"><i style:width="{Math.min(1, c.v / c.goal) * 100}%"></i></div>{/if}
      </div>
    {/each}
  </dl>{/if}
</section>

<style>
  .sum { display: grid; gap: 8px; padding: 12px 14px; }
  .pA { --pc: var(--person-a); }
  .pB { --pc: var(--person-b); }
  .pG { --pc: var(--c-lilac); }
  header { display: flex; align-items: center; gap: 8px; min-height: var(--hit); }
  h3 { margin: 0; font-size: var(--fs-talk); font-weight: 700; }
  .goal { margin-left: auto; display: inline-flex; align-items: center; gap: 6px; font-size: var(--fs-s); font-weight: 700; color: var(--text-soft); font-variant-numeric: tabular-nums; white-space: nowrap; }
  header .pen-btn { margin-bottom: 0; }
  .srow { display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap; }
  .total { font-size: var(--fs-title); line-height: 1.15; white-space: nowrap; }
  .total.none { font-size: var(--fs-talk); color: var(--text-soft); }
  .chg {
    padding: 6px 10px; border-radius: var(--r-chip); white-space: nowrap; font: 700 var(--fs-s)/1 var(--font-ui);
    background: color-mix(in srgb, var(--lip) 35%, transparent);
  }
  .chg.over { background: color-mix(in srgb, var(--c-coral) 25%, transparent); }
  .bar { height: 10px; border-radius: 5px; overflow: hidden; background: color-mix(in srgb, var(--lip) 45%, transparent); }
  .bar i { display: block; height: 100%; border-radius: inherit; background: var(--pc); transition: width 240ms var(--ease-soft); }
  .bar.mini { height: 5px; margin-top: 4px; }
  .cells { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 6px; margin: 2px 0 0; }
  .cell { min-width: 0; padding: 8px 6px 6px; border-radius: var(--r-chip); background: color-mix(in srgb, var(--lip) 22%, transparent); }
  dt { font-size: var(--fs-xs); font-weight: 700; color: var(--text-soft); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  dd { margin: 4px 0 0; font-size: var(--fs-body); white-space: nowrap; }
  /* 「目標 110 g 以上」 wraps in a narrow tile rather than running past it */
  dd small { display: block; margin-top: 3px; font: 700 var(--fs-xs)/1.2 var(--font-ui); color: var(--text-soft); white-space: normal; }
</style>
