// Realistic sample WeekView for `?demo` and for dev without VITE_GAS_URL.
// Cast: ウェイ (A, dog, Anytime) is "me" (the user is A), うめ (B, cat, PT) is the partner.
import type { FruitKey, FruitView, HarvestView, WeekView } from '#lib/types.ts';
import { RUNGS } from '#lib/config/rules.ts';

const MAX: Record<FruitKey, number> = { peach: 35000, coconut: 25000, apple: 15000, pear: 25000 };

function fruit(key: FruitKey, actual: number, target: number): FruitView {
  const ratio = Math.min(1, actual / target);
  return { milli: Math.round(MAX[key] * ratio), maxMilli: MAX[key], pct: Math.round(ratio * 100), actual, target };
}

function score(f: Record<FruitKey, FruitView>): number {
  return Math.floor((f.peach.milli + f.coconut.milli + f.apple.milli + f.pear.milli) / 1000);
}

export function sampleWeek(opts: { harvest?: boolean } = {}): WeekView {
  const aFruits = {
    peach: fruit('peach', 64, 135),
    coconut: fruit('coconut', 1, 2),
    apple: fruit('apple', 2, 5),
    pear: fruit('pear', 5, 15)
  };
  const bFruits = {
    peach: fruit('peach', 49, 85),
    coconut: fruit('coconut', 2, 2),
    apple: fruit('apple', 1, 5),
    pear: fruit('pear', 6, 15)
  };
  const total = 146200;
  const harvest: HarvestView = {
    weekKey: '2026-10-19',
    payout: {
      weekKey: '2026-10-19',
      A: { score: 74, fruitYen: 3700, purseYen: 1000 },
      B: { score: 88, fruitYen: 4400, purseYen: 1000 },
      teamYen: 1480
    },
    rungsReached: ['okinawa'],
    confirmedBy: []
  };
  return {
    me: 'A',
    partner: 'B',
    locale: 'ja',
    weekKey: '2026-10-26',
    today: '2026-10-28',
    people: {
      A: {
        person: 'A',
        villagerName: 'ウェイ',
        score: score(aFruits),
        fruits: aFruits,
        lastSyncAt: '2026-10-28T13:58:00+09:00',
        villager: null,
        habits: {
          keys: ['teishoku_lunch', 'low_salt_day', 'veg_two_meals'],
          ticksByDate: { '2026-10-27': ['teishoku_lunch', 'veg_two_meals'], '2026-10-28': ['teishoku_lunch'] }
        }
      },
      B: {
        person: 'B',
        villagerName: 'うめ',
        score: score(bFruits),
        fruits: bFruits,
        lastSyncAt: '2026-10-28T14:05:00+09:00',
        villager: null,
        habits: {
          keys: ['eat_lunch', 'snack_swap', 'veg_two_meals'],
          ticksByDate: { '2026-10-27': ['eat_lunch', 'snack_swap', 'veg_two_meals'], '2026-10-28': ['eat_lunch', 'veg_two_meals'] }
        }
      }
    },
    jar: {
      totalYen: total,
      layers: { A: 58600, B: 61800, team: 25800 },
      purseYen: 7000,
      thisWeekEstimateYen: 5860,
      nextRung: { key: 'okinawa', yen: 150000, remainingYen: 150000 - total },
      rungs: RUNGS.map((r) => ({ key: r.key, yen: r.yen, reached: total >= r.yen })),
      transfer: { month: '2026-10', amountYen: 41200, done: false },
      pendingSpends: [],
      weeks: 8
    },
    harvest: opts.harvest ? harvest : null,
    pending: [{ kind: 'workout', id: 'w-yoga-1027', date: '2026-10-27', label: 'ヨガ 45分' }],
    juniper: { key: 'juniper.default' },
    highFivesToday: 1
  };
}
