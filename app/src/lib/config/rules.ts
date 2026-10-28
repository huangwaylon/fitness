// The rules as data (PROPOSAL §3, ADRs 0008, 0009, 0011, 0014). Edit here, then `npm run recompute -- --dry-run`.
import type { PersonId, PersonTargets } from '#lib/types.ts';

export const MONEY = {
  yenPerFruit: 50,
  teamYenPerFruit: 20,
  purseYen: 1000,
  purseMinScore: 60,
  purseNeedsBothAtYen: 5000,
  monthlyAutoTransferHintYen: 45000,
  paydayDayOfMonth: 25
} as const;

export const POINTS = {
  peachActive: 30,
  peachRest: 5,
  coconut: 25,
  apple: 15,
  pear: 25
} as const;

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
  A: { age: 29, villager: 'Bean' },
  B: { age: 26, villager: 'Mochi' }
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

export const JOBS = {
  provisional: { weekday: 0, hour: 19, minute: 30 }, // Sunday 19:30 JST
  final: { weekday: 3, hour: 4, minute: 0 }, // Wednesday 04:00 JST
  checkinReminder: { hour: 20, minute: 0 }
} as const;
