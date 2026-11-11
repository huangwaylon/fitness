// The tree popup's three meal circles (docs/design.md "Trees"): which of the day's meals someone has logged, read from
// the meal log's own day (model/food.ts foodDay: its entries by slot, a いつもの's items on the days it covers too).
// The slots are the record's (contract/food.ts MEALS) less おやつ: a snack never stands for a meal. Pure.
import type { LocalDate, Who } from '#lib/types.ts';
import { MEALS, type Meal } from '#lib/contract/food.ts';
import { foodDay } from '#lib/model/food.ts';
import type { State } from '#lib/model/state.ts';

/** 朝, 昼, 夜: the record's slots but the snack. */
export const MAIN_MEALS = MEALS.filter((m): m is Exclude<Meal, 's'> => m !== 's');
type MainMeal = (typeof MAIN_MEALS)[number];

/** Per main meal, whether `who`'s `date` (a Tokyo day, the model's `today`) has anything in it. */
export function mealsLogged(s: Pick<State, 'food' | 'foodRepeat'>, who: Who, date: LocalDate): Record<MainMeal, boolean> {
  const has = new Set(foodDay(s, who, date).entries.map((e) => e.m));
  return Object.fromEntries(MAIN_MEALS.map((m) => [m, has.has(m)])) as Record<MainMeal, boolean>;
}
