// The tree popup's daily checks (docs/design.md "Trees", "Daily checks"): 顔, HIIT and Core, one row per member per
// Tokyo day, each ticked by hand only (HIIT and Core are manual, like 顔: the user, 2026-11-20). A `check` event is a
// member's own value of one check on one day: `v` true (done); false or null not done (an old false stays readable).
// The record keeps one row per (sender, day, check): eventSlot. The guest has no tree (its own rows show nowhere) and
// sees the members'.
// Pure and dependency-free but the contract (the relay imports it).
import { isLocalDate } from './api.ts';
import type { LocalDate } from '../types.ts';

/** The row's checks, left to right. */
export const CHECK_KINDS = ['face', 'hiit', 'core'] as const;
export type CheckKind = (typeof CHECK_KINDS)[number];

/** How many days back a check may be set (the record's day less this, to tomorrow: a phone's day just past midnight). */
export const CHECK_PAST_DAYS = 35;

export interface CheckOp {
  /** The Tokyo day. */
  d: LocalDate;
  k: CheckKind;
  /** Done (true); not done (null; false from an older app, read the same). */
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
