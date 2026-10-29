// Snapshot rows → validated, indexed state. This is where the old server's write-time refusals become read-time
// rules (an event the server would have refused with 4xx is ignored here), so the sheet can stay a dumb log.
import type { FruitKey, LocalDate, PersonId, WeekKey } from '#lib/types.ts';
import { FRUITS, JOBS, SEASONS } from '#lib/config/rules.ts';
import { PLACES } from '#lib/config/places.ts';
import { addDays, targetsFor, toLocalDate, weekKeyOf } from '#lib/scoring/index.ts';
import { parseInstant } from '#lib/scoring/dates.ts';
import type { Snapshot, SnapshotRows } from './snapshot.ts';

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

/** First paid week: the first full Mon–Sun week of season 1. */
export function firstWeek(): WeekKey {
  const from = [...SEASONS].sort((a, b) => a.from.localeCompare(b.from))[0].from;
  const wk = weekKeyOf(from);
  return wk < from ? addDays(wk, 7) : wk;
}

/** A week locks (no more check-ins/answers for it) at its Wednesday 04:00; weeks before the first paid week never lock. */
export const isLockedAt = (wk: WeekKey, t: number): boolean => wk >= firstWeek() && t >= finalMs(wk);

const localDateAt = (ms: number): LocalDate => toLocalDate(new Date(ms).toISOString());

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

export interface CheckinRec { at: number; date: LocalDate; habit: string; done: boolean }
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
  harvests: { at: number; person: PersonId; week: WeekKey }[];
  highfives: { at: number; person: PersonId }[];
  prefs: Record<PersonId, Prefs>;
  shares: Record<PersonId, Map<FruitKey, boolean>>;
  /** Newest metrics/workouts row per person (the sheet keeps no per-upload row in the snapshot). */
  lastSync: Record<PersonId, string | null>;
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
export function reduce(rows: SnapshotRows | Snapshot): State {
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
    harvests: [],
    highfives: [],
    prefs: { A: {}, B: {} },
    shares: { A: new Map(), B: new Map() },
    lastSync: { A: null, B: null }
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
        if (date > today || date < addDays(today, -2)) break; // 48 h fill-in window
        if (isLockedAt(weekKeyOf(date), at)) break;
        if (!targetsFor(person, weekKeyOf(date)).habits.includes(habit)) break;
        s.checkins[person].push({ at, date, habit, done: d.done });
        break;
      }
      case 'confirm': {
        if (typeof d.yes !== 'boolean' || typeof d.id !== 'string') break;
        if (d.kind === 'workout') {
          const w = workoutById.get(`${person}|${d.id}`);
          if (!w || w.at > at || isLockedAt(weekKeyOf(w.date), at)) break;
          push(s.workoutConfirms, `${person}|${d.id}`, { at, v: d.yes });
        } else if (d.kind === 'visit') {
          const p = presenceById.get(d.id);
          if (!p || p.person !== person || p.rec.at > at || isLockedAt(weekKeyOf(toLocalDate(p.rec.eventAt)), at)) break;
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
      case 'share':
        if ((FRUITS as readonly string[]).includes(String(d.metric)) && typeof d.on === 'boolean') s.shares[person].set(d.metric as FruitKey, d.on);
        break;
    }
  }
  return s;
}

/** Latest entry with `at ≤ t`, or undefined. Lists are in ascending `at`. */
export function latestAt<T>(list: Timed<T>[] | undefined, t: number): T | undefined {
  if (!list) return undefined;
  for (let i = list.length - 1; i >= 0; i--) if (list[i].at <= t) return list[i].v;
  return undefined;
}
