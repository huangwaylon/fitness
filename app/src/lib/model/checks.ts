// The tree popup's daily checks as read (docs/design.md "Daily checks", contract/checks.ts): per member, Tokyo day and
// check, its hand-set value when there is one (the latest `check` stamped by t, unless it handed the check back: null),
// else the day's workouts (HIIT and Core: an `hiit_n` / `core_n` row above 0 by t; 顔 has none). Pure.
import type { LocalDate, PersonId } from '#lib/types.ts';
import { CHECK_KINDS, CHECK_METRIC, type CheckKind } from '#lib/contract/checks.ts';
import { metricAsOf } from './inputs.ts';
import type { State } from './state.ts';

export interface Check {
  /** Shown as done. */
  done: boolean;
  /** The workouts say done (whatever the hand says). */
  auto: boolean;
  /** Set by hand (it overrides `auto`). */
  manual: boolean;
}
export type DayChecks = Record<CheckKind, Check>;

/** `who`'s checks on `date` as of `t` (only rows the record stamped by then: a locked week reads its lock). */
export function dayChecks(s: Pick<State, 'checks' | 'metrics'>, who: PersonId, date: LocalDate, t = Infinity): DayChecks {
  const hand: Partial<Record<CheckKind, boolean | null>> = {};
  for (const c of s.checks) if (c.person === who && c.d === date && c.at <= t) hand[c.k] = c.v;
  return Object.fromEntries(CHECK_KINDS.map((k) => {
    const m = CHECK_METRIC[k];
    const auto = m !== null && (metricAsOf(s as State, who, date, m, t) ?? 0) > 0;
    const h = hand[k];
    const manual = h === true || h === false;
    return [k, { done: manual ? h : auto, auto, manual }];
  })) as DayChecks;
}

/** All three done. */
export const allChecked = (c: DayChecks): boolean => CHECK_KINDS.every((k) => c[k].done);

/** A tap on a check: the `check` value to send. It flips what's shown; a flip that lands on what the workouts say
 *  hands the check back to them (null), so a later workout still counts. */
export function toggleValue(c: Check): boolean | null {
  const next = !c.done;
  return next === c.auto ? null : next;
}
