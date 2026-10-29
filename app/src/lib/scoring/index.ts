// Public API of the scoring module: pure functions, no I/O. Implementation split across sibling files.
export { addDays, nowInZone, toLocalDate, weekDays, weekKeyOf } from '#lib/scoring/dates.ts';
export { rulesFor, targetsFor } from '#lib/scoring/targets.ts';
export { activeMilliOfDay, isStrengthWorkout, manualMinutesByDay, minuteSourcesMilli, scoreWeek } from '#lib/scoring/score.ts';
export { nextRung, payoutWeek } from '#lib/scoring/payout.ts';
export { deriveVisits } from '#lib/scoring/visits.ts';
