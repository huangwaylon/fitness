// Public API of the scoring module: pure functions, no I/O. Implementation split across sibling files.
export { addDays, nowInZone, toLocalDate, weekDays, weekKeyOf } from '#lib/time/dates.ts';
export { habitsFor, rulesFor } from '#lib/scoring/targets.ts';
export {
  duoBonus, earnWeek, isStrengthWorkout, manualMinutesByDay, minuteSourcesMilli, splitPots, type EarnInput, type WeekEarning
} from '#lib/scoring/bells.ts';
export { deriveVisits } from '#lib/scoring/visits.ts';
