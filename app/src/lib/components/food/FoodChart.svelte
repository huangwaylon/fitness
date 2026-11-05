<script lang="ts">
  // ごはん's グラフ tab (docs/design.md "Gohan"): けんこう's range row (‹ the range › きょう, then けんこう's period
  // dropdown, Food's period; a horizontal drag on a chart turns the page: RangePager), then the kcal eaten and protein,
  // fat, carbs and salt (BarCard, けんこう's card: a bar per day / the daily average per week or month, met the goal's
  // way, the flat average line). Each card's goal at its upper right, mine to set (GoalEdit), anyone else's read-only.
  // One callout open.
  import '#lib/i18n/kenkou.ts'; // けんこう's strings: the periods, the range row
  import type { LocalDate, Who } from '#lib/types.ts';
  import { PERIODS, type Period } from '#lib/model/health.ts';
  import { foodSeries, setGoal } from '#lib/model/food.ts';
  import { FOOD_GOAL_OF } from '#lib/contract/food.ts';
  import { week } from '#lib/store/week.svelte.ts';
  import { localDateAt } from '#lib/time/dates.ts';
  import { t } from '#lib/i18n/index.ts';
  import RangeNav from '../health/RangeNav.svelte';
  import RangeLabel from '../health/RangeLabel.svelte';
  import Pick from '../health/Pick.svelte';
  import BarCard from '../health/BarCard.svelte';
  import { goalName, kcalWarn, saveGoal } from '../health/goals.ts';
  import { RangePager } from '../health/pager.svelte.ts';

  let { who, name, period, onperiod }: { who: Who; name: string; period: Period; onperiod: (p: Period) => void } = $props();

  const m = $derived(week.model);
  const today = $derived<LocalDate>(m ? localDateAt(m.now) : '');
  /** Each intake's days: kcal, then the nutrients (one pass over the record for all: model/food.ts dayTotals). */
  const all = $derived(m ? FOOD_GOAL_OF.map((n) => ({ n, ds: foodSeries(m.state, who, today, n, m.now) })) : null);
  /** My own goals take a tap; anyone else's are shown. */
  const mine = $derived(who === week.view?.viewer);
  /** Nothing logged at all yet: each card holds its goal (set there) over one line. */
  const any = $derived(!!all?.[0].ds.vals.some((v) => v !== null));

  const pager = new RangePager(() => ({ period, today, first: all?.[0].ds.first ?? today }));
  /** A new period: no slide, no callout (as けんこう's setPeriod). */
  let shown: Period | null = null;
  $effect.pre(() => {
    if (period === shown) return;
    if (shown !== null) pager.reset();
    shown = period;
  });
</script>

{#if all && m && pager.range}
  {@const range = pager.range}
  <RangeNav earlier={t('health.earlier')} later={t('health.later')} today={t('health.today')} canBack={pager.can.back} canOn={pager.can.on} atToday={pager.anchor === null}
    onback={() => pager.go(-1)} onon={() => pager.go(1)} ontoday={() => pager.jumpToday()}>
    <RangeLabel {range} {today} />
    {#snippet end()}
      <span class="per"><Pick kind="period" value={period} options={PERIODS.map((id) => ({ id, label: t(`health.period.${id}`) }))} label={t('health.period')} onpick={onperiod} compact /></span>
    {/snippet}
  </RangeNav>

  {#each all as { n, ds } (n)}
    <BarCard id={n} {ds} {range} {today} p={who} {name} title={n === 'k' ? t('food.chart.head') : goalName(n)} empty={!any} food
      now={setGoal(m.state, who, n)} start={ds.goal(0)} onsave={mine ? (v) => saveGoal(n, who, v) : null} warn={n === 'k' && mine ? kcalWarn(m.state, who, m.now) : null}
      selected={pager.selected(n)} onselect={(i) => pager.pick(n, i)} onswipe={pager.swipe} slide={pager.slide} />
  {/each}
  {#if any}<p class="note">{t('food.chart.note')}</p>{/if}
{/if}

<style>
  .per { flex: none; display: flex; }
  .note { margin: 0 2px; font-size: var(--fs-s); font-weight: 700; color: var(--text-soft); line-height: var(--lh); }
</style>
