// The rules as data (PROPOSAL §3, ADRs 0008, 0009, 0011, 0014).
//
// Everything is computed on read from the raw rows, so a value here applies to every week that uses it, paid or not.
// To change what a week pays, never edit a version (or a season's targets) whose weeks have paid: append a RULES
// version (or a SEASONS entry) with a later `from`. rules.test.ts pins the paid versions.
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
  /** Weekly badges (+`bells` each) and the ふたりボーナス (`duo`, both people with all four). */
  badges: { activeDays: number; stepDays: number; strengthDays: number; ticks: number; bells: number; duo: number };
  /** @deprecated Old yen economy (ADR 0008), read only by the old view fields; removed once the UI has moved over. */
  money: { yenPerFruit: number; teamYenPerFruit: number; purseYen: number; purseMinScore: number };
  /** @deprecated Old fruit points (score /100). */
  points: { peachActive: number; peachRest: number; coconut: number; apple: number; pear: number };
}

export const RULES: readonly RuleVersion[] = [
  {
    // The economy starts in the week of Mon 2026-10-26 (ADR 0019 §7): the current week already earns.
    from: '2026-10-26',
    goals: { activeMin: 45, steps: 8000 },
    bells: { perMinute: 5, stepDay: 200, strengthDay: 400, perTick: 100 },
    badges: { activeDays: 5, stepDays: 4, strengthDays: 3, ticks: 15, bells: 500, duo: 1000 },
    money: { yenPerFruit: 50, teamYenPerFruit: 20, purseYen: 1000, purseMinScore: 60 },
    points: { peachActive: 30, peachRest: 5, coconut: 25, apple: 15, pear: 25 }
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
    // Sweets are deliberately dear (wedding goal, user 2026-10-30): on target the pair earns ~2,900 おやつ ベル a week.
    { id: 'snack', bells: 1500, label: { ja: 'おやつ', en: 'Snack' } },
    { id: 'ice', bells: 2000, label: { ja: 'アイス', en: 'Ice cream' } },
    { id: 'cafe', bells: 2000, label: { ja: 'カフェデート', en: 'Café date' } },
    { id: 'dessert', bells: 3000, label: { ja: 'デザート・パフェ', en: 'Dessert' } },
    { id: 'dinner', bells: 5000, label: { ja: '外ごはん', en: 'Dinner out' } }
  ],
  trip: [
    // Priced so a year on target (~600,000 旅 ベル) pays 2 × abroad + 6 × weekend + 1–2 × onsen (user 2026-10-30).
    { id: 'daytrip', bells: 12000, label: { ja: '日帰り', en: 'Day trip' } },
    { id: 'weekend', bells: 35000, label: { ja: '週末旅行', en: 'Weekend trip' } },
    { id: 'onsen', bells: 45000, label: { ja: '温泉', en: 'Onsen' } },
    { id: 'abroad', bells: 160000, label: { ja: '海外旅行', en: 'Travel abroad' } }
  ]
};

/** Money rules that price no week: the both-OK threshold applies when a spend is made; payday is a calendar cue. */
export const MONEY = { purseNeedsBothAtYen: 5000, paydayDayOfMonth: 25 } as const;

export const STRENGTH = {
  autoTypes: ['Traditional Strength Training', 'Functional Strength Training', 'Pilates'],
  askTypes: ['Core Training', 'High Intensity Interval Training', 'Yoga', 'Mixed Cardio', 'Cross Training'],
  minWorkoutMin: 15,
  minVisitMin: 30,
  /** Confirmed (non-auto) gym visits paid per week. */
  maxConfirmedVisitsPerWeek: 2
} as const;

/** Daily active-minute cap: min(maxMin, max(minMin, ½ × weekly target)) (ADR 0002 round 2). */
export const PEACH_DAILY_CAP = { minMin: 60, maxMin: 90 } as const;

/**
 * No Watch? Steps above the step goal count as active minutes at a moderate pace (round 4 review W1).
 * A day's minutes = max(Watch exercise minutes, (steps − stepGoal) / stepsPerMin), so nothing counts twice.
 */
export const STEP_MINUTES = { stepsPerMin: 100 } as const;

/** Rest day: a day with Health data, no strength day, no workout ≥ longWorkoutMin, none ≥ hardWorkoutMin at ≥ hardHrFraction of 220 − age. */
export const REST = { hardWorkoutMin: 20, hardHrFraction: 0.77, longWorkoutMin: 45 } as const;

/** Tokyo tsuyu: ≥ 30 active minutes also counts as a step day. */
export const TSUYU = { from: '06-01', to: '07-20', exerciseMin: 30 } as const;

/** 正月: Pear not scored; easy weeks use targets × factor (ADR 0011). */
export const HOLIDAY = { pearOff: { from: '12-29', to: '01-03' }, easy: { from: '12-25', to: '01-01', factor: 0.7 } } as const;

export const PEOPLE: Record<PersonId, { age: number; villager: string }> = {
  A: { age: 29, villager: 'ウェイ' },
  B: { age: 26, villager: 'うめ' }
};

export interface Season {
  key: 's1' | 's2' | 's3' | 's4';
  from: string; // inclusive LocalDate
  targets: Record<PersonId, PersonTargets>;
}

// The habits per person (🍐). The other targets only feed the old score /100 (removed with the old view fields).
export const SEASONS: Season[] = [
  {
    key: 's1',
    from: '2026-11-01',
    targets: {
      A: { activeMinPerWeek: 135, strengthDaysPerWeek: 2, stepGoal: 7500, stepDaysPerWeek: 4, habits: ['protein_each_meal', 'no_sweets', 'veg_two_meals'], pearTicksPerWeek: 15 },
      B: { activeMinPerWeek: 85, strengthDaysPerWeek: 2, stepGoal: 6250, stepDaysPerWeek: 4, habits: ['protein_each_meal', 'no_sweets', 'veg_two_meals'], pearTicksPerWeek: 15 }
    }
  }
];


/** Trip ladder for the Jar (editable). Labels in i18n as `rung.<key>`. */
export const RUNGS = [
  { key: 'onsen_day', yen: 30000 },
  { key: 'hakone', yen: 80000 },
  { key: 'okinawa', yen: 150000 },
  { key: 'taiwan', yen: 300000 },
  { key: 'hawaii', yen: 500000 },
  { key: 'europe', yen: 700000 }
] as const;

/** A week's two payout cutoffs (JST): Sunday 19:30 (harvest opens, first payout) and the Wednesday 04:00 after (lock, top-up). */
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
  spendMaxYen: 1_000_000,
  /** A spend or a menu price: a positive integer up to this. */
  bellsMax: 10_000_000,
  /** Items per menu (`pref` treatMenu / tripMenu); a longer list is ignored. */
  menuMaxItems: 30,
  /** A menu item id / a spend's `item`: word characters and dashes. */
  menuIdMaxChars: 40,
  villagerNameMaxChars: 20
} as const;
