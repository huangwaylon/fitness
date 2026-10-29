// The rules as data (PROPOSAL §3, ADRs 0008, 0009, 0011, 0014).
//
// Everything is computed on read from the raw rows, so a value here applies to every week that uses it, paid or not.
// To change what a week pays, never edit a version (or a season's targets) whose weeks have paid: append a RULES
// version (or a SEASONS entry) with a later `from`. rules.test.ts pins the paid versions.
import type { FruitKey, PersonId, PersonTargets, WeekKey } from '#lib/types.ts';

/** The four fruit categories, in display order. */
export const FRUITS = ['peach', 'coconut', 'apple', 'pear'] as const satisfies readonly FruitKey[];

/** What a week pays and how many points each fruit is worth. The model picks the version by week (`rulesFor`). */
export interface RuleVersion {
  /** First week (a Monday WeekKey) it applies to. Versions are in ascending `from`; weeks before the first use it. */
  from: WeekKey;
  money: { yenPerFruit: number; teamYenPerFruit: number; purseYen: number; purseMinScore: number };
  points: { peachActive: number; peachRest: number; coconut: number; apple: number; pear: number };
}

export const RULES: readonly RuleVersion[] = [
  {
    from: '2026-11-02',
    money: { yenPerFruit: 50, teamYenPerFruit: 20, purseYen: 1000, purseMinScore: 60 },
    points: { peachActive: 30, peachRest: 5, coconut: 25, apple: 15, pear: 25 }
  }
];

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

export const CALIBRATION = { flatScore: 60, minDataDays: 6 } as const;

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

// Placeholders until calibration (PROPOSAL §2.3). B's strength target is agreed with her trainer.
export const SEASONS: Season[] = [
  {
    key: 's1',
    from: '2026-11-01',
    targets: {
      A: { activeMinPerWeek: 135, strengthDaysPerWeek: 2, stepGoal: 7500, stepDaysPerWeek: 4, habits: ['teishoku_lunch', 'low_salt_day', 'veg_two_meals'], pearTicksPerWeek: 15 },
      B: { activeMinPerWeek: 85, strengthDaysPerWeek: 2, stepGoal: 6250, stepDaysPerWeek: 4, habits: ['eat_lunch', 'snack_swap', 'veg_two_meals'], pearTicksPerWeek: 15 }
    }
  }
];

/** Weeks (WeekKey) paid at the flat calibration rate. Set when Phase 1 goes live. */
export const CALIBRATION_WEEKS: string[] = ['2026-11-02', '2026-11-09'];

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
  villagerNameMaxChars: 20
} as const;
