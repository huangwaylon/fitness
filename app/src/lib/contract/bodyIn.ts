// The からだ values typed in by hand (docs/design.md "Kenkou", 2026-11-19): what a body-composition scale shows but
// Apple Health can't carry (HealthKit has no type for them), so the Shortcut never sends them: InBody's 筋肉量 (soft
// lean mass) and 骨格筋量 (skeletal muscle mass), in kg with one decimal. A `body_in` event, a member's (either member
// may enter either's: `person`, as a goal), per day and metric; the latest row of a day wins and `v: null` clears that
// day. Every row is kept (no slot: health is never pruned). Trends only: never ベル. Never the guest's to write or to
// see (contract/guest.ts). Pure and dependency-free (the relay imports it).
import { isLocalDate, isPersonId } from './api.ts';
import type { PersonId } from '../types.ts';

/** The metrics typed in: 筋肉量 (soft lean mass), 骨格筋量 (skeletal muscle mass). */
const BODY_IN = ['muscle_kg', 'smm_kg'] as const;
export type BodyInMetric = (typeof BODY_IN)[number];
const isBodyIn = (v: unknown): v is BodyInMetric => v === 'muscle_kg' || v === 'smm_kg';

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
