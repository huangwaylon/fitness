<script lang="ts">
  // ごはん's グラフ tab (docs/design.md "Gohan"): けんこう's range row (‹ the range › きょう, then けんこう's period
  // dropdown, Food's period; a horizontal drag on a chart turns the page), then the kcal eaten (FoodIntake: a bar per day / the daily
  // average per week or month, the flat average line) and, for a member, けんこう's 🍐 Move card for the same person,
  // period and range (the calories burned; the guest has no Health rows of its own: the intake only), then protein,
  // fat, carbs and salt the same way (FoodIntake, in g). Each intake card's goal at its upper right, mine to set
  // (GoalEdit), anyone else's read-only. One callout open.
  import '#lib/i18n/kenkou.ts'; // けんこう's strings: the periods, the range row, the Move card
  import type { LocalDate, Who } from '#lib/types.ts';
  import { isPersonId } from '#lib/contract/api.ts';
  import { canShift, healthSeries, PERIODS, rangeFor, shiftAnchor, type Period } from '#lib/model/health.ts';
  import { foodSeries, setGoal } from '#lib/model/food.ts';
  import { FOOD_GOAL_OF, type FoodGoalOf } from '#lib/contract/food.ts';
  import { week } from '#lib/store/week.svelte.ts';
  import { localDateAt } from '#lib/time/dates.ts';
  import { t } from '#lib/i18n/index.ts';
  import { cue } from '#lib/sound/cues.ts';
  import RangeNav from '../health/RangeNav.svelte';
  import Pick from '../health/Pick.svelte';
  import MetricCard from '../health/MetricCard.svelte';
  import { rangeLabel } from '../health/fmt.ts';
  import FoodIntake from './FoodIntake.svelte';
  import { saveFoodGoal } from './foodUi.ts';
  import { setMoveGoal } from '#lib/store/actions.ts';
  import { toasts } from '#lib/ui-state/toast.svelte.ts';
  import { isGuest } from '#lib/ui-state/viewer.ts';

  let { who, name, period, onperiod }: { who: Who; name: string; period: Period; onperiod: (p: Period) => void } = $props();

  const m = $derived(week.model);
  const today = $derived<LocalDate>(m ? localDateAt(m.now) : '');
  /** Each intake's days: kcal, then the nutrients (one pass over the record for all: model/food.ts dayTotals). */
  const all = $derived(m ? FOOD_GOAL_OF.map((n) => ({ n, ds: foodSeries(m.state, who, today, n, m.now) })) : null);
  const ds = $derived(all?.[0].ds ?? null);
  /** My own goals take a tap; anyone else's are shown. */
  const mine = $derived(who === week.view?.viewer);
  /** けんこう's series, for a member with any Health record (the Move card). */
  const hs = $derived.by(() => {
    const h = m && isPersonId(who) ? healthSeries(m.state, m.now) : null;
    return h?.any ? h : null;
  });
  /** The Move card's goal, set here as in けんこう (either member's, never on the guest's phone). */
  const move = $derived.by(() => {
    const v = week.view;
    if (!v || isGuest(v) || !isPersonId(who)) return null;
    const p = who;
    return { value: v.people[p].moveGoal, onsave: (g: number | null) => g !== null && setMoveGoal(p, g).ok && toasts.show(t('goal.moveSaved'), 2500, { reaction: 'pleased' }) };
  });
  const any = $derived(!!ds?.vals.some((v) => v !== null));

  /** The last day shown (null: today, following the clock). */
  let anchor = $state<LocalDate | null>(null);
  let slide = $state<-1 | 0 | 1>(0);
  let sel = $state<{ k: FoodGoalOf | 'move'; i: number } | null>(null);
  /** A new period: no slide, no callout (as けんこう's setPeriod). */
  let shown: Period | null = null;
  $effect.pre(() => {
    if (period === shown) return;
    if (shown !== null) (slide = 0), (sel = null);
    shown = period;
  });

  const range = $derived(today ? rangeFor(period, anchor ?? today) : null);
  /** ‹ goes back while either chart has something older: the first meal, or the first activity row. */
  const first = $derived(hs && ds && hs.activityFrom < ds.first ? hs.activityFrom : (ds?.first ?? today));
  const can = $derived(range ? canShift(range, first, today) : { back: false, on: false });

  function go(dir: -1 | 1, swiped = false) {
    if (!range || !(dir < 0 ? can.back : can.on)) return;
    const next = shiftAnchor(period, anchor ?? today, dir, today);
    anchor = next >= today ? null : next;
    slide = dir < 0 ? -1 : 1;
    sel = null;
    if (swiped) cue('tick');
  }
  function jumpToday() {
    if (anchor === null) return;
    anchor = null;
    slide = 1;
    sel = null;
  }
  const swipe = (dir: -1 | 1) => go(dir, true);
  function pick(k: FoodGoalOf | 'move', i: number | null) {
    sel = i === null ? null : { k, i };
    if (i !== null) cue('tick');
  }
</script>

{#if ds && range}
  <RangeNav earlier={t('health.earlier')} later={t('health.later')} today={t('health.today')} canBack={can.back} canOn={can.on} atToday={anchor === null}
    onback={() => go(-1)} onon={() => go(1)} ontoday={jumpToday}>
    <span class="rl" aria-live="polite">
      <b class="money" data-food-range>{#each rangeLabel(range, today).split('–') as part, i (i)}{#if i}–<wbr />{/if}<span>{part}</span>{/each}</b>
      <small>{t(`health.unit.${range.unit}`)}</small>
    </span>
    {#snippet end()}
      <span class="per"><Pick kind="period" value={period} options={PERIODS.map((id) => ({ id, label: t(`health.period.${id}`) }))} label={t('health.period')} onpick={onperiod} compact /></span>
    {/snippet}
  </RangeNav>

  {#snippet intake(n: FoodGoalOf, d: typeof ds)}
    {#if d && m}
      <FoodIntake {n} ds={d} {range} {today} p={who} {name} {slide} onswipe={swipe} selected={sel?.k === n ? sel.i : null} onselect={(i) => pick(n, i)}
        set={mine ? { value: setGoal(m.state, who, n), onsave: (v) => saveFoodGoal(who, n, v) } : null} />
    {/if}
  {/snippet}
  {#if all}{@render intake('k', all[0].ds)}{/if}
  {#if hs && isPersonId(who)}
    <MetricCard metric="move" {hs} {range} p={who} {slide} onswipe={swipe} selected={sel?.k === 'move' ? sel.i : null} onselect={(i) => pick('move', i)} goal={move} />
  {/if}
  {#if all}
    {#each all.slice(1) as x (x.n)}{@render intake(x.n, x.ds)}{/each}
  {/if}
  {#if any}<p class="note">{t('food.chart.note')}</p>{/if}
{/if}

<style>
  /* けんこう's range label (Health.svelte) */
  .rl { flex: 1; min-width: 0; display: grid; justify-items: center; gap: 3px; text-align: center; }
  .rl b { font-size: var(--fs-talk); line-height: 1.1; text-wrap: balance; }
  .rl b span { white-space: nowrap; }
  /* (the period beside きょう leaves the range a narrow middle: its unit wraps, 「1か月ごとの / 1日平均」) */
  .rl small { font-size: var(--fs-s); font-weight: 700; line-height: 1.2; color: var(--text-soft); text-wrap: balance; }
  .per { flex: none; display: flex; }
  .note { margin: 0 2px; font-size: var(--fs-s); font-weight: 700; color: var(--text-soft); line-height: var(--lh); }
</style>
