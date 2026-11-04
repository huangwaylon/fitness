// Every goal the app keeps (docs/design.md "Goals in place", docs/decisions.md "Goal directions"): one entry per metric
// charted in けんこう or ごはん's グラフ, the single source for its `pref` key, which way it points (at least / at most /
// near a value), the range and grid the record takes, how its history is kept, who sees it and its default. The
// record (model/record.ts, relay/src/store.ts), the model (model/state.ts), the guest's rules (contract/guest.ts) and
// the screens' editors (components/health/goals.ts) all read it. Pure, relative imports only (the relay imports it).

/**
 * Which way a goal points: `atLeast` (a floor: steps, protein; met at or over it), `atMost` (a ceiling: salt, body fat;
 * met at or under it) or `target` (a value to stay near, either side a miss: kcal, weight; met within `band`).
 */
export type GoalDir = 'atLeast' | 'atMost' | 'target';
export const GOAL_DIRS = ['atLeast', 'atMost', 'target'] as const satisfies readonly GoalDir[];

/** Where a goal's chart is: けんこう's かつどう or からだ, or ごはん's グラフ. */
export type GoalGroup = 'activity' | 'body' | 'food';

/** Every goal, in the screens' order: かつどう, からだ, then ごはん (kcal and the nutrients: a snapshot's keys). */
export const GOAL_IDS = ['steps', 'move', 'exercise', 'stand', 'weight', 'body_fat_pct', 'bmi', 'lean_kg', 'k', 'p', 'fa', 'c', 's'] as const;
export type GoalId = (typeof GOAL_IDS)[number];

export interface GoalDef {
  group: GoalGroup;
  /** The `pref` it is stored as, per person. */
  key: string;
  dir: GoalDir;
  /** What the record takes (inclusive), on a grid of `step` (1: whole numbers, 0.1: one decimal). */
  min: number;
  max: number;
  step: number;
  /**
   * `daily`: applies from the Tokyo day it is set, each past day keeping the one in force then (the record keeps one
   * per day: the ベル of a past day never re-price); `latest`: one per person, the latest set (shown only).
   */
  history: 'daily' | 'latest';
  /** May be cleared (`value: null`): a `latest` goal is optional; a `daily` one always has a value (its default). */
  clearable: boolean;
  /** The goal until one is set (a member's own: the Move goal), or null: none. ごはん's protein has a computed one
   *  (model/food.ts proteinDefault). */
  fallback: number | Readonly<Record<'A' | 'B', number>> | null;
  /** `target` only: met within ± this share of the goal (0.1: 2,000 kcal ± 200). */
  band?: number;
  /** Whether the ベル read it (the stamp card: steps and Move). Exercise and Stand earn on config/rules.ts RULES.goals' fixed values
   *  whatever is set here (their goal is けんこう's line only). */
  earns?: boolean;
}

/**
 * The registry. Directions (docs/decisions.md "Goal directions" says why each):
 * - かつどう: all four at least (more movement is the point); steps and Move are the ベル's.
 * - からだ: 体重 and BMI near a value (a cut and a bulk both aim at a number: neither side of it is "good", and a lower
 *   weight is never rewarded: *Weight never earns*); 体脂肪率 at most; 除脂肪体重 (muscle) at least.
 * - ごはん: kcal near a value (±10 %: a low day is no win, the lifter's surplus no fault); protein at least; fat at most;
 *   carbs near a value (±15 %: fuel for training, less on a cut); salt at most.
 */
const DEFS = {
  steps: { group: 'activity', key: 'stepsGoal', dir: 'atLeast', min: 1000, max: 30000, step: 500, history: 'daily', clearable: false, fallback: 8000, earns: true },
  move: { group: 'activity', key: 'moveGoal', dir: 'atLeast', min: 100, max: 2000, step: 1, history: 'daily', clearable: false, fallback: { A: 600, B: 400 }, earns: true },
  exercise: { group: 'activity', key: 'exerciseGoal', dir: 'atLeast', min: 5, max: 300, step: 5, history: 'daily', clearable: false, fallback: 60 },
  stand: { group: 'activity', key: 'standGoal', dir: 'atLeast', min: 10, max: 600, step: 10, history: 'daily', clearable: false, fallback: 120 },
  weight: { group: 'body', key: 'goalWeight', dir: 'target', min: 20, max: 300, step: 0.1, history: 'latest', clearable: true, fallback: null, band: 0.015 },
  body_fat_pct: { group: 'body', key: 'goalBodyFat', dir: 'atMost', min: 3, max: 60, step: 0.1, history: 'latest', clearable: true, fallback: null },
  bmi: { group: 'body', key: 'goalBmi', dir: 'target', min: 15, max: 40, step: 0.1, history: 'latest', clearable: true, fallback: null, band: 0.04 },
  lean_kg: { group: 'body', key: 'goalLean', dir: 'atLeast', min: 10, max: 150, step: 0.1, history: 'latest', clearable: true, fallback: null },
  k: { group: 'food', key: 'kcalGoal', dir: 'target', min: 1000, max: 5000, step: 50, history: 'latest', clearable: true, fallback: null, band: 0.1 },
  p: { group: 'food', key: 'proteinGoal', dir: 'atLeast', min: 10, max: 400, step: 5, history: 'latest', clearable: true, fallback: null },
  fa: { group: 'food', key: 'fatGoal', dir: 'atMost', min: 10, max: 300, step: 5, history: 'latest', clearable: true, fallback: null },
  c: { group: 'food', key: 'carbsGoal', dir: 'target', min: 20, max: 800, step: 5, history: 'latest', clearable: true, fallback: null, band: 0.15 },
  s: { group: 'food', key: 'saltGoal', dir: 'atMost', min: 1, max: 20, step: 0.5, history: 'latest', clearable: true, fallback: null }
} as const satisfies Record<GoalId, GoalDef>;
export const GOALS: Readonly<Record<GoalId, GoalDef>> = DEFS;
/** A goal's `pref` key; `LatestGoalKey` those kept as the latest only (model/state.ts Prefs). */
export type GoalKey = (typeof DEFS)[GoalId]['key'];
export type LatestGoalKey = { [K in GoalId]: (typeof DEFS)[K]['history'] extends 'latest' ? (typeof DEFS)[K]['key'] : never }[GoalId];

/** Every goal's `pref` key. */
export const GOAL_KEYS = GOAL_IDS.map((id) => DEFS[id].key) as readonly GoalKey[];
/** The goals a day keeps (history `daily`: one per person per Tokyo day; けんこう's かつどう). */
export type DailyGoalId = 'steps' | 'move' | 'exercise' | 'stand';

/** The goal a `pref` key sets, or null. */
export const goalOfKey = (key: unknown): GoalId | null => GOAL_IDS.find((id) => GOALS[id].key === key) ?? null;
/** The keys of one group's goals (the guest never gets the からだ ones; its own are ごはん's). */
export const goalKeysOf = (g: GoalGroup): GoalKey[] => GOAL_IDS.filter((id) => GOALS[id].group === g).map((id) => DEFS[id].key);

/** A goal the record takes: a finite number within its range, on its grid. */
export function isGoalValue(id: GoalId, v: unknown): v is number {
  const g = GOALS[id];
  if (typeof v !== 'number' || !Number.isFinite(v) || v < g.min || v > g.max) return false;
  const k = v / g.step;
  return Math.abs(k - Math.round(k)) < 1e-6;
}

/** What a `pref` of the goal may carry: a goal, or (a clearable one) null / '' to clear it. */
export const goalPrefTaken = (id: GoalId, v: unknown): boolean => (GOALS[id].clearable && (v === null || v === '')) || isGoalValue(id, v);

/** The goal until one is set, for `person` (null: none). */
export function goalFallback(id: GoalId, person: 'A' | 'B' | 'G'): number | null {
  const f = GOALS[id].fallback;
  if (f === null || typeof f === 'number') return f;
  return person === 'G' ? null : f[person];
}

/** Whether `v` meets `goal` the goal's way: at least (a whole Stand minute counts: the stamp card's rule), at most,
 *  or within its band. */
export function goalMet(id: GoalId, v: number, goal: number): boolean {
  const g = GOALS[id];
  if (g.dir === 'atLeast') return (id === 'stand' ? Math.floor(v) : v) >= goal;
  if (g.dir === 'atMost') return v <= goal;
  return Math.abs(v - goal) <= goal * (g.band ?? 0) + 1e-9;
}
