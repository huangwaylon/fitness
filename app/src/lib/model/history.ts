// きろく (docs/design.md#kiroku): every recorded day, with its ベル, for both people, computed on read from the same
// state as the WeekView. Read-only (Apple Health is the source of truth). Pure; the UI asks for one opened day at a
// time (lazy).
import type { LocalDate, PersonId, RingFruit } from '#lib/types.ts';
import { localDateAt, weekKeyOf } from '#lib/time/dates.ts';
import { noneMet } from '#lib/scoring/bells.ts';
import type { State } from './state.ts';
import { weekBells } from './bells.ts';

export interface DayPerson {
  /** The day's ベル: +1 per goal met. */
  bells: number;
  /** The daily goal met, per fruit. */
  met: Record<RingFruit, boolean>;
  steps: number | null;
  /** Exercise minutes (floored). */
  exerciseMin: number;
  /** Move: active kcal and the goal in force that day. */
  move: { value: number | null; goal: number };
  standMin: number | null;
}

export interface DayDetail {
  date: LocalDate;
  people: Record<PersonId, DayPerson>;
  /** ふたりでぜんぶ: both met all four goals. */
  together: boolean;
}

export function dayDetail(s: State, date: LocalDate, now: number): DayDetail {
  const wb = weekBells(s, weekKeyOf(date), now);
  const future = date > localDateAt(now);
  const i = wb.A.days.findIndex((x) => x.date === date);
  const person = (p: PersonId): DayPerson => {
    const d = wb[p].days[i];
    return {
      bells: future || !d ? 0 : d.bells,
      met: future || !d ? noneMet() : { ...d.met },
      steps: d?.steps ?? null,
      exerciseMin: d?.exerciseMin ?? 0,
      move: { value: d?.moveKcal ?? null, goal: d?.moveGoal ?? 0 },
      standMin: d?.standMin ?? null
    };
  };
  return { date, people: { A: person('A'), B: person('B') }, together: !future && (wb.together[i] ?? false) };
}

// ---------- ベル ledger: model/bells.ts ----------

export { bellsLedger, type BellsLedger, type LedgerDay, type LedgerSpend } from './bells.ts';
