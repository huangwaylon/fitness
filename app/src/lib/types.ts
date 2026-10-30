// Shared contracts between scoring, the model, the Apps Script (type-only) and the UI. Keep this file dependency-free.

export type PersonId = 'A' | 'B';
/** Local calendar date in the person's zone (Asia/Tokyo), `YYYY-MM-DD`. */
export type LocalDate = string;
/** Monday of the Mon–Sun week, `YYYY-MM-DD`. */
export type WeekKey = string;

/**
 * @deprecated The four fruits of ADR 0019 (🍐 = eating habits). Use `RingFruit` (ADR 0021); removed once the UI has moved.
 */
export type FruitKey = 'peach' | 'coconut' | 'apple' | 'pear';

/**
 * The five fruits of ADR 0021, one automatic metric each: 🍑 peach = Exercise minutes, 🍐 pear = Move (active kcal),
 * 🍒 cherry = Stand minutes, 🍎 apple = steps, 🥥 coconut = gym (an arrival or a Watch strength workout).
 */
export type RingFruit = 'peach' | 'pear' | 'cherry' | 'apple' | 'coconut';

/** ベル per ring fruit. */
export type RingBells = Record<RingFruit, number>;

export interface Workout {
  id: string;
  date: LocalDate;
  /** Canonical (English) workout name, e.g. "Traditional Strength Training", "Yoga", "Outdoor Walk". */
  type: string;
  startAt: string; // ISO with offset
  endAt: string;
  durationMin: number;
  avgHr: number | null;
  /** A きろく mark (`workout_edit`/`workout_add`): counts (true) or not (false) as strength, for any type. Absent = automatic. */
  strengthOverride?: boolean;
  /** Added by hand in きろく (Watch forgotten): its minutes count toward the day's active minutes (ADR 0011). */
  manual?: boolean;
}

/** A gym arrival (a presence `arrive` at a known place): a strength day on its Tokyo date (2026-10-30). */
export interface Visit {
  placeKey: string;
  date: LocalDate;
  arriveAt: string;
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

/** @deprecated ベル per ADR 0019 fruit (🍐 here = Move ベル since ADR 0021, 🍒 missing). Use `RingBells`. */
export type FruitBells = Record<FruitKey, number>;

/** One person's earnings of one day. */
export interface DayBells {
  date: LocalDate;
  bells: number;
  /** Per ring fruit (ADR 0021); sums to `bells`. */
  rings: RingBells;
  /** @deprecated See FruitBells. */
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

/** The Sunday harvest's weekly bonus: +badges.bells per badge each, +badges.duoPerBadge per badge both met (ふたりボーナス). */
export interface HarvestBonus {
  A: number;
  B: number;
  duo: number;
}

/**
 * @deprecated ADR 0019's fruit progress, filled from the ring numbers since ADR 0021 (🍑🍎🥥 as the rings; 🍐 = Move,
 * in kcal). Read `RingProgress`.
 */
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

/** A ring fruit's progress today and this week (ADR 0021). Units: 🍑 minutes, 🍐 kcal, 🍒 minutes, 🍎 steps, 🥥 1/0. */
export interface RingProgress {
  /** Today's counted amount (🍑 max(Watch, workouts added in きろく); 🥥 1 on a gym day). */
  today: number;
  /** Today's daily goal: 60, the person's Move goal in force today, 180, 8,000, 1. */
  goal: number;
  /** Today's goal is met (🍎 also by the tsuyu rule). */
  met: boolean;
  /** Today's ベル of this fruit. */
  todayBells: number;
  /** Days this week meeting the daily goal. */
  weekDays: number;
  /** The badge threshold: 5 days (🍑🍐🍒), 4 (🍎), 3 (🥥). */
  weekGoalDays: number;
  badge: boolean;
  /** This fruit's daily ベル this week up to today (the badge bonus is in the harvest bonus, not here). */
  weekBells: number;
}

export interface PersonWeekView {
  person: PersonId;
  villagerName: string;
  /** Animal Crossing villager key from the roster (e.g. 'goldie'); null = default for this person. */
  villager: string | null;
  /**
   * Today's earnings so far. `rings`: per ring fruit (ADR 0021; sums to `bells`). `parts` is @deprecated (FruitBells).
   */
  today: { bells: number; parts: FruitBells; rings: RingBells };
  /** This week's daily earnings so far (without the weekly bonus). */
  weekBells: number;
  /** @deprecated ADR 0019's four fruits (see FruitProgress). Read `rings`. */
  fruits: Record<FruitKey, FruitProgress>;
  /** The five ring fruits (ADR 0021). */
  rings: Record<RingFruit, RingProgress>;
  /** The person's Move goal in force today, kcal (`pref` moveGoal; default ウェイ 600, うめ 400). */
  moveGoal: number;
  lastSyncAt: string | null;
}

/** @deprecated No daily questions (2026-10-30): `WeekView.pending` is always empty. */
export interface PendingConfirmation {
  kind: 'workout';
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
  /** @deprecated ADR 0019's four badges (🍐 = the Move badge since ADR 0021). Read `ringBadges`. */
  badges: Record<PersonId, Record<FruitKey, boolean>>;
  /** The week's five badges per person (ADR 0021; lit = met, +bonus each). */
  ringBadges: Record<PersonId, Record<RingFruit, boolean>>;
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
  /** @deprecated Always empty (no daily questions, 2026-10-30). */
  pending: PendingConfirmation[];
  /** i18n key (`host.*`) for the host しずえ's one line, plus params. */
  host: { key: string; params?: Record<string, string | number> };
  highFivesToday: number;
}
