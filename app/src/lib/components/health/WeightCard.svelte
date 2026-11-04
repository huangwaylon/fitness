<script lang="ts">
  // 体重 (けんこう), for the chosen person: the period's average weigh-in and how many, its plain change (the first week's
  // average → the last week's, else the first weigh-in → the last; saying which) and per week; the chart (the goal dashed
  // on it; set at the card's upper right: GoalEdit) and, in the current period, the month the goal may be reached at that pace.
  // Weight never earns: no ベル here and no colours for good or bad.
  import type { PersonId } from '#lib/types.ts';
  import { weightBuckets, weightStats, type HealthSeries, type Range } from '#lib/model/health.ts';
  import { t } from '#lib/i18n/index.ts';
  import { BODY_ART } from '#lib/art.ts';
  import OfficialArt from '../characters/OfficialArt.svelte';
  import DotChart from './DotChart.svelte';
  import GoalEdit from './GoalEdit.svelte';
  import { GOALS } from './goals.ts';
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
    /** The goal's setter (absent: read-only). */
    onsavegoal?: ((v: number | null) => void) | null;
  }
  let { hs, range, p, name, selected, onselect, onswipe, slide, onsavegoal = null }: Props = $props();
  const s = $derived(weightStats(hs, p, range));
  const b = $derived(weightBuckets(hs, p, range));
  const ps = $derived(hs.people[p]);
</script>

<section class="card wc" data-metric="weight" data-person={p} aria-labelledby="mc-weight">
  <header>
    <span class="ic"><OfficialArt key={BODY_ART.weight} size={24} /></span>
    <h3 id="mc-weight">{t('goal.weight')}</h3>
    <GoalEdit id="weight-goal" spec={GOALS.weight} text={ps.goalWeight === null ? null : kgText(ps.goalWeight)} value={ps.goalWeight} onsave={onsavegoal} start={s.avg} tone="yuzu" />
  </header>
  {#if !hs.any}
    <!-- nobody's Health data has come yet: the goal can still be set (its chip above) -->
    <p class="none" data-health-empty>{t('kiroku.empty')}</p>
  {:else}
  {#if s.n}
    <dl class="chips">
      <div><dt>{t('health.weight.avg')}</dt><dd class="money">{kgText(s.avg ?? 0)}</dd><dd class="n">{t('health.weight.count', { n: s.n })}</dd></div>
      <div class="chg">
        <dt>{t('health.weight.change')}</dt><dd class="money">{kgDelta(s.change?.change ?? null)}</dd>
        {#if s.change}<dd class="n basis">{t(s.change.basis === 'weeks' ? 'health.weight.basis.weeks' : 'health.weight.basis.ends')}</dd>{/if}
        {#if s.change?.perWeek != null}<dd class="n">{t('health.weight.perWeek', { d: kgDelta(s.change.perWeek) })}</dd>{/if}
      </div>
    </dl>
  {:else}
    <p class="none">{t('health.noData')}</p>
  {/if}
  <DotChart id="weight" person={p} {range} buckets={b} fmt={kgText} goal={ps.goalWeight} today={hs.to}
    label={t('health.weight.chartLabel', { name, range: rangeLabel(range, hs.to), kg: s.avg === null ? t('health.noData') : kgText(s.avg) })}
    {selected} {onselect} {onswipe} {slide} />
  {#if s.projection && range.to === hs.to}
    <p class="proj">
      {#if s.projection.kind === 'reached'}{t('weight.reached')}
      {:else if s.projection.kind === 'date'}{t('weight.projected', { date: monthText(s.projection.date) })}
      {:else}{t('weight.noDate')}{/if}
    </p>
  {/if}
  <p class="key" aria-hidden="true">
    <span><i class="k-dot"></i>{range.unit === 'day' ? t('weight.legend.day') : t('health.weight.avgKey')}</span>
    <span><i class="k-goal"></i>{t('goal.title')}</span>
  </p>
  {/if}
</section>

<style>
  .wc { display: grid; gap: 10px; padding: 12px 14px 10px; }
  header { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
  .ic { display: inline-flex; flex: none; }
  h3 { margin: 0; font-size: var(--fs-talk); font-weight: 700; }
  .chips { display: grid; grid-template-columns: minmax(0, auto) minmax(0, 1fr); gap: 8px; margin: 0; }
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
  .k-goal { width: 14px; border-top: 2px dashed var(--c-yuzu-lip); }
</style>
