<script lang="ts">
  // ごはん's グラフ: what one person ate of `n`, kcal (たべた カロリー) or a nutrient (g), as けんこう's MetricCard reads
  // (its layout and tokens): its art and name with their goal at the upper right (GoalEdit, set there on my own;
  // anyone else's read-only); 1日の平均（n日分） over the finished days with a meal logged (today and the days to come
  // never count), the period's 合計 of those days beside it, 記録 n日 / 記録なし m日 under it; then けんこう's BarChart
  // (plain: every bar solid, the goal isn't a target to reach) with the flat average line, and a one-line key.
  import type { LocalDate, Who } from '#lib/types.ts';
  import type { FoodGoalOf } from '#lib/contract/food.ts';
  import { seriesBuckets, seriesStats, type DaySeries, type Range } from '#lib/model/health.ts';
  import { formatNum, t } from '#lib/i18n/index.ts';
  import { NUTRIENT_ART } from '#lib/art.ts';
  import OfficialArt from '../characters/OfficialArt.svelte';
  import BarChart from '../health/BarChart.svelte';
  import GoalEdit from '../health/GoalEdit.svelte';
  import { metricText, rangeLabel } from '../health/fmt.ts';
  import { FOOD_GOAL_SPECS, foodGoalText } from './foodUi.ts';

  interface Props {
    /** What: kcal (`k`) or a nutrient. */
    n: FoodGoalOf;
    ds: DaySeries;
    range: Range;
    today: LocalDate;
    /** Whose meals, and their name (the chart's label). */
    p: Who;
    name: string;
    selected: number | null;
    onselect: (i: number | null) => void;
    onswipe: (dir: -1 | 1) => void;
    slide: -1 | 0 | 1;
    /** The goal as they set it (null: none, or protein's default) and its setter (my own only; absent: read-only). */
    set?: { value: number | null; onsave: (v: number | null) => void } | null;
  }
  let { n, ds, range, today, p, name, selected, onselect, onswipe, slide, set = null }: Props = $props();

  const kcal = $derived(n === 'k');
  /** `1,820 kcal` · `84.5 g` (a period's sum of grams whole: `592 g`). */
  const fmt = $derived((v: number) => (kcal ? metricText('move', v) : t('food.g', { n: (Math.round(v * 10) / 10).toFixed(1) })));
  const s = $derived(seriesStats(ds, range.from, range.to));
  const vals = $derived(seriesBuckets(ds, range));
  const goal = $derived(ds.goal(ds.vals.length - 1));
  const what = $derived(t(kcal ? 'food.kcal' : `food.${n}`));
  const label = $derived(t('food.chart.label', { name, what, range: rangeLabel(range, today), avg: s.avg === null ? t('health.noData') : fmt(s.avg) }));
</script>

<section class="card mc" data-food-chart={n} data-person={p} aria-labelledby="fi-{n}">
  <header>
    <span class="ic"><OfficialArt key={NUTRIENT_ART[n]} size={24} /></span>
    <h3 id="fi-{n}">{kcal ? t('food.chart.head') : what}</h3>
    <GoalEdit id="{n}-goal" spec={FOOD_GOAL_SPECS[n]} text={goal === null ? null : foodGoalText(n, goal)} value={set?.value ?? null} onsave={set?.onsave}
      start={goal} />
  </header>

  <div class="srow">
    <span class="lab" data-intake-basis>{s.days ? t('food.chart.avgHead', { n: s.days }) : t('health.avgHead')}</span>
    <b class="avg money" data-intake-avg>{s.avg === null ? '–' : fmt(s.avg)}</b>
    <span class="chg" class:none={!s.days}>
      <span class="cv money" data-intake-sum>{s.days ? (kcal ? t('kiroku.kcal', { n: formatNum(s.sum) }) : t('food.g', { n: formatNum(s.sum) })) : '–'}</span>
      <small>{t('food.chart.total')}</small>
    </span>
    <small class="sub">
      <span>{t('health.recDays', { n: s.days })}</span>
      {#if s.missing}<span>{t('health.missing', { n: s.missing })}</span>{/if}
    </small>
  </div>

  <BarChart metric="move" id="intake-{n}" {range} {p} {vals} first={ds.first} {today} {label} {selected} {onselect} {onswipe} {slide} plain avg={s.avg}
    fmt={kcal ? null : fmt} barFmt={n === 's' ? (v) => v.toFixed(1) : null} />

  {#if s.avg !== null || goal !== null || s.missing}
  <p class="key" aria-hidden="true">
    {#if s.avg !== null}<span><i class="k-avg"></i>{t('food.chart.avg')}</span>{/if}
    {#if goal !== null}<span><i class="k-goal"></i>{t('goal.title')}</span>{/if}
    {#if s.missing}<span><i class="k-none"></i>{t('health.noData')}</span>{/if}
  </p>
  {/if}
</section>

<style>
  /* MetricCard's (health/MetricCard.svelte) */
  .mc { display: grid; gap: 8px; padding: 12px 14px 10px; }
  header { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
  header .ic { display: inline-flex; flex: none; }
  h3 { margin: 0; font-size: var(--fs-talk); font-weight: 700; }
  .srow { display: grid; grid-template-columns: minmax(0, 1fr) auto; grid-template-areas: 'lab chg' 'avg chg' 'sub sub'; align-items: center; column-gap: 10px; row-gap: 2px; }
  .lab { grid-area: lab; font-size: var(--fs-xs); font-weight: 700; color: var(--text-soft); }
  .avg { grid-area: avg; font-size: var(--fs-title); line-height: 1.15; white-space: nowrap; }
  .chg { grid-area: chg; justify-self: end; display: grid; justify-items: center; gap: 3px; padding: 6px 10px; border-radius: var(--r-chip); background: color-mix(in srgb, var(--lip) 35%, transparent); white-space: nowrap; }
  .cv { font-size: var(--fs-body); }
  .chg small { font: 700 var(--fs-xs)/1 var(--font-ui); color: var(--text-soft); }
  .chg.none { background: none; color: var(--text-soft); }
  .sub { grid-area: sub; display: flex; flex-wrap: wrap; gap: 0 10px; margin-top: 2px; font-size: var(--fs-s); font-weight: 700; color: var(--text-soft); font-variant-numeric: tabular-nums; }
  .key { display: flex; flex-wrap: wrap; gap: 2px 12px; margin: 0; font-size: var(--fs-s); font-weight: 700; color: var(--text-soft); }
  .key span { display: inline-flex; align-items: center; gap: 5px; }
  .key i { display: inline-block; flex: none; }
  /* the average: solid, the goal: dashed (BarChart's .avg and .goal) */
  .k-avg { width: 14px; border-top: 2px solid var(--text); }
  .k-goal { width: 14px; border-top: 2px dashed var(--text-soft); }
  .k-none { width: 9px; height: 5px; align-self: center; margin-top: 4px; border: 1px dashed color-mix(in srgb, var(--text-soft) 50%, transparent); border-bottom: 1px solid color-mix(in srgb, var(--text-soft) 45%, transparent); border-radius: 1.5px 1.5px 0 0; background: repeating-linear-gradient(135deg, color-mix(in srgb, var(--text-soft) 45%, transparent) 0 1px, transparent 1px 2.2px); }
</style>
