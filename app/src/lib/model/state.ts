// Snapshot rows → validated, indexed state. This is where the old server's write-time refusals become read-time
// rules (an event the server would have refused with 4xx is ignored here), so the sheet can stay a dumb log.
import type { LocalDate, MenuItem, PersonId, PotKey, WeekKey } from '#lib/types.ts';
import { CUTOFFS, ECONOMY_START, LIMITS, MOVE_GOAL, PEOPLE } from '#lib/config/rules.ts';
import { PLACES } from '#lib/config/places.ts';
import { addDays, toLocalDate, weekKeyOf } from '#lib/scoring/index.ts';
import { localDateOfMs } from '#lib/time/dates.ts';
import { parseInstant } from '#lib/time/dates.ts';
import type { Snapshot } from './snapshot.ts';
import {
  DATE_RE, EVENT_TYPES, isActivityMetric, isWeightKg, MANUAL_ID_RE, MANUAL_WORKOUT_MIN, roundKg, validMetricValue, WEIGHT_KG,
  type EventType, type SnapshotRows
} from '#lib/contract/api.ts';
import { WORKOUT_TYPES } from '#lib/contract/labels.ts';

export const PEOPLE_IDS: PersonId[] = ['A', 'B'];
export const partnerOf = (p: PersonId): PersonId => (p === 'A' ? 'B' : 'A');

// ---------- time ----------

/** Epoch ms of a JST wall-clock time (Tokyo has no DST). */
export function jstMs(date: LocalDate, hour: number, minute: number): number {
  return Date.parse(`${date}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00+09:00`);
}
const cutoffMemo = (fn: (wk: WeekKey) => number) => {
  const memo = new Map<WeekKey, number>();
  return (wk: WeekKey): number => {
    let t = memo.get(wk);
    if (t === undefined) memo.set(wk, (t = fn(wk)));
    return t;
  };
};
/** Sunday 19:30 JST of the week: the harvest opens and the weekly bonus lands. */
export const provisionalMs = cutoffMemo((wk) => jstMs(addDays(wk, 6), CUTOFFS.provisional.hour, CUTOFFS.provisional.minute));
/** Wednesday 04:00 JST after the week: late data and edits still count up to here, then the week locks. */
export const finalMs = cutoffMemo((wk) => jstMs(addDays(wk, 9), CUTOFFS.final.hour, CUTOFFS.final.minute));

/**
 * The demo (`?demo`, lib/store/demo/rows.ts) shows weeks before the economy starts, so it moves the calendar: its own
 * first earning week. It travels with the state (`reduce(rows, calendar)`), never as a module global
 * (round 7 L2); live state always has `calendar: null`.
 */
export interface DemoCalendar { firstWeek: WeekKey }
type Cal = Pick<State, 'calendar'>;

/** First week of the economy (ADR 0019 §7: Mon 2026-10-26), or the demo's own one. */
export const firstWeek = (s: Cal): WeekKey => s.calendar?.firstWeek ?? ECONOMY_START;

/** A week locks (no more check-ins/answers for it) at its Wednesday 04:00; weeks before the first week never lock. */
export const isLockedAt = (s: Cal, wk: WeekKey, t: number): boolean => wk >= firstWeek(s) && t >= finalMs(wk);

export const localDateAt = localDateOfMs;

/**
 * Open for edits at t (history-and-editing.md §4.3): the day has happened, and its week has not reached its
 * Wednesday 04:00 lock. Unlike `isLockedAt` this also closes weeks before the first earning week, so edits never reach
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

/** A gym arrival: a strength day on its Tokyo date. */
interface PresenceRec {
  /** Stable visit id: `<place>@<event_at ISO>`. */
  id: string;
  at: number;
  placeKey: string;
  eventAt: string;
  eventMs: number;
  /** Tokyo date of `eventAt`. */
  date: LocalDate;
}

/** A `workout_edit` field change: `strength` (null = automatic) or `excluded`. */
interface WorkoutEditRec { at: number; person: PersonId; id: string; strength?: boolean | null; excluded?: boolean }
/** A ベル spend (ADR 0019 §9): `{spendId, pot, item, label, bells}`. */
interface BellSpendRec { at: number; person: PersonId; spendId: string; pot: PotKey; item: string; label: string; bells: number }

/** `goalWeight`: the person's optional goal in kg (ADR 0020), shown on the weight chart; never earns. */
interface Prefs { locale?: 'ja' | 'en'; villagerName?: string; villager?: string; goalWeight?: number }

export interface State {
  metrics: Record<PersonId, Map<string, Timed<number>[]>>;
  workouts: Record<PersonId, WorkoutRec[]>;
  presence: Record<PersonId, PresenceRec[]>;
  /** ベル spends (`pot` + `bells`), in server order. */
  bellSpends: BellSpendRec[];
  /** The shared menus (`pref` treatMenu / tripMenu by either person), ascending `at`: the latest wins. */
  menus: Record<PotKey, Timed<MenuItem[]>[]>;
  /** Accepted activity `metric_set` (steps, minutes) per person, keyed `date|metric`, ascending `at`. */
  metricSets: Record<PersonId, Map<string, Timed<number>[]>>;
  /**
   * Body weight (ADR 0020), kept apart from the activity metrics so the economy can't read it: ingested `weight` rows
   * and accepted `metric_set {metric:'weight'}` per person, keyed by date, ascending `at`. A day's weight is the latest
   * of the two (`model/weight.ts`).
   */
  weights: Record<PersonId, Map<LocalDate, Timed<number>[]>>;
  weightSets: Record<PersonId, Map<LocalDate, Timed<number>[]>>;
  /** Accepted `workout_edit`s (and a `workout_add`'s strength choice), ascending `at`. */
  workoutEdits: WorkoutEditRec[];
  /** Indexes of `workoutEdits` per workout key `person|id`. */
  workoutStrength: Map<string, Timed<boolean | null>[]>;
  workoutExcluded: Map<string, Timed<boolean>[]>;
  /** Accepted `workout_add`s, in `workouts`' shape (`manual: true`). */
  manualWorkouts: Record<PersonId, WorkoutRec[]>;
  /** Accepted `spend_void`s (by the spender, after the spend). */
  spendVoids: { at: number; person: PersonId; spendId: string }[];
  harvests: { at: number; person: PersonId; week: WeekKey }[];
  highfives: { at: number; person: PersonId }[];
  prefs: Record<PersonId, Prefs>;
  /** Accepted `pref` moveGoal (kcal) per person, ascending `at` (ADR 0021 §5; `moveGoalOn` picks the one in force). */
  moveGoals: Record<PersonId, Timed<number>[]>;
  /** Newest metrics/workouts row per person (the sheet keeps no per-upload row in the snapshot). */
  lastSync: Record<PersonId, string | null>;
  /** The demo's calendar; null for real data. */
  calendar: DemoCalendar | null;
  /**
   * The sheet's data revision (`snapshot.rev`, sheets-architecture.md §2.1) the rows were cached under, or null. With
   * it, locked weeks' earnings are reused across States (`weekBells`), since rows stamped before a past time never
   * change while `rev` stays the same.
   */
  rev: string | null;
  /** Server `at`s of the accepted-for-indexing rows, ascending, per tab (`rowsUpTo`). */
  ats: number[][];
}

/** How many rows are stamped at or before t: with `rev`, identifies the rows a locked week's earnings depend on. */
export function rowsUpTo(s: Pick<State, 'ats'>, t: number): number {
  let n = 0;
  for (const list of s.ats) {
    let lo = 0;
    let hi = list.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (list[mid] <= t) lo = mid + 1;
      else hi = mid;
    }
    n += lo;
  }
  return n;
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
export function reduce(rows: SnapshotRows | Snapshot, calendar: DemoCalendar | null = null, rev: string | null = null): State {
  const r = 'rows' in rows ? rows.rows : rows;
  const s: State = {
    metrics: { A: new Map(), B: new Map() },
    workouts: { A: [], B: [] },
    presence: { A: [], B: [] },
    bellSpends: [],
    menus: { treat: [], trip: [] },
    metricSets: { A: new Map(), B: new Map() },
    weights: { A: new Map(), B: new Map() },
    weightSets: { A: new Map(), B: new Map() },
    workoutEdits: [],
    workoutStrength: new Map(),
    workoutExcluded: new Map(),
    manualWorkouts: { A: [], B: [] },
    spendVoids: [],
    harvests: [],
    highfives: [],
    prefs: { A: {}, B: {} },
    moveGoals: { A: [], B: [] },
    lastSync: { A: null, B: null },
    calendar,
    rev: calendar ? null : rev,
    ats: []
  };
  const byAt = <T extends readonly unknown[]>(rows: T[]) => {
    const out = sortedByAt(rows);
    s.ats.push(out.map((x) => x.at));
    return out;
  };
  const c: Ctx = { s, workoutById: new Map() };
  const lastSyncMs: Record<PersonId, number> = { A: -Infinity, B: -Infinity };
  const synced = (p: PersonId, at: number, iso: string) => {
    if (at > lastSyncMs[p]) {
      lastSyncMs[p] = at;
      s.lastSync[p] = iso;
    }
  };

  for (const { r: row, at } of byAt(r.metrics ?? [])) {
    const [iso, person, d, metric, v] = row;
    const date = normDate(d);
    const value = num(v);
    if (!date || value === null) continue;
    if (metric === 'weight') {
      if (value < WEIGHT_KG.min || value > WEIGHT_KG.max) continue;
      push(s.weights[person], date, { at, v: roundKg(value) });
    } else if (isActivityMetric(metric)) push(s.metrics[person], `${date}|${metric}`, { at, v: value });
    else continue;
    synced(person, at, String(iso));
  }

  for (const { r: row, at } of byAt(r.workouts ?? [])) {
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

  for (const { r: row, at } of byAt(r.presence ?? [])) {
    const [, person, placeKey, event, eventAtRaw] = row;
    const place = PLACES.find((p) => p.key === placeKey);
    if (!place || place.person !== person || event !== 'arrive') continue;
    const eventMs = ms(eventAtRaw) ?? at;
    if (Math.abs(eventMs - at) > LIMITS.presenceSkewMs) continue;
    const list = s.presence[person];
    if (list.some((e) => e.placeKey === placeKey && Math.abs(e.eventMs - eventMs) <= LIMITS.presenceDuplicateMs)) continue;
    const eventAt = new Date(eventMs).toISOString();
    list.push({ id: `${placeKey}@${eventAt}`, at, placeKey, eventAt, eventMs, date: toLocalDate(eventAt) });
  }

  for (const { r: row, at } of byAt(r.events ?? [])) {
    const [, person, , type, raw] = row;
    const d = parseData(raw);
    // A type the server wouldn't accept (a hand edit of the sheet) is ignored.
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
}
type Data = Record<string, unknown>;
type OnEvent = (c: Ctx, person: PersonId, at: number, d: Data) => void;

const isBells = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v) && v > 0 && v <= LIMITS.bellsMax;
const MENU_ID_RE = /^[\w-]+$/;

/**
 * A menu pref's value: a JSON array (or the array itself) of `{id, label, bells}` with unique ids, at most
 * LIMITS.menuMaxItems. Anything invalid ignores the whole pref (the previous menu stays).
 */
export function parseMenu(v: unknown): MenuItem[] | null {
  let list = v;
  if (typeof v === 'string') {
    try {
      list = JSON.parse(v);
    } catch {
      return null;
    }
  }
  if (!Array.isArray(list) || list.length > LIMITS.menuMaxItems) return null;
  const out: MenuItem[] = [];
  const ids = new Set<string>();
  for (const x of list) {
    if (!x || typeof x !== 'object') return null;
    const { id, label, bells } = x as Record<string, unknown>;
    const l = typeof label === 'string' ? label.trim() : '';
    if (typeof id !== 'string' || id.length > LIMITS.menuIdMaxChars || !MENU_ID_RE.test(id) || ids.has(id)) return null;
    if (!l || l.length > LIMITS.spendLabelMaxChars || !isBells(bells)) return null;
    ids.add(id);
    out.push({ id, label: l, bells });
  }
  return out;
}

const isStrengthChoice = (v: unknown): v is boolean | null => v === null || typeof v === 'boolean';
const hasId = (v: unknown): boolean => v !== undefined && v !== null;

/**
 * One handler per event type: each accepts (indexes) the event or ignores it. The edits (history-and-editing.md §4)
 * always have the sender as subject, so the partner's data is unreachable; activity edits only count while the day's
 * week is open (§4.3).
 */
const ON_EVENT: Record<EventType, OnEvent> = {
  spend({ s }, person, at, d) {
    const label = typeof d.label === 'string' ? d.label.trim() : '';
    if (!hasId(d.spendId) || !label || label.length > LIMITS.spendLabelMaxChars) return;
    // A ベル spend (ADR 0019 §9). Validity only: whether the pot could afford it is decided on read (bells.ts).
    const bells = d.bells;
    if ((d.pot !== 'treat' && d.pot !== 'trip') || !isBells(bells)) return;
    if (typeof d.item !== 'string' || d.item.length > LIMITS.menuIdMaxChars) return;
    const spendId = String(d.spendId);
    if (s.bellSpends.some((x) => x.spendId === spendId)) return;
    s.bellSpends.push({ at, person, spendId, pot: d.pot, item: d.item, label, bells });
  },
  metric_set({ s }, person, at, d) {
    const date = normDate(d.date);
    const metric = d.metric;
    if (!date) return;
    if (metric === 'weight') {
      // A weight (ADR 0020) earns nothing, so no week lock: any day up to today, one decimal, 20–300 kg.
      if (validMetricValue('weight', d.value) && date <= localDateAt(at)) push(s.weightSets[person], date, { at, v: d.value });
      return;
    }
    if (!isActivityMetric(metric) || !validMetricValue(metric, d.value)) return;
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
    const sp = s.bellSpends.find((x) => x.spendId === spendId);
    // The spender only (§4.2), once, after the spend.
    if (!sp || sp.person !== person || sp.at > at || s.spendVoids.some((v) => v.spendId === spendId)) return;
    s.spendVoids.push({ at, person, spendId });
  },
  harvest({ s }, person, at, d) {
    const week = normDate(d.week);
    if (week) s.harvests.push({ at, person, week });
  },
  highfive({ s }, person, at) {
    s.highfives.push({ at, person });
  },
  pref({ s }, person, at, d) {
    if (d.key === 'treatMenu' || d.key === 'tripMenu') {
      const items = parseMenu(d.value);
      if (items) s.menus[d.key === 'treatMenu' ? 'treat' : 'trip'].push({ at, v: items });
      return;
    }
    if (d.key === 'moveGoal') {
      // An integer kcal in MOVE_GOAL; anything else is ignored (the previous goal stays).
      const v = d.value;
      if (typeof v === 'number' && Number.isInteger(v) && v >= MOVE_GOAL.min && v <= MOVE_GOAL.max) s.moveGoals[person].push({ at, v });
      return;
    }
    const p = s.prefs[person];
    if (d.key === 'locale' && (d.value === 'ja' || d.value === 'en')) p.locale = d.value;
    else if (d.key === 'villagerName' && typeof d.value === 'string') {
      const v = d.value.trim();
      if (v.length >= 1 && v.length <= LIMITS.villagerNameMaxChars) p.villagerName = v;
    } else if (d.key === 'villager' && typeof d.value === 'string' && /^[a-z][a-z0-9_]{0,23}$/.test(d.value)) p.villager = d.value;
    else if (d.key === 'goalWeight') {
      // A goal in kg, or null / '' to clear it; anything else is ignored (the previous goal stays).
      if (d.value === null || d.value === '') delete p.goalWeight;
      else if (isWeightKg(d.value)) p.goalWeight = d.value;
    }
  }
};

/**
 * A person's Move goal on `date` (ADR 0021 §5): the latest `pref` moveGoal made on or before that Tokyo date (and
 * stamped by t), else PEOPLE[p].moveGoal. A change applies from the day it's made, never to earlier days.
 */
export function moveGoalOn(s: Pick<State, 'moveGoals'>, person: PersonId, date: LocalDate, t = Infinity): number {
  const list = s.moveGoals[person];
  for (let i = list.length - 1; i >= 0; i--) if (list[i].at <= t && localDateAt(list[i].at) <= date) return list[i].v;
  return PEOPLE[person].moveGoal;
}

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
