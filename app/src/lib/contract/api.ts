// The record's tabs and API shapes (docs/backend.md#tabs, #api). Shared by the record (relay/src/store.ts), the sheet's
// exporter (app/gas/main.ts), the model and the client: row tuples, reply shapes and the validation regexes both sides
// apply. Dependency-free (type imports only), since it is bundled into apps-script/Code.js.
import type { PersonId, Who } from '../types.ts';

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
export const EVENT_TYPES = ['spend', 'spend_void', 'harvest', 'pref', 'find', 'tally', 'island', 'decor', 'board', 'food', 'food_repeat', 'food_recipe'] as const;
export type EventType = (typeof EVENT_TYPES)[number];

/**
 * A `find` (docs/backend.md#events): the island's scenery, a catch or a pick-up for the shared ずかん. It never earns
 * or costs ベル. `kind` is one of these (`item` / `recipe`: what a balloon's present held); `id` a catalog id (the
 * client's lists may grow without a redeploy).
 */
const FIND_KINDS = ['fish', 'bug', 'sea', 'fossil', 'shell', 'fragment', 'item', 'recipe'] as const;
export type FindKind = (typeof FIND_KINDS)[number];
/** A catalog id: lowercase letters, digits and dashes, starting with a letter, at most 48 characters. */
const FIND_ID_RE = /^[a-z][a-z0-9-]{0,47}$/;
const isFindKind = (v: unknown): v is FindKind => (FIND_KINDS as readonly unknown[]).includes(v);
/** A `find`'s data: a known kind and a well-formed id. Shared by the record and the model. */
export const isFind = (d: Record<string, unknown>): boolean => isFindKind(d.kind) && typeof d.id === 'string' && FIND_ID_RE.test(d.id);

/**
 * The activity metrics: they earn ベル, and a day's value is its latest row (Apple Health's current total; a re-sync
 * may lower it).
 * `move_kcal`: the Move ring's active energy (the Shortcut's `calories`); `stand_min`: Health Stand Time in minutes
 * (the Shortcut's `stand_minutes`).
 */
export type ActivityMetric = 'steps' | 'exercise_min' | 'move_kcal' | 'stand_min';
/**
 * The body metrics besides weight, from Apple Health's body measurements (the Shortcut's `body_fat_percentage`,
 * `body_mass_index`, `lean_body_mass`), each with one decimal: `body_fat_pct` Body Fat Percentage in %, `bmi` Body Mass Index (no unit),
 * `lean_kg` Lean Body Mass in kg. Trends only, like weight: they never earn ベル; a day's value is its latest row.
 */
export type BodyMetric = 'body_fat_pct' | 'bmi' | 'lean_kg';
/**
 * `weight`: body weight in kg with one decimal. A trend only: it never earns ベル; a day's value is its latest row,
 * like the activity metrics. @public (relay/src/parse.ts)
 */
export type MetricKey = ActivityMetric | 'weight' | BodyMetric;
export const isActivityMetric = (v: unknown): v is ActivityMetric => v === 'steps' || v === 'exercise_min' || v === 'move_kcal' || v === 'stand_min';
export const isBodyMetric = (v: unknown): v is BodyMetric => v === 'body_fat_pct' || v === 'bmi' || v === 'lean_kg';
/** @public (relay/src/store.ts) */
export const isMetricKey = (v: unknown): v is MetricKey => v === 'weight' || isActivityMetric(v) || isBodyMetric(v);

/**
 * The `pref` keys the model reads (any other key is refused): the sender's `locale`, `villagerName`, `villager`,
 * `goalWeight` (kg), `goalBodyFat` (body fat %), `moveGoal` (kcal), `stepsGoal` (steps) and `kcalGoal` (the meal
 * log's daily kcal, contract/food.ts).
 */
export const PREF_KEYS = ['locale', 'villagerName', 'villager', 'goalWeight', 'goalBodyFat', 'moveGoal', 'stepsGoal', 'kcalGoal'] as const;

/** The `pref` keys either person may set for either person (`data.person`): the goals. The rest are the sender's own. */
const PERSON_PREF_KEYS = ['goalWeight', 'goalBodyFat', 'moveGoal', 'stepsGoal', 'kcalGoal'] as const;

export const isPersonId = (v: unknown): v is PersonId => v === 'A' || v === 'B';
/** A member or the guest (`G`): who sent a row. */
export const isWho = (v: unknown): v is Who => v === 'A' || v === 'B' || v === 'G';

/**
 * Whose data an event changes: `data.person` when present (only on a goal `pref`, and it must be `A` or `B`), else the
 * sender. Null for a `person` that is invalid or on an event that doesn't take one (the record refuses it; the model
 * ignores the event). Shared by the record and the model.
 */
export function eventSubject(type: string, d: Record<string, unknown>, sender: Who): Who | null {
  if (d.person === undefined) return sender;
  if (!isPersonId(d.person) || type !== 'pref' || !(PERSON_PREF_KEYS as readonly unknown[]).includes(d.key)) return null;
  return d.person;
}

/** A local date `YYYY-MM-DD`. */
export const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
/** A real calendar date `YYYY-MM-DD` (not 2026-02-30). */
export function isLocalDate(v: unknown): v is string {
  if (typeof v !== 'string' || !DATE_RE.test(v)) return false;
  // Arithmetic, not Date (the meal log checks one per row it reads): the proleptic Gregorian calendar, as Date's.
  const y = +v.slice(0, 4), m = +v.slice(5, 7), d = +v.slice(8, 10);
  const leap = y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0);
  return m >= 1 && m <= 12 && d >= 1 && d <= (m === 2 ? (leap ? 29 : 28) : m === 4 || m === 6 || m === 9 || m === 11 ? 30 : 31);
}
/** The calendar day after `date` (`YYYY-MM-DD`). */
export const nextDay = (date: string): string => new Date(Date.parse(`${date}T00:00:00Z`) + 86400_000).toISOString().slice(0, 10);

/** An event or spend id: a non-empty string of at most 128 characters. */
export const isId = (v: unknown): v is string => typeof v === 'string' && v.length > 0 && v.length <= 128;

export const isRec = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

/** Ingest's upper bounds for the activity metrics (inclusive): a higher value is skipped. @public (relay/src/parse.ts) */
export const METRIC_BOUNDS = { steps: 100_000, exercise_min: 1_440, move_kcal: 10_000, stand_min: 1_440 } as const;
/** A plausible body weight in kg (inclusive): ingest skips anything else, a `goalWeight` outside it is refused. */
export const WEIGHT_KG = { min: 20, max: 300 } as const;

/** A plausible value of each body metric (inclusive): ingest skips anything else, the model ignores it. */
export const BODY_BOUNDS: Record<BodyMetric, { min: number; max: number }> = {
  body_fat_pct: { min: 2, max: 70 },
  bmi: { min: 10, max: 60 },
  lean_kg: { min: 10, max: 150 }
};

/** A body fat goal in % (inclusive): a `goalBodyFat` outside it is refused. */
export const BODY_FAT_GOAL = { min: 3, max: 60 } as const;

/** kg to one decimal (how weights are stored; the body metrics too). */
export const roundKg = (v: number): number => Math.round(v * 10) / 10;

/** A weight in kg: finite, within WEIGHT_KG, at most one decimal. */
export const isWeightKg = (v: unknown): v is number =>
  typeof v === 'number' && Number.isFinite(v) && v >= WEIGHT_KG.min && v <= WEIGHT_KG.max && Math.abs(v * 10 - Math.round(v * 10)) < 1e-6;

/** A body fat goal in %: finite, within BODY_FAT_GOAL, at most one decimal. */
export const isBodyFatGoal = (v: unknown): v is number =>
  typeof v === 'number' && Number.isFinite(v) && v >= BODY_FAT_GOAL.min && v <= BODY_FAT_GOAL.max && Math.abs(v * 10 - Math.round(v * 10)) < 1e-6;

/** `snapshot` rows: compact arrays in tab column order. `at` is ISO 8601 UTC with milliseconds (`…T…:…:….sssZ`). */
export type MetricRow = [at: string, person: PersonId, date: string, metric: MetricKey, value: number];
/** `data` is the JSON text exactly as stored in the cell. `person` the sender: a member, or the guest (`G`: only its
 *  finds, tallies, cosmetic prefs, its kcal goal, its meals, repeats and recipes, board notes and tent decor, contract/guest.ts). */
export type EventRow = [at: string, person: Who, id: string, type: EventType, data: string];

export interface SnapshotRows { metrics: MetricRow[]; events: EventRow[] }

/** `forbidden`: the guest's key asked for something only a member may (an ingest, a buy, a goal: contract/guest.ts). */
export type ApiError = 'unauthorized' | 'forbidden' | 'bad_request' | 'too_large' | 'busy' | 'unavailable';
export type Fail = { ok: false; error: ApiError; detail?: string };

/**
 * `rev` is the data revision (docs/backend.md#revision): when it differs from the one the client cached with, it
 * is another epoch (the record was rebuilt, or another backend answered), so drop the cache and fetch everything (no `since`).
 */
export type SnapshotReply = { ok: true; me: Who; now: string; rev: string; rows: SnapshotRows } | Fail;
/** `build`: hash of the deployed Code.js (`dev` unbundled), to tell which code the deployment runs. `me`: `G` for the
 *  guest's key. */
export type WhoamiReply = { ok: true; me: Who; build: string } | Fail;
