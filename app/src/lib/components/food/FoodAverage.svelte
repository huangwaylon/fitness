<script lang="ts">
  // グラフ's average card (docs/design.md "Gohan"): the person's average day over the range shown (model/food.ts
  // foodAverage: the range's finished days, to yesterday when it holds today; a day with nothing logged left out, n日分),
  // so a day over or under reads against the period, compact (the user 2026-11-19): its kcal with a chip against the
  // goal (within its band: 目標の範囲; else 目標より N kcal 少なめ / 多め), the PFC bar with each one's grams and % (PfcBar
  // `grams`), then salt and fibre, each a line with its goal (「目標 7.5 g 以下」, the day card's words, no colour: an
  // average over is no fault) and how far its entries know it (model/food.ts Coverage: 「≥」, 一部不明 / わかった分だけ, as
  // the day card's tiles), salt's with the food that gave the most of it (「多いのは … · n回」, 「· n回」 on one line). Read-only. None with no
  // recorded day in them (a いつもの's items alone aren't one).
  import type { FoodAverage } from '#lib/model/food.ts';
  import type { FoodGoalOf } from '#lib/contract/food.ts';
  import { goalMet } from '#lib/contract/goals.ts';
  import { md } from '#lib/i18n/format.ts';
  import { t } from '#lib/i18n/index.ts';
  import { kcalText } from '../kiroku/fmt.ts';
  import { goalLabel } from '../health/goals.ts';
  import { goalChip } from './foodUi.ts';
  import PfcBar from './PfcBar.svelte';

  let { avg, goals }: { avg: FoodAverage; goals: Record<FoodGoalOf, number | null> } = $props();

  const kGoal = $derived(goals.k);
  const chip = $derived(kGoal === null ? null : goalMet('k', avg.kcal, kGoal) ? { text: t('food.avg.ok'), over: false, ok: true } : { ...goalChip(avg.kcal, kGoal, false), ok: false });
  const grams = (v: number | null) => (v === null ? t('food.unknown') : t('food.g', { n: v.toFixed(1) }));
  /** A nutrient's grams, 「≥」 when some entry doesn't know it. */
  const atLeast = (k: keyof FoodAverage['known'], v: number | null) => (v !== null && avg.known[k] !== 'all' ? '≥' : '') + grams(v);
  const rest = $derived((['s', 'fi'] as const).map((k) => {
    const v = avg[k], known = avg.known[k], goal = goals[k];
    const why = v === null || known === 'all' ? null : t(known === 'few' ? 'food.fewKnown' : 'food.partial');
    return { k, v, known, note: [why, goal === null ? null : goalLabel(k, goal)].filter((x) => x !== null).join(' · ') };
  }));
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
  <PfcBar id="avg" p={avg.p} fa={avg.fa} c={avg.c} grams={(v, n) => atLeast(n, v)} />
  <dl class="rest">
    {#each rest as r (r.k)}
      <div data-avg-nutrient={r.k} data-known={r.known}>
        <dt>{t(`food.${r.k}`)}</dt>
        <dd><b class="money">{atLeast(r.k, r.v)}</b>{#if r.note}<small data-avg-note>{r.note}</small>{/if}</dd>
        {#if r.k === 's' && avg.salty}<dd class="salty" data-avg-salty>{t('food.avg.salty', { n: avg.salty.n })} <span class="nw">{t('food.avg.saltyN', { times: avg.salty.times })}</span></dd>{/if}
      </div>
    {/each}
  </dl>
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
  .rest { display: grid; gap: 4px; margin: 0; font: 700 var(--fs-s)/1.3 var(--font-ui); color: var(--text-soft); }
  .rest div { display: grid; grid-template-columns: 5.5em minmax(0, 1fr); column-gap: 8px; }
  .rest dd { margin: 0; display: flex; flex-wrap: wrap; align-items: baseline; gap: 0 8px; min-width: 0; }
  .rest b { color: var(--text); font-size: var(--fs-s); white-space: nowrap; }
  .rest small { font: inherit; word-break: keep-all; }
  .rest .salty { grid-column: 2; font-weight: 400; overflow-wrap: anywhere; }
  .salty .nw { white-space: nowrap; }
</style>
