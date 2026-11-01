<script lang="ts">
  // A body metric (けんこう, after 体重): 体脂肪率, BMI or 除脂肪体重, for the chosen person. As the weight card: the
  // period's average and how many measurements, its plain change (the first week's average → the last week's, else the
  // first measurement → the last; saying which) and per week, and the chart. No goal; never earns, no good / bad colours.
  import type { PersonId } from '#lib/types.ts';
  import type { BodyMetric } from '#lib/contract/api.ts';
  import { bodyBuckets, bodyStats, type HealthSeries, type Range } from '#lib/model/health.ts';
  import { t } from '#lib/i18n/index.ts';
  import DotChart from './DotChart.svelte';
  import { bodyDelta, bodyText, rangeLabel } from './fmt.ts';

  interface Props {
    metric: BodyMetric;
    hs: HealthSeries;
    range: Range;
    /** Whose data, and their name (for the chart's label). */
    p: PersonId;
    name: string;
    selected: number | null;
    onselect: (i: number | null) => void;
    onswipe: (dir: -1 | 1) => void;
    slide: -1 | 0 | 1;
  }
  let { metric, hs, range, p, name, selected, onselect, onswipe, slide }: Props = $props();
  const s = $derived(bodyStats(hs, p, metric, range));
  const b = $derived(bodyBuckets(hs, p, metric, range));
  const title = $derived(t(`health.body.${metric}`));
  const fmt = $derived((v: number) => bodyText(metric, v));
  /** The narrowest axis: 2 points of body fat or 2 kg, 1 of BMI. */
  const minSpan = $derived(metric === 'bmi' ? 1 : 2);
</script>

<section class="card bc" data-metric={metric} data-person={p} aria-labelledby="mc-{metric}">
  <header>
    <span class="ic" aria-hidden="true"><svg viewBox="0 0 24 24"><use href="#i-scale" /></svg></span>
    <h3 id="mc-{metric}">{title}</h3>
  </header>
  {#if s.n}
    <dl class="chips">
      <div><dt>{t('health.weight.avg')}</dt><dd class="money">{fmt(s.avg ?? 0)}</dd><dd class="n">{t('health.body.count', { n: s.n })}</dd></div>
      <div class="chg">
        <dt>{t('health.weight.change')}</dt><dd class="money">{bodyDelta(metric, s.change?.change ?? null)}</dd>
        {#if s.change}<dd class="n basis">{t(s.change.basis === 'weeks' ? 'health.weight.basis.weeks' : 'health.body.basis.ends')}</dd>{/if}
        {#if s.change?.perWeek != null}<dd class="n">{t('health.weight.perWeek', { d: bodyDelta(metric, s.change.perWeek) })}</dd>{/if}
      </div>
    </dl>
  {:else}
    <p class="none">{t('health.noData')}</p>
  {/if}
  <DotChart id={metric} person={p} {range} buckets={b} {fmt} {minSpan} goal={null} today={hs.to}
    label={t('health.body.chartLabel', { name, metric: title, range: rangeLabel(range, hs.to), v: s.avg === null ? t('health.noData') : fmt(s.avg) })}
    {selected} {onselect} {onswipe} {slide} />
  <p class="key" aria-hidden="true">
    <span><i class="k-dot"></i>{range.unit === 'day' ? t('health.body.dayKey') : t('health.weight.avgKey')}</span>
  </p>
</section>

<style>
  .bc { display: grid; gap: 10px; padding: 12px 14px 10px; }
  header { display: flex; align-items: center; gap: 8px; }
  .ic { display: inline-flex; width: 24px; height: 24px; flex: none; color: var(--text-soft); }
  .ic svg { width: 100%; height: 100%; }
  h3 { margin: 0; font-size: var(--fs-talk); font-weight: 700; }
  .chips { display: grid; grid-template-columns: minmax(0, auto) minmax(0, 1fr); gap: 8px; margin: 0; }
  .chips div { padding: 7px 10px; border-radius: var(--r-chip); background: color-mix(in srgb, var(--lip) 28%, transparent); display: grid; gap: 3px; align-content: start; }
  .chips dt { font-size: var(--fs-s); font-weight: 700; color: var(--text-soft); }
  .chips dd { margin: 0; }
  .chips .money { font-size: var(--fs-talk); }
  .chips .n { font-size: var(--fs-s); font-weight: 700; color: var(--text-soft); font-variant-numeric: tabular-nums; }
  .none { margin: 0; font-size: var(--fs-s); font-weight: 700; color: var(--text-soft); }
  .key { display: flex; flex-wrap: wrap; gap: 2px 12px; margin: 0; font-size: var(--fs-s); font-weight: 700; color: var(--text-soft); }
  .key span { display: inline-flex; align-items: center; gap: 5px; }
  .k-dot { display: inline-block; flex: none; width: 7px; height: 7px; border-radius: 50%; background: var(--text-soft); opacity: .7; }
</style>
