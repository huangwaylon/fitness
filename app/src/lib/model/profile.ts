// A person's profile and what it lets the app suggest (docs/design.md "Profile"; decisions: *Profile*): their age from
// their birth date, their height from Health's own BMI, their resting and daily energy (bmrOn: InBody's from the lean
// mass, else Mifflin–St Jeor; and their Move), the BMI category (Asian cut-offs), and the default goals a profile gives where none is set: kcal, salt and
// protein (model/food.ts foodGoal reads them; a goal the person set always wins). Pure: the record's prefs and rows
// in, numbers out. Never ベル: the economy never imports it (deps.test.ts).
import type { LocalDate, PersonId, Who } from '#lib/types.ts';
import { isPersonId } from '#lib/contract/api.ts';
import { FOOD_GOALS } from '#lib/contract/food.ts';
import type { Sex } from '#lib/contract/profile.ts';
import { addDays, localDateAt } from '#lib/time/dates.ts';
import { inbodyBmr } from '#lib/contract/bodyEst.ts';
import { latestAt, type State } from './state.ts';
import { smoothLine, weighIns, type WeighIn } from './weight.ts';
import { activityOn } from './health.ts';

/** A person's profile as set (unset: null). */
export interface Profile { sex: Sex | null; birth: LocalDate | null }

export function profileOf(s: Pick<State, 'prefs'>, who: Who): Profile {
  const p = s.prefs[who];
  return { sex: p.sex ?? null, birth: p.birth ?? null };
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

/** How long a 除脂肪体重 reading stays the resting energy's source (days). */
const LEAN_DAYS = 60;

/** A member's resting energy as of `t`, whole kcal a day, the one figure energyOf (so kcalDefault and lowKcal) and the
 *  pace's calculation share: InBody's from their 除脂肪体重 line, smoothed (smoothLine), at its latest reading of the last
 *  LEAN_DAYS, needing nothing else; else Mifflin–St Jeor from their sex, age, latest weigh-in
 *  and height; null without either. */
export function bmrOn(s: State, p: PersonId, t: number): number | null {
  const today = localDateAt(t), lean = s.body[p].lean_kg;
  const readings: WeighIn[] = [];
  for (const d of [...lean.keys()].sort()) {
    const kg = d <= today ? latestAt(lean.get(d), t) : undefined;
    if (kg !== undefined) readings.push({ date: d, kg });
  }
  // the lean line smoothed as the weight's is (weight.ts smoothLine, over what was known by today): a raw reading swings
  // 20–40 kcal a day (the review 11-24, T2)
  const line = smoothLine(readings).at(-1);
  if (line && line.date >= addDays(today, -LEAN_DAYS)) return Math.round(inbodyBmr(line.kg));
  const { sex } = profileOf(s, p), age = ageAt(s, p, t), last = weighIns(s, p, t).at(-1), cm = heightCm(s, p, t);
  return sex && age !== null && last && cm !== null ? Math.round(mifflinStJeor(sex, last.kg, cm, age)) : null;
}

/** The days of Move (Apple's active energy) averaged, back from yesterday, and how many there must be for it to count;
 *  `stand`: a day's least Stand Time (min) for its Move to be a whole day's. */
const ACTIVE = { days: 28, min: 7, stand: 60 } as const;
/** Without enough Move days: the daily energy as this × the resting (a light activity level). */
export const PAL_FALLBACK = 1.4;
/** The daily energy's bounds as a multiple of the resting (a Move far off either way is clipped to them). */
export const PAL = { min: 1.2, max: 2.2 } as const;

/** Day d's Move as a whole day's energy (the TDEE's, the pace's 計算), or null: the Watch not worn (model/health.ts
 *  activityOn: 0/0/0) or worn only part of the day, under ACTIVE.stand minutes of Stand Time (none sent: counted). The real data had weeks of
 *  such days (Move 3 by 8,000 steps, Stand 0–45 min) that took a member's suggested kcal ~200 low. */
export function dayMove(s: State, p: PersonId, d: LocalDate, t: number): number | null {
  const a = activityOn(s, p, d, t);
  return a.move !== null && (a.stand === null || a.stand >= ACTIVE.stand) ? a.move : null;
}

/** The average Move (active kcal) over the ACTIVE.days before the Tokyo day of `t`, of the whole days (dayMove), or
 *  null with fewer than ACTIVE.min. */
export function activeKcal(s: State, p: PersonId, t: number): number | null {
  const today = localDateAt(t);
  let sum = 0, n = 0;
  for (let i = 1; i <= ACTIVE.days; i++) {
    const v = dayMove(s, p, addDays(today, -i), t);
    if (v !== null) (sum += v), (n += 1);
  }
  return n >= ACTIVE.min ? sum / n : null;
}

/** What a member's energy is (as of `t`): their latest weigh-in, sex, resting energy (bmrOn), daily energy and Move, or
 *  null without a sex, a weigh-in or a resting energy (with a recent 除脂肪体重, no age or height needed). */
interface Energy { kg: number; sex: Sex; bmr: number; tdee: number; active: number | null }

export function energyOf(s: State, who: Who, t: number): Energy | null {
  if (!isPersonId(who)) return null;
  const { sex } = profileOf(s, who), last = weighIns(s, who, t).at(-1), bmr = bmrOn(s, who, t);
  if (!sex || !last || bmr === null) return null;
  const active = activeKcal(s, who, t);
  // the daily energy: resting + the Move as Health measures it (Apple's own total), else a light level
  const tdee = Math.min(PAL.max * bmr, Math.max(PAL.min * bmr, active === null ? PAL_FALLBACK * bmr : bmr + active));
  return { kg: last.kg, sex, bmr, tdee: Math.round(tdee), active: active === null ? null : Math.round(active) };
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
 *  resting energy (energyOf: a sex, a weigh-in and a resting energy), else under the safe floor (KCAL_DEFAULT.floor by
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
const perMeal = (g: number): number => Math.round(g / 3);

/** A meal's protein to aim for (g, whole; きろく's chip turns green at it): a third of the day's goal (perMeal), at
 *  least MEAL_PROTEIN.min (about the least a meal needs to build muscle: 0.4 g/kg, 20 g or more); with no day goal,
 *  MEAL_PROTEIN.none (the 25–30 g a meal of a lifter's usual aims at). */
const MEAL_PROTEIN = { min: 20, none: 25 } as const;
export const mealProteinTarget = (dayGoal: number | null): number => (dayGoal === null ? MEAL_PROTEIN.none : Math.max(MEAL_PROTEIN.min, perMeal(dayGoal)));

/** A BMI's category by the Asian cut-offs, everyone's (2026-11-15): 低体重 under 18.5, 過体重 from 23 (WHO's Asian
 *  cut-off), 肥満 from 25 (JASSO). */
type BmiCategory = 'under' | 'normal' | 'over' | 'obese';
export const bmiCategory = (bmi: number): BmiCategory => (bmi < 18.5 ? 'under' : bmi < 23 ? 'normal' : bmi < 25 ? 'over' : 'obese');
