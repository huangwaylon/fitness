// The rules of the record shared by its writers (docs/backend.md#events): what an `event` must look like to be
// accepted (relay/src/store.ts checks it), and which events replace an earlier one (the
// store's slots: a tally and an island day per person and day, a cosmetic pref per person, a goal per person and
// Tokyo day, a board post, a meal entry, a repeat and a recipe per id). Pure, over the contract only (relative imports), since the relay imports it from here.
import { isBodyFatGoal, isFind, isId, isLocalDate, isWeightKg, nextDay, PREF_KEYS, type EventType } from '../contract/api.ts';
import { isTally } from '../contract/tally.ts';
import { isIslandDay } from '../contract/island.ts';
import { decorOpOf } from '../contract/decor.ts';
import { tentOpOf } from '../contract/tent.ts';
import { layoutOpOf } from '../contract/layout.ts';
import { boardOpOf } from '../contract/board.ts';
import { foodOp, foodRecipeOp, foodRepeatOp, isKcalGoal } from '../contract/food.ts';
import { shopPriced } from '../contract/shop.ts';
import { isStepsGoal, LIMITS, MOVE_GOAL, shopPrice } from '../config/rules.ts';
import { localDateAt } from '../time/dates.ts';
import type { Who } from '../types.ts';

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
      return (PREF_KEYS as readonly unknown[]).includes(d.key) && d.value !== undefined;
    case 'harvest':
      return isLocalDate(d.week);
    case 'spend_void':
      return isId(d.spendId);
    case 'find':
      return isFind(d);
    case 'tally':
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
    case 'sell':
    case 'buy':
      // the shop (contract/shop.ts): a sell at its species' price, a buy at its piece's from a stock of about today;
      // whether the pocket or the かいがら cover it is the record's check against the person's rows (shopRefusal)
      return shopPriced(type, d, localDateAt(now));
    default:
      return true;
  }
}

/** A meal op's `at` (the sender's clock) at most this far past the record's (ms). A phone's clock far ahead would
 *  otherwise stamp ops no later edit could beat (foodAccept: an op no later than the one held is stale). */
const FOOD_AHEAD_MS = 24 * 60 * 60 * 1000;
const atNear = (at: number, now: number): boolean => at <= now + FOOD_AHEAD_MS;

/** The prefs only the latest of counts (per person); the goals keep their history (`moveGoalOn` prices past days). */
const LATEST_PREFS = ['locale', 'villagerName', 'villager', 'goalWeight', 'goalBodyFat', 'kcalGoal'] as const;

/** Whether the model takes this pref's value (model/state.ts ON_EVENT.pref; anything else is ignored there). */
export function prefTaken(key: unknown, v: unknown): boolean {
  switch (key) {
    case 'moveGoal': return typeof v === 'number' && Number.isInteger(v) && v >= MOVE_GOAL.min && v <= MOVE_GOAL.max;
    case 'stepsGoal': return isStepsGoal(v);
    case 'locale': return v === 'ja' || v === 'en';
    case 'villagerName': return typeof v === 'string' && v.trim().length >= 1 && v.trim().length <= LIMITS.villagerNameMaxChars;
    case 'villager': return typeof v === 'string' && /^[a-z][a-z0-9_-]{0,23}$/.test(v);
    case 'goalWeight': return v === null || v === '' || isWeightKg(v);
    case 'goalBodyFat': return v === null || v === '' || isBodyFatGoal(v);
    case 'kcalGoal': return v === null || isKcalGoal(v);
    default: return false;
  }
}

/**
 * The slot an event fills, or null: a later event of the same slot replaces it (the record keeps one row per slot).
 * - `tally`, `island`: the sender's day (`date`);
 * - a cosmetic `pref` (`locale`, `villagerName`, `villager`, `goalWeight`, `goalBodyFat`, `kcalGoal`): its subject and
 *   key;
 * - a goal `pref` (`moveGoal`, `stepsGoal`): its subject, key and the Tokyo day it was made (`at`), so the goal in
 *   force on each past day stays (a goal applies from the day it's made; the last of a day is the one that counts);
 * - a `decor` op: its scope and item id (`decorAccept` / `tentAccept` decide whether it replaces);
 * - a `board` op: its post's id (`boardAccept` decides whether it replaces);
 * - a `food` op: its entry's id, a `food_repeat` op its repeat's, a `food_recipe` op its recipe's (`foodAccept` decides
 *   whether it replaces).
 * A pref the model would ignore takes no slot, so it never replaces one it takes. `subject`: `eventSubject`.
 */
export function eventSlot(type: EventType | string, sender: Who, subject: Who, d: Rec, at: number): string | null {
  switch (type) {
    case 'tally':
    case 'island':
      return typeof d.date === 'string' ? `${type}|${sender}|${d.date}` : null;
    case 'decor':
      return typeof d.id === 'string' ? `decor|${typeof d.sc === 'string' ? d.sc : ''}|${d.id}` : null;
    case 'board':
      return typeof d.id === 'string' ? `board|${d.id}` : null;
    case 'food':
      return typeof d.id === 'string' ? `food|${d.id}` : null;
    case 'food_repeat':
    case 'food_recipe':
      return typeof d.id === 'string' ? `${type}|${d.id}` : null;
    case 'pref':
      if (!prefTaken(d.key, d.value)) return null;
      return (LATEST_PREFS as readonly unknown[]).includes(d.key) ? `pref|${subject}|${d.key}` : `pref|${subject}|${d.key}|${localDateAt(at)}`;
    default:
      return null;
  }
}
