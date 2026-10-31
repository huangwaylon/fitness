// Shared contracts between scoring, the model, the Apps Script (type-only) and the UI. Keep this file dependency-free.

export type PersonId = 'A' | 'B';
/** Local calendar date in the person's zone (Asia/Tokyo), `YYYY-MM-DD`. */
export type LocalDate = string;
/** Monday of the Mon–Sun week, `YYYY-MM-DD`. */
export type WeekKey = string;

/**
 * The four fruits of ADR 0021, one automatic metric each: 🍑 peach = Exercise minutes, 🍐 pear = Move (active kcal),
 * 🍒 cherry = Stand minutes, 🍎 apple = steps.
 */
export type RingFruit = 'peach' | 'pear' | 'cherry' | 'apple';

/** ベル per ring fruit. */
export type RingBells = Record<RingFruit, number>;

/** A workout added by hand in きろく (`workout_add`): its minutes count toward the day's exercise minutes (max, never a sum). */
export interface Workout {
  id: string;
  date: LocalDate;
  /** Canonical (English) workout name, e.g. "Yoga", "Outdoor Walk" (contract/labels.ts WORKOUT_TYPES). */
  type: string;
  durationMin: number;
}

// ---- View model computed in the browser by lib/model (snapshot → UI). Both players see all data. ----

/** A shared menu entry (ADR 0022: one list), editable in the app (`pref` menu): either person can buy it from the wallet. */
export interface WalletItem {
  id: string;
  label: string;
  bells: number;
}

/**
 * A menu entry as the wallet shows it (ADR 0022 amendment "escalating food treats"). `bells` / `basePrice`: the menu's
 * price; `price`: what the next buy costs now (the base, or for an escalating item the base × 1.5 per accepted, not
 * voided buy of that id this week by either person, model/bells.ts `treatPrice`).
 */
export interface MenuItemView extends WalletItem {
  price: number;
  basePrice: number;
  /** Accepted, not voided buys of this id in the current Tokyo week, both people. */
  boughtThisWeek: number;
  /** In ESCALATING_ITEMS (rules.ts): おやつ, カフェ・デザート, 外ごはん by default. */
  escalates: boolean;
}

/** The shared wallet (ADR 0022): every ベル earned, minus the accepted buys. */
export interface WalletView {
  /** earned − spent (never negative: a buy above the balance is ignored on read). */
  balance: number;
  /** Everything earned so far, both people (daily + the Sunday bonuses that landed). */
  earned: number;
  /** Sum of the accepted, not voided buys. */
  spent: number;
  /** Both people, today so far. */
  today: number;
  /** Both people, this week so far, incl. the weekly bonus once it landed (Sunday 19:30). */
  week: number;
}

/** One person's earnings of one day. */
export interface DayBells {
  date: LocalDate;
  bells: number;
  /** Per ring fruit (ADR 0021); sums to `bells`. */
  rings: RingBells;
}

/** The Sunday harvest's weekly bonus: +badges.bells per badge each, +badges.duoPerBadge per badge both met (ふたりボーナス). */
export interface HarvestBonus {
  A: number;
  B: number;
  duo: number;
}

/** A ring fruit's progress today and this week (ADR 0021). Units: 🍑 minutes, 🍐 kcal, 🍒 minutes, 🍎 steps. */
export interface RingProgress {
  /** Today's counted amount (🍑 max(Watch, workouts added in きろく)). */
  today: number;
  /** Today's daily goal at the week's rule version (rules.ts goals; 🍐 the person's Move goal in force today). */
  goal: number;
  /** Today's goal is met (🍎 also by the tsuyu rule). */
  met: boolean;
  /** Today's ベル of this fruit. */
  todayBells: number;
  /** Days this week meeting the daily goal. */
  weekDays: number;
  /** The badge threshold: 5 days (🍑🍐🍒), 4 (🍎). */
  weekGoalDays: number;
  badge: boolean;
  /** This fruit's daily ベル this week up to today (the badge bonus is in the harvest bonus, not here). */
  weekBells: number;
  /**
   * The milestone curve (docs/reviews/round-19/milestones-contract.md). Present in a week with a curve (v2, from
   * 2026-11-02); absent in v1 weeks. `milestone`: steps reached today, 0–4 (4 = the goal met).
   */
  milestone?: number;
  /** The next milestone's amount, in `today`/`goal` units (minutes, kcal rounded up, steps); null once the goal is met. */
  nextAt?: number | null;
  /** This fruit's ベル today once `nextAt` is reached (a total, like `todayBells`); null once the goal is met. */
  nextBells?: number | null;
  /** What reaching `nextAt` adds: nextBells − todayBells (「あと 8分で +45」); null once the goal is met. */
  nextGain?: number | null;
}

export interface PersonWeekView {
  person: PersonId;
  villagerName: string;
  /** Animal Crossing villager key from the roster (e.g. 'goldie'); null = default for this person. */
  villager: string | null;
  /** Today's earnings so far, per ring fruit (ADR 0021; `rings` sums to `bells`). */
  today: { bells: number; rings: RingBells };
  /** This week's daily earnings so far (without the weekly bonus). */
  weekBells: number;
  /** The four ring fruits (ADR 0021). */
  rings: Record<RingFruit, RingProgress>;
  /** The person's Move goal in force today, kcal (`pref` moveGoal; default ウェイ 600, うめ 400). */
  moveGoal: number;
  lastSyncAt: string | null;
}

export interface HarvestView {
  weekKey: WeekKey;
  /** The week's weekly bonus (ADR 0019); it counts whether or not 「受け取る」 is tapped. */
  bonus: HarvestBonus;
  /** The week's total ベル, both people: daily earnings + the bonus. */
  totalBells: number;
  /** The week's four badges per person (ADR 0021; lit = met, +bonus each). */
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
  /** The shared wallet (ADR 0022). */
  wallet: WalletView;
  /** The shared menu, one list (latest `pref` menu by either person, else the defaults), with this week's prices. */
  menu: MenuItemView[];
  /** Present from Sunday 19:30 until both tapped 「受け取る」. */
  harvest: HarvestView | null;
  /** i18n key (`host.*`) for the host しずえ's one line, plus params. */
  host: { key: string; params?: Record<string, string | number> };
  highFivesToday: number;
}
