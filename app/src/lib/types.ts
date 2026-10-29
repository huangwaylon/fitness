// Shared contracts between scoring, server and UI. Keep this file dependency-free.

export type PersonId = 'A' | 'B';
/** Local calendar date in the person's zone (Asia/Tokyo), `YYYY-MM-DD`. */
export type LocalDate = string;
/** Monday of the Mon–Sun week, `YYYY-MM-DD`. */
export type WeekKey = string;

export type FruitKey = 'peach' | 'coconut' | 'apple' | 'pear';

export interface DayMetrics {
  date: LocalDate;
  steps: number | null;
  exerciseMin: number | null;
}

export interface Workout {
  extId: string;
  date: LocalDate;
  /** Canonical (English) workout name, e.g. "Traditional Strength Training", "Yoga", "Outdoor Walk". */
  type: string;
  startAt: string; // ISO with offset
  endAt: string;
  durationMin: number;
  avgHr: number | null;
  /** The one-tap "included strength?" answer for HIIT/yoga; null = not asked/answered. */
  includesStrength: boolean | null;
}

/** An arrive→leave pair derived from presence events. */
export interface Visit {
  placeKey: string;
  date: LocalDate;
  arriveAt: string;
  leaveAt: string;
  dwellMin: number;
  /** Place counts as strength without confirmation (B's PT studio). */
  autoStrength: boolean;
  /** Person tapped 「筋トレとして記録する」; null = not answered. */
  confirmed: boolean | null;
}

export interface CheckinTick {
  date: LocalDate;
  habitKey: string;
}

export interface PersonTargets {
  activeMinPerWeek: number;
  strengthDaysPerWeek: number;
  stepGoal: number;
  stepDaysPerWeek: number;
  /** Exactly three habit keys; labels live in the i18n catalogs (`habit.<key>`). */
  habits: [string, string, string];
  pearTicksPerWeek: number;
}

export interface WeekInput {
  person: PersonId;
  weekKey: WeekKey;
  age: number;
  targets: PersonTargets;
  /** One entry per day Mon..Sun; missing data = nulls. */
  days: DayMetrics[];
  workouts: Workout[];
  visits: Visit[];
  checkins: CheckinTick[];
  calibration: boolean;
}

export interface CategoryResult {
  key: FruitKey;
  /** Earned points × 1000 (integer). */
  milli: number;
  maxMilli: number;
  /** Counted amount (minutes, days or ticks) after caps. */
  actual: number;
  /** Target in the same unit (fractional in 正月 easy weeks; Pear is prorated over 正月 pear-off days). */
  target: number;
}

export interface WeekScore {
  person: PersonId;
  weekKey: WeekKey;
  /** Integer 0–100: floor(sum of category milli / 1000). */
  score: number;
  categories: Record<FruitKey, CategoryResult>;
  restDays: number;
  strengthDays: LocalDate[];
  /** Days with any Health data (used for calibration pay and sync status). */
  dataDays: number;
}

export interface PersonPayout {
  score: number;
  fruitYen: number;
  purseYen: number;
}

export interface WeekPayout {
  weekKey: WeekKey;
  A: PersonPayout;
  B: PersonPayout;
  teamYen: number;
}

// ---- View model returned by GET /api/week (server → UI). Partner fields are already privacy-filtered. ----

export interface FruitView {
  milli: number;
  maxMilli: number;
  /** 0–100, of this category's max. */
  pct: number;
  /** Raw counted amount and target: always for me; for the partner only if they opted in (visibility_pref). */
  actual?: number;
  target?: number;
}

export interface PersonWeekView {
  person: PersonId;
  villagerName: string;
  /** Animal Crossing villager key from the roster (e.g. 'goldie'); null = default for this person. */
  villager: string | null;
  score: number;
  fruits: Record<FruitKey, FruitView>;
  lastSyncAt: string | null;
  /** Only present for `me`: eating answers are never shared. */
  habits?: { keys: [string, string, string]; ticksByDate: Record<LocalDate, string[]> };
}

export interface PendingConfirmation {
  kind: 'visit' | 'workout';
  /** arrive event id (visit) or workout extId. */
  id: string;
  date: LocalDate;
  label: string;
}

export interface JarView {
  totalYen: number;
  layers: { A: number; B: number; team: number };
  purseYen: number;
  /** Provisional yen for the current week if it settled now (quiet "≈ ¥ this week"). */
  thisWeekEstimateYen: number;
  nextRung: { key: string; yen: number; remainingYen: number } | null;
  rungs: { key: string; yen: number; reached: boolean }[];
  /** Payday cue: last month's earnings and whether "moved ✓" was tapped. */
  transfer: { month: string; amountYen: number; done: boolean } | null;
  /** Treat spends ≥ the both-OK threshold waiting for the partner's approval. */
  pendingSpends: { id: number | string; label: string; amountYen: number; by: PersonId }[];
  /** Weeks paid so far: each layer's own maximum is weeks × its weekly max (not a leaderboard). */
  weeks: number;
}

export interface HarvestView {
  weekKey: WeekKey;
  payout: WeekPayout;
  /** Rung keys newly reached by this harvest. */
  rungsReached: string[];
  confirmedBy: PersonId[];
}

export interface WeekView {
  me: PersonId;
  partner: PersonId;
  locale: 'ja' | 'en';
  weekKey: WeekKey;
  today: LocalDate;
  people: Record<PersonId, PersonWeekView>;
  jar: JarView;
  /** Present from Sunday 19:30 until both tapped 「壺に入れる」. */
  harvest: HarvestView | null;
  pending: PendingConfirmation[];
  /** i18n key for the host しずえ's one line, plus params (`juniper.*`: the API name predates the Host rename). */
  juniper: { key: string; params?: Record<string, string | number> };
  highFivesToday: number;
  /** My raw-number sharing prefs, by fruit key. */
  visibility: Partial<Record<FruitKey, boolean>>;
}
