// Public API of the scoring module: pure functions, no I/O. Implementation split across sibling files.
export { addDays, nowInZone, toLocalDate, weekDays, weekKeyOf } from '#lib/time/dates.ts';
export { rulesFor, targetsFor } from '#lib/scoring/targets.ts';
export { scoreWeek } from '#lib/scoring/score.ts';
export {
  duoBonus, earnWeek, isStrengthWorkout, manualMinutesByDay, minuteSourcesMilli, splitPots, zeroParts,
  type DayEarning, type EarnInput, type FruitWeek, type WeekEarning
} from '#lib/scoring/bells.ts';
export { nextRung, payoutWeek } from '#lib/scoring/payout.ts';
export { deriveVisits } from '#lib/scoring/visits.ts';
