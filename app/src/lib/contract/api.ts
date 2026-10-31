// The sheet layout and the web-app API shapes (docs/design/sheets-architecture.md §1–2). Shared by the Apps
// Script (app/gas/main.ts), the model and the client: row tuples, reply shapes and the validation regexes both sides
// apply. Dependency-free (type imports only), since it is bundled into apps-script/Code.js.
import type { PersonId } from '../types.ts';

export const TABS = {
  metrics: ['at', 'person', 'date', 'metric', 'value'],
  events: ['at', 'person', 'id', 'type', 'data'],
  uploads: ['at', 'person', 'status', 'bytes', 'error']
} as const;

export type TabName = keyof typeof TABS;

/** Columns holding numbers; every other column is formatted as plain text so Sheets never turns dates into Dates. */
export const NUMERIC_COLUMNS: Record<TabName, readonly string[]> = {
  metrics: ['value'],
  events: [],
  uploads: ['bytes']
};

/** The event types the server accepts and the model reads (anything else is refused with `bad_request`). */
export const EVENT_TYPES = [
  'spend', 'harvest', 'highfive', 'pref',
  // History and editing (docs/design/history-and-editing.md §4): anyone's data (`data.person`), open weeks only (the
  // model decides).
  'metric_set', 'workout_edit', 'workout_add', 'spend_void'
] as const;
export type EventType = (typeof EVENT_TYPES)[number];

/**
 * The activity metrics: they earn ベル, and a day's value from the Shortcut only ever goes up (the max of its rows).
 * `move_kcal`: the Move ring's active energy (the Shortcut's `calories`); `stand_min`: Health Stand Time in minutes
 * (the Shortcut's `stand_minutes`).
 */
export type ActivityMetric = 'steps' | 'exercise_min' | 'move_kcal' | 'stand_min';
/**
 * `weight`: body weight in kg with one decimal. A trend only: it never earns ベル, and a day's value is the
 * latest row for it (not the max), since a weight goes down as well as up.
 */
export type MetricKey = ActivityMetric | 'weight';
export const isActivityMetric = (v: unknown): v is ActivityMetric => v === 'steps' || v === 'exercise_min' || v === 'move_kcal' || v === 'stand_min';
export const isMetricKey = (v: unknown): v is MetricKey => isActivityMetric(v) || v === 'weight';

/**
 * The `pref` keys the model reads (any other key is refused): the sender's `locale`, `villagerName`, `villager`,
 * `goalWeight` (kg) and `moveGoal` (kcal), and the shared `menu`.
 */
export const PREF_KEYS = ['locale', 'villagerName', 'villager', 'goalWeight', 'moveGoal', 'menu'] as const;

/**
 * The edit events whose `data.person` names whose data they change: either person may edit either person's
 * data. Absent = the sender. `pref` takes it only for the goals (`PERSON_PREF_KEYS`).
 */
const PERSON_EDIT_TYPES = ['metric_set', 'workout_edit', 'workout_add', 'pref'] as const;
/** The `pref` keys another person may set for you: the two goals. Everything else in `pref` is the sender's own. */
const PERSON_PREF_KEYS = ['goalWeight', 'moveGoal'] as const;

export const isPersonId = (v: unknown): v is PersonId => v === 'A' || v === 'B';

/**
 * Whose data an edit event changes: `data.person` when present (it must be `A` or `B`), else the sender. Null for an
 * invalid `person` (the script refuses it; the model ignores the event), or a `person` on a type or `pref` key that
 * doesn't take one. Shared by the Apps Script and the model.
 */
export function editTarget(type: string, d: Record<string, unknown>, sender: PersonId): PersonId | null {
  if (d.person === undefined) return sender;
  if (!isPersonId(d.person)) return null;
  if (!(PERSON_EDIT_TYPES as readonly string[]).includes(type)) return null;
  if (type === 'pref' && !(PERSON_PREF_KEYS as readonly unknown[]).includes(d.key)) return null;
  return d.person;
}

/** A local date `YYYY-MM-DD`. */
export const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
/** A real calendar date `YYYY-MM-DD` (not 2026-02-30). */
export function isLocalDate(v: unknown): v is string {
  if (typeof v !== 'string' || !DATE_RE.test(v)) return false;
  const ms = Date.parse(`${v}T00:00:00Z`);
  return !Number.isNaN(ms) && new Date(ms).toISOString().slice(0, 10) === v;
}
/** A `workout_add` id: `m:` + up to 100 word characters or dashes. */
export const MANUAL_ID_RE = /^m:[\w-]{1,100}$/;

/** An event or spend id: a non-empty string of at most 128 characters. */
export const isId = (v: unknown): v is string => typeof v === 'string' && v.length > 0 && v.length <= 128;

export const isRec = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

/** `metric_set` upper bounds (inclusive). The Apps Script refuses anything else with `bad_request`. */
export const METRIC_BOUNDS = { steps: 100_000, exercise_min: 1_440, move_kcal: 10_000, stand_min: 1_440, weight: 300 } as const;
/** A plausible body weight in kg (inclusive): ingest skips anything else, `metric_set` and `goalWeight` are refused. */
export const WEIGHT_KG = { min: 20, max: 300 } as const;

/** kg to one decimal (how weights are stored). */
export const roundKg = (v: number): number => Math.round(v * 10) / 10;

/** A weight in kg: finite, within WEIGHT_KG, at most one decimal. */
export const isWeightKg = (v: unknown): v is number =>
  typeof v === 'number' && Number.isFinite(v) && v >= WEIGHT_KG.min && v <= WEIGHT_KG.max && Math.abs(v * 10 - Math.round(v * 10)) < 1e-6;

/**
 * A `metric_set` value: an integer 0–METRIC_BOUNDS for steps, minutes and kcal; a weight (`isWeightKg`, decimals allowed)
 * for `weight`. Shared by the Apps Script (refuses) and the model (ignores).
 */
export function validMetricValue(metric: MetricKey, v: unknown): v is number {
  if (metric === 'weight') return isWeightKg(v);
  return typeof v === 'number' && Number.isInteger(v) && v >= 0 && v <= METRIC_BOUNDS[metric];
}
/** `workout_add` minutes (inclusive, integer). */
export const MANUAL_WORKOUT_MIN = { min: 1, max: 600 } as const;

/** `snapshot` rows: compact arrays in tab column order. `at` is ISO 8601 UTC with milliseconds (`…T…:…:….sssZ`). */
export type MetricRow = [at: string, person: PersonId, date: string, metric: MetricKey, value: number];
/** `data` is the JSON text exactly as stored in the cell. */
export type EventRow = [at: string, person: PersonId, id: string, type: EventType, data: string];

export interface SnapshotRows { metrics: MetricRow[]; events: EventRow[] }

export type ApiError = 'unauthorized' | 'bad_request' | 'too_large' | 'busy' | 'unavailable';
export type Fail = { ok: false; error: ApiError; detail?: string };

/** `warnings`: daily-form lists that were dropped (length mismatch) while the rest was saved. */
export type IngestReply = { ok: true; metrics: number; skipped?: number; warnings?: string[] } | Fail;
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
/** `uploads`: the caller's last ingest audit rows, newest first (`notes` holds warnings plus the body's shape). */
export type UploadsReply = { ok: true; rows: { at: string; status: string; bytes: number; notes: string }[] } | Fail;
