// The sheet layout and the web-app API shapes (docs/backend.md#tabs, #api). Shared by the Apps
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
export const EVENT_TYPES = ['spend', 'spend_void', 'harvest', 'highfive', 'pref'] as const;
export type EventType = (typeof EVENT_TYPES)[number];

/**
 * The activity metrics: they earn ベル, and a day's value is its latest row (Apple Health's current total; a re-sync
 * may lower it).
 * `move_kcal`: the Move ring's active energy (the Shortcut's `calories`); `stand_min`: Health Stand Time in minutes
 * (the Shortcut's `stand_minutes`).
 */
export type ActivityMetric = 'steps' | 'exercise_min' | 'move_kcal' | 'stand_min';
/**
 * `weight`: body weight in kg with one decimal. A trend only: it never earns ベル; a day's value is its latest row,
 * like the activity metrics.
 */
export type MetricKey = ActivityMetric | 'weight';
export const isActivityMetric = (v: unknown): v is ActivityMetric => v === 'steps' || v === 'exercise_min' || v === 'move_kcal' || v === 'stand_min';

/**
 * The `pref` keys the model reads (any other key is refused): the sender's `locale`, `villagerName`, `villager`,
 * `goalWeight` (kg) and `moveGoal` (kcal), and the shared `menu`.
 */
export const PREF_KEYS = ['locale', 'villagerName', 'villager', 'goalWeight', 'moveGoal', 'menu'] as const;

/** The `pref` keys either person may set for either person (`data.person`): the two goals. The rest are the sender's own. */
const PERSON_PREF_KEYS = ['goalWeight', 'moveGoal'] as const;

export const isPersonId = (v: unknown): v is PersonId => v === 'A' || v === 'B';

/**
 * Whose data an event changes: `data.person` when present (only on a goal `pref`, and it must be `A` or `B`), else the
 * sender. Null for a `person` that is invalid or on an event that doesn't take one (the script refuses it; the model
 * ignores the event). Shared by the Apps Script and the model.
 */
export function eventSubject(type: string, d: Record<string, unknown>, sender: PersonId): PersonId | null {
  if (d.person === undefined) return sender;
  if (!isPersonId(d.person) || type !== 'pref' || !(PERSON_PREF_KEYS as readonly unknown[]).includes(d.key)) return null;
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

/** An event or spend id: a non-empty string of at most 128 characters. */
export const isId = (v: unknown): v is string => typeof v === 'string' && v.length > 0 && v.length <= 128;

export const isRec = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

/** Ingest's upper bounds for the activity metrics (inclusive): a higher value is skipped. */
export const METRIC_BOUNDS = { steps: 100_000, exercise_min: 1_440, move_kcal: 10_000, stand_min: 1_440 } as const;
/** A plausible body weight in kg (inclusive): ingest skips anything else, a `goalWeight` outside it is refused. */
export const WEIGHT_KG = { min: 20, max: 300 } as const;

/** kg to one decimal (how weights are stored). */
export const roundKg = (v: number): number => Math.round(v * 10) / 10;

/** A weight in kg: finite, within WEIGHT_KG, at most one decimal. */
export const isWeightKg = (v: unknown): v is number =>
  typeof v === 'number' && Number.isFinite(v) && v >= WEIGHT_KG.min && v <= WEIGHT_KG.max && Math.abs(v * 10 - Math.round(v * 10)) < 1e-6;

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
 * `rev` is the data revision (docs/backend.md#revision): when it differs from the one the client cached with, rows
 * were changed by hand, so drop the cache and fetch everything (no `since`).
 */
export type SnapshotReply = { ok: true; me: PersonId; now: string; rev: string; rows: SnapshotRows } | Fail;
/** `build`: hash of the deployed Code.js (`dev` unbundled), to tell which code the deployment runs. */
export type WhoamiReply = { ok: true; me: PersonId; build: string } | Fail;
/** Keyless `{"action":"health"}`: the deployment is up, authorized and running `build` (docs/ops/runbook.md §3). */
export type HealthReply = { ok: true; build: string } | Fail;
/** `uploads`: the caller's last ingest audit rows, newest first (`notes` holds warnings plus the body's shape). */
export type UploadsReply = { ok: true; rows: { at: string; status: string; bytes: number; notes: string }[] } | Fail;
