// The rules as data (ADR 0019 and its amendments; what earns from ADR 0021; tsuyu from ADRs 0011, 0017).
//
// Everything is computed on read from the raw rows, so a value here applies to every week that uses it. To change
// what a week earns, never edit a version whose weeks have earned: append a RULES version with a later `from`.
// rules.test.ts pins the versions in use.
import type { PersonId, RingFruit, WeekKey } from '#lib/types.ts';

/** The four ring fruits (ADR 0021), in display order: Exercise, Move, Stand, steps. */
export const RING_FRUITS = ['peach', 'pear', 'cherry', 'apple'] as const satisfies readonly RingFruit[];

/** What a week earns (ADR 0019). The model picks the version by week (`rulesFor`). */
export interface RuleVersion {
  /** First week (a Monday WeekKey) it applies to. Versions are in ascending `from`; weeks before the first use it. */
  from: WeekKey;
  /**
   * The same daily goals for both people (the Move goal is per person: `pref` moveGoal, PEOPLE[p].moveGoal).
   * ADR 0021: exerciseMin (🍑), standMin (🍒), steps (🍎).
   */
  goals: { exerciseMin: number; standMin: number; steps: number };
  /**
   * ベル per day (ADR 0021): perExerciseMin per counted minute up to goals.exerciseMin (🍑); moveAtGoal at the Move
   * goal, proportional below it (🍐); perStandMin per stand minute up to goals.standMin (🍒); stepDay (🍎).
   */
  bells: { perExerciseMin: number; moveAtGoal: number; perStandMin: number; stepDay: number };
  /**
   * Weekly badges (+`bells` each) and the ふたりボーナス (+`duoPerBadge` for each badge both people met). ADR 0021
   * thresholds: exerciseDays, moveDays, standDays, stepDays.
   */
  badges: { exerciseDays: number; moveDays: number; standDays: number; stepDays: number; bells: number; duoPerBadge: number };
  /**
   * The milestone curve (v2, ADR 0021 amendment "v2 milestone curve"). Without it (v1) 🍑🍐🍒 pay linearly and 🍎 all
   * or nothing, as `bells` says. With it 🍑🍐🍒🍎 pay in steps: reaching `at[i]` of the day's goal pays
   * round(max × pay[i] / pay[last]) ベル, max being the fruit's ベル at the goal (as `bells` gives it); below at[0] 0,
   * above the goal the max. `pay` is shares in whole numbers (no arithmetic here, so the Apps Script bundle can still
   * drop RULES); `bells[f]` replaces a fruit's computed steps exactly. `at` ascends to 1, `pay` ascends.
   */
  curve?: { at: readonly number[]; pay: readonly number[]; bells?: Partial<Record<RingFruit, readonly number[]>> };
}

/**
 * First week that earns ベル (ADR 0019 §7), RULES[0].from. A literal, not `RULES[0].from`, so the Apps Script bundle
 * (which imports LIMITS from here) tree-shakes RULES away and a new rule version never changes Code.js.
 */
export const ECONOMY_START: WeekKey = '2026-10-26';

export const RULES: readonly RuleVersion[] = [
  {
    // The economy starts in the week of Mon 2026-10-26 (ADR 0019 §7): the current week already earns. What earns is
    // ADR 0021 (edited in place on 2026-10-30, and again on 2026-10-31 when the gym 🥥 went: the economy is play
    // money, so this week simply loses its gym ベル; see rules.test.ts). On target (every badge for both, minimum
    // days) a person earns 5 × 180 🍑 + 5 × 180 🍐 + 5 × 180 🍒 + 4 × 200 🍎 = 3,500 daily + 4 × 400 badges = 5,100;
    // both + 4 × 200 ふたりボーナス = 11,000 ベル a week (design.md §E).
    from: ECONOMY_START,
    goals: { exerciseMin: 60, standMin: 180, steps: 8000 },
    bells: { perExerciseMin: 3, moveAtGoal: 180, perStandMin: 1, stepDay: 200 },
    badges: { exerciseDays: 5, moveDays: 5, standDays: 5, stepDays: 4, bells: 400, duoPerBadge: 200 }
  },
  {
    // v2 "push exercise" (user, 2026-10-30; ADR 0021 amendments, round-19 goals review), rebalanced on 2026-10-31
    // without the gym ("keep ~14,400, boost Exercise"): Exercise stays at 60 min but pays 7 a minute (420, the biggest
    // daily earner by far: the gym's share moved here), Stand 120 min (1 a minute). On target a person earns
    // 5 × 420 🍑 + 5 × 180 🍐 + 5 × 120 🍒 + 4 × 200 🍎 = 4,400 daily + 4 × 450 badges = 6,200; both
    // + 4 × 500 ふたりボーナス = 14,400 ベル a week, as before, so the menu prices still fit (design.md §E).
    from: '2026-11-02',
    goals: { exerciseMin: 60, standMin: 120, steps: 8000 },
    bells: { perExerciseMin: 7, moveAtGoal: 180, perStandMin: 1, stepDay: 200 },
    badges: { exerciseDays: 5, moveDays: 5, standDays: 5, stepDays: 4, bells: 450, duoPerBadge: 500 },
    // The milestone curve (user, 2026-10-30): 25 / 50 / 75 / 100% of the goal pay the shares 25 / 70 / 130 / 240 of a
    // fruit's max, each step more than the last and the biggest at the goal. 🍐 and 🍒 take the shares (19 / 53 / 98 /
    // 180 and 13 / 35 / 65 / 120); 🍑 pays the shares of 420 rounded to 5s, 45 / 120 / 230 / 420 (15 / 30 / 45 / 60
    // min; exact: 43.75 / 122.5 / 227.5); 🍎 the user-approved 20 / 60 / 110 / 200 (the shares would give 21 / 58 /
    // 108). The maxima are the fruits' ベル at the goal, so the on-target week is 14,400.
    curve: { at: [0.25, 0.5, 0.75, 1], pay: [25, 70, 130, 240], bells: { peach: [45, 120, 230, 420], apple: [20, 60, 110, 200] } }
  }
];

/** The rule version of a week: the latest with `from` ≤ the week, or the first before any applies. */
export function rulesFor(weekKey: WeekKey): RuleVersion {
  for (let i = RULES.length - 1; i > 0; i--) if (RULES[i].from <= weekKey) return RULES[i];
  return RULES[0];
}

/** A default menu entry; the label follows the viewer's language until the menu is edited (then it is the typed label). */
interface DefaultMenuItem { id: string; bells: number; label: { ja: string; en: string } }

/**
 * The shared menu before anyone edits it (ADR 0022, one list, five grouped items; lead 2026-10-30). Priced against
 * the on-target week of 14,400 ベル for both (design.md §E): 2–3 おやつ (≈ 3,000) + a café date (2,500) + eating out
 * every two weeks (3,000) ≈ 8,500 a week, leaving ≈ 5,900 to save: a ほしいもの in ~1.5 weeks or a 旅のごほうび in ~2.
 */
export const DEFAULT_MENU: readonly DefaultMenuItem[] = [
  { id: 'snack', bells: 1200, label: { ja: 'おやつ', en: 'Snack' } },
  { id: 'cafe', bells: 2500, label: { ja: 'カフェ・デザート', en: 'Café & dessert' } },
  { id: 'dinner', bells: 6000, label: { ja: '外ごはん', en: 'Eating out' } },
  { id: 'want', bells: 8000, label: { ja: 'ほしいもの', en: 'Something we want' } },
  { id: 'trip', bells: 12000, label: { ja: '旅のごほうび', en: 'Trip treat' } }
];

/**
 * Escalating food treats (ADR 0022 amendment "escalating food treats", user 2026-10-30): the menu item ids whose price
 * rises with each repeat in the same Tokyo week (Mon 00:00 to Sun 24:00 JST, the economy's week key), by either person.
 * Keyed by id, so a renamed or repriced item keeps escalating; every other item (ほしいもの, 旅のごほうび, anything
 * added) stays flat.
 */
export const ESCALATING_ITEMS: readonly string[] = ['snack', 'cafe', 'dinner'];

/**
 * How an escalating item's price rises (model/bells.ts `treatPrice`): base × (num/den)^n, n = the earlier accepted,
 * not voided buys of that id this week; for n ≥ 1 rounded to the nearest `roundTo` ベル, an exact half rounding DOWN
 * (2,500 × 1.5² = 5,625 → 5,600), and never below the base. n = 0 is the base exactly.
 * `enforceFrom`: a spend stamped from then on whose `bells` isn't the price at its place in server order is ignored on
 * read; earlier spends keep the old rule (any price is accepted) but still count towards n. Set just after this rule
 * shipped, so no buy made before it is dropped.
 */
export const ESCALATION = { num: 3, den: 2, roundTo: 50, enforceFrom: '2026-10-31T00:00:00+09:00' } as const;

/** Tokyo tsuyu: ≥ 30 counted exercise minutes also counts as a step day. */
export const TSUYU = { from: '06-01', to: '07-20', exerciseMin: 30 } as const;

/**
 * The default villager names (until changed in しまフォン → 村人) and Move goals in kcal (until set with `pref`
 * moveGoal, ADR 0021 §5).
 */
export const PEOPLE: Record<PersonId, { villager: string; moveGoal: number }> = {
  A: { villager: 'ウェイ', moveGoal: 600 },
  B: { villager: 'うめ', moveGoal: 400 }
};

/** A `pref` moveGoal: an integer kcal in this range (inclusive); anything else is ignored (the previous goal stays). */
export const MOVE_GOAL = { min: 100, max: 2000 } as const;

/**
 * A week's two times (JST): Sunday 19:30 (the harvest opens and the weekly bonus lands) and the Wednesday 04:00
 * after (the week locks: its earnings are final).
 */
export const CUTOFFS = {
  provisional: { hour: 19, minute: 30 },
  final: { hour: 4, minute: 0 }
} as const;

/** Read-time checks on event rows: an event outside them is ignored (the server would have refused it). */
export const LIMITS = {
  spendLabelMaxChars: 60,
  /** A spend or a menu price: a positive integer up to this. */
  bellsMax: 10_000_000,
  /** Items in the menu (`pref` menu, both sections); a longer list is ignored. */
  menuMaxItems: 30,
  /** A menu item id / a spend's `item`: word characters and dashes. */
  menuIdMaxChars: 40,
  villagerNameMaxChars: 20
} as const;

/**
 * Body-weight trend (ADR 0020). Shown only: weight never earns ベル and nothing in the economy reads it.
 * - `alpha`: the trend is an exponentially weighted moving average of the daily weigh-ins (as in The Hacker's Diet,
 *   Libra or Happy Scale): each day moves the trend 10% of the way to that day's weight. A gap of g days weighs the
 *   next weigh-in 1 − 0.9^g, so a skipped week doesn't make one reading count like one day.
 * - `rateDays`: the weekly pace is the trend's average change over the last 28 days (at least `minRateDays` of data).
 * - `projectMaxWeeks`: a goal date further out than this isn't shown.
 * - `chartWeeks`: きろく's chart shows the last 12 weeks.
 */
export const WEIGHT = { alpha: 0.1, rateDays: 28, minRateDays: 14, minPacePerWeek: 0.05, projectMaxWeeks: 156, chartWeeks: 12 } as const;
