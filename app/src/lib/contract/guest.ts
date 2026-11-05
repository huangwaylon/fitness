// The guest (docs/design.md "The guest", docs/backend.md#the-guest): a third key, KEY_C, for a visitor who plays on the
// island and in the tent, sees the members' activity and ベル, but never earns or spends and never sees their bodies
// (weight, body fat, BMI, lean mass and their goals). These are the record's rules for that key, shared by the record
// (relay/src/store.ts: what it accepts from the guest and what its snapshot leaves out) and the demo (`?demo&as=G`
// shows what the guest's phone would get). Pure.
import { isActivityMetric, isPersonId, isRec, PROFILE_PREF_KEYS, type EventRow, type SnapshotRows } from './api.ts';
import type { Who } from '../types.ts';
import { scopeMayWrite } from './layout.ts';
import { goalKeysOf } from './goals.ts';
import { listenSeen, listenSummaryJson } from './listen.ts';

/** The guest's own prefs: cosmetic (its look and コーデ too: contract/look.ts), its meal log's daily goals (kcal and the nutrients; never another goal, never
 *  another person's) and its own profile (contract/profile.ts: its sex, birth date and BMI standard). */
const GUEST_PREF_KEYS: readonly unknown[] = ['locale', 'villagerName', 'villager', 'look', 'savedLooks', ...goalKeysOf('food'), ...PROFILE_PREF_KEYS];

type Rec = Record<string, unknown>;

/**
 * Whether the guest may write this event: a `find` or a `tally` (its catches, credited to it), a `decor` op of the
 * tent's room (`sc: 't'`), its own home's room (`v`) or its own home's look (`h`, `hG`: contract/layout.ts
 * scopeMayWrite), a `board` note (posting; editing and removing only its own: contract/board.ts boardMayWrite), a
 * `food` entry, a `food_repeat`, a `food_recipe` or a `food_custom` (its own meals, recipes and foods: contract/food.ts
 * foodAccept), a `sell` or a
 * `buy` at the shop (its own pocket and かいがら: contract/shop.ts) and its own cosmetic `pref` or meal-log goal (no `person`).
 * Everything else (a buy, a void, a harvest, a member's goal, the
 * island's decor and its layout, an island day, a high-five row) is the members' alone: the record answers `forbidden`.
 * @public (relay/src/store.ts)
 */
export function guestMayWrite(type: string, d: Rec): boolean {
  switch (type) {
    case 'find':
    case 'tally':
    case 'tally_back':
    case 'board':
    case 'food':
    case 'food_repeat':
    case 'food_recipe':
    case 'food_custom':
    case 'sell':
    case 'buy':
    case 'listen':
      // its catches; a note on the board (its own to edit and remove: the record checks, contract/board.ts); its
      // meals, repeats, recipes and custom foods (only its own: contract/food.ts); its own pocket's sells and its own かいがら's buys
      // (contract/shop.ts: never ベル); its own ききみみ games (contract/listen.ts: seen by it alone)
      return true;
    case 'decor':
      return scopeMayWrite('G', d);
    case 'pref':
      return d.person === undefined && GUEST_PREF_KEYS.includes(d.key);
    default:
      return false;
  }
}

/** The からだ goals (`pref goalWeight`, `goalBodyFat`, `goalBmi`, `goalLean`: contract/goals.ts group `body`): never
 *  sent to the guest. */
const BODY_GOAL_KEYS: readonly unknown[] = goalKeysOf('body');

/** A `pref` row's data: null for any other row, false for an unreadable one. */
function prefData(r: EventRow): Rec | null | false {
  if (r[3] !== 'pref') return null;
  try {
    const d: unknown = JSON.parse(r[4] || '{}');
    return isRec(d) && d;
  } catch {
    return false;
  }
}

/**
 * Whether a profile `pref` row (sex, birth date, BMI standard: contract/profile.ts) reaches `viewer`: a member's
 * (its subject `person`, else its sender, A or B) only the two members, the guest's only the guest. Any other row: yes.
 */
function profileSeen(viewer: Who, r: EventRow, d: Rec): boolean {
  if (!PROFILE_PREF_KEYS.includes(d.key as string)) return true;
  const subject = d.person === undefined ? r[1] : d.person;
  return isPersonId(viewer) ? isPersonId(subject) : subject === 'G' && r[1] === 'G';
}

/** Whether an event row reaches the guest: all but the からだ goals and the members' profiles; every meal,
 *  everyone's, does. */
function guestSeesEvent(r: EventRow): boolean {
  const d = prefData(r);
  return d === null || (d !== false && !BODY_GOAL_KEYS.includes(d.key) && profileSeen('G', r, d));
}

/**
 * The rows the guest's phone gets: the activity metrics (steps, Move, Exercise, Stand: the trees, today's ベル, きろく)
 * and every event but the からだ goals, the members' profiles (its own profile it does get) and the members' ききみみ games
 * (its own it does get). Never a からだ row: weight, body fat, BMI, lean mass.
 */
export function guestRows(rows: SnapshotRows): SnapshotRows {
  return { metrics: rows.metrics.filter((r) => isActivityMetric(r[3])), events: rows.events.filter((r) => guestSeesEvent(r) && (r[3] !== 'listen' || r[1] === 'G')) };
}

/**
 * A `listen` row (ききみみ クイズ's answers, contract/listen.ts) as `me` gets it: its owner's whole; the other member's
 * summary only (`{d, g, n, ms}`: a game played, never the level or the answers); null between the guest and a member,
 * or for a row that isn't one. Any other row as it is.
 */
function listenFor(me: Who, r: EventRow): EventRow | null {
  if (r[3] !== 'listen') return r;
  const seen = listenSeen(me, r[1]);
  if (seen === 'all') return r;
  const summary = seen === 'summary' ? listenSummaryJson(r[4]) : null;
  return summary === null ? null : [r[0], r[1], r[2], r[3], summary];
}

/**
 * The rows `me`'s phone gets (every `snapshot` and delta, relay/src/store.ts): the guest's, guestRows; a member's,
 * everything but the guest's profile (the guest's alone) and the guest's ききみみ games, the partner's games as their
 * summaries (listenFor). @public (relay/src/store.ts)
 */
export function rowsFor(me: Who, rows: SnapshotRows): SnapshotRows {
  if (me === 'G') return guestRows(rows);
  let changed = false;
  const events: EventRow[] = [];
  for (const r of rows.events) {
    const d = prefData(r);
    const out = d === null || d === false || profileSeen(me, r, d) ? listenFor(me, r) : null;
    if (out !== r) changed = true;
    if (out) events.push(out);
  }
  return changed ? { metrics: rows.metrics, events } : rows;
}
