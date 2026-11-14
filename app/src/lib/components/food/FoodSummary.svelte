<script lang="ts">
  // ごはん's summary card for one person's day: the day's kcal large, against their daily goal when set (a bar in the
  // person's colour; beside it today あと N / N オーバー, a past day 目標より N 少なめ / 多め, coral only past 20 %
  // over: goalChip; the goal at the upper right, GoalEdit, set there on my own day), then protein, fat, carbs and salt,
  // each with its goal and its direction when there is one (「目標 110 g 以上」: グラフ sets them; protein's default
  // 1.6 g × the latest weigh-in, a member's with a weight) and a small bar, coral once past a ceiling (salt and fat at
  // most, carbs past their band: contract/goals.ts goalOver). BarCard's tokens, a row of four, then fibre (データなし while no
  // entry knows it) and alcohol (on a day with any); then the PFC balance (PfcBar: the shares of energy against the
  // 食事摂取基準's ranges). A day with nothing logged: 「きろく
  // なし」 on a past one (not 0 kcal, which reads as eaten nothing), 0 kcal today; no nutrient tiles either way.
  import type { Who } from '#lib/types.ts';
  import type { FoodDay } from '#lib/model/food.ts';
  import { t } from '#lib/i18n/index.ts';
  import type { FoodGoalOf } from '#lib/contract/food.ts';
  import { kcalText } from '../kiroku/fmt.ts';
  import GoalEdit from '../health/GoalEdit.svelte';
  import { goalOver } from '#lib/contract/goals.ts';
  import { GOAL_SPECS, goalLabel } from '../health/goals.ts';
  import { foodLast, goalChip } from './foodUi.ts';
  import PfcBar from './PfcBar.svelte';

  interface Props {
    day: FoodDay;
    who: Who;
    /** The day's goals: kcal and each nutrient (null: none). */
    goals: Record<FoodGoalOf, number | null>;
    /** The day against today: a past day's chip says 少なめ / 多め, tomorrow's (a いつもの's preview) none. */
    when: 'past' | 'today' | 'next';
    /** Sets the kcal goal (my own day only; absent: read-only). */
    onsavegoal?: ((v: number | null) => void) | null;
    /** The kcal editor's gentle note on a low goal (goals.ts kcalWarn). */
    warngoal?: ((v: number) => string | null) | null;
  }
  let { day, who, goals, when, onsavegoal = null, warngoal = null }: Props = $props();
  const goal = $derived(goals.k);

  const share = $derived(goal ? Math.min(1, day.kcal / goal) : 0);
  const empty = $derived(day.entries.length === 0);
  const chip = $derived(goal === null || when === 'next' || (empty && when === 'past') ? null : goalChip(day.kcal, goal, when === 'today'));
  const gText = (n: number) => t('food.g', { n: n.toFixed(1) });
  /** A total some entry doesn't know (a product's salt, unknown on its label): the known ones' sum, shown 「≥」, its tile
   *  saying 一部不明 in words (no hover on a phone) and its bar hatched. */
  const partial = (k: string): boolean => (k === 'p' || k === 'fa' || k === 'c' || k === 's') && day.entries.some((e) => e.f[k] === null);
  /** The tiles: the four, fibre, and alcohol on a day with some. */
  const cells = $derived([
    ...(['p', 'fa', 'c', 's', 'fi'] as const).map((k) => ({ k, v: day[k], goal: goals[k] })),
    ...(day.al > 0 ? [{ k: 'al' as const, v: day.al, goal: goals.al }] : [])
  ]);
  const LINE = ['p', 'fa', 'c', 's'] as const;
  const over = (k: (typeof LINE)[number]) => goals[k] !== null && goalOver(k, day[k], goals[k]!);
</script>

<section class="card sum p{who}" data-food-summary aria-labelledby="fs-h">
  <!-- the kcal large at the left of its title row (この日のカロリー its name for a screen reader), the goal at its right;
       the bar under it with あと N kcal at its end: three short rows, so the meals' ＋ show on opening -->
  <header>
    <h3 id="fs-h" class="sr-only">{t('food.kcalHead')}</h3>
    {#if empty && when === 'past'}
      <b class="total none" data-food-total data-food-none>{t('food.noLog')}</b>
    {:else}
      <b class="total money" data-food-total>{kcalText(day.kcal)}</b>
    {/if}
    <GoalEdit id="kcal-goal" spec={GOAL_SPECS.k} label={goalLabel('k', goal)} value={goal} onsave={onsavegoal} warn={warngoal} />
  </header>
  {#if goal !== null && !(empty && when === 'past')}
    <div class="brow">
      <div class="bar" role="presentation"><i style:width="{share * 100}%"></i></div>
      {#if chip}<span class="chg" class:over={chip.over} data-food-chip>{chip.text}</span>{/if}
    </div>
  {/if}
  {#if !empty}<details class="more" bind:open={foodLast.more} data-food-more>
  <!-- folded: one line of P · F · C · 塩分 (a value past its ceiling coral), so the meals' ＋ show on opening; open: the tiles and the PFC balance -->
  <summary data-sfx="tick">
    <span class="line money">{#each LINE as k (k)}<span class="nv" class:over={over(k)} data-line={k}><span aria-hidden="true">{k === 's' ? t('food.s') : k === 'fa' ? 'F' : k.toUpperCase()}</span><span class="sr-only">{t(`food.${k}`)}</span> {#if partial(k)}<span data-partial title={t('food.partial')}>≥</span><span class="sr-only">{t('food.partial')}</span>{/if}{t('food.g', { n: day[k].toFixed(1) })}</span>{/each}</span>
    <span class="tg">{t('food.details')}<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg></span>
  </summary>
  <dl class="cells">
    {#each cells as c (c.k)}
      <div class="cell" data-nutrient={c.k}>
        <dt>{t(`food.${c.k}`)}</dt>
        {#if c.v === null}
          <dd class="money unknown" data-unknown>{t('food.unknown')}<small>{t('food.fiNone')}</small></dd>
        {:else}
          <dd class="money">{#if partial(c.k)}<span aria-hidden="true">≥</span>{/if}{gText(c.v)}{#if partial(c.k)}<small class="pt" data-partial>{t('food.partial')}</small>{/if}{#if c.goal !== null}<small>{goalLabel(c.k, c.goal)}</small>{/if}</dd>
          {#if c.goal}<div class="bar mini" class:over={goalOver(c.k, c.v, c.goal)} class:partial={partial(c.k)} data-over={goalOver(c.k, c.v, c.goal) || undefined} role="presentation"><i style:width="{Math.min(1, c.v / c.goal) * 100}%"></i></div>{/if}
        {/if}
      </div>
    {/each}
  </dl>
  <PfcBar id="day" p={day.p} fa={day.fa} c={day.c} al={day.al} /></details>{/if}
</section>

<style>
  .sum { display: grid; gap: 8px; padding: 10px 14px; }
  .pA { --pc: var(--person-a); }
  .pB { --pc: var(--person-b); }
  .pG { --pc: var(--c-lilac); }
  header { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 4px 8px; min-height: var(--hit); }
  .total { font-size: var(--fs-title); line-height: 1.15; white-space: nowrap; }
  .total.none { font-size: var(--fs-talk); color: var(--text-soft); }
  .brow { display: flex; align-items: center; gap: 10px; }
  .brow .bar { flex: 1; }
  .chg { white-space: nowrap; font: 700 var(--fs-s)/1.2 var(--font-ui); color: var(--text-soft); }
  .chg.over { color: var(--coral-text); }
  .bar { height: 10px; border-radius: 5px; overflow: hidden; background: color-mix(in srgb, var(--lip) 45%, transparent); }
  .bar i { display: block; height: 100%; border-radius: inherit; background: var(--pc); transition: width 240ms var(--ease-soft); }
  .bar.mini { height: 5px; margin-top: 4px; }
  .bar.over i { background: var(--c-coral); }
  /* a total some entry doesn't know (一部不明): its bar hatched, the known part only */
  .bar.partial i { background: repeating-linear-gradient(135deg, var(--pc) 0 3px, color-mix(in srgb, var(--pc) 35%, var(--card)) 3px 5px); }
  .bar.partial.over i { background: repeating-linear-gradient(135deg, var(--c-coral) 0 3px, color-mix(in srgb, var(--c-coral) 35%, var(--card)) 3px 5px); }
  .more > :not(summary) { margin-top: 12px; }
  summary {
    list-style: none; cursor: pointer; display: flex; align-items: center; justify-content: space-between; gap: 8px; min-height: 36px;
    margin: -4px -6px; padding: 4px 6px; border-radius: var(--r-chip); font-size: var(--fs-s); font-weight: 700;
  }
  summary::-webkit-details-marker { display: none; }
  summary:focus-visible { outline: 3px solid var(--focus); outline-offset: 0; }
  summary:active { background: color-mix(in srgb, var(--lip) 30%, transparent); }
  .line { display: flex; flex-wrap: wrap; gap: 2px 10px; min-width: 0; }
  .nv { white-space: nowrap; }
  .nv.over { color: var(--coral-text); }
  .tg { flex: none; display: inline-flex; align-items: center; gap: 2px; color: var(--text-soft); }
  .tg svg { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 2.6; stroke-linecap: round; stroke-linejoin: round; transition: rotate 160ms var(--ease-soft); }
  .more[open] .tg svg { rotate: 180deg; }
  .cells { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 6px; margin: 2px 0 0; }
  dd.unknown { color: var(--text-soft); }
  .cell { min-width: 0; padding: 8px 6px 6px; border-radius: var(--r-chip); background: color-mix(in srgb, var(--lip) 22%, transparent); }
  dt { font-size: var(--fs-xs); font-weight: 700; color: var(--text-soft); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  dd { margin: 4px 0 0; font-size: var(--fs-body); white-space: nowrap; }
  /* 「目標 110 g 以上」 wraps in a narrow tile rather than running past it, only after 目標 (the copy's no-break spaces) */
  dd small { display: block; margin-top: 3px; font: 700 var(--fs-xs)/1.2 var(--font-ui); color: var(--text-soft); white-space: normal; text-wrap: balance; }
</style>
