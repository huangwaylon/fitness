// Shared contracts between scoring, the model, the Apps Script (type-only) and the UI. Keep this file dependency-free.

export type PersonId = 'A' | 'B';
/** Local calendar date in the person's zone (Asia/Tokyo), `YYYY-MM-DD`. */
export type LocalDate = string;
/** Monday of the Mon–Sun week, `YYYY-MM-DD`. */
export type WeekKey = string;

/**
 * The four ring fruits, one automatic metric each: 🍐 pear = Move (active kcal), 🍑 peach = Exercise minutes,
 * 🍒 cherry = Stand minutes, 🍎 apple = steps (display order: config/rules.ts RING_FRUITS).
 */
export type RingFruit = 'pear' | 'peach' | 'cherry' | 'apple';

/** A number per ring fruit (ベル: 1 when its goal was met). */
export type RingBells = Record<RingFruit, number>;

// ---- View model computed in the browser by lib/model (snapshot → UI). Both players see all data. ----

/** The two rewards (config/rules.ts SHOP): 🍡 おやつ and 🍜 外食. */
export type ShopItemId = 'snack' | 'dinner';

/** The shared wallet as the island shows it. */
interface WalletView {
  /** Every ベル earned minus the accepted buys (never negative: a buy above the balance is ignored on read). */
  balance: number;
  /** Both people today so far, ふたりでぜんぶ included. */
  today: number;
}

/** One person's earnings of one day: +1 ベル per goal met, + がんばり (+1 per goal at 1.5×, at most +2). */
export interface DayBells {
  date: LocalDate;
  bells: number;
  /** The daily goal met, per ring fruit. */
  met: Record<RingFruit, boolean>;
  /** がんばり ベル in `bells` (0–2). */
  stretch: number;
}

/** A ring fruit's progress today. Units: 🍑 minutes, 🍐 kcal, 🍒 minutes, 🍎 steps. */
export interface RingProgress {
  /** Today's amount from Apple Health. */
  today: number;
  /** Today's daily goal (rules.ts goals; 🍐 the person's Move goal in force today). */
  goal: number;
  /** Today's goal is met: +1 ベル. */
  met: boolean;
  /** Today's stretch target (1.5 × the goal) is reached: がんばり (+1 within the day's cap of 2). */
  stretched: boolean;
}

export interface PersonWeekView {
  person: PersonId;
  villagerName: string;
  /** Animal Crossing villager key from the roster (e.g. 'goldie'); null = default for this person. */
  villager: string | null;
  /** Today's ベル so far (0–4 goals + 0–2 がんばり) and, per ring fruit, the ベル it earned (1 = met, 2 = met and its
   *  がんばり paid). */
  today: { bells: number; rings: RingBells };
  /** This week's ベル so far (this person's goals; ふたりでぜんぶ is shared, not in here). */
  weekBells: number;
  /** The four ring fruits. */
  rings: Record<RingFruit, RingProgress>;
  /** The person's Move goal in force today, kcal (`pref` moveGoal; default ウェイ 600, うめ 400). */
  moveGoal: number;
  lastSyncAt: string | null;
}

/** Today's ふたりでぜんぶ: both people meet all four goals. */
export interface TogetherView {
  met: boolean;
  /** Goals still to meet today, both people counted (0–8). */
  left: number;
}

/** The Sunday harvest: a recap of the week (its ベル landed day by day; nothing more lands here). */
export interface HarvestView {
  weekKey: WeekKey;
  /** The week's ベル: each person's goals, and ふたりでぜんぶ (shared). */
  bells: { A: number; B: number; together: number };
  /** Days both people met all four goals. */
  togetherDays: number;
  /** bells.A + bells.B + bells.together. */
  totalBells: number;
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
  together: TogetherView;
  /** The shared wallet. */
  wallet: WalletView;
  /** Present from Sunday 19:30 until both tapped 「受け取る」. */
  harvest: HarvestView | null;
  /** i18n key (`host.*`) for the host しずえ's one line, plus params. */
  host: { key: string; params?: Record<string, string | number> };
  highFivesToday: number;
}
