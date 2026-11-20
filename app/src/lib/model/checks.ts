// The tree popup's daily checks as read (docs/design.md "Daily checks", contract/checks.ts): per member, Tokyo day and
// check, done when its latest `check` stamped by t says true; all three by hand only. Pure.
import type { LocalDate, PersonId } from '#lib/types.ts';
import { CHECK_KINDS, type CheckKind } from '#lib/contract/checks.ts';
import type { State } from './state.ts';

/** 顔's video (the user, 2026-11-19): a tap that ticks 顔 opens it (iOS hands it to the YouTube app or Safari). */
export const FACE_VIDEO = 'https://youtu.be/vfifXKeHzOI';

export interface Check {
  /** Shown as done. */
  done: boolean;
}
export type DayChecks = Record<CheckKind, Check>;

/** `who`'s checks on `date` as of `t` (only rows the record stamped by then: a locked week reads its lock). */
export function dayChecks(s: Pick<State, 'checks'>, who: PersonId, date: LocalDate, t = Infinity): DayChecks {
  const hand: Partial<Record<CheckKind, boolean | null>> = {};
  for (const c of s.checks) if (c.person === who && c.d === date && c.at <= t) hand[c.k] = c.v;
  return Object.fromEntries(CHECK_KINDS.map((k) => [k, { done: hand[k] === true }])) as DayChecks;
}

/** All three done. */
export const allChecked = (c: DayChecks): boolean => CHECK_KINDS.every((k) => c[k].done);

/** A tap on a check: the `check` value to send, which flips it (true on, null off). */
export const toggleValue = (c: Check): true | null => (c.done ? null : true);
