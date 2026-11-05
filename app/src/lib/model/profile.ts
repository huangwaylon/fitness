// A person's profile and what it lets the app suggest (docs/design.md "Profile"; decisions: *Profile*): their age from
// their birth date, their height from Health's own BMI, their resting and daily energy (Mifflin–St Jeor and their
// Move), the BMI category by their standard, and the default goals a profile gives where none is set: kcal, salt and
// protein (model/food.ts foodGoal reads them; a goal the person set always wins). Pure: the record's prefs and rows
// in, numbers out. Never ベル: the economy never imports it (deps.test.ts).
import type { LocalDate, PersonId, Who } from '#lib/types.ts';
import { isPersonId } from '#lib/contract/api.ts';
import { FOOD_GOALS } from '#lib/contract/food.ts';
import type { BmiStd, Sex } from '#lib/contract/profile.ts';
import { addDays, localDateAt } from '#lib/time/dates.ts';
import { latestAt, type State } from './state.ts';
import { weighIns } from './weight.ts';
import { activityOn } from './health.ts';

/** A person's profile as set (unset: null; the BMI standard `asia` until chosen). */
export interface Profile { sex: Sex | null; birth: LocalDate | null; bmiStd: BmiStd }

export function profileOf(s: Pick<State, 'prefs'>, who: Who): Profile {
  const p = s.prefs[who];
  return { sex: p.sex ?? null, birth: p.birth ?? null, bmiStd: p.bmiStd ?? 'asia' };
}

/** Age in whole years on `date` (both `YYYY-MM-DD`): a year more on each birthday (a 29 February's on 1 March in
 *  other years). */
export function ageOn(birth: LocalDate, date: LocalDate): number {
  const years = +date.slice(0, 4) - +birth.slice(0, 4);
  return date.slice(5) >= birth.slice(5) ? years : years - 1;
}

/** `who`'s age on the Tokyo day of `t`, or null without a birth date. */
export function ageAt(s: Pick<State, 'prefs'>, who: Who, t: number): number | null {
  const b = s.prefs[who].birth;
  return b ? ageOn(b, localDateAt(t)) : null;
}

/** Height in cm from a weight (kg) and the BMI it was measured with (BMI = kg / m²), one decimal. */
export const heightFrom = (kg: number, bmi: number): number => Math.round(Math.sqrt(kg / bmi) * 1000) / 10;

/** The latest day (as of `t`) with both a weight and a BMI: the height Health holds, derived (heightFrom), or null. */
export function heightCm(s: State, p: PersonId, t: number): number | null {
  const today = localDateAt(t), bmis = s.body[p].bmi;
  const days = [...s.weights[p].keys()].filter((d) => d <= today && bmis.has(d)).sort();
  for (let i = days.length - 1; i >= 0; i--) {
    const kg = latestAt(s.weights[p].get(days[i]), t), bmi = latestAt(bmis.get(days[i]), t);
    if (kg !== undefined && bmi !== undefined) return heightFrom(kg, bmi);
  }
  return null;
}

/** Resting energy, kcal a day (Mifflin–St Jeor 1990): 10 × kg + 6.25 × cm − 5 × age, + 5 for a man, − 161 for a woman. */
export const mifflinStJeor = (sex: Sex, kg: number, cm: number, age: number): number => 10 * kg + 6.25 * cm - 5 * age + (sex === 'm' ? 5 : -161);

/** The days of Move (Apple's active energy) averaged, back from yesterday, and how many there must be for it to count. */
const ACTIVE = { days: 28, min: 7 } as const;
/** Without enough Move days: the daily energy as this × the resting (a light activity level). */
export const PAL_FALLBACK = 1.4;
/** The daily energy's bounds as a multiple of the resting (a Move far off either way is clipped to them). */
const PAL = { min: 1.2, max: 2.2 } as const;

/** The average Move (active kcal) over the ACTIVE.days before the Tokyo day of `t`, of the days with a Move and the
 *  Watch worn (model/health.ts activityOn: a 0/0/0 day is no data, not a day at rest), or null with fewer than
 *  ACTIVE.min. */
export function activeKcal(s: State, p: PersonId, t: number): number | null {
  const today = localDateAt(t);
  let sum = 0, n = 0;
  for (let i = 1; i <= ACTIVE.days; i++) {
    const v = activityOn(s, p, addDays(today, -i), t).move;
    if (v !== null) (sum += v), (n += 1);
  }
  return n >= ACTIVE.min ? sum / n : null;
}

/** What a member's energy is (as of `t`): the inputs and the resting and daily kcal, or null without a sex, a birth
 *  date, a weigh-in or a height. */
export interface Energy { kg: number; cm: number; age: number; sex: Sex; bmr: number; tdee: number; active: number | null }

export function energyOf(s: State, who: Who, t: number): Energy | null {
  if (!isPersonId(who)) return null;
  const { sex } = profileOf(s, who), age = ageAt(s, who, t), last = weighIns(s, who, t).at(-1), cm = heightCm(s, who, t);
  if (!sex || age === null || !last || cm === null) return null;
  const bmr = mifflinStJeor(sex, last.kg, cm, age), active = activeKcal(s, who, t);
  // the daily energy: resting + the Move as Health measures it (Apple's own total), else a light level
  const tdee = Math.min(PAL.max * bmr, Math.max(PAL.min * bmr, active === null ? PAL_FALLBACK * bmr : bmr + active));
  return { kg: last.kg, cm, age, sex, bmr: Math.round(bmr), tdee: Math.round(tdee), active: active === null ? null : Math.round(active) };
}

/** The kcal default's rules: a deficit of this share of the daily energy while the goal weight is under the latest
 *  weigh-in by more than `loseKg`; never under the resting energy nor the sex's floor (kcal). */
const KCAL_DEFAULT = { deficit: 0.15, loseKg: 0.5, floor: { m: 1500, f: 1200 } } as const;

/** A member's suggested daily kcal (whole FOOD_GOALS.k steps): the daily energy, less KCAL_DEFAULT.deficit while losing
 *  toward their goal weight; at least the resting energy and the sex's floor. Null without an energy (energyOf). */
export function kcalDefault(s: State, who: Who, t: number): number | null {
  const e = energyOf(s, who, t);
  if (!e) return null;
  const goal = s.prefs[who].goalWeight, losing = goal !== undefined && goal < e.kg - KCAL_DEFAULT.loseKg;
  const want = losing ? e.tdee * (1 - KCAL_DEFAULT.deficit) : e.tdee;
  const g = FOOD_GOALS.k, floor = Math.max(e.bmr, KCAL_DEFAULT.floor[e.sex]);
  return Math.min(g.max, Math.ceil(Math.max(want, floor) / g.step) * g.step);
}

/** Why a kcal goal is low ("warn, allow": the editor says so under the field and still saves it): under the person's
 *  resting energy (energyOf: with a full profile and a weigh-in), else under the safe floor (KCAL_DEFAULT.floor by
 *  their sex; unknown: the women's 1,200). `kcal`: the line it's under. Null: not low. */
type LowKcal = { why: 'bmr' | 'floor'; kcal: number };

export function lowKcal(s: State, who: Who, t: number, v: number): LowKcal | null {
  const e = energyOf(s, who, t);
  if (e && v < e.bmr) return { why: 'bmr', kcal: e.bmr };
  const floor = KCAL_DEFAULT.floor[profileOf(s, who).sex ?? 'f'];
  return v < floor ? { why: 'floor', kcal: floor } : null;
}

/** Salt's ceiling a day (g), 日本人の食事摂取基準（2025年版）'s 目標量 from 15: men under 7.5, women under 6.5. */
const SALT_LIMIT: Record<Sex, number> = { m: 7.5, f: 6.5 };

/** `who`'s default salt ceiling (SALT_LIMIT by their sex; from 15, or with no birth date), or null without a sex. */
export function saltDefault(s: State, who: Who, t: number): number | null {
  const { sex } = profileOf(s, who), age = ageAt(s, who, t);
  return sex && (age === null || age >= 15) ? SALT_LIMIT[sex] : null;
}

/** Fibre's 目標量 a day (g, at least), 日本人の食事摂取基準（2025年版）, adults (18–64): men 20 (22 from 30), women 18. */
export const fibreTarget = (sex: Sex, age: number | null): number => (sex === 'f' ? 18 : age !== null && age >= 30 && age < 65 ? 22 : 20);

/** `who`'s default fibre floor (fibreTarget by their sex and age; no birth date: the 18–29 value), or null without a
 *  sex or under 18 (the 目標量 above is the adults'). */
export function fibreDefault(s: Pick<State, 'prefs'>, who: Who, t: number): number | null {
  const { sex } = profileOf(s, who), age = ageAt(s, who, t);
  return sex && (age === null || age >= 18) ? fibreTarget(sex, age) : null;
}

/** Protein's 推奨量 (RDA) a day (g), 食事摂取基準 2025, adults: men 65 (60 from 65), women 50. */
export const proteinRda = (sex: Sex, age: number): number => (sex === 'f' ? 50 : age >= 65 ? 60 : 65);

/** A day's protein goal split over three meals (g, whole): the per-meal hint. */
export const perMeal = (g: number): number => Math.round(g / 3);

/** A meal's protein to aim for (g, whole; きろく's chip turns green at it): a third of the day's goal (perMeal), at
 *  least MEAL_PROTEIN.min (about the least a meal needs to build muscle: 0.4 g/kg, 20 g or more); with no day goal,
 *  MEAL_PROTEIN.none (the 25–30 g a meal of a lifter's usual aims at). */
const MEAL_PROTEIN = { min: 20, none: 25 } as const;
export const mealProteinTarget = (dayGoal: number | null): number => (dayGoal === null ? MEAL_PROTEIN.none : Math.max(MEAL_PROTEIN.min, perMeal(dayGoal)));

/** A BMI's category by a standard: `asia` (JASSO: 肥満 from 25; WHO's Asian cut-off 23 for 過体重), `who` (25, 30);
 *  under 18.5 低体重 in both. */
export type BmiCategory = 'under' | 'normal' | 'over' | 'obese';
const BMI_CUTS: Record<BmiStd, { over: number; obese: number }> = { asia: { over: 23, obese: 25 }, who: { over: 25, obese: 30 } };
export function bmiCategory(bmi: number, std: BmiStd): BmiCategory {
  const c = BMI_CUTS[std];
  return bmi < 18.5 ? 'under' : bmi < c.over ? 'normal' : bmi < c.obese ? 'over' : 'obese';
}
