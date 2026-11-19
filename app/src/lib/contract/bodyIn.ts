// InBody's 筋肉量 (soft lean mass) and 骨格筋量 (skeletal muscle mass), which Apple Health can't carry (HealthKit has no
// type for them), so the Shortcut never sends them (docs/design.md "Kenkou"). The app estimates both per day from the
// fat-free mass Health does carry (除脂肪体重, InBody's FFM): a ratio by sex (estimateRatio), refined per person by the
// InBody readings on the record. A reading is a `body_in` event (kg, one decimal), set once from the Mac
// (relay/scripts/record.ts inbody), never typed on a phone: its day's value over its lean mass is that person's
// ratio, so no one's numbers live in the source. A member's (`person`, as a goal); the latest row of a day wins and
// `v: null` clears it. Every row is kept (health is never pruned). Trends only: never ベル. Never the guest's to
// write or to see (contract/guest.ts). Pure and dependency-free (the relay imports it).
import { isLocalDate, isPersonId } from './api.ts';
import type { Sex } from './profile.ts';
import type { PersonId } from '../types.ts';

/** The metrics estimated (an InBody reading calibrates them): 筋肉量 (soft lean mass), 骨格筋量 (skeletal muscle mass). */
export const BODY_IN = ['muscle_kg', 'smm_kg'] as const;
export type BodyInMetric = (typeof BODY_IN)[number];
export const isBodyIn = (v: unknown): v is BodyInMetric => v === 'muscle_kg' || v === 'smm_kg';

/** What the record takes (inclusive, kg): an adult's range on InBody's sheets with room either side. */
const BODY_IN_BOUNDS: Record<BodyInMetric, { min: number; max: number }> = {
  muscle_kg: { min: 10, max: 100 },
  smm_kg: { min: 5, max: 60 }
};

/** A `body_in` row's data: the day, the metric, the value (null: that day's cleared) and whose (absent: the sender's). */
export interface BodyIn { date: string; m: BodyInMetric; v: number | null; person?: PersonId }

/** A value the record takes for `m`: finite, in its range, one decimal at most. */
export function bodyInValue(m: BodyInMetric, v: unknown): v is number {
  const b = BODY_IN_BOUNDS[m];
  return typeof v === 'number' && Number.isFinite(v) && v >= b.min && v <= b.max && Math.abs(v * 10 - Math.round(v * 10)) < 1e-6;
}

/** A `body_in` event's data, or null: exactly `date`, `m`, `v` (and `person`, A or B), the date a real one. Whether the
 *  day is too far ahead is the record's rule (contract/record.ts). */
export function bodyInOf(d: Record<string, unknown>): BodyIn | null {
  for (const k of Object.keys(d)) if (k !== 'date' && k !== 'm' && k !== 'v' && k !== 'person') return null;
  if (!isLocalDate(d.date) || !isBodyIn(d.m) || !(d.v === null || bodyInValue(d.m, d.v))) return null;
  if (d.person !== undefined && !isPersonId(d.person)) return null;
  return { date: d.date, m: d.m, v: d.v as number | null, ...(d.person !== undefined ? { person: d.person as PersonId } : {}) };
}

/**
 * InBody's 基礎代謝量 (BMR) from the fat-free mass: the Katch–McArdle formula InBody prints, 370 + 21.6 × FFM (kg),
 * whole kcal. Apple Health's Lean Body Mass as InBody writes it is that FFM (weight × (1 − body fat)): 37.3 kg →
 * 1,176 kcal, InBody's own figure.
 */
export const inbodyBmr = (leanKg: number): number => Math.round(370 + 21.6 * leanKg);

/**
 * Each metric's share of the fat-free mass without a reading to calibrate it. 筋肉量 = FFM − bone mineral, and bone
 * mineral is about 6 % of an adult's FFM (FFM ≈ 73 % water, 20 % protein, 7 % mineral, ~5.5–6 % of it bone: Wang et al.
 * 1992, Am J Clin Nutr 56:19; Heymsfield et al., Human Body Composition, 2005), either sex. 骨格筋量 is about 0.57 of
 * a man's FFM and 0.54 of a woman's as InBody reports it (its SMM, DXA-calibrated: Kim et al. 2002, Am J Clin Nutr
 * 76:378; MRI: Janssen et al. 2000, J Appl Physiol 89:81, ~38 % / 31 % of body mass); unknown sex, between.
 */
export const PER_FFM: Record<BodyInMetric, Record<Sex | 'x', number>> = {
  muscle_kg: { m: 0.94, f: 0.94, x: 0.94 },
  smm_kg: { m: 0.57, f: 0.54, x: 0.555 }
};
/** A calibrated ratio the estimate takes (a reading off these is a typo or another scale's, ignored). */
const RATIO_BOUNDS: Record<BodyInMetric, { min: number; max: number }> = { muscle_kg: { min: 0.88, max: 0.97 }, smm_kg: { min: 0.45, max: 0.65 } };

/** `m`'s share of the FFM for a person: the mean of their readings' (value over that day's lean mass, in bounds),
 *  else the sex's default (PER_FFM); `calibrated` whether readings set it. */
export function estimateRatio(m: BodyInMetric, sex: Sex | null, readings: readonly { lean: number; v: number }[]): { ratio: number; calibrated: boolean } {
  const b = RATIO_BOUNDS[m];
  const rs = readings.filter((r) => r.lean > 0).map((r) => r.v / r.lean).filter((r) => r >= b.min && r <= b.max);
  return rs.length ? { ratio: rs.reduce((a, r) => a + r, 0) / rs.length, calibrated: true } : { ratio: PER_FFM[m][sex ?? 'x'], calibrated: false };
}

/** A day's estimate (kg, one decimal) from its lean mass and the ratio. */
export const estimateKg = (leanKg: number, ratio: number): number => Math.round(leanKg * ratio * 10) / 10;
