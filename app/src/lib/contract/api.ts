// The sheet layout and the web-app API shapes (docs/design/sheets-architecture.md §1–2). Shared by the Apps
// Script (app/gas/main.ts), the model and the client: row tuples, reply shapes and the validation regexes both sides
// apply. Dependency-free (type imports only), since it is bundled into apps-script/Code.js.
import type { PersonId } from '../types.ts';

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
  'checkin', 'confirm', 'spend', 'approve', 'transfer', 'harvest', 'highfive', 'pref',
  // History and editing (docs/design/history-and-editing.md §4): own data only, open weeks only (the model decides).
  'metric_set', 'workout_edit', 'workout_add', 'spend_void', 'transfer_undo'
] as const;
export type EventType = (typeof EVENT_TYPES)[number];

export type MetricKey = 'steps' | 'exercise_min';
export const isMetricKey = (v: unknown): v is MetricKey => v === 'steps' || v === 'exercise_min';

/** A local date `YYYY-MM-DD`. */
export const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
/** A month `YYYY-MM` (`transfer`, `transfer_undo`). */
export const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;
/** A `workout_add` id: `m:` + up to 100 word characters or dashes. */
export const MANUAL_ID_RE = /^m:[\w-]{1,100}$/;

export const isRec = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

/** `metric_set` bounds (inclusive, integers). The Apps Script refuses anything else with `bad_request`. */
export const METRIC_BOUNDS = { steps: 100_000, exercise_min: 1_440 } as const;
/** `workout_add` minutes (inclusive, integer). */
export const MANUAL_WORKOUT_MIN = { min: 1, max: 600 } as const;

/** `snapshot` rows: compact arrays in tab column order. `at` is ISO 8601 UTC with milliseconds (`…T…:…:….sssZ`). */
export type MetricRow = [at: string, person: PersonId, date: string, metric: MetricKey, value: number];
export type WorkoutRow = [at: string, person: PersonId, id: string, date: string, type: string, start: string, end: string, durationMin: number, avgHr: number | null];
export type PresenceRow = [at: string, person: PersonId, place: string, event: 'arrive' | 'leave', eventAt: string];
/** `data` is the JSON text exactly as stored in the cell. */
export type EventRow = [at: string, person: PersonId, id: string, type: EventType, data: string];

export interface SnapshotRows { metrics: MetricRow[]; workouts: WorkoutRow[]; presence: PresenceRow[]; events: EventRow[] }

export type ApiError = 'unauthorized' | 'bad_request' | 'too_large' | 'busy' | 'unavailable';
export type Fail = { ok: false; error: ApiError; detail?: string };

export type IngestReply = { ok: true; metrics: number; workouts: number; skipped?: number; unknownTypes?: string[] } | Fail;
export type PresenceReply = { ok: true } | Fail;
export type EventReply = { ok: true; duplicate?: true } | Fail;
/**
 * `rev` is the data revision (sheets-architecture.md §2.1): when it differs from the one the client cached with, rows
 * were changed by hand, so drop the cache and fetch everything (no `since`).
 */
export type SnapshotReply = { ok: true; me: PersonId; now: string; rev: string; rows: SnapshotRows } | Fail;
/** `build`: hash of the deployed Code.js (`dev` unbundled), to tell which code the deployment runs. */
export type WhoamiReply = { ok: true; me: PersonId; build: string } | Fail;
/** Keyless `{"action":"health"}`: the deployment is up, authorized and running `build` (runbook §5). */
export type HealthReply = { ok: true; build: string } | Fail;
