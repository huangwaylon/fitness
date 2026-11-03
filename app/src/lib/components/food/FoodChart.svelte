<script lang="ts">
  // ごはん's グラフ tab (docs/design.md "Gohan"): けんこう's range row (‹ the range › きょう, the period from Food's
  // dropdown; a horizontal drag on a chart turns the page), then the kcal eaten (FoodIntake: a bar per day / the daily
  // average per week or month, the flat average line) and, for a member, けんこう's 🍐 Move card for the same person,
  // period and range (the calories burned; the guest has no Health rows of its own: the intake only). One callout open.
  import '#lib/i18n/kenkou.ts'; // けんこう's strings: the periods, the range row, the Move card
  import type { LocalDate, Who } from '#lib/types.ts';
  import { isPersonId } from '#lib/contract/api.ts';
  import { canShift, healthSeries, rangeFor, shiftAnchor, type Period } from '#lib/model/health.ts';
  import { foodSeries } from '#lib/model/food.ts';
  import { week } from '#lib/store/week.svelte.ts';
  import { localDateAt } from '#lib/time/dates.ts';
  import { t } from '#lib/i18n/index.ts';
  import { cue } from '#lib/sound/cues.ts';
  import RangeNav from '../health/RangeNav.svelte';
  import MetricCard from '../health/MetricCard.svelte';
  import { rangeLabel } from '../health/fmt.ts';
  import FoodIntake from './FoodIntake.svelte';

  let { who, name, period }: { who: Who; name: string; period: Period } = $props();

  const m = $derived(week.model);
  const today = $derived<LocalDate>(m ? localDateAt(m.now) : '');
  const ds = $derived(m ? foodSeries(m.state, who, today) : null);
  /** けんこう's series, for a member with any Health record (the Move card). */
  const hs = $derived.by(() => {
    const h = m && isPersonId(who) ? healthSeries(m.state, m.now) : null;
    return h?.any ? h : null;
  });
  const any = $derived(!!ds?.vals.some((v) => v !== null));

  /** The last day shown (null: today, following the clock). */
  let anchor = $state<LocalDate | null>(null);
  let slide = $state<-1 | 0 | 1>(0);
  let sel = $state<{ k: 'intake' | 'move'; i: number } | null>(null);
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
  function pick(k: 'intake' | 'move', i: number | null) {
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
  </RangeNav>

  {#if any}
    <FoodIntake {ds} {range} {today} p={who} {name} {slide} onswipe={swipe} selected={sel?.k === 'intake' ? sel.i : null} onselect={(i) => pick('intake', i)} />
  {:else}
    <section class="card empty"><p>{t('kiroku.empty')}</p></section>
  {/if}
  {#if hs && isPersonId(who)}
    <MetricCard metric="move" {hs} {range} p={who} {slide} onswipe={swipe} selected={sel?.k === 'move' ? sel.i : null} onselect={(i) => pick('move', i)} />
  {/if}
  {#if any}<p class="note">{t('food.chart.note')}</p>{/if}
{/if}

<style>
  /* けんこう's range label (Health.svelte) */
  .rl { flex: 1; min-width: 0; display: grid; justify-items: center; gap: 3px; text-align: center; }
  .rl b { font-size: var(--fs-talk); line-height: 1.1; text-wrap: balance; }
  .rl b span { white-space: nowrap; }
  .rl small { font-size: var(--fs-s); font-weight: 700; color: var(--text-soft); white-space: nowrap; }
  .empty p { margin: 0; font-weight: 700; color: var(--text-soft); }
  .note { margin: 0 2px; font-size: var(--fs-s); font-weight: 700; color: var(--text-soft); line-height: var(--lh); }
</style>
