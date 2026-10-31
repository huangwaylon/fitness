<script lang="ts">
  // One person's weight (ADR 0020): the trend in kg, this week's change, the change since the first weigh-in and the
  // weekly pace; the 12-week chart (dots = weigh-ins, line = trend, dashes = goal); the goal and, at the current pace, a
  // month it may be reached. 体重を記録 (the goal is set in きろく's 目標 card). The recent weigh-ins double as the chart's table view, and
  // each row fixes that day: on either person's screen (ADR 0023: either person edits either person's data). Supportive wording only: no red, no "bad week".
  import type { PersonId } from '#lib/types.ts';
  import type { WeightTrend } from '#lib/model/weight.ts';
  import { WEIGHT } from '#lib/config/rules.ts';
  import Avatar from '../characters/Avatar.svelte';
  import Glyph from './Glyph.svelte';
  import WeightChart from './WeightChart.svelte';
  import { dayTitle, kgDelta, kgText, monthText } from './fmt.ts';
  import { t } from '#lib/i18n/index.ts';

  interface Props {
    w: WeightTrend;
    person: PersonId;
    name: string;
    villager: string | null;
    mine: boolean;
    today: string;
    onlog: (date: string) => void;
  }
  let { w, person, name, villager, mine, today, onlog }: Props = $props();
  const recent = $derived(w.points.slice(-7).reverse());
</script>

<header class="who">
  <Avatar {person} {villager} size={34} />
  <h3>{name}{#if mine}<small> · {t('kiroku.me')}</small>{/if}</h3>
</header>

{#if w.latest}
  <section class="card stats">
    <div class="now">
      <span class="k">{t('weight.trend')}</span>
      <b class="hero-num">{w.latest.trend.toFixed(1)}<small>kg</small></b>
    </div>
    <dl class="chips">
      <div><dt>{t('weight.week')}</dt><dd class="money">{kgDelta(w.weekChange)}</dd></div>
      <div><dt>{t('weight.since')}</dt><dd class="money">{kgDelta(w.sinceStart)}</dd></div>
    </dl>
    {#if w.perWeek !== null}<p class="pace">{t('weight.pace', { d: kgDelta(w.perWeek) })}</p>{/if}
    <WeightChart points={w.points} goal={w.goal} to={today}
      label={t('weight.chartLabel', { name, weeks: WEIGHT.chartWeeks, kg: kgText(w.latest.trend) })} />
    <p class="legend" aria-hidden="true">
      <span><i class="ldot"></i>{t('weight.legend.day')}</span>
      <span><i class="lline"></i>{t('weight.legend.trend')}</span>
      {#if w.goal !== null}<span><i class="lgoal"></i>{t('weight.goalShort', { kg: '' }).trim()}</span>{/if}
    </p>
    {#if w.goal !== null && w.projection}
      <p class="proj">
        <b>{t('weight.goalShort', { kg: kgText(w.goal) })}</b>
        {#if w.projection.kind === 'reached'}{t('weight.reached')}
        {:else if w.projection.kind === 'date'}{t('weight.projected', { date: monthText(w.projection.date) })}
        {:else}{t('weight.noDate')}{/if}
      </p>
    {/if}
  </section>
{:else}
  <section class="card stats empty"><p>{mine ? t('weight.emptyMine') : t('weight.empty')}</p></section>
{/if}

<div class="acts">
  <button type="button" class="btn small" data-focus="weight-log" data-sfx="page" onclick={() => onlog(today)}>{t('weight.log')}</button>
</div>

<p class="note">{t('weight.note')}</p>

{#if recent.length}
  <section class="card recent" aria-labelledby="wrec-h">
    <h4 id="wrec-h">{t('weight.recent')}</h4>
    <table>
      <thead><tr><th scope="col">{t('weight.col.day')}</th><th scope="col">{t('weight.col.kg')}</th><th scope="col">{t('weight.legend.trend')}</th><th><span class="sr-only">✎</span></th></tr></thead>
      <tbody>
        {#each recent as p (p.date)}
          <tr>
            <td>{dayTitle(p.date)}</td>
            <td class="money">{p.kg.toFixed(1)}</td>
            <td class="money soft">{p.trend.toFixed(1)}</td>
            <td class="pc"><button type="button" class="pen-btn" data-focus="wfix:{p.date}" data-sfx="page" aria-label={t('weight.fix', { date: dayTitle(p.date) })} onclick={() => onlog(p.date)}><Glyph kind="pen" size={18} /></button></td>
          </tr>
        {/each}
      </tbody>
    </table>
  </section>
{/if}

<style>
  .who { display: flex; align-items: center; gap: 10px; margin: 0 2px; }
  .who h3 { margin: 0; font-size: var(--fs-talk); }
  .who small { font-size: var(--fs-s); color: var(--text-soft); }
  .stats { display: grid; gap: 10px; padding: 14px 14px 12px; }
  .stats.empty p { margin: 0; font-size: var(--fs-body); font-weight: 700; color: var(--text-soft); line-height: var(--lh); }
  .now { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; }
  .k { font-size: var(--fs-body); font-weight: 700; color: var(--text-soft); }
  .now small { font-size: var(--fs-talk); margin-left: 4px; color: var(--text-soft); }
  .chips { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; margin: 0; }
  .chips div { padding: 8px 10px; border-radius: var(--r-chip); background: color-mix(in srgb, var(--lip) 28%, transparent); display: grid; gap: 4px; }
  .chips dt { font-size: var(--fs-s); font-weight: 700; color: var(--text-soft); }
  .chips dd { margin: 0; font-size: var(--fs-talk); }
  .pace { margin: -2px 2px 4px; font-size: var(--fs-s); font-weight: 700; color: var(--text-soft); font-variant-numeric: tabular-nums; }
  .legend { display: flex; flex-wrap: wrap; gap: 4px 14px; margin: 0; font-size: var(--fs-s); font-weight: 700; color: var(--text-soft); }
  .legend span { display: inline-flex; align-items: center; gap: 6px; }
  .legend i { display: inline-block; flex: none; }
  .ldot { width: 7px; height: 7px; border-radius: 50%; background: var(--c-mint-lip); opacity: .75; }
  .lline { width: 16px; height: 2px; border-radius: 2px; background: var(--text); }
  .lgoal { width: 16px; border-top: 2px dashed var(--c-yuzu-lip); }
  .proj { margin: 0; font-size: var(--fs-body); font-weight: 700; line-height: var(--lh); }
  .proj b { margin-right: 6px; white-space: nowrap; }
  .acts { display: flex; gap: 10px; flex-wrap: wrap; }
  .acts .btn { flex: 1 1 8em; margin: 0; }
  .note { margin: 0 2px; font-size: var(--fs-s); font-weight: 700; color: var(--text-soft); line-height: var(--lh); }
  .recent { padding: 12px 14px; display: grid; gap: 6px; }
  .recent h4 { margin: 0; font-size: var(--fs-body); }
  table { width: 100%; border-collapse: collapse; font-size: var(--fs-body); }
  th { font-size: var(--fs-xs); color: var(--text-soft); text-align: right; font-weight: 700; padding: 2px 4px; }
  th:first-child, td:first-child { text-align: left; }
  td { text-align: right; padding: 2px 4px; height: var(--row-obj); border-top: 1px dashed color-mix(in srgb, var(--lip) 70%, transparent); }
  td.soft { color: var(--text-soft); }
  td.pc { width: var(--hit); padding: 0; }
</style>
