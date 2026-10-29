// The sheet layout and the web-app API shapes (docs/design/sheets-architecture.md §1–2). Shared by the Apps
// Script (app/gas/main.ts) and anything client-side that wants the row tuple types. Dependency-free.

export const TABS = {
  metrics: ['at', 'person', 'date', 'metric', 'value'],
  workouts: ['at', 'person', 'id', 'date', 'type', 'start', 'end', 'duration_min', 'avg_hr'],
  presence: ['at', 'person', 'place', 'event', 'event_at'],
  events: ['at', 'person', 'id', 'type', 'data'],
  uploads: ['at', 'person', 'status', 'bytes', 'error']
} as const;

export type TabName = keyof typeof TABS;

/** Columns holding numbers; every other column is formatted as plain text so Sheets never turns dates into Dates. */
export const NUMERIC_COLUMNS: Record<TabName, readonly string[]> = {
  metrics: ['value'],
  workouts: ['duration_min', 'avg_hr'],
  presence: [],
  events: [],
  uploads: ['bytes']
};

export const EVENT_TYPES = [
  'checkin', 'confirm', 'spend', 'approve', 'transfer', 'harvest', 'highfive', 'pref', 'share',
  // History and editing (docs/design/history-and-editing.md §4): own data only, open weeks only (the model decides).
  'metric_set', 'workout_edit', 'workout_add', 'spend_void', 'transfer_undo'
] as const;
export type EventType = (typeof EVENT_TYPES)[number];

export type Person = 'A' | 'B';

/** `metric_set` bounds (inclusive, integers). The Apps Script refuses anything else with `bad_request`. */
export const METRIC_BOUNDS = { steps: 100_000, exercise_min: 1_440 } as const;
/** `workout_add` minutes (inclusive, integer). */
export const MANUAL_WORKOUT_MIN = { min: 1, max: 600 } as const;

/** `snapshot` rows: compact arrays in tab column order. `at` is ISO 8601 UTC with milliseconds (`…T…:…:….sssZ`). */
export type MetricRow = [at: string, person: Person, date: string, metric: 'steps' | 'exercise_min', value: number];
export type WorkoutRow = [at: string, person: Person, id: string, date: string, type: string, start: string, end: string, durationMin: number, avgHr: number | null];
export type PresenceRow = [at: string, person: Person, place: string, event: 'arrive' | 'leave', eventAt: string];
/** `data` is the JSON text exactly as stored in the cell. */
export type EventRow = [at: string, person: Person, id: string, type: EventType, data: string];

export interface SnapshotRows { metrics: MetricRow[]; workouts: WorkoutRow[]; presence: PresenceRow[]; events: EventRow[] }

export type ApiError = 'unauthorized' | 'bad_request' | 'too_large' | 'busy' | 'unavailable';
export type Fail = { ok: false; error: ApiError; detail?: string };

export type IngestReply = { ok: true; metrics: number; workouts: number; skipped?: number; unknownTypes?: string[] } | Fail;
export type PresenceReply = { ok: true } | Fail;
export type EventReply = { ok: true; duplicate?: true } | Fail;
export type SnapshotReply = { ok: true; me: Person; now: string; rows: SnapshotRows } | Fail;
export type WhoamiReply = { ok: true; me: Person } | Fail;
