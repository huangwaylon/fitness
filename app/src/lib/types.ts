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

/** A person's targets beyond the shared daily goals (RuleVersion.goals): their three eating habits. */
export interface PersonTargets {
  /** Exactly three habit keys; labels live in the i18n catalogs (`habit.<key>`). */
  habits: [string, string, string];
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

/** A pot's balance plus what flowed into it today and this week (its share of the pair's earnings, as split on totals). */
export interface PotFlow extends PotBalance {
  /** This pot's share of today's earnings: share(earned) − share(earned − todayBells), so treat + trip = todayBells. */
  today: number;
  /** The same for this week's earnings (incl. the bonus once it landed): treat + trip = weekBells. */
  week: number;
}

export interface PotsView {
  treat: PotFlow;
  trip: PotFlow;
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
  /** The badge threshold in the same unit: 5 days, 4 days, 3 days, 15 ticks (🍐 fewer over 正月). */
  weekGoalDays: number;
  badge: boolean;
  /** This fruit's daily ベル this week (the badge's +500 is in the harvest bonus, not here). */
  weekBells: number;
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
  fruits: Record<FruitKey, FruitProgress>;
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

export interface HarvestView {
  weekKey: WeekKey;
  /** The week's weekly bonus (ADR 0019); it counts whether or not 「受け取る」 is tapped. */
  bonus: HarvestBonus;
  /** The week's total ベル, both people: daily earnings + the bonus. */
  totalBells: number;
  /** The week's badges per person (lit = met, +bonus each). */
  badges: Record<PersonId, Record<FruitKey, boolean>>;
  /** Who tapped 「受け取る」 (a ceremony only). */
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
  /** Present from Sunday 19:30 until both tapped 「受け取る」. */
  harvest: HarvestView | null;
  pending: PendingConfirmation[];
  /** i18n key (`host.*`) for the host しずえ's one line, plus params. */
  host: { key: string; params?: Record<string, string | number> };
  highFivesToday: number;
}
