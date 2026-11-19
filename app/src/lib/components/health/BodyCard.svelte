<script lang="ts">
  // A からだ card (けんこう): 体重, 体脂肪率, BMI, 除脂肪体重, 筋肉量, 骨格筋量 or 基礎代謝量, for the chosen person, in
  // ChartCard (its goal at the upper right: GoalEdit, each optional, per person; 基礎代謝量 none). One stat line, the same
  // in every card (the user, 2026-11-19: charts first, the stats a small summary): the period's last measurement, its
  // day when it isn't the period's last (the axis says that one), BMI's category by the Asian cut-offs, and a chip
  // 「N日で +0.2 kg」 (the last − the first measurement of the period, N the days between, InBody's way; none under
  // two). Then the dot chart, the goal solid on it (the chip its only words). Data only (the user, 2026-11-19): no
  // coaching or forecast lines. 基礎代謝量 (InBody's formula from 除脂肪体重) and 筋肉量 / 骨格筋量, which Apple Health lacks
  // (contract/bodyEst.ts: from 除脂肪体重, calibrated by the person's InBody sheets, else the sex's ratio), carry a small
  // 「計算 ⓘ」 / 「推定 ⓘ」 that unfolds how under the chart. Nothing is typed in here. Never earns, no good / bad colours.
  import type { PersonId } from '#lib/types.ts';
  import { dotSeries, dotStats, type BodyId, type HealthSeries, type Range } from '#lib/model/health.ts';
  import { formatNum, t } from '#lib/i18n/index.ts';
  import '#lib/i18n/sheets.ts';
  import { bmiCategory } from '#lib/model/profile.ts';
  import { md } from '#lib/i18n/format.ts';
  import { isBodyEst } from '#lib/contract/bodyEst.ts';
  import ChartCard from './ChartCard.svelte';
  import DotChart from './DotChart.svelte';
  import { goalLabel, goalName, valueText } from './goals.ts';
  import { deltaText, spokenRange } from './fmt.ts';
  import Phrases from '#lib/components/ui/Phrases.svelte';

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

  /** The latest's day, but when it is the period's last (the axis's last label says it). */
  const showDate = $derived(!!s.latest && s.latest.date !== (range.to < hs.to ? range.to : hs.to));

  /** 基礎代謝量 / 筋肉量 / 骨格筋量: how it's worked out (the person's InBody sheets, else the sex's ratio), on a tap. */
  const note = $derived(id === 'bmr' ? t('health.bmr.note') : isBodyEst(id) ? t(hs.people[p].calibrated[id] ? 'health.est.calibrated' : 'health.est.default') : '');
  let open = $state(false);
</script>

<ChartCard {id} {title} {p} {goal} start={s.latest?.kg ?? null} {onsave} tone="yuzu" empty={!hs.any} kind="metric">
  {#if s.n}
    <p class="sl">
      <b class="v" data-stat="latest">{fmt(s.latest!.kg)}</b>
      {#if showDate}<span data-stat="date">{md(s.latest!.date)}</span>{/if}
      {#if note}<button type="button" class="est" data-sfx="tick" aria-expanded={open} aria-controls="{id}-{p}-note" onclick={() => (open = !open)}>{t(id === 'bmr' ? 'health.bmr.tag' : 'health.est.tag')} ⓘ</button>{/if}
      {#if cat}<span data-bmi-cat={cat}>{t(`health.bmi.${cat}`)}</span>{/if}
      {#if s.since}<span class="dc">{t('health.body.since', { n: s.since.days })} <span data-stat="since">{delta(s.since.d)}</span></span>{/if}
    </p>
  {:else}
    <p class="none"><Phrases text={t('health.noData')} /></p>
  {/if}
  <DotChart {id} person={p} {range} buckets={b} {fmt} {minSpan} {goal} today={hs.to}
    label={t('health.body.chartLabel', { name, what: title, range: spokenRange(range, hs.to), v: s.latest ? fmt(s.latest.kg) : t('health.noData'), goal: gl })}
    {selected} {onselect} {onswipe} {slide} />
  {#if note && open}<p class="foot note" id="{id}-{p}-note" data-note={id}>{note}</p>{/if}
</ChartCard>

<style>
  /* a soft word in the stat line, its tap area 44 px tall without growing the line */
  .est { all: unset; position: relative; cursor: pointer; color: var(--text-soft); font: inherit; white-space: nowrap; }
  .est::after { content: ''; position: absolute; inset: -14px -8px; }
  .est:focus-visible { border-radius: var(--r-chip); }
</style>
