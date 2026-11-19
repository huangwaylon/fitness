<script lang="ts">
  // グラフ's average card (docs/design.md "Gohan"): the person's average day over the range shown (model/food.ts
  // foodAverage: the range's finished days, to yesterday when it holds today; a day with nothing logged left out, n日分),
  // so a day over or under reads against the period, compact (the user 2026-11-19): its kcal with a chip against the
  // goal (within its band: 目標の範囲; else 目標より N kcal 少なめ / 多め), the PFC bar with each one's grams and % (PfcBar
  // `grams`), then salt and fibre on one line. Read-only. None with nothing logged in those days.
  import type { FoodAverage } from '#lib/model/food.ts';
  import type { FoodGoalOf } from '#lib/contract/food.ts';
  import { goalMet } from '#lib/contract/goals.ts';
  import { md } from '#lib/i18n/format.ts';
  import { t } from '#lib/i18n/index.ts';
  import { kcalText } from '../kiroku/fmt.ts';
  import { goalChip } from './foodUi.ts';
  import PfcBar from './PfcBar.svelte';

  let { avg, goals }: { avg: FoodAverage; goals: Record<FoodGoalOf, number | null> } = $props();

  const kGoal = $derived(goals.k);
  const chip = $derived(kGoal === null ? null : goalMet('k', avg.kcal, kGoal) ? { text: t('food.avg.ok'), over: false, ok: true } : { ...goalChip(avg.kcal, kGoal, false), ok: false });
  const grams = (v: number | null) => (v === null ? t('food.unknown') : t('food.g', { n: v.toFixed(1) }));
  const rest = $derived((['s', 'fi'] as const).map((k) => ({ k, v: avg[k] })));
</script>

<section class="card wk" data-food-avg aria-labelledby="fw-h">
  <header>
    <h3 id="fw-h">{t('food.avg.head')}</h3>
    <small data-avg-range>{t('food.avg.range', { from: md(avg.from), to: md(avg.to), n: avg.days })}</small>
  </header>
  <p class="row">
    <b class="total money" data-avg-kcal>{kcalText(avg.kcal)}</b>
    {#if chip}<span class="chg" class:over={chip.over} class:ok={chip.ok} data-avg-chip>{chip.text}</span>{/if}
  </p>
  <PfcBar id="avg" p={avg.p} fa={avg.fa} c={avg.c} {grams} />
  <p class="rest">
    {#each rest as r (r.k)}<span data-avg-nutrient={r.k}>{t(`food.${r.k}`)} <b class="money">{grams(r.v)}</b></span>{/each}
  </p>
</section>

<style>
  .wk { display: grid; gap: 8px; padding: 12px 14px; }
  header { display: flex; flex-wrap: wrap; align-items: baseline; gap: 2px 10px; }
  h3 { margin: 0; font-size: var(--fs-talk); font-weight: 700; }
  header small { font-size: var(--fs-s); font-weight: 700; color: var(--text-soft); font-variant-numeric: tabular-nums; }
  .row { display: flex; flex-wrap: wrap; align-items: baseline; gap: 4px 8px; margin: 0; }
  .total { font-size: var(--fs-talk); line-height: 1.2; white-space: nowrap; }
  .chg {
    margin-left: auto; padding: 3px 8px; border-radius: var(--r-pill); white-space: nowrap; font: 700 var(--fs-s)/1.3 var(--font-ui);
    background: color-mix(in srgb, var(--lip) 35%, transparent);
  }
  .chg.ok { color: var(--leaf-text); background: color-mix(in srgb, var(--c-leaf) 22%, transparent); }
  .chg.over { background: color-mix(in srgb, var(--c-coral) 25%, transparent); }
  .rest { display: flex; flex-wrap: wrap; gap: 2px 14px; margin: 0; font: 700 var(--fs-s)/1.3 var(--font-ui); color: var(--text-soft); }
  .rest b { color: var(--text); font-size: var(--fs-s); }
</style>
