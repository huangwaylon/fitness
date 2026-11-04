// The guest (docs/design.md "The guest", docs/backend.md#the-guest): a third key, KEY_C, for a visitor who plays on the
// island and in the tent, sees the members' activity and ベル, but never earns or spends and never sees their bodies
// (weight, body fat, BMI, lean mass and their goals). These are the record's rules for that key, shared by the record
// (relay/src/store.ts: what it accepts from the guest and what its snapshot leaves out) and the demo (`?demo&as=G`
// shows what the guest's phone would get). Pure.
import { isActivityMetric, isRec, type EventRow, type SnapshotRows } from './api.ts';
import { scopeMayWrite } from './layout.ts';
import { goalKeysOf } from './goals.ts';

/** The guest's own prefs: cosmetic, and its meal log's daily goals (kcal and the nutrients; never another goal,
 *  never another person's). */
const GUEST_PREF_KEYS: readonly unknown[] = ['locale', 'villagerName', 'villager', ...goalKeysOf('food')];

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
    case 'board':
    case 'food':
    case 'food_repeat':
    case 'food_recipe':
    case 'food_custom':
    case 'sell':
    case 'buy':
      // its catches; a note on the board (its own to edit and remove: the record checks, contract/board.ts); its
      // meals, repeats, recipes and custom foods (only its own: contract/food.ts); its own pocket's sells and its own かいがら's buys
      // (contract/shop.ts: never ベル)
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

/** Whether an event row reaches the guest: all but the からだ goals; every meal,
 *  everyone's, does. */
function guestSeesEvent(r: EventRow): boolean {
  if (r[3] !== 'pref') return true;
  let d: unknown;
  try {
    d = JSON.parse(r[4] || '{}');
  } catch {
    return false;
  }
  return isRec(d) && !BODY_GOAL_KEYS.includes(d.key);
}

/**
 * The rows the guest's phone gets: the activity metrics (steps, Move, Exercise, Stand: the trees, today's ベル, きろく)
 * and every event but the からだ goals. Never a からだ row: weight, body fat, BMI, lean mass.
 */
export function guestRows(rows: SnapshotRows): SnapshotRows {
  return { metrics: rows.metrics.filter((r) => isActivityMetric(r[3])), events: rows.events.filter(guestSeesEvent) };
}
