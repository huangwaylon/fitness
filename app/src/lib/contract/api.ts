// The record's tables and API shapes (docs/backend.md#tables, #api). Shared by the record (relay/src/store.ts), the
// model and the client: row tuples, reply shapes and the validation regexes both sides apply. Dependency-free (type
// imports only).
import type { PersonId, Who } from '../types.ts';
import { isRec } from './guards.ts';

/** The people (types.ts), for the relay: it imports only contract/ (deps.test). @public (relay/) */
export type { PersonId, Who };

/** The event types the server accepts and the model reads (anything else is refused with `bad_request`). */
export const EVENT_TYPES = ['spend', 'spend_void', 'harvest', 'pref', 'find', 'tally', 'island', 'decor', 'board', 'food', 'food_repeat', 'food_recipe', 'food_custom', 'sell', 'buy', 'tally_back', 'listen', 'pack', 'pack_chk', 'pack_reset', 'trip_note', 'wtask', 'wdone', 'wconf', 'wnote', 'farm', 'buy_starts', 'wet', 'room_save'] as const;
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
/** A catalog id (a find's, a tally's goods'). */
export const isFindId = (v: unknown): v is string => typeof v === 'string' && FIND_ID_RE.test(v);
/** A `find`'s data: a known kind and a well-formed id. Shared by the record and the model. */
export const isFind = (d: Record<string, unknown>): boolean => isFindKind(d.kind) && isFindId(d.id);

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
 * Every goal's `pref` key (contract/goals.ts GOALS, the registry, holds each one's rules; written out here so this file
 * stays dependency-free: goals.test.ts checks they agree). Either person may set these for either person
 * (`data.person`); the other prefs are the sender's own.
 */
export const GOAL_PREF_KEYS: readonly string[] = [
  'stepsGoal', 'moveGoal', 'exerciseGoal', 'standGoal', 'goalWeight', 'goalBodyFat', 'goalBmi', 'goalLean', 'kcalGoal', 'proteinGoal', 'fatGoal', 'carbsGoal', 'saltGoal',
  'fibreGoal', 'alcoholGoal'
];

/**
 * The `pref` keys the model reads (any other key is refused): the sender's `locale`, `villagerName`, `villager`, `look`
 * and `savedLooks` (contract/look.ts: the look worn and the コーデ), every
 * goal (contract/goals.ts GOALS: the activity, body and meal-log goals, each its own key), the profile (`sex`, `birth`,
 * `bmiStd`: PROFILE_PREF_KEYS), the island's `weatherMode` (WEATHER_MODES) and its `seasonLook` (isSeasonLook): both
 * island-wide, anyone's, the guest's too.
 */
export const PREF_KEYS: readonly string[] = [
  'locale', 'villagerName', 'villager', 'stepsGoal', 'moveGoal', 'exerciseGoal', 'standGoal', 'goalWeight', 'goalBodyFat', 'goalBmi', 'goalLean', 'kcalGoal',
  'proteinGoal', 'fatGoal', 'carbsGoal', 'saltGoal', 'fibreGoal', 'alcoholGoal', 'weatherMode', 'sex', 'birth', 'bmiStd', 'look', 'savedLooks', 'seasonLook'
];

/** The profile's `pref` keys (contract/profile.ts PROFILE_KEYS, written out here as GOAL_PREF_KEYS are): either member
 *  sets either member's (`data.person`), the guest only its own; private (contract/guest.ts rowsFor). */
export const PROFILE_PREF_KEYS: readonly string[] = ['sex', 'birth', 'bmiStd'];

/** The island's weather (`pref weatherMode`, docs/design.md "Weather"): Tokyo's real sky by the hour (`real`, the
 *  default) or the game's seeded one. One for the whole island (no `person`; the last one set wins), so both phones
 *  agree on the rain-only critters; a member sets it, the guest's phone only shows it. */
const WEATHER_MODES = ['real', 'game'] as const;
export type WeatherMode = (typeof WEATHER_MODES)[number];
export const isWeatherMode = (v: unknown): v is WeatherMode => v === 'real' || v === 'game';

/** The island's look (`pref seasonLook`, 設定 → 季節, docs/design.md "Seasonal look"): an event, a season, a weather and
 *  a time of day the whole island shows instead of the real day's, each null for the real one; `null` is 自動 (the
 *  real date and Tokyo's weather). One for the island (no `person`; the last one set wins). Its fields' names are
 *  checked here, their values by the phones (ui-state/preview.ts lookFrom: a value a phone doesn't know is the real
 *  day's there), so a later build's event still replaces the slot on an older one. */
const SEASON_LOOK_KEYS = ['event', 'season', 'weather', 'tod'] as const;
export type SeasonLook = Partial<Record<(typeof SEASON_LOOK_KEYS)[number], string | null>>;
export const isSeasonLook = (v: unknown): v is SeasonLook | null =>
  v === null || (isRec(v) && Object.entries(v).every(([k, x]) => (SEASON_LOOK_KEYS as readonly string[]).includes(k) && (x === null || (typeof x === 'string' && /^[a-z0-9-]{1,24}$/.test(x)))));


export const isPersonId = (v: unknown): v is PersonId => v === 'A' || v === 'B';
/** A member or the guest (`G`): who sent a row. */
export const isWho = (v: unknown): v is Who => v === 'A' || v === 'B' || v === 'G';

/**
 * Whose data an event changes: `data.person` when present (only on a goal or profile `pref`, and it must be `A` or `B`), else the
 * sender. Null for a `person` that is invalid or on an event that doesn't take one (the record refuses it; the model
 * ignores the event). Shared by the record and the model.
 */
export function eventSubject(type: string, d: Record<string, unknown>, sender: Who): Who | null {
  if (d.person === undefined) return sender;
  if (!isPersonId(d.person) || type !== 'pref' || !(GOAL_PREF_KEYS.includes(d.key as string) || PROFILE_PREF_KEYS.includes(d.key as string))) return null;
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

/** An event or spend id: a non-empty string of at most 128 characters. */
export const isId = (v: unknown): v is string => typeof v === 'string' && v.length > 0 && v.length <= 128;


/** Whether `d` has exactly these keys (an event's data: nothing more, nothing missing). */
export const keysAre = (d: Record<string, unknown>, keys: readonly string[]): boolean => {
  const k = Object.keys(d);
  return k.length === keys.length && keys.every((x) => Object.hasOwn(d, x));
};

/** Ingest's upper bounds for the activity metrics (inclusive): a higher value is skipped. @public (relay/src/parse.ts) */
export const METRIC_BOUNDS = { steps: 100_000, exercise_min: 1_440, move_kcal: 10_000, stand_min: 1_440 } as const;
/** A plausible body weight in kg (inclusive): ingest skips anything else (a goal's range: contract/goals.ts). */
export const WEIGHT_KG = { min: 20, max: 300 } as const;

/** A plausible value of each body metric (inclusive): ingest skips anything else, the model ignores it. */
export const BODY_BOUNDS: Record<BodyMetric, { min: number; max: number }> = {
  body_fat_pct: { min: 2, max: 70 },
  bmi: { min: 10, max: 60 },
  lean_kg: { min: 10, max: 150 }
};

/** kg to one decimal (how weights are stored; the body metrics too). */
export const roundKg = (v: number): number => Math.round(v * 10) / 10;

/** `snapshot` rows: compact arrays in tab column order. `at` is ISO 8601 UTC with milliseconds (`…T…:…:….sssZ`). */
export type MetricRow = [at: string, person: PersonId, date: string, metric: MetricKey, value: number];
/** `data` is the JSON text exactly as stored in the cell. `person` the sender: a member, or the guest (`G`: only its
 *  finds, tallies, cosmetic prefs, its kcal goal, its meals, repeats and recipes, board notes and tent decor, contract/guest.ts). */
export type EventRow = [at: string, person: Who, id: string, type: EventType, data: string];

export interface SnapshotRows { metrics: MetricRow[]; events: EventRow[] }

/** `forbidden`: the guest's key asked for something only a member may (an ingest, a buy, a goal: contract/guest.ts). @public (relay/src/store.ts) */
export type ApiError = 'unauthorized' | 'forbidden' | 'bad_request' | 'too_large' | 'busy' | 'unavailable';
/** @public (relay/src/store.ts) */
export type Fail = { ok: false; error: ApiError; detail?: string };

/**
 * `rev` is the data revision (docs/backend.md#revision): when it differs from the one the client cached with, it
 * is another epoch (the record was rebuilt, or another backend answered), so drop the cache and fetch everything (no `since`).
 */
export type SnapshotReply = { ok: true; me: Who; now: string; rev: string; rows: SnapshotRows; next?: string } | Fail;

/** A paged `snapshot` (2026-11-05, docs/backend.md#api): `page` rows at most a reply, the next page asked for with the
 *  reply's `next` as `after` (the same `since`) until a reply has none. A request without `page` gets every row at once,
 *  as before. @public (relay/src/store.ts, sync/cache.ts) */
export const SNAPSHOT_PAGE = 4000;
/** The most rows a page may ask for. @public (relay/src/store.ts) */
export const SNAPSHOT_PAGE_MAX = 10_000;
/** A page's cursor (`next`, `after`): the last row's `at`, its table (`m` metrics, `e` events) and its `seq`.
 *  @public (relay/src/store.ts) */
export const CURSOR_RE = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z)\|([me])\|(\d{1,15})$/;
/** A row's `at` (the record's clock, ISO with ms). @public (relay/src/store.ts) */
export const ISO_AT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
/** The record's caps on one `/api` request: its body's characters, and an `events` batch's events. The phones' queue
 *  (sync/queue.ts) sends under them; never lower them below what a build in use sends. @public (relay/src/store.ts) */
export const MAX_BODY_CHARS = 1_000_000;
/** @public (relay/src/store.ts) */
export const EVENTS_MAX = 50;
/** A batch that is one `group` alone may hold this many (a room's whole change at once, all or none: up to TENT_MAX
 *  removals, TENT_MAX placements, the wallpaper, the floor and the size; 2026-11-10). @public (relay/src/store.ts) */
export const GROUP_MAX = 128;
/** `build`: the deployed relay's commit (relay/scripts/deploy.sh COMMIT; `dev` unstamped), as `/health`'s `sha`. `me`: `G` for the
 *  guest's key. */
export type WhoamiReply = { ok: true; me: Who; build: string } | Fail;
