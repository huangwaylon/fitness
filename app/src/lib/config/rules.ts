// The rules as data: what earns, the two rewards, the cutoffs and the read-time limits. Everything is computed on read
// from the raw rows, so a value here applies to every week (docs/design.md#economy).
import type { PersonId, RingFruit, ShopItemId } from '#lib/types.ts';

/** The four ring fruits in display order, Apple's rings first: 🍐 Move, 🍑 Exercise, 🍒 Stand, then 🍎 steps. Every
 *  list of fruits (the tree, its popup, きろく, あそびかた) follows this. */
export const RING_FRUITS = ['pear', 'peach', 'cherry', 'apple'] as const satisfies readonly RingFruit[];

/**
 * The stamp card. Per person per Tokyo day, all or nothing per goal: +`perGoal` ベル for each daily goal met (🍐 the
 * person's Move goal, `moveGoalOn`; 🍑 exerciseMin; 🍒 standMin; 🍎 steps), so at most 4 a day. ふたりでぜんぶ:
 * +`together` shared when both people meet all four goals on the same day.
 */
export const RULES = {
  goals: { exerciseMin: 60, standMin: 120, steps: 8000 },
  perGoal: 1,
  together: 2
} as const;

/** The two rewards (one shared wallet): a buy must name one of these ids at exactly its price. */
export const SHOP = [
  { id: 'snack', bells: 6 },
  { id: 'dinner', bells: 20 }
] as const satisfies readonly { id: ShopItemId; bells: number }[];

/** A reward's price, or undefined for anything that isn't one. */
export const shopPrice = (id: unknown): number | undefined => SHOP.find((x) => x.id === id)?.bells;

/**
 * The default villager names (until changed in むらびと) and Move goals in kcal (until set with `pref` moveGoal).
 */
export const PEOPLE: Record<PersonId, { villager: string; moveGoal: number }> = {
  A: { villager: 'ウェイ', moveGoal: 600 },
  B: { villager: 'うめ', moveGoal: 400 }
};

/** A `pref` moveGoal: an integer kcal in this range (inclusive); anything else is ignored (the previous goal stays). */
export const MOVE_GOAL = { min: 100, max: 2000 } as const;

/**
 * A week's two times (JST): Sunday 19:30 (the harvest recap opens) and the Wednesday 04:00 after (the week locks: rows
 * stamped later no longer count for it).
 */
export const CUTOFFS = {
  provisional: { hour: 19, minute: 30 },
  final: { hour: 4, minute: 0 }
} as const;

/** Read-time checks on event rows: an event outside them is ignored (the server would have refused it). */
export const LIMITS = {
  villagerNameMaxChars: 20
} as const;

/**
 * Body-weight trend. Shown only: weight never earns ベル and nothing in the economy reads it.
 * - `alpha`: the trend is an exponentially weighted moving average of the daily weigh-ins (as in The Hacker's Diet,
 *   Libra or Happy Scale): each day moves the trend 10% of the way to that day's weight. A gap of g days weighs the
 *   next weigh-in 1 − 0.9^g, so a skipped week doesn't make one reading count like one day.
 * - `rateDays`: the weekly pace is the trend's average change over the last 28 days (at least `minRateDays` of data).
 * - `projectMaxWeeks`: a goal date further out than this isn't shown.
 * - `chartWeeks`: きろく's chart shows the last 12 weeks.
 */
export const WEIGHT = { alpha: 0.1, rateDays: 28, minRateDays: 14, minPacePerWeek: 0.05, projectMaxWeeks: 156, chartWeeks: 12 } as const;
