<script lang="ts">
  // A からだ card (けんこう): 体重, 体脂肪率, BMI, 除脂肪体重, 筋肉量, 骨格筋量 or 基礎代謝量, for the chosen person, in
  // ChartCard (its goal at the upper right: GoalEdit, each optional, per person; 基礎代謝量 none). One stat line, the same
  // in every card (the user, 2026-11-19: charts first, the stats a small summary): the period's last measurement, its
  // day when it isn't the period's last (the axis says that one), BMI's category by the Asian cut-offs, and a chip
  // 「N日で +0.2 kg」 (the trend line's change from the period's first measurement to its last, N the days between: a
  // home scale's single readings are too noisy for the raw last − first; model/health.ts dotStats; none under two).
  // Then the dot chart, the goal solid on it (the chip its only words). Data only (the user, 2026-11-19): no coaching
  // lines; every card draws its trend line (the chip's change: model/health.ts dotLine), 体重's also its projection on
  // 1か月 / 3か月 today (the pace card's, model/pace.ts: the user 2026-11-21); one quiet 〰 傾向線 toggle at the end of
  // 体重's stat line turns them all (on by default, kept per phone: prefs.ts; off: the thin line through the dots).
  // 基礎代謝量 (InBody's formula from 除脂肪体重) and 筋肉量 / 骨格筋量, which Apple Health lacks (contract/bodyEst.ts: from
  // 除脂肪体重, calibrated by the person's InBody sheets, else the sex's ratio), carry a small 「計算 ⓘ」 / 「推定 ⓘ」 that
  // unfolds how under the chart. Nothing is typed in here. Never earns, no good / bad colours.
  import type { PersonId } from '#lib/types.ts';
  import type { WeighIn } from '#lib/model/weight.ts';
  import type { Ahead } from '#lib/model/pace.ts';
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
    /** The card's trend line (model/health.ts dotLine), 体重's projection (DotChart), and whether they show (傾向線). */
    line: readonly WeighIn[];
    ahead?: Ahead | null;
    trend: boolean;
    /** 傾向線's toggle, on 体重's card only (it turns every card's line). */
    ontrend?: (() => void) | null;
  }
  let { id, hs, range, p, name, selected, onselect, onswipe, slide, onsave = null, line, ahead = null, trend, ontrend = null }: Props = $props();
  const wl = $derived(!!ontrend);
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
    <p class="sl" class:wlrow={wl}>
      <b class="v" data-stat="latest">{fmt(s.latest!.kg)}</b>
      {#if showDate}<span data-stat="date">{md(s.latest!.date)}</span>{/if}
      {#if note}<button type="button" class="est" data-sfx="tick" aria-expanded={open} aria-controls="{id}-{p}-note" onclick={() => (open = !open)}>{t(id === 'bmr' ? 'health.bmr.tag' : 'health.est.tag')} ⓘ</button>{/if}
      {#if cat}<span data-bmi-cat={cat}>{t(`health.bmi.${cat}`)}</span>{/if}
      {#if s.since}<span class="dc">{t('health.body.since', { n: s.since.days })} <span data-stat="since">{delta(s.since.d)}</span></span>{/if}
      {#if wl}
        <!-- 体重's 傾向線: a swatch of what it draws (the smooth line in the person's colour; off, a faint zigzag through dots) -->
        <button type="button" class="est wl" aria-pressed={trend} aria-label={t('health.weight.lineLabel')} data-weight-line={trend ? 'trend' : 'raw'} data-sfx="tick" onclick={ontrend}>
          <svg class="swatch p{p}" class:on={trend} width="14" height="8" viewBox="0 0 14 8" aria-hidden="true">
            {#if trend}<path d="M1 6.5C4 6.5 5 2.5 7.5 3S10.5 1.5 13 1.5" />
            {:else}<polyline points="1,6 4.5,2 8,5.5 13,1.5" />{#each [[1, 6], [4.5, 2], [8, 5.5], [13, 1.5]] as [cx, cy] (cx)}<circle {cx} {cy} r="1.1" />{/each}{/if}
          </svg>{t('health.weight.line')}
        </button>
      {/if}
    </p>
  {:else}
    <p class="none"><Phrases text={t('health.noData')} /></p>
  {/if}
  <DotChart {id} person={p} {range} buckets={b} {fmt} {minSpan} {goal} today={hs.to}
    label={t('health.body.chartLabel', { name, what: title, range: spokenRange(range, hs.to), v: s.latest ? fmt(s.latest.kg) : t('health.noData'), goal: gl })}
    {selected} {onselect} {onswipe} {slide} line={trend ? line : null} ahead={trend ? ahead : null} />
  {#if note && open}<p class="foot note" id="{id}-{p}-note" data-note={id}>{note}</p>{/if}
</ChartCard>

<style>
  /* a soft word in the stat line, its tap area 44 px tall without growing the line */
  .est { all: unset; position: relative; cursor: pointer; color: var(--text-soft); font: inherit; white-space: nowrap; }
  .est::after { content: ''; position: absolute; inset: -14px -8px; }
  .est:focus-visible { border-radius: var(--r-chip); }
  /* 体重's toggle at the line's right end (the chip beside the stats, not pushed away from them) */
  .wl { margin-left: auto; display: inline-flex; align-items: center; gap: 4px; }
  .sl.wlrow .dc { margin-left: 0; }
  .swatch { flex: none; fill: none; stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round; }
  .swatch.on.pA { stroke: var(--person-a); }
  .swatch.on.pB { stroke: var(--person-b); }
  .swatch:not(.on) { stroke: currentColor; opacity: .45; }
  .swatch:not(.on) circle { fill: currentColor; stroke: none; }
</style>
