// The tree popup's daily checks (docs/design.md "Trees", "Daily checks"): 顔, HIIT and Core, one row per member per
// Tokyo day. HIIT and Core tick themselves from the day's Apple Health workouts (the Shortcut's `workout_types` /
// `workout_dates`: relay/src/workouts.ts → the metrics `hiit_n` / `core_n`, workouts that day); 顔 only by hand. A
// `check` event is a member's own hand-set value of one check on one day: `v` true (done) or false (not done) wins
// over the workouts; null hands it back to them. The record keeps one row per (sender, day, check): eventSlot. The
// guest has no tree: the record refuses its `check` (contract/guest.ts) and sees the members' (activity, not からだ).
// Pure and dependency-free but the contract (the relay imports it).
import { isLocalDate, type WorkoutMetric } from './api.ts';
import type { LocalDate } from '../types.ts';

/** The row's checks, left to right. */
export const CHECK_KINDS = ['face', 'hiit', 'core'] as const;
export type CheckKind = (typeof CHECK_KINDS)[number];

/** The workout metric that ticks a check by itself (顔: none, by hand only). */
export const CHECK_METRIC: Record<CheckKind, WorkoutMetric | null> = { face: null, hiit: 'hiit_n', core: 'core_n' };

/** How many days back a check may be set (the record's day less this, to tomorrow: a phone's day just past midnight). */
export const CHECK_PAST_DAYS = 35;

export interface CheckOp {
  /** The Tokyo day. */
  d: LocalDate;
  k: CheckKind;
  /** Done (true) or not (false) by hand; null: back to the workouts (no hand-set value). */
  v: boolean | null;
}

/** A `check`'s data (exactly `d`, `k`, `v`), or null. */
export function checkOf(d: Record<string, unknown>): CheckOp | null {
  const keys = Object.keys(d);
  if (keys.length !== 3 || !keys.every((k) => k === 'd' || k === 'k' || k === 'v')) return null;
  if (!isLocalDate(d.d) || !(CHECK_KINDS as readonly unknown[]).includes(d.k)) return null;
  if (d.v !== true && d.v !== false && d.v !== null) return null;
  return { d: d.d, k: d.k as CheckKind, v: d.v };
}

/** The record's slot: one value per sender, day and check (the latest wins). */
export const checkSlot = (sender: string, d: Record<string, unknown>): string | null => {
  const op = checkOf(d);
  return op ? `check|${sender}|${op.d}|${op.k}` : null;
};
