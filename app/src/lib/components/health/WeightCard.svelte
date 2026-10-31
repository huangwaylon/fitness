<script lang="ts">
  // 体重 (けんこう): per person (small multiples, each on its own axis) the period's average weigh-in and how many, the
  // change of the trend over the period and per week; that person's chart (the goal dashed on it) and, at today's pace,
  // the month the goal may be reached. Weight never earns: no ベル here and no colours for good or bad.
  import type { PersonId } from '#lib/types.ts';
  import { weightBuckets, weightStats, type HealthSeries, type Range } from '#lib/model/health.ts';
  import { t } from '#lib/i18n/index.ts';
  import Avatar from '../characters/Avatar.svelte';
  import WeightChart from './WeightChart.svelte';
  import { kgDelta, kgText, monthText } from '../kiroku/fmt.ts';
  import { rangeLabel } from './fmt.ts';

  interface Props {
    hs: HealthSeries;
    range: Range;
    shown: PersonId[];
    names: Record<PersonId, string>;
    villagers: Record<PersonId, string | null>;
    /** The open callout: whose chart and which bucket. */
    selected: { p: PersonId; i: number } | null;
    onselect: (s: { p: PersonId; i: number } | null) => void;
    onswipe: (dir: -1 | 1) => void;
    slide: -1 | 0 | 1;
  }
  let { hs, range, shown, names, villagers, selected, onselect, onswipe, slide }: Props = $props();
  const rows = $derived(shown.map((p) => ({ p, s: weightStats(hs, p, range), b: weightBuckets(hs, p, range), ps: hs.people[p] })));
</script>

<section class="card wc" data-metric="weight" aria-labelledby="mc-weight">
  <header>
    <span class="ic" aria-hidden="true"><svg viewBox="0 0 24 24"><use href="#i-scale" /></svg></span>
    <h3 id="mc-weight">{t('goal.weight')}</h3>
  </header>
  {#each rows as { p, s, b, ps } (p)}
    <div class="person" data-person={p}>
      <div class="hd">
        <span class="who"><Avatar person={p} villager={villagers[p]} size={26} /><i class="sw p{p}" aria-hidden="true"></i></span>
        <b class="nm">{names[p]}</b>
      </div>
      {#if s.n}
        <dl class="chips">
          <div><dt>{t('health.weight.avg')}</dt><dd class="money">{kgText(s.avg ?? 0)}</dd><dd class="n">{t('health.weight.count', { n: s.n })}</dd></div>
          <div><dt>{t('health.weight.change')}</dt><dd class="money">{kgDelta(s.change)}</dd>{#if s.perWeek !== null}<dd class="n">{t('health.weight.perWeek', { d: kgDelta(s.perWeek) })}</dd>{/if}</div>
        </dl>
      {:else}
        <p class="none">{t('health.noData')}</p>
      {/if}
      <WeightChart person={p} {range} buckets={b} goal={ps.goalWeight} today={hs.to}
        label={t('health.weight.chartLabel', { name: names[p], range: rangeLabel(range, hs.to), kg: s.avg === null ? t('health.noData') : kgText(s.avg) })}
        selected={selected?.p === p ? selected.i : null} onselect={(i) => onselect(i === null ? null : { p, i })} {onswipe} {slide} />
      {#if ps.goalWeight !== null && ps.projection && range.to === hs.to}
        <p class="proj">
          {#if ps.projection.kind === 'reached'}{t('weight.reached')}
          {:else if ps.projection.kind === 'date'}{t('weight.projected', { date: monthText(ps.projection.date) })}
          {:else}{t('weight.noDate')}{/if}
        </p>
      {/if}
    </div>
  {/each}
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
  .person { display: grid; gap: 8px; }
  .person + .person { padding-top: 8px; border-top: 1px dashed color-mix(in srgb, var(--lip) 70%, transparent); }
  .hd { display: flex; align-items: center; gap: 10px; }
  .who { position: relative; display: inline-flex; padding-bottom: 6px; }
  .sw { position: absolute; left: 3px; right: 3px; bottom: 0; height: 4px; border-radius: 2px; }
  .sw.pA { background: var(--person-a); }
  .sw.pB { background: var(--person-b); }
  .nm { font-size: var(--fs-body); }
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
