// Public API of the scoring module: pure functions, no I/O. Implementation split across sibling files.
export { addDays, nowInZone, toLocalDate, weekDays, weekKeyOf } from '#lib/scoring/dates.ts';
export { targetsFor } from '#lib/scoring/targets.ts';
export { scoreWeek } from '#lib/scoring/score.ts';
export { nextRung, payoutWeek } from '#lib/scoring/payout.ts';
export { deriveVisits } from '#lib/scoring/visits.ts';
export type { PlaceRow, PresenceRow } from '#lib/scoring/visits.ts';
export { checkPromise } from '#lib/scoring/promise.ts';
