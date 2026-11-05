<script lang="ts">
  // A からだ card (けんこう): 体重, 体脂肪率, BMI or 除脂肪体重, for the chosen person, in ChartCard (its goal at the upper
  // right: GoalEdit, each optional, per person). The period's average and how many measurements, its plain change (the
  // first week's average → the last week's, else the first measurement → the last; saying which) and per week, the dot
  // chart (the goal dashed on it) and, in the current period with a goal, the month it may be reached at that pace (the
  // goal's way: under a ceiling, over a floor, near a value). BMI's average carries its category by the person's
  // standard (model/profile.ts bmiCategory: アジア, the default, or WHO; せってい → プロフィール), said plainly. Never
  // earns, no good / bad colours.
  import type { PersonId } from '#lib/types.ts';
  import { dotSeries, dotStats, type BodyId, type HealthSeries, type Range } from '#lib/model/health.ts';
  import { t } from '#lib/i18n/index.ts';
  import { week } from '#lib/store/week.svelte.ts';
  import { bmiCategory, profileOf } from '#lib/model/profile.ts';
  import { monthText } from '../kiroku/fmt.ts';
  import ChartCard from './ChartCard.svelte';
  import DotChart from './DotChart.svelte';
  import { goalLabel, goalName, valueText } from './goals.ts';
  import { deltaText, rangeLabel } from './fmt.ts';

  interface Props {
    id: BodyId;
    hs: HealthSeries;
    range: Range;
    /** Whose data, and their name (for the chart's label). */
    p: PersonId;
    name: string;
    selected: number | null;
    onselect: (i: number | null) => void;
    onswipe: (dir: -1 | 1) => void;
    slide: -1 | 0 | 1;
    /** The goal's setter (absent: read-only). */
    onsave?: ((v: number | null) => void) | null;
  }
  let { id, hs, range, p, name, selected, onselect, onswipe, slide, onsave = null }: Props = $props();
  const s = $derived(dotStats(hs, p, id, range));
  const b = $derived(dotSeries(hs, p, id, range));
  const goal = $derived(hs.people[p].bodyGoals[id]);
  const title = $derived(goalName(id));
  const fmt = $derived((v: number) => valueText(id, v, 1));
  /** The narrowest axis: 2 kg or 2 points of body fat, 1 of BMI. */
  const minSpan = $derived(id === 'bmi' ? 1 : 2);
  const gl = $derived(goalLabel(id, goal));
  /** BMI's category for the period's average, by the person's standard. */
  const std = $derived(week.model ? profileOf(week.model.state, p).bmiStd : 'asia');
  const cat = $derived(id === 'bmi' && s.avg !== null ? bmiCategory(s.avg, std) : null);
</script>

<ChartCard {id} {title} {p} {goal} start={s.avg} {onsave} tone="yuzu" empty={!hs.any} kind="metric">
  {#if s.n}
    <dl class="chips">
      <div><dt>{t('health.weight.avg')}</dt><dd class="money">{fmt(s.avg ?? 0)}</dd><dd class="n">{t('health.weight.count', { n: s.n })}</dd>
        {#if cat}<dd class="n" data-bmi-cat={cat} data-bmi-std={std}>{t('health.bmi.cat', { cat: t(`health.bmi.${cat}`), std: t(`health.bmi.std.${std}`) })}</dd>{/if}</div>
      <div class="chg">
        <dt>{t('health.weight.change')}</dt><dd class="money">{deltaText(id, s.change?.change ?? null)}</dd>
        {#if s.change}<dd class="n basis">{t(s.change.basis === 'weeks' ? 'health.weight.basis.weeks' : 'health.weight.basis.ends')}</dd>{/if}
        {#if s.change?.perWeek != null}<dd class="n">{t('health.weight.perWeek', { d: deltaText(id, s.change.perWeek) })}</dd>{/if}
      </div>
    </dl>
  {:else}
    <p class="none">{t('health.noData')}</p>
  {/if}
  <DotChart {id} person={p} {range} buckets={b} {fmt} {minSpan} {goal} goalText={gl} today={hs.to}
    label={t('health.chartLabel', { name, what: title, range: rangeLabel(range, hs.to), avg: s.avg === null ? t('health.noData') : fmt(s.avg), goal: gl })}
    {selected} {onselect} {onswipe} {slide} />
  {#if s.projection && range.to === hs.to}
    <p class="proj" data-proj={s.projection.kind}>
      {#if s.projection.kind === 'reached'}{t('weight.reached')}
      {:else if s.projection.kind === 'date'}{t('weight.projected', { date: monthText(s.projection.date) })}
      {:else}{t('weight.noDate')}{/if}
    </p>
  {/if}
  <p class="key" aria-hidden="true">
    <span><i class="k-dot"></i>{range.unit === 'day' ? t('health.body.dayKey') : t('health.weight.avgKey')}</span>
    {#if goal !== null}<span><i class="k-goal"></i>{t('goal.title')}</span>{/if}
  </p>
</ChartCard>

<style>
  .chips { display: grid; grid-template-columns: minmax(0, auto) minmax(0, 1fr); gap: 8px; margin: 0; }
  .chips div { padding: 7px 10px; border-radius: var(--r-chip); background: color-mix(in srgb, var(--lip) 28%, transparent); display: grid; gap: 3px; align-content: start; }
  .chips dt { font-size: var(--fs-s); font-weight: 700; color: var(--text-soft); }
  .chips dd { margin: 0; }
  .chips .money { font-size: var(--fs-talk); }
  .chips .n { font-size: var(--fs-s); font-weight: 700; color: var(--text-soft); font-variant-numeric: tabular-nums; }
  .proj { margin: 0; font-size: var(--fs-s); font-weight: 700; line-height: var(--lh); }
  .k-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--text-soft); opacity: .7; }
  /* the goal: dashed yuzu (ChartFrame's .goal.yuzu) */
  .k-goal { width: 14px; border-top: 2px dashed var(--c-yuzu-lip); }
</style>
