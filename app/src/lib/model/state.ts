// Snapshot rows → validated, indexed state. This is where the old server's write-time refusals become read-time
// rules (an event the server would have refused with 4xx is ignored here), so the sheet can stay a dumb log.
import type { FruitKey, LocalDate, PersonId, WeekKey } from '#lib/types.ts';
import { CALIBRATION_WEEKS, FRUITS, JOBS, SEASONS } from '#lib/config/rules.ts';
import { PLACES } from '#lib/config/places.ts';
import { addDays, targetsFor, toLocalDate, weekKeyOf } from '#lib/scoring/index.ts';
import { parseInstant } from '#lib/scoring/dates.ts';
import type { Snapshot, SnapshotRows } from './snapshot.ts';
import { MANUAL_WORKOUT_MIN, METRIC_BOUNDS } from '#lib/ingest/sheet-api.ts';
import { WORKOUT_TYPES } from './labels.ts';

export const PEOPLE_IDS: PersonId[] = ['A', 'B'];
export const partnerOf = (p: PersonId): PersonId => (p === 'A' ? 'B' : 'A');

// ---------- time ----------

/** Epoch ms of a JST wall-clock time (Tokyo has no DST). */
export function jstMs(date: LocalDate, hour: number, minute: number): number {
  return Date.parse(`${date}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00+09:00`);
}
/** Sunday 19:30 JST of the week: the harvest opens and the first payout is taken. */
export const provisionalMs = (wk: WeekKey): number => jstMs(addDays(wk, 6), JOBS.provisional.hour, JOBS.provisional.minute);
/** Wednesday 04:00 JST after the week: late data can still raise the payout up to here, then the week locks. */
export const finalMs = (wk: WeekKey): number => jstMs(addDays(wk, 9), JOBS.final.hour, JOBS.final.minute);

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
export function seasonFirstWeek(): WeekKey {
  const from = [...SEASONS].sort((a, b) => a.from.localeCompare(b.from))[0].from;
  const wk = weekKeyOf(from);
  return wk < from ? addDays(wk, 7) : wk;
}

/** First paid week (the demo's own one in the demo). */
export const firstWeek = (s: Cal): WeekKey => s.calendar?.firstWeek ?? seasonFirstWeek();

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
  extId: string;
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
}

/** `edit`: a fix from きろく (`edit:true`), allowed for any open day; it shows in the change log. */
export interface CheckinRec { at: number; date: LocalDate; habit: string; done: boolean; edit?: true }
export type MetricKey = 'steps' | 'exercise_min';
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

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const PRESENCE_DUP_MS = 120_000;
const PRESENCE_WINDOW_MS = 48 * 3600_000;

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
    if (!date || (metric !== 'steps' && metric !== 'exercise_min') || value === null) continue;
    push(s.metrics[person], `${date}|${metric}`, { at, v: value });
    synced(person, at, String(iso));
  }

  const workoutById = new Map<string, WorkoutRec>();
  for (const { r: row, at } of sortedByAt(r.workouts ?? [])) {
    const [iso, person, id, d, type, start, end, dur, hr] = row;
    const date = normDate(d);
    const durationMin = num(dur);
    const key = `${person}|${id}`;
    if (!id || !date || durationMin === null || workoutById.has(key)) continue;
    const w: WorkoutRec = { at, extId: String(id), date, type: String(type), startAt: String(start), endAt: String(end), durationMin, avgHr: num(hr) };
    workoutById.set(key, w);
    s.workouts[person].push(w);
    synced(person, at, String(iso));
  }

  const presenceById = new Map<string, { person: PersonId; rec: PresenceRec }>();
  let n = 0;
  for (const { r: row, at } of sortedByAt(r.presence ?? [])) {
    const [, person, placeKey, event, eventAtRaw] = row;
    const place = PLACES.find((p) => p.key === placeKey);
    if (!place || place.person !== person || (event !== 'arrive' && event !== 'leave')) continue;
    const eventMs = ms(eventAtRaw) ?? at;
    if (Math.abs(eventMs - at) > PRESENCE_WINDOW_MS) continue;
    // Shortcuts sometimes fire twice: a repeat of the same event within 2 minutes is dropped.
    const list = s.presence[person];
    if (list.some((e) => e.placeKey === placeKey && e.event === event && Math.abs(Date.parse(e.eventAt) - eventMs) <= PRESENCE_DUP_MS)) continue;
    const eventAt = new Date(eventMs).toISOString();
    const rec: PresenceRec = { n: ++n, id: `${placeKey}@${eventAt}`, at, placeKey, event, eventAt };
    list.push(rec);
    if (event === 'arrive' && !presenceById.has(rec.id)) presenceById.set(rec.id, { person, rec });
  }

  for (const { r: row, at } of sortedByAt(r.events ?? [])) {
    const [, person, , type, raw] = row;
    const d = parseData(raw);
    if (!d) continue;
    switch (type) {
      case 'checkin': {
        const date = normDate(d.date);
        const habit = typeof d.habit === 'string' ? d.habit : typeof d.habitKey === 'string' ? d.habitKey : null;
        if (!date || !habit || typeof d.done !== 'boolean') break;
        const today = localDateAt(at);
        if (d.edit === true) {
          // A fix from きろく: any day of an open week (history-and-editing.md §4.1).
          if (!editableAt(date, at)) break;
        } else {
          if (date > today || date < addDays(today, -2)) break; // 48 h fill-in window
          if (isLockedAt(s, weekKeyOf(date), at)) break;
        }
        if (!targetsFor(person, weekKeyOf(date)).habits.includes(habit)) break;
        s.checkins[person].push(d.edit === true ? { at, date, habit, done: d.done, edit: true } : { at, date, habit, done: d.done });
        break;
      }
      case 'confirm': {
        if (typeof d.yes !== 'boolean' || typeof d.id !== 'string') break;
        if (d.kind === 'workout') {
          const w = workoutById.get(`${person}|${d.id}`);
          if (!w || w.at > at || isLockedAt(s, weekKeyOf(w.date), at)) break;
          push(s.workoutConfirms, `${person}|${d.id}`, { at, v: d.yes });
        } else if (d.kind === 'visit') {
          const p = presenceById.get(d.id);
          if (!p || p.person !== person || p.rec.at > at || isLockedAt(s, weekKeyOf(toLocalDate(p.rec.eventAt)), at)) break;
          push(s.visitConfirms, d.id, { at, v: d.yes });
        }
        break;
      }
      case 'spend': {
        const label = typeof d.label === 'string' ? d.label.trim() : '';
        const amountYen = d.amountYen;
        if (d.spendId === undefined || d.spendId === null || !label || label.length > 60) break;
        if (typeof amountYen !== 'number' || !Number.isInteger(amountYen) || amountYen <= 0 || amountYen > 1_000_000) break;
        const spendId = String(d.spendId);
        if (s.spends.some((x) => x.spendId === spendId)) break;
        s.spends.push({ at, person, spendId, rawId: typeof d.spendId === 'number' ? d.spendId : spendId, label, amountYen });
        break;
      }
      case 'approve':
        if (d.spendId !== undefined && d.spendId !== null) s.approves.push({ at, person, spendId: String(d.spendId) });
        break;
      case 'transfer':
        if (typeof d.month === 'string' && /^\d{4}-(0[1-9]|1[0-2])$/.test(d.month) && d.month < localDateAt(at).slice(0, 7)) {
          s.transfers.push({ at, month: d.month });
        }
        break;
      // ---- edits (history-and-editing.md §4): the subject is always the sender, so the partner's data is
      // unreachable; activity edits only count while the day's week is open (§4.3).
      case 'metric_set': {
        const date = normDate(d.date);
        const metric = d.metric;
        if (!date || (metric !== 'steps' && metric !== 'exercise_min')) break;
        if (typeof d.value !== 'number' || !Number.isInteger(d.value) || d.value < 0 || d.value > METRIC_BOUNDS[metric]) break;
        if (!editableAt(date, at)) break;
        push(s.metricSets[person], `${date}|${metric}`, { at, v: d.value });
        break;
      }
      case 'workout_edit': {
        if (typeof d.id !== 'string') break;
        const key = `${person}|${d.id}`;
        const w = workoutById.get(key);
        if (!w || w.at > at || !editableAt(w.date, at)) break;
        const strength = d.strength === null || typeof d.strength === 'boolean' ? d.strength : undefined;
        const excluded = typeof d.excluded === 'boolean' ? d.excluded : undefined;
        if (strength === undefined && excluded === undefined) break;
        const rec: WorkoutEditRec = { at, person, id: d.id };
        if (strength !== undefined) rec.strength = strength;
        if (excluded !== undefined) rec.excluded = excluded;
        s.workoutEdits.push(rec);
        break;
      }
      case 'workout_add': {
        const date = normDate(d.date);
        const id = typeof d.id === 'string' && /^m:[\w-]{1,100}$/.test(d.id) ? d.id : null;
        const dur = d.durationMin;
        if (!id || !date || typeof d.type !== 'string' || !WORKOUT_TYPES.includes(d.type)) break;
        if (typeof dur !== 'number' || !Number.isInteger(dur) || dur < MANUAL_WORKOUT_MIN.min || dur > MANUAL_WORKOUT_MIN.max) break;
        const key = `${person}|${id}`;
        if (workoutById.has(key) || !editableAt(date, at)) break;
        // No clock time is asked for: it sits at noon (Tokyo) so it never overlaps a gym visit by accident.
        const startAt = `${date}T12:00:00+09:00`;
        const endAt = new Date(Date.parse(startAt) + dur * 60_000).toISOString();
        const w: WorkoutRec = { at, extId: id, date, type: d.type, startAt, endAt, durationMin: dur, avgHr: null, manual: true };
        workoutById.set(key, w);
        s.manualWorkouts[person].push(w);
        if (d.strength === null || typeof d.strength === 'boolean') s.workoutEdits.push({ at, person, id, strength: d.strength });
        break;
      }
      case 'spend_void': {
        if (d.spendId === undefined || d.spendId === null) break;
        const spendId = String(d.spendId);
        const sp = s.spends.find((x) => x.spendId === spendId);
        // The spender only (§4.2), once, after the spend.
        if (!sp || sp.person !== person || sp.at > at || s.spendVoids.some((v) => v.spendId === spendId)) break;
        s.spendVoids.push({ at, person, spendId });
        break;
      }
      case 'transfer_undo':
        if (typeof d.month === 'string' && /^\d{4}-(0[1-9]|1[0-2])$/.test(d.month)) s.transferUndos.push({ at, person, month: d.month });
        break;
      case 'harvest': {
        const week = normDate(d.week);
        if (week) s.harvests.push({ at, person, week });
        break;
      }
      case 'highfive':
        s.highfives.push({ at, person });
        break;
      case 'pref': {
        const p = s.prefs[person];
        if (d.key === 'locale' && (d.value === 'ja' || d.value === 'en')) p.locale = d.value;
        else if (d.key === 'villagerName' && typeof d.value === 'string') {
          const v = d.value.trim();
          if (v.length >= 1 && v.length <= 20) p.villagerName = v;
        } else if (d.key === 'villager' && typeof d.value === 'string' && /^[a-z][a-z0-9_]{0,23}$/.test(d.value)) p.villager = d.value;
        break;
      }
      // Old `share` rows (the removed privacy toggles) are ignored: both players see all data.
    }
  }
  // The per-workout lookups are indexes of workoutEdits (one source; round 7 L6).
  for (const e of s.workoutEdits) {
    const key = `${e.person}|${e.id}`;
    if (e.strength !== undefined) push(s.workoutStrength, key, { at: e.at, v: e.strength });
    if (e.excluded !== undefined) push(s.workoutExcluded, key, { at: e.at, v: e.excluded });
  }
  return s;
}

/** Latest entry with `at ≤ t`, or undefined. Lists are in ascending `at`. */
export function latestAt<T>(list: Timed<T>[] | undefined, t: number): T | undefined {
  if (!list) return undefined;
  for (let i = list.length - 1; i >= 0; i--) if (list[i].at <= t) return list[i].v;
  return undefined;
}
