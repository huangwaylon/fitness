<script lang="ts">
  // A daily series' card (けんこう's かつどう, ごはん's グラフ), for the chosen person, in ChartCard: one stat line (the
  // user 2026-11-19: charts first, the stats a small summary): the daily average over the finished days with a record
  // (Apple Health's values, or what was logged, as is) with its caption (ごはん's: its days, a dashed swatch as the
  // chart's average line), the goal met n/N days (the goal's way), and activity's change against the previous period
  // as a chip at the right; then the bar chart (in the person's colour; ごはん's with the flat average line). No key:
  // the goal chip carries the goal line's swatch, the caption the average's, a bar's tap its numbers.
  import type { LocalDate, Who } from '#lib/types.ts';
  import type { GoalId } from '#lib/contract/goals.ts';
  import { periodStats, seriesBuckets, type DaySeries, type Range } from '#lib/model/health.ts';
  import { t } from '#lib/i18n/index.ts';
  import '#lib/i18n/sheets.ts';
  import BarChart from './BarChart.svelte';
  import ChartCard from './ChartCard.svelte';
  import { goalLabel, valueText } from './goals.ts';
  import { pctText, spokenRange } from './fmt.ts';

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
  const label = $derived(t('health.chartLabel', { name, what: title, range: spokenRange(range, today), avg: s.avg === null ? t('health.noData') : fmt(s.avg), goal: gl }));
</script>

<ChartCard {id} {title} {p} {goal} {now} {start} {onsave} {warn} tone="soft" {empty} kind={food ? 'food' : 'metric'}>
  <p class="sl">
    <b class="v" data-intake-avg={food ? '' : undefined}>{s.avg === null ? '–' : fmt(s.avg)}</b>
    <span class="cap" data-intake-basis={food ? '' : undefined}>{#if food}<i class="k-avg" aria-hidden="true"></i>{/if}{food && s.days ? t('food.chart.avgHead', { n: s.days }) : t('health.avgHead')}</span>
    {#if s.days && goal !== null}<span data-met>{t('health.met', { n: s.met, d: s.days })}</span>{/if}
    {#if !food && s.change !== null}<span class="dc" data-change>{t('health.vsPrev', { v: pctText(s.change) })}</span>{/if}
  </p>

  <BarChart id="bar-{id}" {range} {p} {vals} first={ds.first} {today} {label} goalText={goal === null ? null : gl} {selected} {onselect} {onswipe} {slide}
    plain={goal === null} avg={food ? s.avg : null} {fmt} barFmt={id === 's' ? (v) => v.toFixed(1) : null} />
</ChartCard>

<style>
  .cap { display: inline-flex; align-items: center; gap: 5px; }
  /* the average's swatch: BarChart's .avg, its 5 4 dash */
  .k-avg { width: 14px; height: 2px; background: repeating-linear-gradient(90deg, var(--text) 0 5px, transparent 5px 9px); }
</style>
