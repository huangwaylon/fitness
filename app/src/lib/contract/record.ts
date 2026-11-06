// The rules of the record shared by its writers (docs/backend.md#events): what an `event` must look like to be
// accepted (relay/src/store.ts checks it), and which events replace an earlier one (the
// store's slots: a tally and an island day per person and day, a cosmetic pref per person, a goal per person and
// Tokyo day, a board post, a meal entry, a repeat, a recipe and a custom food per id). Pure, over the contract only (relative imports), since the relay imports it from here (deps.test: the relay imports
// only contract/).
import { isFind, isId, isLocalDate, isWeatherMode, nextDay, PREF_KEYS, type EventType } from './api.ts';
import { GOAL_IDS, GOALS, goalOfKey, goalPrefTaken } from './goals.ts';
import { isTally } from './tally.ts';
import { isIslandDay } from './island.ts';
import { decorOpOf } from './decor.ts';
import { tentOpOf } from './tent.ts';
import { layoutOpOf } from './layout.ts';
import { boardOpOf } from './board.ts';
import { packOpOf, packSlot } from './pack.ts';
import { wedOpOf, wedSlot } from './wedding.ts';
import { foodCustomOp, foodOp, foodRecipeOp, foodRepeatOp } from './food.ts';
import { shopPriced } from './shop.ts';
import { AHEAD_MS } from './ops.ts';
import { listenOf } from './listen.ts';
import { LIMITS, shopPrice } from './rules.ts';
import { isBirth, isBmiStd, isProfileKey, isSex, profileValueOk } from './profile.ts';
import { lookPrefOk, lookPrefRead, savedLooksOk } from './look.ts';
import { localDateAt } from './tokyo.ts';
import type { LocalDate, Who } from '../types.ts';

type Rec = Record<string, unknown>;

/**
 * Shape checks per event type: a spend names one of the two rewards (SHOP) at exactly its price. Whether the wallet
 * covers it and the pref values stay read-time rules in the model (`model/state.ts`), so the record stays a dumb log.
 * `now`: the server's clock (a tally's or island day's date may not be after tomorrow). @public (relay/src/store.ts)
 */
export function validEventData(type: string, d: Rec, now: number): boolean {
  switch (type) {
    case 'spend':
      return isId(d.spendId) && shopPrice(d.item) !== undefined && d.bells === shopPrice(d.item);
    case 'pref':
      // the profile's values are checked here (contract/profile.ts: a sex, a birth date 1900 … 10 years ago, a BMI
      // standard, or null), and the look's (contract/look.ts: a whole look, at most 20 コーデ); the other prefs' at read
      // time (prefTaken)
      // a goal a day keeps may say the phone's Tokyo day it was set on (`day`: goalDay)
      return (PREF_KEYS as readonly unknown[]).includes(d.key) && d.value !== undefined && (!isProfileKey(d.key) || profileValueOk(d.key, d.value, localDateAt(now)))
        && (d.day === undefined || (isDailyGoalKey(d.key) && isLocalDate(d.day)))
        && (d.key !== 'look' || lookPrefOk(d.value)) && (d.key !== 'savedLooks' || savedLooksOk(d.value));
    case 'harvest':
      return isLocalDate(d.week);
    case 'spend_void':
      return isId(d.spendId);
    case 'find':
      return isFind(d);
    case 'tally':
    // a day's catches given back (a claim race lost after its tally reached the record: contract/tally.ts), a tally's shape;
    // whether that day's tally covers them is the record's check (relay/src/store.ts)
    case 'tally_back':
      return isTally(d, localDateAt(now));
    case 'island':
      return isIslandDay(d, localDateAt(now));
    case 'decor':
      // the island's decorations, a home's room (`sc` t, u, v: contract/tent.ts) or the layout (o, c, r, h:
      // contract/layout.ts)
      return decorOpOf(d) !== null || tentOpOf(d) !== null || layoutOpOf(d) !== null;
    case 'board':
      // a bulletin board post set or removed (contract/board.ts: its text already clean)
      return boardOpOf(d) !== null;
    case 'food': {
      // a meal entry set or removed (contract/food.ts: already normalized), its day not after tomorrow
      const op = foodOp(d);
      return op !== null && atNear(op.at, now) && (op.rm === true || op.d <= nextDay(localDateAt(now)));
    }
    case 'food_repeat': {
      // a repeat set or removed (contract/food.ts: already normalized), its first day not after tomorrow
      const op = foodRepeatOp(d);
      return op !== null && atNear(op.at, now) && (op.rm === true || op.from <= nextDay(localDateAt(now)));
    }
    case 'food_recipe': {
      // a recipe set or removed (contract/food.ts: already normalized)
      const op = foodRecipeOp(d);
      return op !== null && atNear(op.at, now);
    }
    case 'food_custom': {
      // a custom food set or removed (contract/food.ts: already normalized)
      const op = foodCustomOp(d);
      return op !== null && atNear(op.at, now);
    }
    case 'sell':
    case 'buy':
      // the shop (contract/shop.ts): a sell at its species' price, a buy at its piece's from a stock of about today;
      // whether the pocket or the かいがら cover it is the record's check against the person's rows (shopRefusal)
      return shopPriced(type, d, localDateAt(now));
    case 'pack':
    case 'pack_chk':
    case 'pack_reset':
    case 'trip_note':
      // a trip's packing list, a person's tick or reset, a trip's private note (contract/pack.ts: its texts already
      // clean, its `at` not over a day past the record's)
      return packOpOf(type, d, now) !== null;
    case 'wtask':
    case 'wdone':
    case 'wconf':
    case 'wnote':
      // the wedding board (contract/wedding.ts: its texts already clean, its `at` not over a day past the record's,
      // never `imported` or a note's `was`: the admin's load's and the record's own)
      return wedOpOf(type, d, { now }) !== null;
    case 'listen': {
      // a ききみみ game's answers (contract/listen.ts), its day not after tomorrow
      const row = listenOf(d);
      return row !== null && row.d <= nextDay(localDateAt(now));
    }
    default:
      return true;
  }
}

/** A meal op's `at` (the sender's clock) at most AHEAD_MS past the record's (foodAccept: an op no later than the one
 *  held is stale, so a clock far ahead would stamp ops no later edit could beat). */
const atNear = (at: number, now: number): boolean => at <= now + AHEAD_MS;

/** Whether `key` is a goal a day keeps (contract/goals.ts history `daily`). */
const isDailyGoalKey = (key: unknown): boolean => {
  const id = goalOfKey(key);
  return id !== null && GOALS[id].history === 'daily';
};

/**
 * The Tokyo day a goal a day keeps applies from: its `day` (2026-11-05: the phone's Tokyo day when it was set, so a
 * goal set at 23:59 that reaches the record after midnight is that day's) when it is within a day of the record's
 * Tokyo day of `at`, else that day (an older phone's, or one queued offline for longer). The record's slot
 * (eventSlot) and the model (model/state.ts dailyGoalOn) both read it. @public (model/state.ts)
 */
export function goalDay(d: Rec, at: number): LocalDate {
  const own = localDateAt(at);
  const day = d.day;
  return typeof day === 'string' && isLocalDate(day) && (day === own || nextDay(day) === own || day === nextDay(own)) ? day : own;
}

/** The prefs only the latest of counts (per person); the goals keep their history (`moveGoalOn` prices past days). */
const LATEST_PREFS: readonly unknown[] = ['locale', 'villagerName', 'villager', 'look', 'savedLooks', ...GOAL_IDS.filter((id) => GOALS[id].history === 'latest').map((id) => GOALS[id].key), 'sex', 'birth', 'bmiStd'];

/** Whether the model takes this pref's value (model/state.ts ON_EVENT.pref; anything else is ignored there). */
export function prefTaken(key: unknown, v: unknown): boolean {
  switch (key) {
    case 'locale': return v === 'ja' || v === 'en';
    case 'villagerName': return typeof v === 'string' && v.trim().length >= 1 && v.trim().length <= LIMITS.villagerNameMaxChars;
    case 'villager': return typeof v === 'string' && /^[a-z][a-z0-9_-]{0,23}$/.test(v);
    // (the look's whole check is the record's when it's set: validEventData; read part by part, contract/look.ts)
    case 'look': return lookPrefRead(v);
    case 'savedLooks': return Array.isArray(v);
    case 'weatherMode': return isWeatherMode(v);
    case 'sex': return v === null || isSex(v);
    // (a birth date's upper bound is the record's check when it's set: validEventData)
    case 'birth': return v === null || isBirth(v, '9999-12-31');
    case 'bmiStd': return v === null || isBmiStd(v);
    default: {
      // a goal (contract/goals.ts): in its range, on its grid; a clearable one null / '' too
      const id = goalOfKey(key);
      return id !== null && goalPrefTaken(id, v);
    }
  }
}

/**
 * The slot an event fills, or null: a later event of the same slot replaces it (the record keeps one row per slot).
 * - `tally`, `tally_back`, `island`: the sender's day (`date`);
 * - a cosmetic `pref` (`locale`, `villagerName`, `villager`, `look`, `savedLooks`), the profile (`sex`, `birth`, `bmiStd`) or a goal kept as its latest (contract/goals.ts history
 *   `latest`: the body and meal-log goals): its subject and key;
 * - a goal a day keeps (history `daily`: `stepsGoal`, `moveGoal`, `exerciseGoal`, `standGoal`): its subject, key and the Tokyo day it was made (goalDay: its `day`, else `at`'s), so the goal in
 *   force on each past day stays (a goal applies from the day it's made; the last of a day is the one that counts);
 * - the island's `weatherMode`: one for the island, whoever set it (the last one wins);
 * - a `decor` op: its scope and item id (`decorAccept` / `tentAccept` decide whether it replaces), a room light's switch
 *   (`lt`) its own beside its piece's;
 * - a `board` op: its post's id (`boardAccept` decides whether it replaces);
 * - a `pack` op: its trip and id, a `pack_chk` its trip, id and sender, a `pack_reset` its trip and sender, a
 *   `trip_note` its trip (contract/pack.ts PackBook decides whether it replaces);
 * - a `wtask` and a `wdone` op: its task's id, a `wconf` its key, the `wnote` one for the board (contract/wedding.ts
 *   WedBook decides whether it replaces);
 * - a `food` op: its entry's id, a `food_repeat` op its repeat's, a `food_recipe` op its recipe's, a `food_custom` op
 *   its custom food's (`foodAccept` decides whether it replaces).
 * A pref the model would ignore takes no slot, so it never replaces one it takes. `subject`: `eventSubject`.
 */
export function eventSlot(type: EventType | string, sender: Who, subject: Who, d: Rec, at: number): string | null {
  switch (type) {
    case 'tally':
    case 'tally_back':
    case 'island':
      return typeof d.date === 'string' ? `${type}|${sender}|${d.date}` : null;
    case 'decor':
      // (a light's switch alone, contract/tent.ts: its own slot beside its piece's)
      return typeof d.id === 'string' ? `decor|${typeof d.sc === 'string' ? d.sc : ''}|${d.id}${d.lt !== undefined ? '|l' : ''}` : null;
    case 'board':
      return typeof d.id === 'string' ? `board|${d.id}` : null;
    case 'food':
      return typeof d.id === 'string' ? `food|${d.id}` : null;
    case 'pack':
    case 'pack_chk':
    case 'pack_reset':
    case 'trip_note':
      return packSlot(type, sender, d);
    case 'wtask':
    case 'wdone':
    case 'wconf':
    case 'wnote':
      return wedSlot(type, d);
    case 'food_repeat':
    case 'food_recipe':
    case 'food_custom':
      return typeof d.id === 'string' ? `${type}|${d.id}` : null;
    case 'pref':
      if (!prefTaken(d.key, d.value)) return null;
      if (d.key === 'weatherMode') return 'pref|island|weatherMode';
      return LATEST_PREFS.includes(d.key) ? `pref|${subject}|${d.key}` : `pref|${subject}|${d.key}|${goalDay(d, at)}`;
    default:
      return null;
  }
}
