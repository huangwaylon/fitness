// Snapshot rows → validated, indexed state. Whose goal a `pref` sets (`data.person`) and which buys are valid are
// read-time rules here (an invalid or unknown event is ignored, not refused), so the sheet stays a dumb append-only log.
// Health data comes only from the Shortcut's `metrics` rows: Apple Health is the source of truth.
import type { LocalDate, PersonId, ShopItemId, WeekKey, Who } from '#lib/types.ts';
import { CUTOFFS } from '#lib/config/rules.ts';
import { LIMITS, shopPrice } from '#lib/contract/rules.ts';
import { addDays, jstMs, localDateAt, toLocalDate, weekKeyOf } from '#lib/time/dates.ts';
import { isTally } from '#lib/contract/tally.ts';
import { isIslandDay, type IslandDayData } from '#lib/contract/island.ts';
import { decorOpOf, type DecorEntry } from '#lib/contract/decor.ts';
import { boardOpOf, type BoardEntry } from '#lib/contract/board.ts';
import { goalFallback, goalKeysOf, goalOfKey, GOALS, isGoalValue, type DailyGoalId, type LatestGoalKey } from '#lib/contract/goals.ts';
import { tentOpOf, type TentEntry } from '#lib/contract/tent.ts';
import { isRoomScope, layoutOpOf, type LayoutEntry } from '#lib/contract/layout.ts';
import { buyOf, sellOf, type ShopRowAt } from '#lib/contract/shop.ts';
import { isBirth, isBmiStd, isProfileKey, isSex, PROFILE_KEYS, type BmiStd, type ProfileKey, type Sex } from '#lib/contract/profile.ts';
import { lookPrefRead, readSavedLooks, type SavedLook } from '#lib/contract/look.ts';
import type { TallyRow } from './tally.ts';
import { rowAt } from './snapshot.ts';
import {
  BODY_BOUNDS, DATE_RE, eventSubject, EVENT_TYPES, isFind, isId, isPersonId, isWho, isActivityMetric, isBodyMetric, isWeatherMode, roundKg, WEIGHT_KG,
  type ActivityMetric, type BodyMetric, type EventRow, type EventType, type FindKind, type SnapshotRows, type WeatherMode
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

/** The goals kept as their latest (contract/goals.ts history `latest`: `goalWeight`, `goalBodyFat`, `goalBmi`,
 *  `goalLean`, the meal log's `kcalGoal` … `saltGoal`), each optional and shown only: none ever earns. */
interface Prefs extends Partial<Record<LatestGoalKey, number>> {
  locale?: 'ja' | 'en'; villagerName?: string; villager?: string;
  /** The profile (contract/profile.ts; model/profile.ts reads it): sex, birth date (`YYYY-MM-DD`), BMI standard. */
  sex?: Sex; birth?: string; bmiStd?: BmiStd;
  /** The look worn (contract/look.ts LookPref, as sent: resolveLook reads it, an unknown part as いつもの's); unset:
   *  いつもの. */
  look?: unknown;
  /** The コーデ (contract/look.ts), read (readSavedLooks). */
  savedLooks?: SavedLook[];
}

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
   *  (a day's rows fold by each entry's largest count). Never read by the economy. */
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
  /** The island's layout (`decor` with `sc` o, c, r or h: objects, terrain chunks, a reset, the homes' looks,
   *  contract/layout.ts), in server order (store/layout.svelte.ts merges them over the default). Never read by the
   *  economy. The homes' interiors (`sc` u and v) are rooms like the tent's, in `tent` with their scope. */
  layout: LayoutEntry[];
  /** The bulletin board (`board`: each post's ops, contract/board.ts), in server order; the posts are their merge
   *  (components/board/posts.svelte.ts). Never read by the economy. */
  board: BoardEntry[];
  /** The meal log (`food`: each entry's ops, contract/food.ts) as raw rows (RAW_EVENTS: unparsed, in the order given);
   *  the entries are their fold (model/food.ts). Never read by the economy. */
  food: EventRow[];
  /** The recurring meals (`food_repeat`: each repeat's ops, contract/food.ts) as raw rows (RAW_EVENTS); their days'
   *  items are read into each day (model/food.ts). Never read by the economy. */
  foodRepeat: EventRow[];
  /** My recipes (`food_recipe`: each recipe's ops, contract/food.ts) as raw rows (RAW_EVENTS); everyone's, read by
   *  everyone (model/food.ts recipes). Never read by the economy. */
  foodRecipe: EventRow[];
  /** My foods (`food_custom`: each custom food's ops, contract/food.ts) as raw rows (RAW_EVENTS); everyone's, read by
   *  everyone (model/food.ts customs). Never read by the economy. */
  foodCustom: EventRow[];
  /** The shop's rows (`sell`, `buy`: contract/shop.ts), each with whose they are (the guest's too), in server order,
   *  a queued one marked `queued`; the pockets and かいがら are their fold over the tallies (model/shop.ts). Never read
   *  by the economy. */
  shop: ShopRowAt[];
  /** Each person's prefs; the guest's (`G`) only ever hold its locale, name, villager and kcal goal (contract/guest.ts). */
  prefs: Record<Who, Prefs>;
  /** The island's weather (`pref weatherMode`: the last a member set; unset, `real`): Tokyo's real sky or the game's. */
  weatherMode?: WeatherMode;
  /** The goals a day keeps (`pref` stepsGoal, moveGoal, exerciseGoal, standGoal) per person, each ascending `at`
   *  (`goalOn` picks the one in force on a day). */
  dailyGoals: Record<PersonId, Record<DailyGoalId, Timed<number>[]>>;
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
  /** Server `at`s of the accepted-for-indexing rows (the raw ones aside), ascending, per tab (`rowsUpTo`). */
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

/** A date given as a full ISO instant (an imported row) normalised to a Tokyo `YYYY-MM-DD`. */
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

/**
 * The event types kept raw: the row as is (unparsed, unsorted, out of `ats`: nothing of the economy depends on them)
 * into this State list. High-volume logs the island never reads, so a reduce (each poll that brings a row, each cold
 * start) costs one lookup per row of them. Their own model parses, validates, orders and folds them when read,
 * memoised per row and per list (model/food.ts opOf, entriesOf). A new such type is one entry here, a list in State
 * and its reader.
 */
const RAW_EVENTS = new Map<string, 'food' | 'foodRepeat' | 'foodRecipe' | 'foodCustom'>([
  ['food', 'food'], ['food_repeat', 'foodRepeat'], ['food_recipe', 'foodRecipe'], ['food_custom', 'foodCustom']
]);
type RawEvent = 'food' | 'food_repeat' | 'food_recipe' | 'food_custom';

const bodyMaps = (): Record<BodyMetric, Map<LocalDate, Timed<number>[]>> => ({ body_fat_pct: new Map(), bmi: new Map(), lean_kg: new Map() });

/** Index and validate all rows. Rows are only ever appended, so nothing here depends on "now". `queued`: the ids of
 *  rows the record hasn't kept yet (a phone's queue: its sells and buys are judged as the record will, contract/shop.ts
 *  shopLedger). */
export function reduce(r: SnapshotRows, rev: string | null = null, queued?: ReadonlySet<string>): State {
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
    layout: [],
    board: [],
    food: [],
    foodRepeat: [],
    foodRecipe: [],
    foodCustom: [],
    shop: [],
    prefs: { A: {}, B: {}, G: {} },
    dailyGoals: { A: noGoals(), B: noGoals() },
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

  const events: EventRow[] = [];
  for (const row of r.events ?? []) {
    const list = RAW_EVENTS.get(row[3]);
    if (!list) events.push(row);
    else if (isWho(row[1])) s[list].push(row);
  }
  for (const { r: row, at } of byAt(events)) {
    const [, person, id, type, raw] = row;
    const d = parseData(raw);
    // A type the server doesn't accept (a hand edit of the sheet) is ignored, and so is a bad `person`.
    if (!d || !(EVENT_TYPES as readonly string[]).includes(type)) continue;
    const subject = eventSubject(type, d, person);
    const shopN = s.shop.length;
    if (subject) ON_EVENT[type as Exclude<EventType, RawEvent>](s, subject, at, d);
    if (queued?.has(id)) markQueued(s, shopN);
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
    layout: [...base.layout],
    board: [...base.board],
    food: [...base.food],
    foodRepeat: [...base.foodRepeat],
    foodRecipe: [...base.foodRecipe],
    foodCustom: [...base.foodCustom],
    shop: [...base.shop],
    prefs: { A: { ...base.prefs.A }, B: { ...base.prefs.B }, G: { ...base.prefs.G } },
    dailyGoals: { A: copyGoals(base.dailyGoals.A), B: copyGoals(base.dailyGoals.B) },
    rev,
    ats: [base.ats[0] ?? [], [...baseAts]]
  };
  let last = baseAts.length ? baseAts[baseAts.length - 1] : -Infinity;
  for (const row of events) {
    const at = rowAt(row, false);
    if (at === null || !isWho(row[1])) continue;
    if (at < last) return null; // not after the base: only a whole reduce orders it right
    last = at;
    const type = row[3];
    const list = RAW_EVENTS.get(type);
    if (list) {
      s[list].push(row);
      continue;
    }
    s.ats[1].push(at);
    const d = parseData(row[4]);
    if (!d || !(EVENT_TYPES as readonly string[]).includes(type)) continue;
    const subject = eventSubject(type, d, row[1]);
    const shopN = s.shop.length;
    if (subject) ON_EVENT[type as Exclude<EventType, RawEvent>](s, subject, at, d);
    markQueued(s, shopN);
  }
  return s;
}

/** The shop rows from `from` on are queued ones (not the record's yet). */
function markQueued(s: State, from: number): void {
  for (let i = from; i < s.shop.length; i++) s.shop[i] = { ...s.shop[i], queued: true };
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
/** The prefs the guest has (its villager, name, look, コーデ, language, meal-log goals and profile): anything else of `G`
 *  is ignored. */
const GUEST_PREFS: readonly unknown[] = ['locale', 'villagerName', 'villager', 'look', 'savedLooks', ...goalKeysOf('food'), ...PROFILE_KEYS];
const noGoals = (): Record<DailyGoalId, Timed<number>[]> => ({ steps: [], move: [], exercise: [], stand: [] });
const copyGoals = (g: Record<DailyGoalId, Timed<number>[]>): Record<DailyGoalId, Timed<number>[]> =>
  ({ steps: [...g.steps], move: [...g.move], exercise: [...g.exercise], stand: [...g.stand] });

/** One handler per event type: each accepts (indexes) the event or ignores it. */
const ON_EVENT: Record<Exclude<EventType, RawEvent>, OnEvent> = {
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
    if (isRoomScope(d.sc)) {
      const t = tentOpOf(d);
      if (t) s.tent.push({ ...t, who: person } as TentEntry);
      return;
    }
    if (d.sc !== undefined) {
      const l = layoutOpOf(d);
      if (l) s.layout.push({ ...l, who: person } as LayoutEntry);
      return;
    }
    const op = decorOpOf(d);
    if (op) s.decor.push({ ...op, who: person } as DecorEntry);
  },
  sell(s, person, at, d) {
    const data = sellOf(d);
    if (data) s.shop.push({ type: 'sell', data, at, person });
  },
  buy(s, person, at, d) {
    const data = buyOf(d);
    if (data) s.shop.push({ type: 'buy', data, at, person });
  },
  board(s, person, _at, d) {
    const op = boardOpOf(d);
    if (op) s.board.push({ ...op, who: person } as BoardEntry);
  },
  pref(s, person, at, d) {
    if (!isPersonId(person)) {
      if (!GUEST_PREFS.includes(d.key)) return;
    } else if (d.key === 'weatherMode') {
      // the island's, whoever set it (no `person`); anything else is ignored (the mode stays)
      if (isWeatherMode(d.value)) s.weatherMode = d.value;
      return;
    }
    const id = goalOfKey(d.key);
    if (id !== null && GOALS[id].history === 'daily') {
      // in its range and on its grid; anything else is ignored (the previous goal stays)
      if (isPersonId(person) && isGoalValue(id, d.value)) s.dailyGoals[person][id as DailyGoalId].push({ at, v: d.value });
      return;
    }
    const p = s.prefs[person];
    if (d.key === 'locale' && (d.value === 'ja' || d.value === 'en')) p.locale = d.value;
    else if (d.key === 'villagerName' && typeof d.value === 'string') {
      const v = d.value.trim();
      if (v.length >= 1 && v.length <= LIMITS.villagerNameMaxChars) p.villagerName = v;
    } else if (d.key === 'villager' && typeof d.value === 'string' && /^[a-z][a-z0-9_-]{0,23}$/.test(d.value)) p.villager = d.value;
    else if (d.key === 'look') {
      // null: back to いつもの; a player or a villager kept as sent (resolveLook reads it part by part); else ignored
      if (d.value === null) delete p.look;
      else if (lookPrefRead(d.value)) p.look = d.value;
    } else if (d.key === 'savedLooks' && Array.isArray(d.value)) p.savedLooks = readSavedLooks(d.value, person);
    else if (isProfileKey(d.key)) {
      // The profile: a value, or null to clear it; anything else is ignored (as the record's slot: prefTaken).
      if (d.value === null) delete p[d.key];
      else if (d.key === 'sex' ? isSex(d.value) : d.key === 'bmiStd' ? isBmiStd(d.value) : isBirth(d.value, '9999-12-31')) (p as Record<ProfileKey, unknown>)[d.key] = d.value;
    } else if (id !== null) {
      // a goal kept as its latest, or null / '' to clear it; anything else is ignored (the previous goal stays)
      const key = GOALS[id].key as LatestGoalKey;
      if (d.value === null || d.value === '') delete p[key];
      else if (isGoalValue(id, d.value)) p[key] = d.value;
    }
  }
};

/**
 * A person's goal of `id` on `date` (a goal a day keeps: steps, Move, Exercise, Stand): the latest `pref` made on or
 * before that Tokyo date (and stamped by t), else its default (contract/goals.ts fallback). A change applies from the
 * day it's made, never to earlier days.
 */
export function dailyGoalOn(s: Pick<State, 'dailyGoals'>, person: PersonId, id: DailyGoalId, date: LocalDate, t = Infinity): number {
  return goalOn(s.dailyGoals[person][id], date, t) ?? goalFallback(id, person) ?? 0;
}
/** A person's Move goal on `date` (dailyGoalOn: what the ベル price a day by). */
export const moveGoalOn = (s: Pick<State, 'dailyGoals'>, person: PersonId, date: LocalDate, t = Infinity): number => dailyGoalOn(s, person, 'move', date, t);
/** A person's steps goal on `date`, as moveGoalOn. */
export const stepsGoalOn = (s: Pick<State, 'dailyGoals'>, person: PersonId, date: LocalDate, t = Infinity): number => dailyGoalOn(s, person, 'steps', date, t);

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
