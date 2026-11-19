<script lang="ts">
  // A からだ card (けんこう): 体重, 体脂肪率, BMI, 除脂肪体重, 筋肉量, 骨格筋量 or 基礎代謝量, for the chosen person, in
  // ChartCard (its goal at the upper right: GoalEdit, each optional, per person; 基礎代謝量 none). One stat line, the same
  // in every card (the user, 2026-11-19: charts first, the stats a small summary): the period's last measurement, its
  // day (BMI's category by the Asian cut-offs beside it), and a chip 「N日で +0.2 kg」 (the last − the first measurement
  // of the period, N the days between, InBody's way; none under two). Then the dot chart (the goal solid on it, the
  // chip its only words), and footnotes: in the current period with a goal the month it may be reached at that pace (the
  // goal's way); 基礎代謝量 worked out (InBody's formula from 除脂肪体重); 筋肉量 and 骨格筋量, which Apple Health lacks,
  // estimated from it (contract/bodyEst.ts: calibrated by the person's InBody sheets, else the sex's ratio). Nothing
  // is typed in here. Never earns, no good / bad colours.
  import type { PersonId } from '#lib/types.ts';
  import { dotSeries, dotStats, type BodyId, type HealthSeries, type Range } from '#lib/model/health.ts';
  import { formatNum, t } from '#lib/i18n/index.ts';
  import '#lib/i18n/sheets.ts';
  import { bmiCategory } from '#lib/model/profile.ts';
  import { md, monthLabel } from '#lib/i18n/format.ts';
  import { isBodyEst } from '#lib/contract/bodyEst.ts';
  import ChartCard from './ChartCard.svelte';
  import DotChart from './DotChart.svelte';
  import { goalLabel, goalName, valueText } from './goals.ts';
  import { deltaText, spokenRange } from './fmt.ts';

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
  const title = $derived(id === 'bmr' ? t('health.body.bmr') : goalName(id));
  const fmt = $derived((v: number) => (id === 'bmr' ? `${formatNum(Math.round(v))} kcal` : valueText(id, v, 1)));
  const delta = $derived((d: number) => (id === 'bmr' ? `${d < 0 ? '−' : d > 0 ? '+' : '±'}${formatNum(Math.abs(Math.round(d)))} kcal` : deltaText(id, d)));
  /** The narrowest axis: 2 kg or 2 points of body fat, 1 of BMI, 40 kcal. */
  const minSpan = $derived(id === 'bmi' ? 1 : id === 'bmr' ? 40 : 2);
  const gl = $derived(id === 'bmr' ? '' : goalLabel(id, goal));
  /** BMI's category for the latest measurement. */
  const cat = $derived(id === 'bmi' && s.latest ? bmiCategory(s.latest.kg) : null);

  /** 筋肉量 / 骨格筋量: how the estimate is made (the person's InBody sheets, else the sex's ratio). */
  const note = $derived(id === 'bmr' ? t('health.bmr.note') : isBodyEst(id) ? t(hs.people[p].calibrated[id] ? 'health.est.calibrated' : 'health.est.default') : '');
</script>

<ChartCard {id} {title} {p} {goal} start={s.latest?.kg ?? null} {onsave} tone="yuzu" empty={!hs.any} kind="metric">
  {#if s.n}
    <p class="sl">
      <b class="v" data-stat="latest">{fmt(s.latest!.kg)}</b>
      <span>{md(s.latest!.date)}</span>
      {#if cat}<span data-bmi-cat={cat}>{t(`health.bmi.${cat}`)}</span>{/if}
      {#if s.since}<span class="dc">{t('health.body.since', { n: s.since.days })} <span data-stat="since">{delta(s.since.d)}</span></span>{/if}
    </p>
  {:else}
    <p class="none">{t('health.noData')}</p>
  {/if}
  <DotChart {id} person={p} {range} buckets={b} {fmt} {minSpan} {goal} goalText={t('goal.title')} today={hs.to}
    label={t('health.body.chartLabel', { name, what: title, range: spokenRange(range, hs.to), v: s.latest ? fmt(s.latest.kg) : t('health.noData'), goal: gl })}
    {selected} {onselect} {onswipe} {slide} />
  {#if s.projection && range.to === hs.to}
    <p class="foot proj" data-proj={s.projection.kind}>
      {#if s.projection.kind === 'reached'}{t('weight.reached')}
      {:else if s.projection.kind === 'date'}{t('weight.projected', { date: monthLabel(s.projection.date) })}
      {:else}{t('weight.noDate')}{/if}
    </p>
  {/if}
  {#if note}<p class="foot note" data-note={id}>{note}</p>{/if}
</ChartCard>

<style>
  .proj { color: var(--text); }
</style>
