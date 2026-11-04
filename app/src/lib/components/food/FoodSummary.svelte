<script lang="ts">
  // ごはん's summary card for one person's day: the day's kcal large, against their daily goal when set (a bar in the
  // person's colour; beside it today あと N / N オーバー, a past day 目標より N 少なめ / 多め, coral only past 20 %
  // over: goalChip; the goal at the upper right, GoalEdit, set there on my own day), then protein, fat, carbs and salt,
  // each with its goal when there is one (グラフ sets them; protein's default 1.6 g × the latest weigh-in, a member's
  // with a weight) and a small bar, salt's coral once past it. MetricCard's layout and tokens, one row of four. A day with nothing logged: 「きろく
  // なし」 on a past one (not 0 kcal, which reads as eaten nothing), 0 kcal today; no nutrient tiles either way.
  import type { Who } from '#lib/types.ts';
  import type { FoodDay } from '#lib/model/food.ts';
  import { t } from '#lib/i18n/index.ts';
  import type { FoodGoalOf } from '#lib/contract/food.ts';
  import { kcalText } from '../kiroku/fmt.ts';
  import GoalEdit from '../health/GoalEdit.svelte';
  import { FOOD_GOAL_SPECS, foodGoalText, goalChip } from './foodUi.ts';

  interface Props {
    day: FoodDay;
    who: Who;
    /** The day's goals: kcal and each nutrient (null: none). */
    goals: Record<FoodGoalOf, number | null>;
    /** The day against today: a past day's chip says 少なめ / 多め, tomorrow's (a いつもの's preview) none. */
    when: 'past' | 'today' | 'next';
    /** Sets the kcal goal (my own day only; absent: read-only). */
    onsavegoal?: ((v: number | null) => void) | null;
  }
  let { day, who, goals, when, onsavegoal = null }: Props = $props();
  const goal = $derived(goals.k);

  const share = $derived(goal ? Math.min(1, day.kcal / goal) : 0);
  const empty = $derived(day.entries.length === 0);
  const chip = $derived(goal === null || when === 'next' || (empty && when === 'past') ? null : goalChip(day.kcal, goal, when === 'today'));
  const gText = (n: number) => t('food.g', { n: n.toFixed(1) });
  const cells = $derived((['p', 'fa', 'c', 's'] as const).map((k) => ({ k, v: day[k], goal: goals[k] })));
</script>

<section class="card sum p{who}" data-food-summary aria-labelledby="fs-h">
  <header>
    <h3 id="fs-h">{t('food.kcalHead')}</h3>
    <GoalEdit id="kcal-goal" spec={FOOD_GOAL_SPECS.k} text={goal === null ? null : foodGoalText('k', goal)} value={goal} onsave={onsavegoal} />
  </header>
  <div class="srow">
    {#if empty && when === 'past'}
      <b class="total none" data-food-total data-food-none>{t('food.noLog')}</b>
    {:else}
      <b class="total money" data-food-total>{kcalText(day.kcal)}</b>
    {/if}
    {#if chip}<span class="chg" class:over={chip.over} data-food-chip>{chip.text}</span>{/if}
  </div>
  {#if goal !== null && !(empty && when === 'past')}
    <div class="bar" role="presentation"><i style:width="{share * 100}%"></i></div>
  {/if}
  {#if !empty}<dl class="cells">
    {#each cells as c (c.k)}
      <div class="cell" data-nutrient={c.k}>
        <dt>{t(`food.${c.k}`)}</dt>
        <dd class="money">{gText(c.v)}{#if c.goal !== null}<small>{t(`food.cellGoal.${c.k}`, { g: c.k === 's' ? c.goal.toFixed(1) : c.goal })}</small>{/if}</dd>
        {#if c.goal}<div class="bar mini" class:over={c.k === 's' && c.v > c.goal} role="presentation"><i style:width="{Math.min(1, c.v / c.goal) * 100}%"></i></div>{/if}
      </div>
    {/each}
  </dl>{/if}
</section>

<style>
  .sum { display: grid; gap: 8px; padding: 12px 14px; }
  .pA { --pc: var(--person-a); }
  .pB { --pc: var(--person-b); }
  .pG { --pc: var(--c-lilac); }
  header { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; min-height: var(--hit); }
  h3 { margin: 0; font-size: var(--fs-talk); font-weight: 700; }
  .srow { display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap; }
  .total { font-size: var(--fs-title); line-height: 1.15; white-space: nowrap; }
  .total.none { font-size: var(--fs-talk); color: var(--text-soft); }
  .chg {
    padding: 6px 10px; border-radius: var(--r-chip); white-space: nowrap; font: 700 var(--fs-s)/1 var(--font-ui);
    background: color-mix(in srgb, var(--lip) 35%, transparent);
  }
  .chg.over { background: color-mix(in srgb, var(--c-coral) 25%, transparent); }
  .bar { height: 10px; border-radius: 5px; overflow: hidden; background: color-mix(in srgb, var(--lip) 45%, transparent); }
  .bar i { display: block; height: 100%; border-radius: inherit; background: var(--pc); transition: width 240ms var(--ease-soft); }
  .bar.mini { height: 5px; margin-top: 4px; }
  .bar.over i { background: var(--c-coral); }
  .cells { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 6px; margin: 2px 0 0; }
  .cell { min-width: 0; padding: 8px 6px 6px; border-radius: var(--r-chip); background: color-mix(in srgb, var(--lip) 22%, transparent); }
  dt { font-size: var(--fs-xs); font-weight: 700; color: var(--text-soft); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  dd { margin: 4px 0 0; font-size: var(--fs-body); white-space: nowrap; }
  /* 「目標 110 g 以上」 wraps in a narrow tile rather than running past it, only after 目標 (the copy's no-break spaces) */
  dd small { display: block; margin-top: 3px; font: 700 var(--fs-xs)/1.2 var(--font-ui); color: var(--text-soft); white-space: normal; text-wrap: balance; }
</style>
