// Public API of the scoring module: pure functions, no I/O. Implemented by the scoring workstream.
import type {
  LocalDate, PersonId, PersonTargets, PromiseResult, Visit, WeekInput, WeekKey, WeekPayout, WeekPromise,
  WeekScore, Workout
} from '#lib/types.ts';

const todo = (name: string): never => {
  throw new Error(`scoring.${name} not implemented`);
};

/** ISO timestamp (with offset) → local date in Asia/Tokyo. */
export function toLocalDate(iso: string): LocalDate { return todo('toLocalDate'); }
/** Monday of the week containing `date`. */
export function weekKeyOf(date: LocalDate): WeekKey { return todo('weekKeyOf'); }
/** The seven dates Mon..Sun of a week. */
export function weekDays(weekKey: WeekKey): LocalDate[] { return todo('weekDays'); }
export function addDays(date: LocalDate, n: number): LocalDate { return todo('addDays'); }
/** Current local date/time parts in Asia/Tokyo (weekday 0 = Sunday). */
export function nowInZone(now?: Date): { date: LocalDate; weekday: number; hour: number; minute: number } { return todo('nowInZone'); }

/** Season targets for a person in a week, with holiday easy-week factors applied (ADR 0011). */
export function targetsFor(person: PersonId, weekKey: WeekKey): PersonTargets { return todo('targetsFor'); }

export function scoreWeek(input: WeekInput): WeekScore { return todo('scoreWeek'); }
export function payoutWeek(a: WeekScore, b: WeekScore): WeekPayout { return todo('payoutWeek'); }

export interface PresenceRow { id: number; placeKey: string; event: 'arrive' | 'leave'; at: string }
export interface PlaceRow { key: string; autoStrength: boolean }
/** Pair arrive→leave events into visits (dwell ≥ STRENGTH.minVisitMin). `confirmations` keyed by arrive id. */
export function deriveVisits(events: PresenceRow[], places: PlaceRow[], confirmations: Map<number, boolean>): (Visit & { arriveEventId: number })[] { return todo('deriveVisits'); }

export function checkPromise(p: WeekPromise, weekKey: WeekKey, workouts: Workout[], visits: Visit[], cozyDays: LocalDate[], today: LocalDate): PromiseResult { return todo('checkPromise'); }

/** Next trip rung above `totalYen`, or null past the top. */
export function nextRung(totalYen: number): { key: string; yen: number; remainingYen: number } | null { return todo('nextRung'); }
