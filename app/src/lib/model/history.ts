// きろく (docs/design.md#kiroku): every recorded week and day, with its ベル, for both people, computed on read from the
// same state as the WeekView. Read-only (Apple Health is the source of truth). Pure; the UI asks for one opened week or
// day at a time (lazy).
import type { HarvestBonus, LocalDate, PersonId, RingBells, RingFruit, WeekKey } from '#lib/types.ts';
import { addDays, localDateAt, weekKeyOf } from '#lib/time/dates.ts';
import { zeroRings, type WeekEarning } from '#lib/scoring/bells.ts';
import { firstWeek, provisionalMs, type State } from './state.ts';
import { dailyUpTo, dayBells, weekBells, type WeekBells } from './bells.ts';
import { replayHarvests } from './week.ts';

/** A week's ベル at `now` (both people's daily earnings up to today, and the bonus once it landed on Sunday 19:30). */
function weekTotal(w: WeekBells, today: LocalDate, now: number): { bells: number; bonus: HarvestBonus } {
  const bonus: HarvestBonus = provisionalMs(w.weekKey) <= now ? { ...w.bonus } : { A: 0, B: 0, duo: 0 };
  return { bonus, bells: dailyUpTo(w.A, today) + dailyUpTo(w.B, today) + bonus.A + bonus.B + bonus.duo };
}

/** Badge progress per fruit: days at the goal this week, and the threshold of the week's rule version. */
type RingWeek = Record<RingFruit, { days: number; goal: number }>;
const ringWeekOf = (e: WeekEarning): RingWeek =>
  Object.fromEntries(Object.entries(e.fruits).map(([f, x]) => [f, { days: x.weekDays, goal: x.weekGoalDays }])) as RingWeek;

interface HistoryPerson {
  /** The four badges. */
  ringBadges: Record<RingFruit, boolean>;
  /** Badge progress per fruit (days at the goal / the threshold). */
  ringWeek: RingWeek;
}

export interface HistoryWeek {
  weekKey: WeekKey;
  current: boolean;
  /** Both tapped 受け取る. */
  harvested: boolean;
  people: Record<PersonId, HistoryPerson>;
}

/** Every week from the economy's first week (or this week, before it starts) to this week, newest first. */
export function historyWeeks(s: State, now: number): HistoryWeek[] {
  const today = localDateAt(now);
  const cur = weekKeyOf(today);
  const harvested = new Set([...replayHarvests(s, now)].filter(([, by]) => by.size === 2).map(([wk]) => wk));
  const out: HistoryWeek[] = [];
  const start = firstWeek(s) < cur ? firstWeek(s) : cur;
  for (let wk = cur; wk >= start; wk = addDays(wk, -7)) {
    const wb = weekBells(s, wk, now);
    const person = (e: WeekEarning): HistoryPerson => ({ ringBadges: { ...e.badges }, ringWeek: ringWeekOf(e) });
    out.push({ weekKey: wk, current: wk === cur, harvested: harvested.has(wk), people: { A: person(wb.A), B: person(wb.B) } });
  }
  return out;
}

// ---------- week detail ----------

interface DayRow {
  date: LocalDate;
  future: boolean;
  steps: number | null;
  /** Exercise minutes (floored). */
  exerciseMin: number;
  /** Move, active kcal. */
  moveKcal: number | null;
  standMin: number | null;
  /** The daily goal met, per fruit. */
  met: Record<RingFruit, boolean>;
}

interface WeekDetailPerson {
  /** The four badges. */
  ringBadges: Record<RingFruit, boolean>;
  /** Badge progress per fruit (days at the goal / the threshold). */
  ringWeek: RingWeek;
  days: DayRow[];
}

export interface WeekDetail {
  weekKey: WeekKey;
  current: boolean;
  /** The harvest opened (Sunday 19:30): the badges are the week's. */
  settled: boolean;
  /** The week's ベル (both people, incl. the bonus once it landed) and the bonus itself. */
  bells: number;
  bonus: HarvestBonus;
  people: Record<PersonId, WeekDetailPerson>;
}

export function weekDetail(s: State, wk: WeekKey, now: number): WeekDetail {
  const today = localDateAt(now);
  const wb = weekBells(s, wk, now);
  const b = weekTotal(wb, today, now);
  const person = (p: PersonId): WeekDetailPerson => ({
    ringBadges: { ...wb[p].badges },
    ringWeek: ringWeekOf(wb[p]),
    days: wb[p].days.map((d) => ({
      date: d.date,
      future: d.date > today,
      steps: d.steps,
      exerciseMin: d.exerciseMin,
      moveKcal: d.moveKcal,
      standMin: d.standMin,
      met: { ...d.met }
    }))
  });
  return {
    weekKey: wk,
    current: wk === weekKeyOf(today),
    settled: wk >= firstWeek(s) && provisionalMs(wk) <= now,
    bells: b.bells,
    bonus: b.bonus,
    people: { A: person('A'), B: person('B') }
  };
}

// ---------- day detail ----------

export interface DayPerson {
  /** The day's ベル, per ring fruit. */
  bells: number;
  rings: RingBells;
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
}

export function dayDetail(s: State, date: LocalDate, now: number): DayDetail {
  const wb = weekBells(s, weekKeyOf(date), now);
  const future = date > localDateAt(now);
  const person = (p: PersonId): DayPerson => {
    const d = wb[p].days.find((x) => x.date === date);
    return {
      ...(future ? { bells: 0, rings: zeroRings() } : dayBells(wb[p], date)),
      met: d ? { ...d.met } : { pear: false, peach: false, cherry: false, apple: false },
      steps: d?.steps ?? null,
      exerciseMin: d?.exerciseMin ?? 0,
      move: { value: d?.moveKcal ?? null, goal: d?.moveGoal ?? 0 },
      standMin: d?.standMin ?? null
    };
  };
  return { date, people: { A: person('A'), B: person('B') } };
}

// ---------- ベル ledger: model/bells.ts ----------

export { bellsLedger, type BellsLedger, type LedgerBonus, type LedgerDay, type LedgerSpend } from './bells.ts';
