// The rules as data: what earns, the two rewards, the cutoffs and the read-time limits. Everything is computed on read
// from the raw rows, so a value here applies to every week (docs/design.md#economy).
import type { PersonId, RingFruit } from '#lib/types.ts';

/** The four ring fruits in display order, Apple's rings first: 🍐 Move, 🍑 Exercise, 🍒 Stand, then 🍎 steps. Every
 *  list of fruits (the tree, きろく) follows this, except けんこう and the tree's popup (steps first). */
export const RING_FRUITS = ['pear', 'peach', 'cherry', 'apple'] as const satisfies readonly RingFruit[];
/** The order the four goals are shown in everywhere (the tree's popup, けんこう, the ledger, the guide): 🍎 steps first. */
export const GOALS_SHOWN = ['apple', 'pear', 'peach', 'cherry'] as const satisfies readonly RingFruit[];

/**
 * The stamp card. Per person per Tokyo day, all or nothing per goal: +`perGoal` ベル for each daily goal met (🍐 the
 * person's Move goal, `moveGoalOn`; 🍑 exerciseMin; 🍒 standMin; 🍎 the person's steps goal, `stepsGoalOn`: their
 * ranges and defaults are contract/goals.ts GOALS'; the Exercise and Stand goals set in けんこう never change these), so at most
 * 4 a day. ふたりでぜんぶ:
 * +`together` shared when both people meet all four goals on the same day.
 */
export const RULES = {
  goals: { exerciseMin: 60, standMin: 120 },
  perGoal: 1,
  together: 2
} as const;

/**
 * がんばり (the stretch bonus). Per person per Tokyo day: +`perGoal` more for each goal reached at `multiplier` × its
 * target (🍐 1.5 × the Move goal in force that day; 🍑 90 min; 🍒 180 min; 🍎 1.5 × the steps goal in force that day,
 * 12,000 for 8,000), at most `cap` ベル a day
 * (the first fruits in RING_FRUITS order take them). So a person earns 0–4 + 0–2 a day; ふたりでぜんぶ ignores it.
 */
export const STRETCH = { multiplier: 1.5, perGoal: 1, cap: 2 } as const;

/** A goal's stretch target: 1.5 × the goal (60 → 90 min, 8,000 → 12,000 steps, 600 → 900 kcal). */
export const stretchOf = (goal: number): number => goal * STRETCH.multiplier;

/**
 * The default villager names (until changed in むらびと) and birthdays ('MM-DD', Tokyo; null turns the island's birthday off for that person: docs/design.md "Birthdays").
 */
export const PEOPLE: Record<PersonId, { villager: string; birthday: string | null }> = {
  A: { villager: 'ウェイ', birthday: '10-06' },
  B: { villager: 'うめ', birthday: '03-04' }
};

/** The guest (docs/design.md "The guest"): the name its villager has until it picks one (its look: villagers/look.ts). */
export const GUEST = { villager: 'おきゃくさん' } as const;

/**
 * A week's two times (JST): Sunday 19:30 (the harvest recap opens) and the Wednesday 04:00 after (the week locks: rows
 * stamped later no longer count for it).
 */
export const CUTOFFS = {
  provisional: { hour: 19, minute: 30 },
  final: { hour: 4, minute: 0 }
} as const;

/**
 * Body weight (けんこう). Shown only: weight never earns ベル and nothing in the economy reads it.
 * - The goal month extends the period's plain weekly pace (model/weight.ts); none under `minPacePerWeek` kg a week or
 *   further out than `projectMaxWeeks`.
 */
export const WEIGHT = { minPacePerWeek: 0.05, projectMaxWeeks: 156 } as const;
