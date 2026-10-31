// きろく (docs/design.md#kiroku): every recorded day, with its ベル, for both people, computed on read from the same
// state as the WeekView. Read-only (Apple Health is the source of truth). Pure; the UI asks for one opened day at a
// time (lazy).
import type { LocalDate, PersonId, RingBells, RingFruit } from '#lib/types.ts';
import { localDateAt, weekKeyOf } from '#lib/time/dates.ts';
import { noneMet, ringBells } from '#lib/scoring/bells.ts';
import type { State } from './state.ts';
import { weekBells } from './bells.ts';

export interface DayPerson {
  /** The day's ベル: +1 per goal met, + がんばり. */
  bells: number;
  /** The daily goal met, per fruit. */
  met: Record<RingFruit, boolean>;
  /** The stretch target (1.5 × the goal) reached, per fruit. */
  stretched: Record<RingFruit, boolean>;
  /** がんばり ベル in `bells` (0–2). */
  stretch: number;
  /** ベル per fruit (1 = met, 2 = met and its がんばり paid). */
  rings: RingBells;
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
    const e = future ? undefined : d;
    const met = e ? { ...e.met } : noneMet();
    const stretched = e ? { ...e.stretched } : noneMet();
    return {
      bells: e?.bells ?? 0,
      met,
      stretched,
      stretch: e?.stretch ?? 0,
      rings: ringBells({ met, stretched }),
      steps: d?.steps ?? null,
      exerciseMin: d?.exerciseMin ?? 0,
      move: { value: d?.moveKcal ?? null, goal: d?.moveGoal ?? 0 },
      standMin: d?.standMin ?? null
    };
  };
  return { date, people: { A: person('A'), B: person('B') }, together: !future && (wb.together[i] ?? false) };
}

// ---------- ベル ledger: model/bells.ts ----------

export { bellsLedger, type BellsLedger, type LedgerDay } from './bells.ts';
