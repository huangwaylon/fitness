// The tree popup's three meal circles (docs/design.md "Trees"): which of the day's meals someone has logged, read from
// the meal log's own day (model/food.ts foodDay: its entries by slot, a いつもの's items on the days it covers too).
// The slots are the record's (contract/food.ts MEALS) less おやつ: a snack never stands for a meal. And its P · F · C
// marks: today's protein, fat and carbs against that person's goals, each under / met / over its goal's way. Pure.
import type { LocalDate, Who } from '#lib/types.ts';
import { MEALS, type Meal } from '#lib/contract/food.ts';
import { foodDay } from '#lib/model/food.ts';
import { GOALS, goalMet, goalOver } from '#lib/contract/goals.ts';
import type { State } from '#lib/model/state.ts';

/** 朝, 昼, 夜: the record's slots but the snack. */
export const MAIN_MEALS = MEALS.filter((m): m is Exclude<Meal, 's'> => m !== 's');
type MainMeal = (typeof MAIN_MEALS)[number];

/** Per main meal, whether `who`'s `date` (a Tokyo day, the model's `today`) has anything in it. */
export function mealsLogged(s: Pick<State, 'food' | 'foodRepeat'>, who: Who, date: LocalDate): Record<MainMeal, boolean> {
  const has = new Set(foodDay(s, who, date).entries.map((e) => e.m));
  return Object.fromEntries(MAIN_MEALS.map((m) => [m, has.has(m)])) as Record<MainMeal, boolean>;
}

/** The popup's three nutrients, P · F · C. */
const PFC = ['p', 'fa', 'c'] as const;
export type PfcKey = (typeof PFC)[number];
/** One nutrient's mark: today's grams (one decimal), its goal (null: none set, no default) and the share of it (whole %,
 *  null without a goal). `state` the goal's way (contract/goals.ts dir): `over` past a ceiling (fat over, carbs past
 *  their band), `met` a floor reached or within the band (protein, carbs), else `under` (fat under its ceiling is
 *  `under` too: fine, never leaf, since 0 g isn't an achievement); `none` without a goal. */
export interface PfcMark { k: PfcKey; g: number; goal: number | null; pct: number | null; state: 'under' | 'met' | 'over' | 'none' }

/** `day`'s P · F · C against `goals` (model/food.ts foodGoals). */
export function pfcMarks(day: Record<PfcKey, number>, goals: Record<PfcKey, number | null>): PfcMark[] {
  return PFC.map((k) => {
    const g = day[k], goal = goals[k];
    if (!goal) return { k, g, goal: null, pct: null, state: 'none' };
    const state = goalOver(k, g, goal) ? 'over' : GOALS[k].dir !== 'atMost' && goalMet(k, g, goal) ? 'met' : 'under';
    return { k, g, goal, pct: Math.round((g / goal) * 100), state };
  });
}

/** `who`'s P · F · C on `date` (the meal log's day: foodDay) against `goals`. */
export const pfcToday = (s: Pick<State, 'food' | 'foodRepeat'>, who: Who, date: LocalDate, goals: Record<PfcKey, number | null>): PfcMark[] =>
  pfcMarks(foodDay(s, who, date), goals);
