// The rules as data (ADR 0019 and its 2026-10-30 amendment; strength and tsuyu from ADRs 0009, 0011, 0017).
//
// Everything is computed on read from the raw rows, so a value here applies to every week that uses it. To change
// what a week earns, never edit a version (or a HABITS entry) whose weeks have earned: append a RULES version (or a
// HABITS entry) with a later `from`. rules.test.ts pins the versions in use.
import type { FruitKey, PersonId, PersonTargets, PotKey, WeekKey } from '#lib/types.ts';

/** The four fruit categories, in display order. */
export const FRUITS = ['peach', 'coconut', 'apple', 'pear'] as const satisfies readonly FruitKey[];

/** What a week earns (ADR 0019). The model picks the version by week (`rulesFor`). */
export interface RuleVersion {
  /** First week (a Monday WeekKey) it applies to. Versions are in ascending `from`; weeks before the first use it. */
  from: WeekKey;
  /** The same daily goals for both people. */
  goals: { activeMin: number; steps: number };
  /** ベル per day: per counted minute (up to goals.activeMin), on a step-goal day, on a strength day, per habit tick. */
  bells: { perMinute: number; stepDay: number; strengthDay: number; perTick: number };
  /** Weekly badges (+`bells` each) and the ふたりボーナス (+`duoPerBadge` for each badge both people met). */
  badges: { activeDays: number; stepDays: number; strengthDays: number; ticks: number; bells: number; duoPerBadge: number };
}

export const RULES: readonly RuleVersion[] = [
  {
    // The economy starts in the week of Mon 2026-10-26 (ADR 0019 §7): the current week already earns.
    from: '2026-10-26',
    goals: { activeMin: 45, steps: 8000 },
    bells: { perMinute: 5, stepDay: 200, strengthDay: 400, perTick: 100 },
    badges: { activeDays: 5, stepDays: 4, strengthDays: 3, ticks: 15, bells: 500, duoPerBadge: 250 }
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

export const STRENGTH = {
  autoTypes: ['Traditional Strength Training', 'Functional Strength Training', 'Pilates'],
  askTypes: ['Core Training', 'High Intensity Interval Training', 'Yoga', 'Mixed Cardio', 'Cross Training'],
  minWorkoutMin: 15,
  minVisitMin: 30,
  /** Confirmed (non-auto) gym visits paid per week. */
  maxConfirmedVisitsPerWeek: 3
} as const;

/**
 * No Watch? Steps above the step goal count as active minutes at a moderate pace (round 4 review W1).
 * A day's minutes = max(Watch exercise minutes, (steps − stepGoal) / stepsPerMin), so nothing counts twice.
 */
export const STEP_MINUTES = { stepsPerMin: 100 } as const;

/** Tokyo tsuyu: ≥ 30 active minutes also counts as a step day. */
export const TSUYU = { from: '06-01', to: '07-20', exerciseMin: 30 } as const;

/** 正月: Dec 29–Jan 3 earn no 🍐, and the 🍐 badge is prorated to the other days of the week. */
export const HOLIDAY = { pearOff: { from: '12-29', to: '01-03' } } as const;

/** The default villager names (until changed in しまフォン → 村人). */
export const PEOPLE: Record<PersonId, { villager: string }> = {
  A: { villager: 'ウェイ' },
  B: { villager: 'うめ' }
};

/** A habits version: from week `from` (a Monday WeekKey) on, each person's three 🍐 habits. */
export interface HabitsVersion {
  from: WeekKey;
  people: Record<PersonId, PersonTargets>;
}

/**
 * The eating habits (🍐), versioned by week like RULES: ascending `from`; weeks before the first use it. Labels in
 * the i18n catalogs (`habit.<key>`). Both people share the same three since the 2026-10-30 amendment.
 */
export const HABITS: readonly HabitsVersion[] = [
  {
    from: '2026-10-26',
    people: {
      A: { habits: ['protein_each_meal', 'no_sweets', 'veg_two_meals'] },
      B: { habits: ['protein_each_meal', 'no_sweets', 'veg_two_meals'] }
    }
  }
];

/**
 * A week's two times (JST): Sunday 19:30 (the harvest opens and the weekly bonus lands) and the Wednesday 04:00
 * after (the week locks: its earnings are final).
 */
export const CUTOFFS = {
  provisional: { hour: 19, minute: 30 },
  final: { hour: 4, minute: 0 }
} as const;

/** Per-day caps of the counted amounts (scoring and きろく). */
export const DAILY = {
  /** 🍐 Pear: distinct habit ticks counted per day. */
  maxTicks: 3,
  /** きろく stamps: a day counts as active (●) from this many counted minutes, or on a step-goal day. */
  activeDayMin: 20
} as const;

/** Read-time checks on event rows: an event outside them is ignored (the server would have refused it). */
export const LIMITS = {
  /** A check-in without `edit` may fill in today and the two days before (the 48 h window). */
  checkinBackDays: 2,
  /** Shortcuts sometimes fire twice: a repeat of the same presence event this close is dropped. */
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
