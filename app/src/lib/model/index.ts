// Public API of the compute-on-read model: pure functions, no I/O (docs/design/sheets-architecture.md §3).
export type { Snapshot, SnapshotRows, MetricRow, WorkoutRow, PresenceRow, EventRow, EventType } from './snapshot.ts';
export { emptyRows, mergeRows, maxAt } from './snapshot.ts';
export { reduce, firstWeek, provisionalMs, finalMs, isLockedAt, type State } from './state.ts';
export { buildWeekView, payoutAsOf, settledWeeks, paidAt, monthEarnings, prevMonth, type SettledWeek } from './week.ts';
export { workoutLabel } from './labels.ts';
