<script lang="ts">
  // 体重 (けんこう), for the chosen person: the period's average weigh-in and how many, the change of the trend over the
  // period and per week; the chart (the goal dashed on it) and, at today's pace, the month the goal may be reached.
  // Weight never earns: no ベル here and no colours for good or bad.
  import type { PersonId } from '#lib/types.ts';
  import { weightBuckets, weightStats, type HealthSeries, type Range } from '#lib/model/health.ts';
  import { t } from '#lib/i18n/index.ts';
  import WeightChart from './WeightChart.svelte';
  import { kgDelta, kgText, monthText } from '../kiroku/fmt.ts';
  import { rangeLabel } from './fmt.ts';

  interface Props {
    hs: HealthSeries;
    range: Range;
    /** Whose weight, and their name (for the chart's label). */
    p: PersonId;
    name: string;
    /** The open callout's bucket. */
    selected: number | null;
    onselect: (i: number | null) => void;
    onswipe: (dir: -1 | 1) => void;
    slide: -1 | 0 | 1;
  }
  let { hs, range, p, name, selected, onselect, onswipe, slide }: Props = $props();
  const s = $derived(weightStats(hs, p, range));
  const b = $derived(weightBuckets(hs, p, range));
  const ps = $derived(hs.people[p]);
</script>

<section class="card wc" data-metric="weight" data-person={p} aria-labelledby="mc-weight">
  <header>
    <span class="ic" aria-hidden="true"><svg viewBox="0 0 24 24"><use href="#i-scale" /></svg></span>
    <h3 id="mc-weight">{t('goal.weight')}</h3>
  </header>
  {#if s.n}
    <dl class="chips">
      <div><dt>{t('health.weight.avg')}</dt><dd class="money">{kgText(s.avg ?? 0)}</dd><dd class="n">{t('health.weight.count', { n: s.n })}</dd></div>
      <div><dt>{t('health.weight.change')}</dt><dd class="money">{kgDelta(s.change)}</dd>{#if s.perWeek !== null}<dd class="n">{t('health.weight.perWeek', { d: kgDelta(s.perWeek) })}</dd>{/if}</div>
    </dl>
  {:else}
    <p class="none">{t('health.noData')}</p>
  {/if}
  <WeightChart person={p} {range} buckets={b} goal={ps.goalWeight} today={hs.to}
    label={t('health.weight.chartLabel', { name, range: rangeLabel(range, hs.to), kg: s.avg === null ? t('health.noData') : kgText(s.avg) })}
    {selected} {onselect} {onswipe} {slide} />
  {#if ps.goalWeight !== null && ps.projection && range.to === hs.to}
    <p class="proj">
      {#if ps.projection.kind === 'reached'}{t('weight.reached')}
      {:else if ps.projection.kind === 'date'}{t('weight.projected', { date: monthText(ps.projection.date) })}
      {:else}{t('weight.noDate')}{/if}
    </p>
  {/if}
  <p class="key" aria-hidden="true">
    <span><i class="k-dot"></i>{range.unit === 'day' ? t('weight.legend.day') : t('health.weight.avgKey')}</span>
    <span><i class="k-line"></i>{t('weight.legend.trend')}</span>
    <span><i class="k-goal"></i>{t('goal.title')}</span>
  </p>
  <p class="note">{t('weight.note')}</p>
</section>

<style>
  .wc { display: grid; gap: 10px; padding: 12px 14px 10px; }
  header { display: flex; align-items: center; gap: 8px; }
  .ic { display: inline-flex; width: 24px; height: 24px; flex: none; color: var(--text-soft); }
  .ic svg { width: 100%; height: 100%; }
  h3 { margin: 0; font-size: var(--fs-talk); font-weight: 700; }
  .chips { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; margin: 0; }
  .chips div { padding: 7px 10px; border-radius: var(--r-chip); background: color-mix(in srgb, var(--lip) 28%, transparent); display: grid; gap: 3px; align-content: start; }
  .chips dt { font-size: var(--fs-s); font-weight: 700; color: var(--text-soft); }
  .chips dd { margin: 0; }
  .chips .money { font-size: var(--fs-talk); }
  .chips .n { font-size: var(--fs-s); font-weight: 700; color: var(--text-soft); font-variant-numeric: tabular-nums; }
  .none { margin: 0; font-size: var(--fs-s); font-weight: 700; color: var(--text-soft); }
  .proj { margin: 0; font-size: var(--fs-s); font-weight: 700; line-height: var(--lh); }
  .key { display: flex; flex-wrap: wrap; gap: 2px 12px; margin: 0; font-size: var(--fs-s); font-weight: 700; color: var(--text-soft); }
  .key span { display: inline-flex; align-items: center; gap: 5px; }
  .key i { display: inline-block; flex: none; }
  .k-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--text-soft); opacity: .7; }
  .k-line { width: 14px; height: 2px; border-radius: 2px; background: var(--text); }
  .k-goal { width: 14px; border-top: 2px dashed var(--c-yuzu-lip); }
  .note { margin: 0; font-size: var(--fs-s); font-weight: 700; color: var(--text-soft); line-height: var(--lh); }
</style>
