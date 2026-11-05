<script lang="ts">
  // きろく's week (docs/design.md "Gohan"): the person's average day over the 7 finished days to the day shown
  // (model/food.ts foodWeek: yesterday back on today, a day with nothing logged left out, 記録 n日), so one day over or
  // under (a weekend) reads against the week: its kcal against the goal (within its band: 目標の はんい; else 目標より N
  // kcal 少なめ / 多め), protein, fat, carbs, salt and fibre a day, and the PFC balance (PfcBar). Read-only. None with
  // nothing logged in those days.
  import type { FoodWeek } from '#lib/model/food.ts';
  import type { FoodGoalOf } from '#lib/contract/food.ts';
  import { goalMet } from '#lib/contract/goals.ts';
  import { md } from '#lib/i18n/format.ts';
  import { t } from '#lib/i18n/index.ts';
  import { kcalText } from '../kiroku/fmt.ts';
  import { goalLabel } from '../health/goals.ts';
  import { goalChip } from './foodUi.ts';
  import PfcBar from './PfcBar.svelte';

  let { week, goals }: { week: FoodWeek; goals: Record<FoodGoalOf, number | null> } = $props();

  const kGoal = $derived(goals.k);
  const chip = $derived(kGoal === null ? null : goalMet('k', week.kcal, kGoal) ? { text: t('food.week.ok'), over: false, ok: true } : { ...goalChip(week.kcal, kGoal, false), ok: false });
  const cells = $derived((['p', 'fa', 'c', 's', 'fi'] as const).map((k) => ({ k, v: week[k] })));
</script>

<section class="card wk" data-food-week aria-labelledby="fw-h">
  <header>
    <h3 id="fw-h">{t('food.week.head')}</h3>
    <small data-week-range>{t('food.week.range', { from: md(week.from), to: md(week.to), n: week.days })}</small>
  </header>
  <div class="srow">
    <span class="lab">{t('food.week.kcal')}</span>
    <b class="total money" data-week-kcal>{kcalText(week.kcal)}</b>
    {#if chip}<span class="chg" class:over={chip.over} class:ok={chip.ok} data-week-chip>{chip.text}</span>{/if}
    {#if kGoal !== null}<small class="goal">{goalLabel('k', kGoal)}</small>{/if}
  </div>
  <dl class="cells">
    {#each cells as c (c.k)}
      <div class="cell" data-week-nutrient={c.k}>
        <dt>{t(`food.${c.k}`)}</dt>
        <dd class="money">{c.v === null ? t('food.unknown') : t('food.g', { n: c.v.toFixed(1) })}</dd>
      </div>
    {/each}
  </dl>
  <PfcBar id="week" p={week.p} fa={week.fa} c={week.c} al={week.al} />
</section>

<style>
  .wk { display: grid; gap: 8px; padding: 12px 14px; }
  header { display: flex; flex-wrap: wrap; align-items: baseline; gap: 4px 10px; }
  h3 { margin: 0; font-size: var(--fs-talk); font-weight: 700; }
  header small { font-size: var(--fs-s); font-weight: 700; color: var(--text-soft); font-variant-numeric: tabular-nums; }
  .srow { display: grid; grid-template-columns: minmax(0, 1fr) auto; grid-template-areas: 'lab chg' 'v chg' 'g g'; align-items: center; column-gap: 10px; }
  .lab { grid-area: lab; font-size: var(--fs-s); font-weight: 700; color: var(--text-soft); }
  .total { grid-area: v; font-size: var(--fs-title); line-height: 1.15; white-space: nowrap; }
  .goal { grid-area: g; font: 700 var(--fs-xs)/1.3 var(--font-ui); color: var(--text-soft); }
  .chg {
    grid-area: chg; padding: 6px 10px; border-radius: var(--r-chip); white-space: nowrap; font: 700 var(--fs-s)/1 var(--font-ui);
    background: color-mix(in srgb, var(--lip) 35%, transparent);
  }
  .chg.ok { color: var(--leaf-text); background: color-mix(in srgb, var(--c-leaf) 22%, transparent); }
  .chg.over { background: color-mix(in srgb, var(--c-coral) 25%, transparent); }
  .cells { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 6px; margin: 0; }
  .cell { min-width: 0; padding: 8px 6px 6px; border-radius: var(--r-chip); background: color-mix(in srgb, var(--lip) 22%, transparent); }
  dt { font-size: var(--fs-xs); font-weight: 700; color: var(--text-soft); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  dd { margin: 4px 0 0; font-size: var(--fs-s); white-space: nowrap; }
</style>
