// The island tree popup's 🥥 chips (ADR 0023): yesterday's and today's gym day for one person, one tap each
// (`gym_set`). Kept apart from history.ts so the island doesn't load きろく's views.
import type { LocalDate, PersonId } from '#lib/types.ts';
import { addDays, localDateAt, weekKeyOf } from '#lib/time/dates.ts';
import { editableAt, finalMs, type State } from './state.ts';
import { earnTimeOf } from './bells.ts';
import { gymDayAsOf, gymSetAsOf } from './inputs.ts';

/** One chip: yesterday or today, whether it is a gym day, and whether it can change now. */
export interface GymChip {
  date: LocalDate;
  which: 'yesterday' | 'today';
  on: boolean;
  /** Set by hand (a `gym_set`), not by an arrival or a workout. */
  override: boolean;
  /** Its week is open (yesterday may be in last week, locked from Wednesday 04:00). */
  open: boolean;
  /** Epoch ms of its week's lock. */
  lockAt: number;
}

/** Yesterday's and today's 🥥 for `person` at `now`, oldest first. */
export function gymChips(s: State, person: PersonId, now: number): GymChip[] {
  const today = localDateAt(now);
  return (['yesterday', 'today'] as const).map((which) => {
    const date = which === 'today' ? today : addDays(today, -1);
    const wk = weekKeyOf(date);
    const t = earnTimeOf(wk, now);
    return {
      date, which, on: gymDayAsOf(s, person, date, t), override: gymSetAsOf(s, person, date, t) !== null,
      open: editableAt(date, now), lockAt: finalMs(wk)
    };
  });
}
