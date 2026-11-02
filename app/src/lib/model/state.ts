// Snapshot rows → validated, indexed state. Whose goal a `pref` sets (`data.person`) and which buys are valid are
// read-time rules here (an invalid or unknown event is ignored, not refused), so the sheet stays a dumb append-only log.
// Health data comes only from the Shortcut's `metrics` rows: Apple Health is the source of truth.
import type { LocalDate, PersonId, ShopItemId, WeekKey, Who } from '#lib/types.ts';
import { CUTOFFS, LIMITS, MOVE_GOAL, PEOPLE, STEPS_GOAL, isStepsGoal, shopPrice } from '#lib/config/rules.ts';
import { addDays, jstMs, localDateAt, toLocalDate, weekKeyOf } from '#lib/time/dates.ts';
import { isTally } from '#lib/contract/tally.ts';
import { isIslandDay, type IslandDayData } from '#lib/contract/island.ts';
import { decorOpOf, type DecorEntry } from '#lib/contract/decor.ts';
import { tentOpOf, type TentEntry } from '#lib/contract/tent.ts';
import type { TallyRow } from './tally.ts';
import { rowAt } from './snapshot.ts';
import {
  BODY_BOUNDS, DATE_RE, eventSubject, EVENT_TYPES, isFind, isId, isPersonId, isWho, isActivityMetric, isBodyMetric, isWeightKg, isBodyFatGoal, roundKg, WEIGHT_KG,
  type ActivityMetric, type BodyMetric, type EventRow, type EventType, type FindKind, type SnapshotRows
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

/** `goalWeight` / `goalBodyFat`: the person's optional goals in kg / body fat %, shown on the weight / body fat
 *  charts; never earn. */
interface Prefs { locale?: 'ja' | 'en'; villagerName?: string; villager?: string; goalWeight?: number; goalBodyFat?: number }

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
  /**
   * The body metrics (body fat %, BMI, lean body mass), apart like weight and never read by the economy: per person and
   * metric, date → rows, ascending `at`, one decimal, within BODY_BOUNDS. A day's value is its latest row.
   */
  body: Record<PersonId, Record<BodyMetric, Map<LocalDate, Timed<number>[]>>>;
  /** Accepted `spend_void`s (by either person, once per buy, after it). */
  spendVoids: { at: number; person: PersonId; spendId: string }[];
  harvests: { at: number; person: PersonId; week: WeekKey }[];
  /** The island's finds (`find`: catches and pick-ups for the ずかん), in server order. Never read by the economy. */
  finds: { at: number; person: Who; kind: FindKind; id: string }[];
  /** Each person's day tallies (`tally`: the ずかん's counts, model/tally.ts), in server order, replaced rows included
   *  (a day's latest wins). Never read by the economy. */
  tallies: TallyRow[];
  /** Each person's island days (`island`: their part of a day's shared island, contract/island.ts), in server order,
   *  replaced rows included (a day's latest wins: `latestIslandDay`). Never read by the economy. */
  islandDays: IslandDayRow[];
  /** The island's decorations (`decor`: each item's ops, contract/decor.ts), in server order; the layout is their merge
   *  (store/decor.svelte.ts). Never read by the economy. */
  decor: DecorEntry[];
  /** The tent's room (`decor` with `sc: 't'`: each piece's ops, the wallpaper's and the floor's, contract/tent.ts), in
   *  server order (store/tent.svelte.ts merges them). Never read by the economy. */
  tent: TentEntry[];
  /** Each person's prefs; the guest's (`G`) only ever hold its locale, name and villager (contract/guest.ts). */
  prefs: Record<Who, Prefs>;
  /** Accepted `pref` moveGoal (kcal) per person, ascending `at` (`moveGoalOn` picks the one in force). */
  moveGoals: Record<PersonId, Timed<number>[]>;
  /** Accepted `pref` stepsGoal per person, ascending `at` (`stepsGoalOn` picks the one in force). */
  stepsGoals: Record<PersonId, Timed<number>[]>;
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
    if (at === null || !isWho(r[1])) continue;
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

const bodyMaps = (): Record<BodyMetric, Map<LocalDate, Timed<number>[]>> => ({ body_fat_pct: new Map(), bmi: new Map(), lean_kg: new Map() });

/** Index and validate all rows. Rows are only ever appended, so nothing here depends on "now". */
export function reduce(r: SnapshotRows, rev: string | null = null): State {
  const s: State = {
    metrics: { A: new Map(), B: new Map() },
    bellSpends: [],
    weights: { A: new Map(), B: new Map() },
    body: { A: bodyMaps(), B: bodyMaps() },
    spendVoids: [],
    harvests: [],
    finds: [],
    tallies: [],
    islandDays: [],
    decor: [],
    tent: [],
    prefs: { A: {}, B: {}, G: {} },
    moveGoals: { A: [], B: [] },
    stepsGoals: { A: [], B: [] },
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
    if (!isPersonId(person)) continue; // health is the members' alone
    const date = normDate(d);
    const value = num(v);
    if (!date || value === null) continue;
    if (metric === 'weight') {
      if (value < WEIGHT_KG.min || value > WEIGHT_KG.max) continue;
      push(s.weights[person], date, { at, v: roundKg(value) });
    } else if (isBodyMetric(metric)) {
      if (value < BODY_BOUNDS[metric].min || value > BODY_BOUNDS[metric].max) continue;
      push(s.body[person][metric], date, { at, v: roundKg(value) });
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
    // A type the server doesn't accept (a hand edit of the sheet) is ignored, and so is a bad `person`.
    if (!d || !(EVENT_TYPES as readonly string[]).includes(type)) continue;
    const subject = eventSubject(type, d, person);
    if (subject) ON_EVENT[type](s, subject, at, d);
  }
  return s;
}

/**
 * `reduce` of `base`'s rows plus `events`, without reducing the base again and without touching it (a State is never
 * mutated: bells.ts caches per State): the lists the events can change are copied, the rest is shared. Only for
 * events stamped after every event of the base (the queued ones: view.ts composeModel); otherwise null.
 */
export function foldEvents(base: State, events: readonly EventRow[], rev: string | null): State | null {
  const baseAts = base.ats[1] ?? [];
  const s: State = {
    ...base,
    bellSpends: [...base.bellSpends],
    spendVoids: [...base.spendVoids],
    harvests: [...base.harvests],
    finds: [...base.finds],
    tallies: [...base.tallies],
    islandDays: [...base.islandDays],
    decor: [...base.decor],
    tent: [...base.tent],
    prefs: { A: { ...base.prefs.A }, B: { ...base.prefs.B }, G: { ...base.prefs.G } },
    moveGoals: { A: [...base.moveGoals.A], B: [...base.moveGoals.B] },
    stepsGoals: { A: [...base.stepsGoals.A], B: [...base.stepsGoals.B] },
    rev,
    ats: [base.ats[0] ?? [], [...baseAts]]
  };
  let last = baseAts.length ? baseAts[baseAts.length - 1] : -Infinity;
  for (const row of events) {
    const at = rowAt(row, false);
    if (at === null || !isWho(row[1])) continue;
    if (at < last) return null; // not after the base: only a whole reduce orders it right
    last = at;
    s.ats[1].push(at);
    const d = parseData(row[4]);
    const type = row[3];
    if (!d || !(EVENT_TYPES as readonly string[]).includes(type)) continue;
    const subject = eventSubject(type, d, row[1]);
    if (subject) ON_EVENT[type](s, subject, at, d);
  }
  return s;
}

// ---------- events ----------

type Data = Record<string, unknown>;
/** `person`: whose data the event changes (a goal's `data.person`, else the sender: the guest's, `G`, too). */
type OnEvent = (s: State, person: Who, at: number, d: Data) => void;
type MemberEvent = (s: State, person: PersonId, at: number, d: Data) => void;
/** A handler of the members' alone (the economy, a goal): the guest's row of it is ignored (the record refuses those
 *  anyway: contract/guest.ts). */
const members = (fn: MemberEvent): OnEvent => (s, person, at, d) => {
  if (isPersonId(person)) fn(s, person, at, d);
};
/** The prefs the guest has (its villager, name and language): anything else of `G` is ignored. */
const GUEST_PREFS: readonly unknown[] = ['locale', 'villagerName', 'villager'];

/** One handler per event type: each accepts (indexes) the event or ignores it. */
const ON_EVENT: Record<EventType, OnEvent> = {
  spend: members((s, person, at, d) => {
    // A buy from the wallet: a SHOP item at exactly its price. Whether the wallet covered it is decided on read (bells.ts).
    const { spendId, item } = d;
    const bells = shopPrice(item);
    if (!isId(spendId) || bells === undefined || d.bells !== bells) return;
    if (s.bellSpends.some((x) => x.spendId === spendId)) return;
    s.bellSpends.push({ at, person, spendId, item: item as ShopItemId, bells });
  }),
  spend_void: members((s, person, at, d) => {
    const spendId = d.spendId;
    if (!isId(spendId)) return;
    const sp = s.bellSpends.find((x) => x.spendId === spendId);
    // Either of us (one shared wallet), once, after the spend.
    if (!sp || sp.at > at || s.spendVoids.some((v) => v.spendId === spendId)) return;
    s.spendVoids.push({ at, person, spendId });
  }),
  harvest: members((s, person, at, d) => {
    const week = normDate(d.week);
    if (week) s.harvests.push({ at, person, week });
  }),
  find(s, person, at, d) {
    if (isFind(d)) s.finds.push({ at, person, kind: d.kind as FindKind, id: d.id as string });
  },
  tally(s, person, at, d) {
    if (isTally(d)) s.tallies.push({ at, person, date: d.date, counts: d.counts });
  },
  island: members((s, person, at, d) => {
    if (isIslandDay(d)) s.islandDays.push({ at, person, data: d });
  }),
  decor(s, person, _at, d) {
    if (d.sc === 't') {
      const t = tentOpOf(d);
      if (t) s.tent.push({ ...t, who: person } as TentEntry);
      return;
    }
    const op = decorOpOf(d);
    if (op) s.decor.push({ ...op, who: person } as DecorEntry);
  },
  pref(s, person, at, d) {
    if (!isPersonId(person)) {
      if (!GUEST_PREFS.includes(d.key)) return;
    } else if (d.key === 'moveGoal') {
      // An integer kcal in MOVE_GOAL; anything else is ignored (the previous goal stays).
      const v = d.value;
      if (typeof v === 'number' && Number.isInteger(v) && v >= MOVE_GOAL.min && v <= MOVE_GOAL.max) s.moveGoals[person].push({ at, v });
      return;
    } else if (d.key === 'stepsGoal') {
      // A whole STEPS_GOAL.step in STEPS_GOAL's range; anything else is ignored (the previous goal stays).
      if (isStepsGoal(d.value)) s.stepsGoals[person].push({ at, v: d.value });
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
    } else if (d.key === 'goalBodyFat') {
      // A goal in body fat %, or null / '' to clear it; anything else is ignored (the previous goal stays).
      if (d.value === null || d.value === '') delete p.goalBodyFat;
      else if (isBodyFatGoal(d.value)) p.goalBodyFat = d.value;
    }
  }
};

/**
 * A person's Move goal on `date`: the latest `pref` moveGoal made on or before that Tokyo date (and
 * stamped by t), else PEOPLE[p].moveGoal. A change applies from the day it's made, never to earlier days.
 */
export function moveGoalOn(s: Pick<State, 'moveGoals'>, person: PersonId, date: LocalDate, t = Infinity): number {
  return goalOn(s.moveGoals[person], date, t) ?? PEOPLE[person].moveGoal;
}

/** A person's steps goal on `date`, as moveGoalOn: the latest `pref` stepsGoal by then, else STEPS_GOAL.fallback. */
export function stepsGoalOn(s: Pick<State, 'stepsGoals'>, person: PersonId, date: LocalDate, t = Infinity): number {
  return goalOn(s.stepsGoals[person], date, t) ?? STEPS_GOAL.fallback;
}

/** The latest goal made on or before that Tokyo date (and stamped by t), or undefined. */
function goalOn(list: Timed<number>[], date: LocalDate, t: number): number | undefined {
  for (let i = list.length - 1; i >= 0; i--) if (list[i].at <= t && localDateAt(list[i].at) <= date) return list[i].v;
  return undefined;
}

/** The value of the latest entry with `at ≤ t`, or undefined. Lists are in ascending `at`. */
export function latestAt<T>(list: Timed<T>[] | undefined, t: number): T | undefined {
  if (!list) return undefined;
  for (let i = list.length - 1; i >= 0; i--) if (list[i].at <= t) return list[i].v;
  return undefined;
}

/** One person's island day as the sheet has it (an `island` row). */
export interface IslandDayRow {
  at: number;
  person: PersonId;
  data: IslandDayData;
}

/** `person`'s latest island day of `date` (a later row of the same day replaces an earlier one), or null. */
export function latestIslandDay(rows: readonly IslandDayRow[], person: PersonId, date: string): IslandDayRow | null {
  let best: IslandDayRow | null = null;
  for (const r of rows) if (r.person === person && r.data.date === date && (!best || r.at >= best.at)) best = r;
  return best;
}
