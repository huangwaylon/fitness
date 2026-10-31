// Snapshot rows → validated, indexed state. Whose goal a `pref` sets (`data.person`) and which buys are valid are
// read-time rules here (an invalid or unknown event is ignored, not refused), so the sheet stays a dumb append-only log.
// Health data comes only from the Shortcut's `metrics` rows: Apple Health is the source of truth.
import type { LocalDate, PersonId, ShopItemId, WeekKey } from '#lib/types.ts';
import { CUTOFFS, LIMITS, MOVE_GOAL, PEOPLE, shopPrice } from '#lib/config/rules.ts';
import { addDays, jstMs, localDateAt, toLocalDate, weekKeyOf } from '#lib/time/dates.ts';
import { rowAt } from './snapshot.ts';
import {
  DATE_RE, eventSubject, EVENT_TYPES, isFind, isId, isPersonId, isActivityMetric, isWeightKg, roundKg, WEIGHT_KG,
  type ActivityMetric, type EventType, type FindKind, type SnapshotRows
} from '#lib/contract/api.ts';

export const partnerOf = (p: PersonId): PersonId => (p === 'A' ? 'B' : 'A');

// ---------- time ----------

const cutoffMemo = (fn: (wk: WeekKey) => number) => {
  const memo = new Map<WeekKey, number>();
  return (wk: WeekKey): number => {
    let t = memo.get(wk);
    if (t === undefined) memo.set(wk, (t = fn(wk)));
    return t;
  };
};
/** Sunday 19:30 JST of the week: the harvest recap opens. */
export const provisionalMs = cutoffMemo((wk) => jstMs(addDays(wk, 6), CUTOFFS.provisional.hour, CUTOFFS.provisional.minute));
/** Wednesday 04:00 JST after the week: late Health data still counts up to here, then the week locks (its earnings are final). */
export const finalMs = cutoffMemo((wk) => jstMs(addDays(wk, 9), CUTOFFS.final.hour, CUTOFFS.final.minute));

/**
 * The economy's first week: the first week with an activity row stamped by its lock (a week whose rows all came after
 * its lock, like a baseline of old days, could never earn). Compaction always keeps such a row. Null before any data.
 */
export const firstWeek = (s: Pick<State, 'start'>): WeekKey | null => s.start;

/** The latest week lock (a Wednesday 04:00) at or before `t`: what `rev` reuses earnings up to, and compaction compacts through. */
export function lastLockAt(t: number): number {
  const prev = addDays(weekKeyOf(localDateAt(t)), -7);
  const lock = finalMs(prev);
  return lock <= t ? lock : finalMs(addDays(prev, -7));
}

// ---------- records ----------

interface Timed<T> { at: number; v: T }
/** A buy from the wallet: `{spendId, item, bells}`, a SHOP item at its price. */
interface BellSpendRec { at: number; person: PersonId; spendId: string; item: ShopItemId; bells: number }

/** `goalWeight`: the person's optional goal in kg, shown on the weight chart; never earns. */
interface Prefs { locale?: 'ja' | 'en'; villagerName?: string; villager?: string; goalWeight?: number }

export interface State {
  /** Ingested activity rows per person: date → metric → rows, ascending `at` (no key string built per row). */
  metrics: Record<PersonId, Map<LocalDate, Partial<Record<ActivityMetric, Timed<number>[]>>>>;
  /** Buys from the wallet, in server order. */
  bellSpends: BellSpendRec[];
  /**
   * Body weight, kept apart from the activity metrics so the economy can't read it: ingested `weight` rows per
   * person, keyed by date, ascending `at`. A day's weight is its latest row (`model/weight.ts`).
   */
  weights: Record<PersonId, Map<LocalDate, Timed<number>[]>>;
  /** Accepted `spend_void`s (by the spender, after the spend). */
  spendVoids: { at: number; person: PersonId; spendId: string }[];
  harvests: { at: number; person: PersonId; week: WeekKey }[];
  highfives: { at: number; person: PersonId }[];
  /** The island's finds (`find`: catches and pick-ups for the ずかん), in server order. Never read by the economy. */
  finds: { at: number; person: PersonId; kind: FindKind; id: string }[];
  prefs: Record<PersonId, Prefs>;
  /** Accepted `pref` moveGoal (kcal) per person, ascending `at` (`moveGoalOn` picks the one in force). */
  moveGoals: Record<PersonId, Timed<number>[]>;
  /** Newest metrics row per person (the sheet keeps no per-upload row in the snapshot). */
  lastSync: Record<PersonId, string | null>;
  /** The economy's first week (`firstWeek`). */
  start: WeekKey | null;
  /**
   * The sheet's data revision (`snapshot.rev`, docs/backend.md#revision) the rows were cached under, or null. With
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

/** The rows with a readable `at` and person, in server order (as the sheet returns them, so the sort is rarely needed). */
function sortedByAt<T extends readonly unknown[]>(rows: T[]): { r: T; at: number }[] {
  const out: { r: T; at: number; i: number }[] = [];
  let ordered = true;
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const at = rowAt(r, false);
    if (at === null || !isPersonId(r[1])) continue;
    if (ordered && out.length && at < out[out.length - 1].at) ordered = false;
    out.push({ r, at, i });
  }
  return ordered ? out : out.sort((x, y) => x.at - y.at || x.i - y.i);
}

const push = <K, V>(m: Map<K, V[]>, k: K, v: V) => {
  const l = m.get(k);
  if (l) l.push(v);
  else m.set(k, [v]);
};

const weeks = new Map<LocalDate, WeekKey>();
/** A date's week, memoised (reduce asks for every activity row). */
const weekOf = (d: LocalDate): WeekKey => {
  let wk = weeks.get(d);
  if (wk === undefined) weeks.set(d, (wk = weekKeyOf(d)));
  return wk;
};

/** Index and validate all rows. Rows are only ever appended, so nothing here depends on "now". */
export function reduce(r: SnapshotRows, rev: string | null = null): State {
  const s: State = {
    metrics: { A: new Map(), B: new Map() },
    bellSpends: [],
    weights: { A: new Map(), B: new Map() },
    spendVoids: [],
    harvests: [],
    highfives: [],
    finds: [],
    prefs: { A: {}, B: {} },
    moveGoals: { A: [], B: [] },
    lastSync: { A: null, B: null },
    start: null,
    rev,
    ats: []
  };
  const byAt = <T extends readonly unknown[]>(rows: T[]) => {
    const out = sortedByAt(rows);
    s.ats.push(out.map((x) => x.at));
    return out;
  };
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
    } else if (isActivityMetric(metric)) {
      let day = s.metrics[person].get(date);
      if (!day) s.metrics[person].set(date, (day = {}));
      (day[metric] ??= []).push({ at, v: value });
      const wk = weekOf(date);
      if ((s.start === null || wk < s.start) && at <= finalMs(wk)) s.start = wk;
    }
    else continue;
    synced(person, at, String(iso));
  }

  for (const { r: row, at } of byAt(r.events ?? [])) {
    const [, person, , type, raw] = row;
    const d = parseData(raw);
    // A type the server doesn't accept (a hand edit of the sheet, or a row of a type since removed) is ignored, and
    // so is a bad `person`.
    if (!d || !(EVENT_TYPES as readonly string[]).includes(type)) continue;
    const subject = eventSubject(type, d, person);
    if (subject) ON_EVENT[type](s, subject, at, d);
  }
  return s;
}

// ---------- events ----------

type Data = Record<string, unknown>;
/** `person`: whose data the event changes (a goal's `data.person`, else the sender). */
type OnEvent = (s: State, person: PersonId, at: number, d: Data) => void;

/** One handler per event type: each accepts (indexes) the event or ignores it. */
const ON_EVENT: Record<EventType, OnEvent> = {
  spend(s, person, at, d) {
    // A buy from the wallet: a SHOP item at exactly its price. Whether the wallet covered it is decided on read (bells.ts).
    const { spendId, item } = d;
    const bells = shopPrice(item);
    if (!isId(spendId) || bells === undefined || d.bells !== bells) return;
    if (s.bellSpends.some((x) => x.spendId === spendId)) return;
    s.bellSpends.push({ at, person, spendId, item: item as ShopItemId, bells });
  },
  spend_void(s, person, at, d) {
    const spendId = d.spendId;
    if (!isId(spendId)) return;
    const sp = s.bellSpends.find((x) => x.spendId === spendId);
    // The spender only, once, after the spend.
    if (!sp || sp.person !== person || sp.at > at || s.spendVoids.some((v) => v.spendId === spendId)) return;
    s.spendVoids.push({ at, person, spendId });
  },
  harvest(s, person, at, d) {
    const week = normDate(d.week);
    if (week) s.harvests.push({ at, person, week });
  },
  highfive(s, person, at) {
    s.highfives.push({ at, person });
  },
  find(s, person, at, d) {
    if (isFind(d)) s.finds.push({ at, person, kind: d.kind as FindKind, id: d.id as string });
  },
  pref(s, person, at, d) {
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
    } else if (d.key === 'villager' && typeof d.value === 'string' && /^[a-z][a-z0-9_-]{0,23}$/.test(d.value)) p.villager = d.value;
    else if (d.key === 'goalWeight') {
      // A goal in kg, or null / '' to clear it; anything else is ignored (the previous goal stays).
      if (d.value === null || d.value === '') delete p.goalWeight;
      else if (isWeightKg(d.value)) p.goalWeight = d.value;
    }
  }
};

/**
 * A person's Move goal on `date`: the latest `pref` moveGoal made on or before that Tokyo date (and
 * stamped by t), else PEOPLE[p].moveGoal. A change applies from the day it's made, never to earlier days.
 */
export function moveGoalOn(s: Pick<State, 'moveGoals'>, person: PersonId, date: LocalDate, t = Infinity): number {
  const list = s.moveGoals[person];
  for (let i = list.length - 1; i >= 0; i--) if (list[i].at <= t && localDateAt(list[i].at) <= date) return list[i].v;
  return PEOPLE[person].moveGoal;
}

/** The value of the latest entry with `at ≤ t`, or undefined. Lists are in ascending `at`. */
export function latestAt<T>(list: Timed<T>[] | undefined, t: number): T | undefined {
  if (!list) return undefined;
  for (let i = list.length - 1; i >= 0; i--) if (list[i].at <= t) return list[i].v;
  return undefined;
}
