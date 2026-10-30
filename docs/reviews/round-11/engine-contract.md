# Round 11: the ベル engine contract (ADR 0019)

The model's view types for the ベル economy, for the UI. Source of truth: `app/src/lib/types.ts` (view model) and
`app/src/lib/model/history.ts` (きろく). Values: `app/src/lib/config/rules.ts`.

```ts
// ---- app/src/lib/types.ts ----
export type PotKey = 'treat' | 'trip';

/** A shared menu entry (おやつ item or 旅 trip type), editable in the app (`pref` treatMenu / tripMenu). */
export interface MenuItem { id: string; label: string; bells: number }

export type FruitBells = Record<FruitKey, number>;

/** One person's earnings of one day. */
export interface DayBells { date: LocalDate; bells: number; parts: FruitBells }

export interface PotBalance {
  balance: number; // earned − spent, never negative (a spend above the balance is ignored on read)
  earned: number;  // this pot's share of everything earned so far (30% / 70%, on totals)
  spent: number;   // accepted, not voided spends from this pot
}

export interface PotsView {
  treat: PotBalance;
  trip: PotBalance;
  todayBells: number; // both people, today so far
  weekBells: number;  // both people, this week so far, incl. the weekly bonus once it landed (Sunday 19:30)
}

/** +500 per badge each, +1,000 ふたりボーナス when both have all four. */
export interface HarvestBonus { A: number; B: number; duo: number }

/** A fruit's progress today and this week. */
export interface FruitProgress {
  todayActual: number;  // minutes (🍑), steps (🍎), 1/0 strength day (🥥), ticks (🍐)
  todayGoal: number;    // 45, 8,000, 1, 3
  todayMet: boolean;    // 🍎 also by the tsuyu rule (≥ 30 active minutes, Jun 1–Jul 20)
  weekDays: number;     // progress toward the badge: days meeting the daily goal (🍑🍎🥥), ticks (🍐)
  weekGoalDays: number; // 5 days, 4 days, 2 days, 15 ticks (🍐 prorated over 正月 pear-off days)
  badge: boolean;
  weekBells: number;    // this fruit's daily ベル this week (the badge's +500 is in the harvest bonus)
}

export interface PersonWeekView {
  person: PersonId;
  villagerName: string;
  villager: string | null;
  today: { bells: number; parts: FruitBells }; // today's earnings so far
  weekBells: number;                            // this week's daily earnings (without the bonus)
  fruits: Record<FruitKey, FruitView & FruitProgress>; // FruitView = the OLD fields (milli, pct, …), going away
  lastSyncAt: string | null;
  habits: { keys: [string, string, string]; ticksByDate: Record<LocalDate, string[]> };
  score: number; // OLD, going away
}

export interface HarvestView {
  weekKey: WeekKey;
  bonus: HarvestBonus;
  totalBells: number;     // the week's total, both people: daily earnings + bonus
  confirmedBy: PersonId[]; // 「受け取る」 is a ceremony only: the bonus counts either way
  payout: WeekPayout;      // OLD, going away
  rungsReached: string[];  // OLD, going away
}

export interface WeekView {
  me: PersonId; partner: PersonId; locale: 'ja' | 'en'; weekKey: WeekKey; today: LocalDate;
  people: Record<PersonId, PersonWeekView>;
  pots: PotsView;
  menus: Record<PotKey, MenuItem[]>; // latest `pref` by either person, else the defaults in the viewer's language
  harvest: HarvestView | null;       // Sunday 19:30 until both tapped
  pending: PendingConfirmation[];
  host: { key: string; params?: Record<string, string | number> };
  highFivesToday: number;
  jar: JarView; // OLD, going away
}

// ---- app/src/lib/model/history.ts (きろく) ----
export function bellsLedger(s: State, now: number): BellsLedger;

export interface BellsLedger {
  pots: Record<PotKey, PotBalance>;
  earned: number;          // everything earned so far, both people
  days: LedgerDay[];       // newest first, economy start → today
  bonuses: LedgerBonus[];  // newest first, weeks whose harvest opened
  spends: LedgerSpend[];   // newest first
}
export interface LedgerDay {
  date: LocalDate; weekKey: WeekKey;
  bells: number;                       // both people
  people: Record<PersonId, DayBells>;
  locked: boolean;                     // the week locked (Wednesday 04:00): final
}
export interface LedgerBonus {
  weekKey: WeekKey; at: number;        // at = Sunday 19:30 JST (epoch ms)
  bonus: HarvestBonus; bells: number;
  badges: Record<PersonId, Record<FruitKey, boolean>>;
  locked: boolean;
}
export interface LedgerSpend {
  spendId: string; at: number; by: PersonId; pot: PotKey;
  item: string; label: string; bells: number;
  voided: boolean; voidedAt: number | null;
}

// Added to the existing きろく shapes:
// HistoryWeek:        bells (week total incl. bonus once landed); people[p].bells, people[p].badges
// WeekDetail:         bells, bonus: HarvestBonus; people[p].dailyBells, .bonus, .badges; people[p].days[i].bells, .parts
// DayDetail:          people[p].bells, people[p].parts

// ---- app/src/lib/store/actions.ts ----
export function buyTreat(itemId: string): SendResult;  // {ok:false} if unknown item or balance < price; UNDO_MS banner
export function buyTrip(itemId: string): SendResult;
export function undoSpend(spendId: string): SendResult; // spend_void; only the buyer's counts
export function setMenu(pot: PotKey, items: MenuItem[]): SendResult; // {ok:false} if invalid
export function newMenuItemId(): string;
```

## Rules the UI can rely on
- Menu validation (`parseMenu`): ≤ 30 items, unique ids `[\w-]{1,40}`, label 1–60 chars after trim, bells an
  integer 1–10,000,000. An empty list is valid.
- Default menu ids: おやつ `snack` `ice` `cafe` `dinner`; 旅 `daytrip` `onsen` `weekend` `abroad`.
- Amounts are integers. Format `1,234 ベル` / `1,234 Bells`.
- Only days up to today count anywhere (a future-dated row never earns early). `todayActual` for 🍑 is the counted
  minutes uncapped (e.g. 60 of 45); the ベル cap at 45.
- `pots` and `bellsLedger().pots` are the same numbers. `pots.weekBells` and `HistoryWeek.bells` include the weekly
  bonus only once it landed (Sunday 19:30); `harvest.totalBells` always includes it.
- The harvest opens Sunday 19:30 for the week (or last week while not both tapped), as before; a tap changes no money.
- A spend the pot couldn't cover when it was made is ignored and doesn't appear in `bellsLedger().spends`.
  `buyTreat`/`buyTrip` already refuse it on the phone (`{ok:false}`), so show a gentle "not enough" instead.
- `host`: `host.harvest_ready` carries `{bells, score}`; `host.default` carries `{bells}` (today's, mine); the
  `host.payday` and `host.next_rung` lines are no longer emitted. No new host keys.
- Status (phase 2, 2026-10-30): every field above is computed for real. Old view fields (`score`, `jar`,
  `harvest.payout`, `rungsReached`, the `FruitView` part of `fruits[f]`, `HistoryWeek.yen`/`estimate`, `moneyLog`)
  stay populated until the UI has moved over, then they are removed.
