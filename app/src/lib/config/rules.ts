// The rules as data (ADR 0019 and its amendments; what earns from ADR 0021; tsuyu from ADRs 0011, 0017).
//
// Everything is computed on read from the raw rows, so a value here applies to every week that uses it. To change
// what a week earns, never edit a version whose weeks have earned: append a RULES version with a later `from`.
// rules.test.ts pins the versions in use.
import type { FruitKey, PersonId, PotKey, RingFruit, WeekKey } from '#lib/types.ts';

/** @deprecated ADR 0019's four fruits (🍐 = eating habits). Use RING_FRUITS. */
export const FRUITS = ['peach', 'coconut', 'apple', 'pear'] as const satisfies readonly FruitKey[];

/** The five ring fruits (ADR 0021), in display order: Exercise, Move, Stand, steps, gym. */
export const RING_FRUITS = ['peach', 'pear', 'cherry', 'apple', 'coconut'] as const satisfies readonly RingFruit[];

/** What a week earns (ADR 0019). The model picks the version by week (`rulesFor`). */
export interface RuleVersion {
  /** First week (a Monday WeekKey) it applies to. Versions are in ascending `from`; weeks before the first use it. */
  from: WeekKey;
  /**
   * The same daily goals for both people (the Move goal is per person: `pref` moveGoal, PEOPLE[p].moveGoal).
   * ADR 0021: exerciseMin (🍑), standMin (🍒), steps (🍎). `activeMin` is @deprecated (ADR 0019).
   */
  goals: { activeMin: number; steps: number; exerciseMin: number; standMin: number };
  /**
   * ベル per day (ADR 0021): perExerciseMin per counted minute up to goals.exerciseMin (🍑); moveAtGoal at the Move
   * goal, proportional below it (🍐); perStandMin per stand minute up to goals.standMin (🍒); stepDay (🍎); gymDay
   * (🥥). `perMinute`, `strengthDay`, `perTick` are @deprecated (ADR 0019).
   */
  bells: { perMinute: number; stepDay: number; strengthDay: number; perTick: number; perExerciseMin: number; moveAtGoal: number; perStandMin: number; gymDay: number };
  /**
   * Weekly badges (+`bells` each) and the ふたりボーナス (+`duoPerBadge` for each badge both people met). ADR 0021
   * thresholds: exerciseDays, moveDays, standDays, stepDays, gymDays. `activeDays`, `strengthDays`, `ticks` are
   * @deprecated (ADR 0019).
   */
  badges: {
    activeDays: number; stepDays: number; strengthDays: number; ticks: number; bells: number; duoPerBadge: number;
    exerciseDays: number; moveDays: number; standDays: number; gymDays: number;
  };
}

export const RULES: readonly RuleVersion[] = [
  {
    // The economy starts in the week of Mon 2026-10-26 (ADR 0019 §7): the current week already earns. What earns is
    // ADR 0021 (edited in place on 2026-10-30, in the economy's first week: see rules.test.ts). On target (every
    // badge for both, minimum days) a person earns 5 × 180 🍑 + 5 × 180 🍐 + 5 × 180 🍒 + 4 × 200 🍎 + 3 × 400 🥥 =
    // 4,700 daily + 5 × 400 badges = 6,700; both + 5 × 200 ふたりボーナス = 14,400 ベル a week (design.md §E).
    from: '2026-10-26',
    goals: { activeMin: 60, steps: 8000, exerciseMin: 60, standMin: 180 },
    bells: { perMinute: 3, stepDay: 200, strengthDay: 400, perTick: 0, perExerciseMin: 3, moveAtGoal: 180, perStandMin: 1, gymDay: 400 },
    badges: {
      activeDays: 5, stepDays: 4, strengthDays: 3, ticks: 0, bells: 400, duoPerBadge: 200,
      exerciseDays: 5, moveDays: 5, standDays: 5, gymDays: 3
    }
  }
];

/**
 * The two shared pots (ADR 0019 §5): every earning splits おやつ `treatPercent`% / 旅 the rest, computed on all-time
 * totals (treats = floor(total × treatPercent / 100), trips = total − treats). Not versioned by week: a change
 * re-splits everything earned so far.
 */
export const POTS = { treatPercent: 20 } as const;

/** First week that earns ベル (ADR 0019 §7). */
export const ECONOMY_START: WeekKey = RULES[0].from;

/** A default menu entry; the label follows the viewer's language until the menu is edited (then it is the typed label). */
export interface DefaultMenuItem { id: string; bells: number; label: { ja: string; en: string } }

/** The shared menus before anyone edits them (ADR 0019 §5). */
export const DEFAULT_MENUS: Record<PotKey, readonly DefaultMenuItem[]> = {
  treat: [
    // Sweets are dear but reachable (wedding goal; goals review round 12, user 2026-10-30): on target ~2,900 おやつ ベル a week.
    { id: 'snack', bells: 800, label: { ja: 'おやつ', en: 'Snack' } },
    { id: 'ice', bells: 1000, label: { ja: 'アイス', en: 'Ice cream' } },
    { id: 'cafe', bells: 2000, label: { ja: 'カフェデート', en: 'Café date' } },
    { id: 'dessert', bells: 2000, label: { ja: 'デザート・パフェ', en: 'Dessert' } },
    { id: 'dinner', bells: 5000, label: { ja: '外ごはん', en: 'Dinner out' } }
  ],
  trip: [
    // ~80% of a year on target (~600,000 旅 ベル) pays 2 × abroad + 6 × weekend + 1–2 × onsen, leaving room for off weeks (round 12).
    { id: 'daytrip', bells: 10000, label: { ja: '日帰り', en: 'Day trip' } },
    { id: 'weekend', bells: 28000, label: { ja: '週末旅行', en: 'Weekend trip' } },
    { id: 'onsen', bells: 36000, label: { ja: '温泉', en: 'Onsen' } },
    { id: 'abroad', bells: 130000, label: { ja: '海外旅行', en: 'Travel abroad' } }
  ]
};

/**
 * 🥥 strength workouts (no daily questions, 2026-10-30): these types of at least `minWorkoutMin` count; any other type
 * counts only when marked as strength in きろく (`workout_edit {strength}`), and a mark can also take one of these out.
 */
export const STRENGTH = {
  autoTypes: ['Traditional Strength Training', 'Functional Strength Training', 'Pilates'],
  minWorkoutMin: 15
} as const;

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

/** Per-day amounts of きろく. */
export const DAILY = {
  /** @deprecated ADR 0019's habit ticks per day (no economy effect since ADR 0021). */
  maxTicks: 3,
  /** きろく stamps: a day counts as active (●) from this many counted exercise minutes, or on a step-goal day. */
  activeDayMin: 20
} as const;

/** Read-time checks on event rows: an event outside them is ignored (the server would have refused it). */
export const LIMITS = {
  /** Shortcuts sometimes fire twice: a repeat arrive at the same place this close is dropped. */
  presenceDuplicateMs: 120_000,
  /** A presence `event_at` further than this from the server `at` is ignored. */
  presenceSkewMs: 48 * 3600_000,
  spendLabelMaxChars: 60,
  /** A spend or a menu price: a positive integer up to this. */
  bellsMax: 10_000_000,
  /** Items per menu (`pref` treatMenu / tripMenu); a longer list is ignored. */
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
