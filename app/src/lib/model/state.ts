// Snapshot rows → validated, indexed state. This is where the old server's write-time refusals become read-time
// rules (an event the server would have refused with 4xx is ignored here), so the sheet can stay a dumb log.
import type { LocalDate, PersonId, WeekKey } from '#lib/types.ts';
import { CALIBRATION_WEEKS, CUTOFFS, LIMITS } from '#lib/config/rules.ts';
import { PLACES } from '#lib/config/places.ts';
import { addDays, targetsFor, toLocalDate, weekKeyOf } from '#lib/scoring/index.ts';
import { parseInstant } from '#lib/scoring/dates.ts';
import { seasonsByStart } from '#lib/scoring/targets.ts';
import type { Snapshot } from './snapshot.ts';
import {
  DATE_RE, EVENT_TYPES, isMetricKey, MANUAL_ID_RE, MANUAL_WORKOUT_MIN, METRIC_BOUNDS, MONTH_RE, type EventType, type SnapshotRows
} from '#lib/ingest/sheet-api.ts';
import { WORKOUT_TYPES } from './labels.ts';

export const PEOPLE_IDS: PersonId[] = ['A', 'B'];
export const partnerOf = (p: PersonId): PersonId => (p === 'A' ? 'B' : 'A');

// ---------- time ----------

/** Epoch ms of a JST wall-clock time (Tokyo has no DST). */
export function jstMs(date: LocalDate, hour: number, minute: number): number {
  return Date.parse(`${date}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00+09:00`);
}
/** Sunday 19:30 JST of the week: the harvest opens and the first payout is taken. */
export const provisionalMs = (wk: WeekKey): number => jstMs(addDays(wk, 6), CUTOFFS.provisional.hour, CUTOFFS.provisional.minute);
/** Wednesday 04:00 JST after the week: late data can still raise the payout up to here, then the week locks. */
export const finalMs = (wk: WeekKey): number => jstMs(addDays(wk, 9), CUTOFFS.final.hour, CUTOFFS.final.minute);

/**
 * The demo (`?demo`, lib/client/demoRows.ts) runs before season 1 starts, so it moves the calendar: its own first paid
 * week and no calibration weeks. It travels with the state (`reduce(rows, calendar)`), never as a module global
 * (round 7 L2); live state always has `calendar: null`.
 */
export interface DemoCalendar { firstWeek: WeekKey }
type Cal = Pick<State, 'calendar'>;

/** Weeks paid at the flat calibration rate. */
export const isCalibrationWeek = (s: Cal, wk: WeekKey): boolean => !s.calendar && CALIBRATION_WEEKS.includes(wk);

/** First paid week of the season calendar: the first full Mon–Sun week of season 1. */
const SEASON_FIRST_WEEK: WeekKey = (() => {
  const from = seasonsByStart()[0].from;
  const wk = weekKeyOf(from);
  return wk < from ? addDays(wk, 7) : wk;
})();

/** First paid week (the demo's own one in the demo). */
export const firstWeek = (s: Cal): WeekKey => s.calendar?.firstWeek ?? SEASON_FIRST_WEEK;

/** A week locks (no more check-ins/answers for it) at its Wednesday 04:00; weeks before the first paid week never lock. */
export const isLockedAt = (s: Cal, wk: WeekKey, t: number): boolean => wk >= firstWeek(s) && t >= finalMs(wk);

export const localDateAt = (ms: number): LocalDate => toLocalDate(new Date(ms).toISOString());

/**
 * Open for edits at t (history-and-editing.md §4.3): the day has happened, and its week has not reached its
 * Wednesday 04:00 lock. Unlike `isLockedAt` this also closes weeks before the first paid week, so edits never reach
 * more than ~9.5 days back.
 */
export const editableAt = (date: LocalDate, t: number): boolean => date <= localDateAt(t) && t < finalMs(weekKeyOf(date));

// ---------- records ----------

export interface Timed<T> { at: number; v: T }

export interface WorkoutRec {
  at: number;
  id: string;
  date: LocalDate;
  type: string;
  startAt: string;
  endAt: string;
  durationMin: number;
  avgHr: number | null;
  /** A `workout_add` (Watch forgotten), not an ingested Health workout. */
  manual?: true;
}

export interface PresenceRec {
  /** Numeric id for deriveVisits (row order). */
  n: number;
  /** Stable visit id, used by `confirm {kind:'visit'}`: `<place>@<event_at ISO>`. */
  id: string;
  at: number;
  placeKey: string;
  event: 'arrive' | 'leave';
  eventAt: string;
  eventMs: number;
  /** Tokyo date of `eventAt`. */
  date: LocalDate;
}

/** `edit`: a fix from きろく (`edit:true`), allowed for any open day; it shows in the change log. */
export interface CheckinRec { at: number; date: LocalDate; habit: string; done: boolean; edit?: true }
/** A `workout_edit` field change: `strength` (null = automatic) or `excluded`. */
export interface WorkoutEditRec { at: number; person: PersonId; id: string; strength?: boolean | null; excluded?: boolean }
/** `spendId` is the dedupe key; `rawId` is the id as the client sent it (number or string), echoed back for `approve`. */
export interface SpendRec { at: number; person: PersonId; spendId: string; rawId: number | string; label: string; amountYen: number }
export interface ApproveRec { at: number; person: PersonId; spendId: string }

export interface Prefs { locale?: 'ja' | 'en'; villagerName?: string; villager?: string }

export interface State {
  metrics: Record<PersonId, Map<string, Timed<number>[]>>;
  workouts: Record<PersonId, WorkoutRec[]>;
  workoutConfirms: Map<string, Timed<boolean>[]>;
  presence: Record<PersonId, PresenceRec[]>;
  visitConfirms: Map<string, Timed<boolean>[]>;
  checkins: Record<PersonId, CheckinRec[]>;
  spends: SpendRec[];
  approves: ApproveRec[];
  transfers: { at: number; month: string }[];
  /** Accepted `metric_set` per person, keyed `date|metric`, ascending `at`. */
  metricSets: Record<PersonId, Map<string, Timed<number>[]>>;
  /** Accepted `workout_edit`s (and a `workout_add`'s strength choice), ascending `at`. */
  workoutEdits: WorkoutEditRec[];
  /** Indexes of `workoutEdits` per workout key `person|id`. */
  workoutStrength: Map<string, Timed<boolean | null>[]>;
  workoutExcluded: Map<string, Timed<boolean>[]>;
  /** Accepted `workout_add`s, in `workouts`' shape (`manual: true`). */
  manualWorkouts: Record<PersonId, WorkoutRec[]>;
  /** Accepted `spend_void`s (by the spender, after the spend). */
  spendVoids: { at: number; person: PersonId; spendId: string }[];
  /** Accepted `transfer_undo`s (either person). */
  transferUndos: { at: number; person: PersonId; month: string }[];
  harvests: { at: number; person: PersonId; week: WeekKey }[];
  highfives: { at: number; person: PersonId }[];
  prefs: Record<PersonId, Prefs>;
  /** Newest metrics/workouts row per person (the sheet keeps no per-upload row in the snapshot). */
  lastSync: Record<PersonId, string | null>;
  /** The demo's calendar; null for real data. */
  calendar: DemoCalendar | null;
}

/** Sheets may hand dates back as full ISO instants; normalise to a Tokyo `YYYY-MM-DD`. */
function normDate(v: unknown): LocalDate | null {
  const s = String(v ?? '').trim();
  if (DATE_RE.test(s)) return s;
  if (!s) return null;
  try {
    return toLocalDate(s);
  } catch {
    return null;
  }
}

function ms(v: unknown): number | null {
  const s = String(v ?? '').trim();
  if (!s) return null;
  try {
    return parseInstant(s);
  } catch {
    return null;
  }
}

const isPerson = (p: unknown): p is PersonId => p === 'A' || p === 'B';
const num = (v: unknown): number | null => (v === '' || v === null || v === undefined || !Number.isFinite(Number(v)) ? null : Number(v));

function parseData(d: unknown): Record<string, unknown> | null {
  if (d && typeof d === 'object') return d as Record<string, unknown>;
  if (typeof d !== 'string' || !d) return d === '' ? {} : null;
  try {
    const v = JSON.parse(d);
    return v && typeof v === 'object' ? v : null;
  } catch {
    return null;
  }
}

function sortedByAt<T extends readonly unknown[]>(rows: T[]): { r: T; at: number }[] {
  return rows
    .map((r, i) => ({ r, at: ms(r[0]), i }))
    .filter((x): x is { r: T; at: number; i: number } => x.at !== null && isPerson(x.r[1]))
    .sort((x, y) => x.at - y.at || x.i - y.i);
}

const push = <K, V>(m: Map<K, V[]>, k: K, v: V) => {
  const l = m.get(k);
  if (l) l.push(v);
  else m.set(k, [v]);
};

/** Index and validate all rows. Rows are only ever appended, so nothing here depends on "now". */
export function reduce(rows: SnapshotRows | Snapshot, calendar: DemoCalendar | null = null): State {
  const r = 'rows' in rows ? rows.rows : rows;
  const s: State = {
    metrics: { A: new Map(), B: new Map() },
    workouts: { A: [], B: [] },
    workoutConfirms: new Map(),
    presence: { A: [], B: [] },
    visitConfirms: new Map(),
    checkins: { A: [], B: [] },
    spends: [],
    approves: [],
    transfers: [],
    metricSets: { A: new Map(), B: new Map() },
    workoutEdits: [],
    workoutStrength: new Map(),
    workoutExcluded: new Map(),
    manualWorkouts: { A: [], B: [] },
    spendVoids: [],
    transferUndos: [],
    harvests: [],
    highfives: [],
    prefs: { A: {}, B: {} },
    lastSync: { A: null, B: null },
    calendar
  };
  const c: Ctx = { s, workoutById: new Map(), arriveById: new Map() };
  const lastSyncMs: Record<PersonId, number> = { A: -Infinity, B: -Infinity };
  const synced = (p: PersonId, at: number, iso: string) => {
    if (at > lastSyncMs[p]) {
      lastSyncMs[p] = at;
      s.lastSync[p] = iso;
    }
  };

  for (const { r: row, at } of sortedByAt(r.metrics ?? [])) {
    const [iso, person, d, metric, v] = row;
    const date = normDate(d);
    const value = num(v);
    if (!date || !isMetricKey(metric) || value === null) continue;
    push(s.metrics[person], `${date}|${metric}`, { at, v: value });
    synced(person, at, String(iso));
  }

  for (const { r: row, at } of sortedByAt(r.workouts ?? [])) {
    const [iso, person, id, d, type, start, end, dur, hr] = row;
    const date = normDate(d);
    const durationMin = num(dur);
    const key = `${person}|${id}`;
    if (!id || !date || durationMin === null || c.workoutById.has(key)) continue;
    const w: WorkoutRec = { at, id: String(id), date, type: String(type), startAt: String(start), endAt: String(end), durationMin, avgHr: num(hr) };
    c.workoutById.set(key, w);
    s.workouts[person].push(w);
    synced(person, at, String(iso));
  }

  let n = 0;
  for (const { r: row, at } of sortedByAt(r.presence ?? [])) {
    const [, person, placeKey, event, eventAtRaw] = row;
    const place = PLACES.find((p) => p.key === placeKey);
    if (!place || place.person !== person || (event !== 'arrive' && event !== 'leave')) continue;
    const eventMs = ms(eventAtRaw) ?? at;
    if (Math.abs(eventMs - at) > LIMITS.presenceSkewMs) continue;
    const list = s.presence[person];
    if (list.some((e) => e.placeKey === placeKey && e.event === event && Math.abs(e.eventMs - eventMs) <= LIMITS.presenceDuplicateMs)) continue;
    const eventAt = new Date(eventMs).toISOString();
    const rec: PresenceRec = { n: ++n, id: `${placeKey}@${eventAt}`, at, placeKey, event, eventAt, eventMs, date: toLocalDate(eventAt) };
    list.push(rec);
    if (event === 'arrive' && !c.arriveById.has(rec.id)) c.arriveById.set(rec.id, { person, rec });
  }

  for (const { r: row, at } of sortedByAt(r.events ?? [])) {
    const [, person, , type, raw] = row;
    const d = parseData(raw);
    // Old `share` rows (the removed privacy toggles) and other unknown types are ignored.
    if (d && (EVENT_TYPES as readonly string[]).includes(type)) ON_EVENT[type](c, person, at, d);
  }
  // The per-workout lookups are indexes of workoutEdits (one source; round 7 L6).
  for (const e of s.workoutEdits) {
    const key = `${e.person}|${e.id}`;
    if (e.strength !== undefined) push(s.workoutStrength, key, { at: e.at, v: e.strength });
    if (e.excluded !== undefined) push(s.workoutExcluded, key, { at: e.at, v: e.excluded });
  }
  return s;
}

// ---------- events ----------

interface Ctx {
  s: State;
  /** Ingested and manual workouts by `person|id`. */
  workoutById: Map<string, WorkoutRec>;
  /** Arrive events by visit id. */
  arriveById: Map<string, { person: PersonId; rec: PresenceRec }>;
}
type Data = Record<string, unknown>;
type OnEvent = (c: Ctx, person: PersonId, at: number, d: Data) => void;

const isStrengthChoice = (v: unknown): v is boolean | null => v === null || typeof v === 'boolean';
const hasId = (v: unknown): boolean => v !== undefined && v !== null;

/**
 * One handler per event type: each accepts (indexes) the event or ignores it. The edits (history-and-editing.md §4)
 * always have the sender as subject, so the partner's data is unreachable; activity edits only count while the day's
 * week is open (§4.3).
 */
const ON_EVENT: Record<EventType, OnEvent> = {
  checkin({ s }, person, at, d) {
    const date = normDate(d.date);
    const habit = typeof d.habit === 'string' ? d.habit : null;
    if (!date || !habit || typeof d.done !== 'boolean') return;
    const today = localDateAt(at);
    if (d.edit === true) {
      // A fix from きろく: any day of an open week (history-and-editing.md §4.1).
      if (!editableAt(date, at)) return;
    } else if (date > today || date < addDays(today, -LIMITS.checkinBackDays) || isLockedAt(s, weekKeyOf(date), at)) return;
    if (!targetsFor(person, weekKeyOf(date)).habits.includes(habit)) return;
    s.checkins[person].push(d.edit === true ? { at, date, habit, done: d.done, edit: true } : { at, date, habit, done: d.done });
  },
  confirm({ s, workoutById, arriveById }, person, at, d) {
    if (typeof d.yes !== 'boolean' || typeof d.id !== 'string') return;
    if (d.kind === 'workout') {
      const w = workoutById.get(`${person}|${d.id}`);
      if (!w || w.at > at || isLockedAt(s, weekKeyOf(w.date), at)) return;
      push(s.workoutConfirms, `${person}|${d.id}`, { at, v: d.yes });
    } else if (d.kind === 'visit') {
      const p = arriveById.get(d.id);
      if (!p || p.person !== person || p.rec.at > at || isLockedAt(s, weekKeyOf(p.rec.date), at)) return;
      push(s.visitConfirms, d.id, { at, v: d.yes });
    }
  },
  spend({ s }, person, at, d) {
    const label = typeof d.label === 'string' ? d.label.trim() : '';
    const amountYen = d.amountYen;
    if (!hasId(d.spendId) || !label || label.length > LIMITS.spendLabelMaxChars) return;
    if (typeof amountYen !== 'number' || !Number.isInteger(amountYen) || amountYen <= 0 || amountYen > LIMITS.spendMaxYen) return;
    const spendId = String(d.spendId);
    if (s.spends.some((x) => x.spendId === spendId)) return;
    s.spends.push({ at, person, spendId, rawId: typeof d.spendId === 'number' ? d.spendId : spendId, label, amountYen });
  },
  approve({ s }, person, at, d) {
    if (hasId(d.spendId)) s.approves.push({ at, person, spendId: String(d.spendId) });
  },
  transfer({ s }, _person, at, d) {
    if (typeof d.month === 'string' && MONTH_RE.test(d.month) && d.month < localDateAt(at).slice(0, 7)) s.transfers.push({ at, month: d.month });
  },
  metric_set({ s }, person, at, d) {
    const date = normDate(d.date);
    const metric = d.metric;
    if (!date || !isMetricKey(metric)) return;
    if (typeof d.value !== 'number' || !Number.isInteger(d.value) || d.value < 0 || d.value > METRIC_BOUNDS[metric]) return;
    if (editableAt(date, at)) push(s.metricSets[person], `${date}|${metric}`, { at, v: d.value });
  },
  workout_edit({ s, workoutById }, person, at, d) {
    if (typeof d.id !== 'string') return;
    const w = workoutById.get(`${person}|${d.id}`);
    if (!w || w.at > at || !editableAt(w.date, at)) return;
    const strength = isStrengthChoice(d.strength) ? d.strength : undefined;
    const excluded = typeof d.excluded === 'boolean' ? d.excluded : undefined;
    if (strength === undefined && excluded === undefined) return;
    const rec: WorkoutEditRec = { at, person, id: d.id };
    if (strength !== undefined) rec.strength = strength;
    if (excluded !== undefined) rec.excluded = excluded;
    s.workoutEdits.push(rec);
  },
  workout_add({ s, workoutById }, person, at, d) {
    const date = normDate(d.date);
    const id = typeof d.id === 'string' && MANUAL_ID_RE.test(d.id) ? d.id : null;
    const dur = d.durationMin;
    if (!id || !date || typeof d.type !== 'string' || !WORKOUT_TYPES.includes(d.type)) return;
    if (typeof dur !== 'number' || !Number.isInteger(dur) || dur < MANUAL_WORKOUT_MIN.min || dur > MANUAL_WORKOUT_MIN.max) return;
    const key = `${person}|${id}`;
    if (workoutById.has(key) || !editableAt(date, at)) return;
    // No clock time is asked for: it sits at noon (Tokyo) so it never overlaps a gym visit by accident.
    const startAt = `${date}T12:00:00+09:00`;
    const endAt = new Date(Date.parse(startAt) + dur * 60_000).toISOString();
    const w: WorkoutRec = { at, id, date, type: d.type, startAt, endAt, durationMin: dur, avgHr: null, manual: true };
    workoutById.set(key, w);
    s.manualWorkouts[person].push(w);
    if (isStrengthChoice(d.strength)) s.workoutEdits.push({ at, person, id, strength: d.strength });
  },
  spend_void({ s }, person, at, d) {
    if (!hasId(d.spendId)) return;
    const spendId = String(d.spendId);
    const sp = s.spends.find((x) => x.spendId === spendId);
    // The spender only (§4.2), once, after the spend.
    if (!sp || sp.person !== person || sp.at > at || s.spendVoids.some((v) => v.spendId === spendId)) return;
    s.spendVoids.push({ at, person, spendId });
  },
  transfer_undo({ s }, person, at, d) {
    if (typeof d.month === 'string' && MONTH_RE.test(d.month)) s.transferUndos.push({ at, person, month: d.month });
  },
  harvest({ s }, person, at, d) {
    const week = normDate(d.week);
    if (week) s.harvests.push({ at, person, week });
  },
  highfive({ s }, person, at) {
    s.highfives.push({ at, person });
  },
  pref({ s }, person, _at, d) {
    const p = s.prefs[person];
    if (d.key === 'locale' && (d.value === 'ja' || d.value === 'en')) p.locale = d.value;
    else if (d.key === 'villagerName' && typeof d.value === 'string') {
      const v = d.value.trim();
      if (v.length >= 1 && v.length <= LIMITS.villagerNameMaxChars) p.villagerName = v;
    } else if (d.key === 'villager' && typeof d.value === 'string' && /^[a-z][a-z0-9_]{0,23}$/.test(d.value)) p.villager = d.value;
  }
};

/** Latest entry with `at ≤ t`, or undefined. Lists are in ascending `at`. */
export function latestTimed<T>(list: Timed<T>[] | undefined, t: number): Timed<T> | undefined {
  if (!list) return undefined;
  for (let i = list.length - 1; i >= 0; i--) if (list[i].at <= t) return list[i];
  return undefined;
}

/** The value of the latest entry with `at ≤ t`, or undefined. */
export const latestAt = <T>(list: Timed<T>[] | undefined, t: number): T | undefined => latestTimed(list, t)?.v;

/** Ingested and hand-added workouts of a person. */
export const allWorkouts = (s: State, p: PersonId): WorkoutRec[] => [...s.workouts[p], ...s.manualWorkouts[p]];
