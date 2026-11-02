// The rules of the record shared by its writers (docs/backend.md#events): what an `event` must look like to be
// accepted (the Apps Script and the relay's store check the same), and which events replace an earlier one (the
// store's slots: a tally and an island day per person and day, a cosmetic pref per person, a goal per person and
// Tokyo day). Dependency-free (type imports only), since it is bundled into apps-script/Code.js.
import { isBodyFatGoal, isFind, isId, isLocalDate, isWeightKg, PREF_KEYS, type EventType } from '../contract/api.ts';
import { isTally } from '../contract/tally.ts';
import { isIslandDay } from '../contract/island.ts';
import { decorOpOf } from '../contract/decor.ts';
import { tentOpOf } from '../contract/tent.ts';
import { layoutOpOf } from '../contract/layout.ts';
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
    default:
      return true;
  }
}

/** The prefs only the latest of counts (per person); the goals keep their history (`moveGoalOn` prices past days). */
const LATEST_PREFS = ['locale', 'villagerName', 'villager', 'goalWeight', 'goalBodyFat'] as const;

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
    default: return false;
  }
}

/**
 * The slot an event fills, or null: a later event of the same slot replaces it (the record keeps one row per slot).
 * - `tally`, `island`: the sender's day (`date`);
 * - a cosmetic `pref` (`locale`, `villagerName`, `villager`, `goalWeight`, `goalBodyFat`): its subject and key;
 * - a goal `pref` (`moveGoal`, `stepsGoal`): its subject, key and the Tokyo day it was made (`at`), so the goal in
 *   force on each past day stays (a goal applies from the day it's made; the last of a day is the one that counts);
 * - a `decor` op: its scope and item id (`decorAccept` / `tentAccept` decide whether it replaces).
 * A pref the model would ignore takes no slot, so it never replaces one it takes. `subject`: `eventSubject`.
 */
export function eventSlot(type: EventType | string, sender: Who, subject: Who, d: Rec, at: number): string | null {
  switch (type) {
    case 'tally':
    case 'island':
      return typeof d.date === 'string' ? `${type}|${sender}|${d.date}` : null;
    case 'decor':
      return typeof d.id === 'string' ? `decor|${typeof d.sc === 'string' ? d.sc : ''}|${d.id}` : null;
    case 'pref':
      if (!prefTaken(d.key, d.value)) return null;
      return (LATEST_PREFS as readonly unknown[]).includes(d.key) ? `pref|${subject}|${d.key}` : `pref|${subject}|${d.key}|${localDateAt(at)}`;
    default:
      return null;
  }
}
