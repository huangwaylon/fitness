<script lang="ts">
  // A daily series' card (けんこう's かつどう, ごはん's グラフ), for the chosen person, in ChartCard: the daily average over
  // the finished days with a record (Apple Health's values, or what was logged, as is), then beside it the change
  // against the previous period (activity) or the period's total (ごはん); under it the goal met n/N days (%, the
  // goal's way), the best day (activity) and the days with no record (記録なし, when there are any); then the bar chart
  // (in the person's colour; ごはん's with the flat average line) and a one-line key.
  import type { LocalDate, Who } from '#lib/types.ts';
  import type { GoalId } from '#lib/contract/goals.ts';
  import { periodStats, seriesBuckets, type DaySeries, type Range } from '#lib/model/health.ts';
  import { md } from '#lib/i18n/format.ts';
  import { t } from '#lib/i18n/index.ts';
  import BarChart from './BarChart.svelte';
  import ChartCard from './ChartCard.svelte';
  import { goalLabel, valueText } from './goals.ts';
  import { pctText, rangeLabel } from './fmt.ts';

  interface Props {
    id: GoalId;
    ds: DaySeries;
    range: Range;
    today: LocalDate;
    /** Whose data, and their name (the chart's label). */
    p: Who;
    name: string;
    title: string;
    /** Nothing recorded yet (no one's Health data, no meal of theirs): the card holds its goal over one line. */
    empty: boolean;
    /** The goal in force now (as set: null for none, or ごはん's protein default) and its setter (absent: read-only);
     *  where −/＋ start with none (protein's default). */
    now: number | null;
    start?: number | null;
    onsave?: ((v: number | null) => void) | null;
    /** The editor's gentle note on a value (the kcal goal's: goals.ts kcalWarn). */
    warn?: ((v: number) => string | null) | null;
    /** ごはん's: the total beside the average, the average line, every value to one decimal of a gram. */
    food?: boolean;
    selected: number | null;
    onselect: (i: number | null) => void;
    onswipe: (dir: -1 | 1) => void;
    slide: -1 | 0 | 1;
  }
  let { id, ds, range, today, p, name, title, empty, now, start = null, onsave = null, warn = null, food = false, selected, onselect, onswipe, slide }: Props = $props();

  /** `9,214歩` · `620 kcal` · `84.5 g` (a day's grams to one decimal). */
  const fmt = $derived((v: number) => valueText(id, v, food && id !== 'k' ? 1 : 0));
  const s = $derived(periodStats(ds, range));
  const vals = $derived(seriesBuckets(ds, range));
  /** The goal at the period's end (a past period's own: the goals a day keeps change). */
  const goal = $derived(vals.at(-1)?.goal ?? null);
  const gl = $derived(goalLabel(id, goal));
  const label = $derived(t('health.chartLabel', { name, what: title, range: rangeLabel(range, today), avg: s.avg === null ? t('health.noData') : fmt(s.avg), goal: gl }));
</script>

<ChartCard {id} {title} {p} {goal} {now} {start} {onsave} {warn} tone="soft" {empty} kind={food ? 'food' : 'metric'}>
  <div class="srow">
    <span class="lab" data-intake-basis={food ? '' : undefined}>{food && s.days ? t('food.chart.avgHead', { n: s.days }) : t('health.avgHead')}</span>
    <b class="avg money" data-intake-avg={food ? '' : undefined}>{s.avg === null ? '–' : fmt(s.avg)}</b>
    {#if food}
      <span class="chg" class:none={!s.days}>
        <span class="cv money" data-intake-sum>{s.days ? valueText(id, s.sum, 0) : '–'}</span>
        <small>{t('food.chart.total')}</small>
      </span>
    {:else}
      <span class="chg" class:none={s.change === null}>
        <span class="cv money">{#if s.change === null}–{:else}<span aria-hidden="true">{s.change > 0.005 ? '↑' : s.change < -0.005 ? '↓' : '→'}</span> {pctText(s.change)}{/if}</span>
        <small>{t('health.changeHead')}</small>
      </span>
    {/if}
    <small class="sub">
      {#if s.days && goal !== null}<span data-met>{t('health.met', { n: s.met, d: s.days, p: Math.round((s.met / s.days) * 100) })}</span>{/if}
      {#if food}<span>{t('health.recDays', { n: s.days })}</span>{:else if s.best}<span>{t('health.best', { v: fmt(s.best.v), date: md(s.best.date) })}</span>{/if}
      {#if s.missing}<span>{t('health.missing', { n: s.missing })}</span>{/if}
    </small>
  </div>

  <BarChart id="bar-{id}" {range} {p} {vals} first={ds.first} {today} {label} goalText={goal === null ? null : gl} {selected} {onselect} {onswipe} {slide}
    plain={goal === null} avg={food ? s.avg : null} {fmt} barFmt={id === 's' ? (v) => v.toFixed(1) : null} />

  <p class="key p{p}" aria-hidden="true">
    {#if goal !== null}
      {#if range.unit === 'day'}
        <span><i class="k-met"></i>{t('health.key.met')}</span>
        <span><i class="k-miss"></i>{t('health.key.missed')}</span>
      {:else}
        <span><i class="k-miss"></i><i class="k-mid"></i><i class="k-met"></i>{t('health.key.share')}</span>
      {/if}
      <span><i class="k-goal"></i>{t('goal.title')}</span>
    {/if}
    {#if food && s.avg !== null}<span><i class="k-avg"></i>{t('food.chart.avg')}</span>{/if}
    {#if s.missing}<span><i class="k-none"></i>{t('health.noData')}</span>{/if}
  </p>
</ChartCard>

<style>
  /* the average large, the change (or the total) beside it, the counts under it */
  .srow { display: grid; grid-template-columns: minmax(0, 1fr) auto; grid-template-areas: 'lab chg' 'avg chg' 'sub sub'; align-items: center; column-gap: 10px; row-gap: 2px; }
  .lab { grid-area: lab; font-size: var(--fs-s); font-weight: 700; color: var(--text-soft); }
  .avg { grid-area: avg; font-size: var(--fs-title); line-height: 1.15; white-space: nowrap; }
  .chg { grid-area: chg; justify-self: end; display: grid; justify-items: center; gap: 3px; padding: 6px 10px; border-radius: var(--r-chip); background: color-mix(in srgb, var(--lip) 35%, transparent); white-space: nowrap; }
  .cv { font-size: var(--fs-body); }
  .chg small { font: 700 var(--fs-s)/1 var(--font-ui); color: var(--text-soft); }
  .chg.none { background: none; color: var(--text-soft); }
  .sub { grid-area: sub; display: flex; flex-wrap: wrap; gap: 0 10px; margin-top: 2px; font-size: var(--fs-s); font-weight: 700; color: var(--text-soft); font-variant-numeric: tabular-nums; }
  .key.pA { --pc: var(--person-a); }
  .key.pB { --pc: var(--person-b); }
  .key.pG { --pc: var(--c-lilac); }
  .k-met, .k-miss, .k-mid { width: 8px; height: 11px; border-radius: 2px 2px 0 0; background: var(--pc); }
  .k-miss { opacity: var(--bar-floor); }
  .k-mid { opacity: .67; margin-left: -3px; }
  .k-mid + .k-met { margin-left: -3px; }
  /* the goal: dashed (ChartFrame's .goal.soft), the average: solid (BarChart's .avg) */
  .k-goal { width: 14px; border-top: 2px dashed var(--text-soft); }
  .k-avg { width: 14px; border-top: 2px solid var(--text); }
  /* the chart's no-record stub: short, faint and hatched, on a baseline */
  .k-none { width: 9px; height: 5px; align-self: center; margin-top: 4px; border: 1px dashed color-mix(in srgb, var(--text-soft) 50%, transparent); border-bottom: 1px solid color-mix(in srgb, var(--text-soft) 45%, transparent); border-radius: 1.5px 1.5px 0 0; background: repeating-linear-gradient(135deg, color-mix(in srgb, var(--text-soft) 45%, transparent) 0 1px, transparent 1px 2.2px); }
</style>
