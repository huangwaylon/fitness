<script lang="ts">
  // ごはん's グラフ: the kcal eaten (たべた カロリー), one person's, as けんこう's MetricCard reads (its layout and tokens):
  // the ramen bowl and the name with their kcal goal; 1日の平均（n日分） over the finished days with a meal logged (today
  // and the days to come never count), the period's
  // 合計 of those days beside it, 記録 n日 / 記録なし m日 under it; then けんこう's BarChart (plain: every bar solid, the
  // goal isn't a target to reach) with the flat average line, and a one-line key.
  import type { LocalDate, Who } from '#lib/types.ts';
  import { seriesBuckets, seriesStats, type DaySeries, type Range } from '#lib/model/health.ts';
  import { formatNum, t } from '#lib/i18n/index.ts';
  import OfficialArt from '../characters/OfficialArt.svelte';
  import BarChart from '../health/BarChart.svelte';
  import { metricText, rangeLabel } from '../health/fmt.ts';

  interface Props {
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
  }
  let { ds, range, today, p, name, selected, onselect, onswipe, slide }: Props = $props();

  const kcal = (v: number) => metricText('move', v);
  const s = $derived(seriesStats(ds, range.from, range.to));
  const vals = $derived(seriesBuckets(ds, range));
  const goal = $derived(ds.goal(ds.vals.length - 1));
  const label = $derived(t('food.chart.label', { name, range: rangeLabel(range, today), avg: s.avg === null ? t('health.noData') : kcal(s.avg) }));
</script>

<section class="card mc" data-food-chart data-person={p} aria-labelledby="fi-h">
  <header>
    <span class="ic"><OfficialArt key="items/dinner" size={24} /></span>
    <h3 id="fi-h">{t('food.chart.head')}</h3>
    <span class="goal">{#if goal !== null}<i class="gl" aria-hidden="true"></i>{t('food.goalOf', { g: kcal(goal) })}{:else}{t('food.noGoal')}{/if}</span>
  </header>

  <div class="srow">
    <span class="lab" data-intake-basis>{s.days ? t('food.chart.avgHead', { n: s.days }) : t('health.avgHead')}</span>
    <b class="avg money" data-intake-avg>{s.avg === null ? '–' : kcal(s.avg)}</b>
    <span class="chg" class:none={!s.days}>
      <span class="cv money" data-intake-sum>{s.days ? t('kiroku.kcal', { n: formatNum(s.sum) }) : '–'}</span>
      <small>{t('food.chart.total')}</small>
    </span>
    <small class="sub">
      <span>{t('health.recDays', { n: s.days })}</span>
      {#if s.missing}<span>{t('health.missing', { n: s.missing })}</span>{/if}
    </small>
  </div>

  <BarChart metric="move" id="intake" {range} {p} {vals} first={ds.first} {today} {label} {selected} {onselect} {onswipe} {slide} plain avg={s.avg} />

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
  header { display: flex; align-items: center; gap: 8px; }
  header .ic { display: inline-flex; flex: none; }
  h3 { margin: 0; font-size: var(--fs-talk); font-weight: 700; }
  .goal { margin-left: auto; display: inline-flex; align-items: center; gap: 6px; font-size: var(--fs-s); font-weight: 700; color: var(--text-soft); font-variant-numeric: tabular-nums; white-space: nowrap; }
  .gl { width: 14px; border-top: 2px dashed var(--text-soft); }
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
