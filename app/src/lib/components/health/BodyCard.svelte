<script lang="ts">
  // A からだ card (けんこう): 体重, 体脂肪率, BMI, 除脂肪体重, 筋肉量, 骨格筋量 or 基礎代謝量, for the chosen person, in
  // ChartCard (its goal at the upper right: GoalEdit, each optional, per person; 基礎代謝量 none). One stat row of two
  // equal boxes, the same in every card (the user, 2026-11-19: 「スッキリ」): 最新 (the period's last measurement, its
  // day; BMI's category by the Asian cut-offs under it) and 「N日前より」 (the last − the first measurement of the
  // period, N the days between, as InBody's sheet says it; 変化 – under two). Then the dot chart (the goal solid on it,
  // the chip its only words), and in the current period with a goal the month it may be reached at that pace (the
  // goal's way). 基礎代謝量 says it is worked out (InBody's formula from 除脂肪体重); 筋肉量 and 骨格筋量, which Apple
  // Health lacks, say they are estimated from it (contract/bodyIn.ts: calibrated by the person's InBody readings, else
  // the sex's ratio). Nothing is typed in here. Never earns, no good / bad colours.
  import type { PersonId } from '#lib/types.ts';
  import { dotSeries, dotStats, type BodyId, type HealthSeries, type Range } from '#lib/model/health.ts';
  import { formatNum, t } from '#lib/i18n/index.ts';
  import '#lib/i18n/sheets.ts';
  import { bmiCategory } from '#lib/model/profile.ts';
  import { md, monthLabel } from '#lib/i18n/format.ts';
  import { isBodyIn } from '#lib/contract/bodyIn.ts';
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

  /** 筋肉量 / 骨格筋量: how the estimate is made (the person's InBody readings, else the sex's ratio). */
  const note = $derived(id === 'bmr' ? t('health.bmr.note') : isBodyIn(id) ? t(hs.people[p].calibrated[id] ? 'health.est.calibrated' : 'health.est.default') : '');
</script>

<ChartCard {id} {title} {p} {goal} start={s.latest?.kg ?? null} {onsave} tone="yuzu" empty={!hs.any} kind="metric">
  {#if s.n}
    <dl class="stats">
      <div>
        <dt>{t('health.body.latest')} <span class="when">{md(s.latest!.date)}</span></dt>
        <dd class="money" data-stat="latest">{fmt(s.latest!.kg)}</dd>
        {#if cat}<dd class="sub" data-bmi-cat={cat}>{t('health.bmi.cat', { cat: t(`health.bmi.${cat}`) })}</dd>{/if}
      </div>
      <div>
        <dt>{s.since ? t('health.body.since', { n: s.since.days }) : t('health.body.change')}</dt>
        <dd class="money" data-stat="since">{s.since ? delta(s.since.d) : '–'}</dd>
      </div>
    </dl>
  {:else}
    <p class="none">{t('health.noData')}</p>
  {/if}
  {#if note}<p class="sub note" data-note={id}>{note}</p>{/if}
  <DotChart {id} person={p} {range} buckets={b} {fmt} {minSpan} {goal} goalText={t('goal.title')} today={hs.to}
    label={t('health.body.chartLabel', { name, what: title, range: spokenRange(range, hs.to), v: s.latest ? fmt(s.latest.kg) : t('health.noData'), goal: gl })}
    {selected} {onselect} {onswipe} {slide} />
  {#if s.projection && range.to === hs.to}
    <p class="sub proj" data-proj={s.projection.kind}>
      {#if s.projection.kind === 'reached'}{t('weight.reached')}
      {:else if s.projection.kind === 'date'}{t('weight.projected', { date: monthLabel(s.projection.date) })}
      {:else}{t('weight.noDate')}{/if}
    </p>
  {/if}
</ChartCard>

<style>
  /* one row of two equal boxes, the same label / value / sub-line in each */
  .stats { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; margin: 0; }
  .stats div { padding: 7px 10px; border-radius: var(--r-chip); background: color-mix(in srgb, var(--lip) 28%, transparent); display: grid; gap: 2px; align-content: start; }
  .stats dt { font-size: var(--fs-s); font-weight: 700; color: var(--text-soft); }
  .when { font-variant-numeric: tabular-nums; }
  .stats dd { margin: 0; }
  .stats .money { font-size: var(--fs-talk); font-variant-numeric: tabular-nums; }
  .sub { margin: 0; font-size: var(--fs-s); font-weight: 700; color: var(--text-soft); line-height: var(--lh); }
  .proj { color: var(--text); }
</style>
