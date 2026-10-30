// Shared contracts between scoring, the model, the Apps Script (type-only) and the UI. Keep this file dependency-free.

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
  id: string;
  date: LocalDate;
  /** Canonical (English) workout name, e.g. "Traditional Strength Training", "Yoga", "Outdoor Walk". */
  type: string;
  startAt: string; // ISO with offset
  endAt: string;
  durationMin: number;
  avgHr: number | null;
  /** The one-tap "included strength?" answer for HIIT/yoga; null = not asked/answered. */
  includesStrength: boolean | null;
  /** A きろく edit (`workout_edit`/`workout_add`): counts (true) or not (false) as strength, for any type. Absent = automatic. */
  strengthOverride?: boolean;
  /** Added by hand in きろく (Watch forgotten): its minutes count toward the day's active minutes (ADR 0011). */
  manual?: boolean;
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
  habit: string;
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
  /** Days with any Health data. */
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

// ---- View model computed in the browser by lib/model (snapshot → UI). Both players see all data. ----

// ---- ベル economy (ADR 0019) ----

/** The two shared pots: おやつ (treats) and 旅 (trips). */
export type PotKey = 'treat' | 'trip';

/** A shared menu entry (おやつ item or 旅 trip type), editable in the app (`pref` treatMenu / tripMenu). */
export interface MenuItem {
  id: string;
  label: string;
  bells: number;
}

/** ベル per fruit. */
export type FruitBells = Record<FruitKey, number>;

/** One person's earnings of one day. */
export interface DayBells {
  date: LocalDate;
  bells: number;
  parts: FruitBells;
}

export interface PotBalance {
  /** earned − spent (never negative: a spend above the balance is ignored on read). */
  balance: number;
  /** This pot's share of everything earned so far (POTS.treatPercent% to おやつ, the rest to 旅, on totals). */
  earned: number;
  /** Sum of the accepted, not voided spends from this pot. */
  spent: number;
}

export interface PotsView {
  treat: PotBalance;
  trip: PotBalance;
  /** Both people, today so far. */
  todayBells: number;
  /** Both people, this week so far, incl. the weekly bonus once it landed (Sunday 19:30). */
  weekBells: number;
}

/** The Sunday harvest's weekly bonus: +500 per badge each, +1,000 ふたりボーナス when both have all four. */
export interface HarvestBonus {
  A: number;
  B: number;
  duo: number;
}

/** A fruit's progress today and this week (ADR 0019). */
export interface FruitProgress {
  /** Today's counted amount: minutes (🍑), steps (🍎), 1/0 strength day (🥥), ticks (🍐). */
  todayActual: number;
  /** Today's daily goal in the same unit: 45, 8,000, 1, 3. */
  todayGoal: number;
  /** Today's goal is met (🍎 also by the tsuyu rule; 🍐 at 3 ticks). */
  todayMet: boolean;
  /** Progress toward the weekly badge: days meeting the daily goal (🍑🍎🥥), or ticks (🍐). */
  weekDays: number;
  /** The badge threshold in the same unit: 5 days, 4 days, 2 days, 15 ticks (🍐 fewer over 正月). */
  weekGoalDays: number;
  badge: boolean;
  /** This fruit's daily ベル this week (the badge's +500 is in the harvest bonus, not here). */
  weekBells: number;
}

/** Old (score /100) fill of a fruit; removed once the UI has moved over. */
export interface FruitView {
  milli: number;
  maxMilli: number;
  /** 0–100, of this category's max. */
  pct: number;
  /** Raw counted amount and target. */
  actual: number;
  target: number;
}

export interface PersonWeekView {
  person: PersonId;
  villagerName: string;
  /** Animal Crossing villager key from the roster (e.g. 'goldie'); null = default for this person. */
  villager: string | null;
  /** Today's earnings so far (ADR 0019). */
  today: { bells: number; parts: FruitBells };
  /** This week's daily earnings so far (without the weekly bonus). */
  weekBells: number;
  /** Old weekly score /100; removed once the UI has moved over. */
  score: number;
  fruits: Record<FruitKey, FruitView & FruitProgress>;
  lastSyncAt: string | null;
  /** Eating check-ins (the three habit keys and the ticks by date). */
  habits: { keys: [string, string, string]; ticksByDate: Record<LocalDate, string[]> };
}

export interface PendingConfirmation {
  kind: 'visit' | 'workout';
  /** Visit id (`<place>@<arrive ISO>`) or workout id. */
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
  /** The week's weekly bonus (ADR 0019); it counts whether or not 「受け取る」 is tapped. */
  bonus: HarvestBonus;
  /** The week's total ベル, both people: daily earnings + the bonus. */
  totalBells: number;
  /** Old yen payout; removed once the UI has moved over. */
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
  /** The two shared pots (ADR 0019). */
  pots: PotsView;
  /** The shared menus: おやつ items and 旅 trip types (latest `pref` by either person, else the defaults). */
  menus: Record<PotKey, MenuItem[]>;
  /** Old jar/purse/transfer; removed once the UI has moved over. */
  jar: JarView;
  /** Present from Sunday 19:30 until both tapped 「壺に入れる」. */
  harvest: HarvestView | null;
  pending: PendingConfirmation[];
  /** i18n key (`host.*`) for the host しずえ's one line, plus params. */
  host: { key: string; params?: Record<string, string | number> };
  highFivesToday: number;
}
