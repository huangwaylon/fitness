<script lang="ts">
  // One metric's card (けんこう): its fruit and name with the goal; per person (a colour swatch = their bars) the daily
  // average over the recorded days, the change against the previous period, the goal met n/N days (%), the best day and
  // the days with no record; then the chart and a one-line key.
  import type { LocalDate, PersonId } from '#lib/types.ts';
  import { bucketValues, metricStats, METRIC_FRUIT, rolling7, type HealthSeries, type Metric, type Range } from '#lib/model/health.ts';
  import { fruitArt } from '#lib/art.ts';
  import { md } from '#lib/i18n/format.ts';
  import { formatNum, t } from '#lib/i18n/index.ts';
  import Avatar from '../characters/Avatar.svelte';
  import OfficialArt from '../characters/OfficialArt.svelte';
  import BarChart from './BarChart.svelte';
  import { metricText, pctText, rangeLabel } from './fmt.ts';

  interface Props {
    metric: Metric;
    hs: HealthSeries;
    range: Range;
    shown: PersonId[];
    names: Record<PersonId, string>;
    villagers: Record<PersonId, string | null>;
    selected: number | null;
    onselect: (i: number | null) => void;
    onswipe: (dir: -1 | 1) => void;
    slide: -1 | 0 | 1;
  }
  let { metric, hs, range, shown, names, villagers, selected, onselect, onswipe, slide }: Props = $props();

  const fruit = $derived(METRIC_FRUIT[metric]);
  const today: LocalDate = $derived(hs.to);
  const rows = $derived(shown.map((p) => ({ p, s: metricStats(hs, p, metric, range) })));
  const series = $derived(shown.map((p) => ({
    p, vals: bucketValues(hs, p, metric, range), roll: range.unit === 'day' ? rolling7(hs, p, metric, range) : null
  })));
  /** The goal at the period's end, per person (only Move differs). */
  const goalText = $derived.by(() => {
    const gs = [...new Set(series.map((s) => Math.round(s.vals.at(-1)?.goal ?? 0)))];
    return gs.length === 1 ? metricText(metric, gs[0]) : `${gs.map(formatNum).join(' / ')} ${metric === 'move' ? 'kcal' : ''}`.trim();
  });
  const label = $derived(t('health.chartLabel', {
    metric: t(`fruit.${fruit}`), range: rangeLabel(range, today),
    avgs: rows.map((r) => `${names[r.p]} ${r.s.avg === null ? t('health.noData') : metricText(metric, r.s.avg)}`).join('、')
  }));
</script>

<section class="card mc" data-metric={metric} aria-labelledby="mc-{metric}">
  <header>
    <span class="ic"><OfficialArt key={fruitArt(fruit)} size={24} /></span>
    <h3 id="mc-{metric}">{t(`fruit.${fruit}`)}</h3>
    <span class="goal"><i class="gl" aria-hidden="true"></i>{t('health.goalOf', { g: goalText })}</span>
  </header>

  <div class="shead" aria-hidden="true"><span>{t('health.avgHead')}</span><span>{t('health.changeHead')}</span></div>
  {#each rows as { p, s } (p)}
    <div class="srow" data-person={p}>
      <span class="who"><Avatar person={p} villager={villagers[p]} size={26} /><i class="sw p{p}" aria-hidden="true"></i></span>
      <span class="nm sr-only">{names[p]}</span>
      <b class="avg money">{s.avg === null ? '–' : metricText(metric, s.avg)}</b>
      <span class="chg money" class:none={s.change === null}>
        {#if s.change === null}–{:else}<span aria-hidden="true">{s.change > 0.005 ? '↑' : s.change < -0.005 ? '↓' : '→'}</span> {pctText(s.change)}{/if}
      </span>
      <small class="sub">
        {#if s.days}
          <span>{t('health.met', { n: s.met, d: s.days, p: Math.round((s.met / s.days) * 100) })}</span>
          {#if s.best}<span>{t('health.best', { v: metricText(metric, s.best.v), date: md(s.best.date) })}</span>{/if}
        {/if}
        {#if s.missing}<span>{t('health.missing', { n: s.missing })}</span>{/if}
      </small>
    </div>
  {/each}

  <BarChart {metric} {range} {series} first={hs.activityFrom} {today} {names} {label} {selected} {onselect} {onswipe} {slide} />

  <p class="key" aria-hidden="true">
    {#if range.unit === 'day'}
      <span><i class="k-met"></i>{t('health.key.met')}</span>
      <span><i class="k-miss"></i>{t('health.key.missed')}</span>
      <span><i class="k-roll"></i>{t('health.key.roll')}</span>
    {:else}
      <span><i class="k-miss"></i><i class="k-mid"></i><i class="k-met"></i>{t('health.key.share')}</span>
    {/if}
    <span><i class="k-goal"></i>{t('goal.title')}</span>
  </p>
</section>

<style>
  .mc { display: grid; gap: 8px; padding: 12px 14px 10px; }
  header { display: flex; align-items: center; gap: 8px; }
  header .ic { display: inline-flex; flex: none; }
  h3 { margin: 0; font-size: var(--fs-talk); font-weight: 700; }
  .goal { margin-left: auto; display: inline-flex; align-items: center; gap: 6px; font-size: var(--fs-s); font-weight: 700; color: var(--text-soft); font-variant-numeric: tabular-nums; }
  .gl { width: 14px; border-top: 2px dashed var(--text-soft); }
  .shead { display: flex; justify-content: space-between; gap: 8px; font-size: var(--fs-xs); font-weight: 700; color: var(--text-soft); margin-bottom: -4px; }
  .srow { display: grid; grid-template-columns: auto 1fr auto; grid-template-areas: 'who avg chg' 'who sub sub'; align-items: center; column-gap: 10px; row-gap: 2px; }
  .srow + .srow { padding-top: 6px; border-top: 1px dashed color-mix(in srgb, var(--lip) 70%, transparent); }
  .who { grid-area: who; position: relative; display: inline-flex; align-self: start; padding-bottom: 6px; }
  .sw { position: absolute; left: 3px; right: 3px; bottom: 0; height: 4px; border-radius: 2px; }
  .sw.pA { background: var(--person-a); }
  .sw.pB { background: var(--person-b); }
  .avg { grid-area: avg; font-size: var(--fs-talk); }
  .chg { grid-area: chg; justify-self: end; font-size: var(--fs-body); padding: 3px 8px; border-radius: var(--r-pill); background: color-mix(in srgb, var(--lip) 35%, transparent); white-space: nowrap; }
  .chg.none { background: none; color: var(--text-soft); }
  .sub { grid-area: sub; display: flex; flex-wrap: wrap; gap: 0 10px; font-size: var(--fs-s); font-weight: 700; color: var(--text-soft); font-variant-numeric: tabular-nums; }
  .key { display: flex; flex-wrap: wrap; gap: 2px 12px; margin: 0; font-size: var(--fs-s); font-weight: 700; color: var(--text-soft); }
  .key span { display: inline-flex; align-items: center; gap: 5px; }
  .key i { display: inline-block; flex: none; }
  .k-met, .k-miss { width: 8px; height: 11px; border-radius: 2px 2px 0 0; background: var(--text-soft); }
  .k-miss { opacity: .34; }
  .k-mid { opacity: .67; width: 8px; height: 11px; border-radius: 2px 2px 0 0; background: var(--text-soft); margin-left: -3px; }
  .k-mid + .k-met { margin-left: -3px; }
  .k-roll { width: 14px; height: 2px; border-radius: 2px; background: var(--text); }
  .k-goal { width: 14px; border-top: 2px dashed var(--text-soft); }
</style>
