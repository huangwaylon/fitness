<script lang="ts">
  // One metric's card (けんこう), for the chosen person: its fruit and name with their goal; the daily average over the
  // recorded days, the change against the previous period, the goal met n/N days (%), the best day and the days with no
  // record; then the chart (in the person's colour) and a one-line key.
  import type { LocalDate, PersonId } from '#lib/types.ts';
  import { bucketValues, metricStats, METRIC_FRUIT, type HealthSeries, type Metric, type Range } from '#lib/model/health.ts';
  import { fruitArt } from '#lib/art.ts';
  import { md } from '#lib/i18n/format.ts';
  import { t } from '#lib/i18n/index.ts';
  import OfficialArt from '../characters/OfficialArt.svelte';
  import BarChart from './BarChart.svelte';
  import { metricText, pctText, rangeLabel } from './fmt.ts';

  interface Props {
    metric: Metric;
    hs: HealthSeries;
    range: Range;
    /** Whose data. */
    p: PersonId;
    selected: number | null;
    onselect: (i: number | null) => void;
    onswipe: (dir: -1 | 1) => void;
    slide: -1 | 0 | 1;
  }
  let { metric, hs, range, p, selected, onselect, onswipe, slide }: Props = $props();

  const fruit = $derived(METRIC_FRUIT[metric]);
  const today: LocalDate = $derived(hs.to);
  const s = $derived(metricStats(hs, p, metric, range));
  const vals = $derived(bucketValues(hs, p, metric, range));
  /** The goal at the period's end (only Move's changes). */
  const goalText = $derived(metricText(metric, Math.round(vals.at(-1)?.goal ?? 0)));
  const label = $derived(t('health.chartLabel', {
    metric: t(`fruit.${fruit}`), range: rangeLabel(range, today), avg: s.avg === null ? t('health.noData') : metricText(metric, s.avg)
  }));
</script>

<section class="card mc" data-metric={metric} data-person={p} aria-labelledby="mc-{metric}">
  <header>
    <span class="ic"><OfficialArt key={fruitArt(fruit)} size={24} /></span>
    <h3 id="mc-{metric}">{t(`fruit.${fruit}`)}</h3>
    <span class="goal"><i class="gl" aria-hidden="true"></i>{t('health.goalOf', { g: goalText })}</span>
  </header>

  <div class="srow">
    <span class="lab">{t('health.avgHead')}</span>
    <b class="avg money">{s.avg === null ? '–' : metricText(metric, s.avg)}</b>
    <span class="chg" class:none={s.change === null}>
      <span class="cv money">{#if s.change === null}–{:else}<span aria-hidden="true">{s.change > 0.005 ? '↑' : s.change < -0.005 ? '↓' : '→'}</span> {pctText(s.change)}{/if}</span>
      <small>{t('health.changeHead')}</small>
    </span>
    <small class="sub">
      {#if s.days}
        <span>{t('health.met', { n: s.met, d: s.days, p: Math.round((s.met / s.days) * 100) })}</span>
        {#if s.best}<span>{t('health.best', { v: metricText(metric, s.best.v), date: md(s.best.date) })}</span>{/if}
      {/if}
      {#if s.missing}<span>{t('health.missing', { n: s.missing })}</span>{/if}
    </small>
  </div>

  <BarChart {metric} {range} {p} {vals} first={hs.activityFrom} {today} {label} {selected} {onselect} {onswipe} {slide} />

  <p class="key p{p}" aria-hidden="true">
    {#if range.unit === 'day'}
      <span><i class="k-met"></i>{t('health.key.met')}</span>
      <span><i class="k-miss"></i>{t('health.key.missed')}</span>
    {:else}
      <span><i class="k-miss"></i><i class="k-mid"></i><i class="k-met"></i>{t('health.key.share')}</span>
    {/if}
    <span><i class="k-goal"></i>{t('goal.title')}</span>
    <span><i class="k-none"></i>{t('health.noData')}</span>
  </p>
</section>

<style>
  .mc { display: grid; gap: 8px; padding: 12px 14px 10px; }
  header { display: flex; align-items: center; gap: 8px; }
  header .ic { display: inline-flex; flex: none; }
  h3 { margin: 0; font-size: var(--fs-talk); font-weight: 700; }
  .goal { margin-left: auto; display: inline-flex; align-items: center; gap: 6px; font-size: var(--fs-s); font-weight: 700; color: var(--text-soft); font-variant-numeric: tabular-nums; }
  .gl { width: 14px; border-top: 2px dashed var(--text-soft); }
  /* one person: the average large, the change beside it, the counts under it */
  .srow { display: grid; grid-template-columns: minmax(0, 1fr) auto; grid-template-areas: 'lab chg' 'avg chg' 'sub sub'; align-items: center; column-gap: 10px; row-gap: 2px; }
  .lab { grid-area: lab; font-size: var(--fs-xs); font-weight: 700; color: var(--text-soft); }
  .avg { grid-area: avg; font-size: var(--fs-title); line-height: 1.15; white-space: nowrap; }
  .chg { grid-area: chg; justify-self: end; display: grid; justify-items: center; gap: 3px; padding: 6px 10px; border-radius: var(--r-chip); background: color-mix(in srgb, var(--lip) 35%, transparent); white-space: nowrap; }
  .cv { font-size: var(--fs-body); }
  .chg small { font: 700 var(--fs-xs)/1 var(--font-ui); color: var(--text-soft); }
  .chg.none { background: none; color: var(--text-soft); }
  .sub { grid-area: sub; display: flex; flex-wrap: wrap; gap: 0 10px; margin-top: 2px; font-size: var(--fs-s); font-weight: 700; color: var(--text-soft); font-variant-numeric: tabular-nums; }
  .key { display: flex; flex-wrap: wrap; gap: 2px 12px; margin: 0; font-size: var(--fs-s); font-weight: 700; color: var(--text-soft); }
  .key.pA { --pc: var(--person-a); }
  .key.pB { --pc: var(--person-b); }
  .key span { display: inline-flex; align-items: center; gap: 5px; }
  .key i { display: inline-block; flex: none; }
  .k-met, .k-miss, .k-mid { width: 8px; height: 11px; border-radius: 2px 2px 0 0; background: var(--pc); }
  .k-miss { opacity: .34; }
  .k-mid { opacity: .67; margin-left: -3px; }
  .k-mid + .k-met { margin-left: -3px; }
  .k-goal { width: 14px; border-top: 2px dashed var(--text-soft); }
  .k-none { width: 8px; height: 11px; border-radius: 2px 2px 0 0; background: repeating-linear-gradient(135deg, color-mix(in srgb, var(--text-soft) 45%, transparent) 0 1.5px, transparent 1.5px 3.5px); box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--text-soft) 40%, transparent); }
</style>
