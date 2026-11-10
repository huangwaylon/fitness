// Property-style checks of the economy over seeded random histories (cheap: a few hundred small sheets).
// - The wallets: over random buys (right or wrong prices, the old or the new ones, unknown items) and voids (by the
//   buyer, the partner, twice, early) on both sides of the split, the replay matches a plain re-implementation of the
//   rule (bells.ts `walletAt`), and no balance goes negative.
// - A day: more of any metric never pays less, and a day pays 0–4 + がんばり 0–2 per person, 0–14 for the pair.
import { describe, expect, it } from 'vitest';
import type { EventRow, MetricRow } from '#lib/contract/api.ts';
import type { PersonId, RingFruit } from '#lib/types.ts';
import { RING_FRUITS, RULES, STRETCH, stretchOf } from '#lib/config/rules.ts';
import { SHOP, shopPrice, WALLET_SPLIT_MS } from '#lib/contract/rules.ts';
import { addDays, localDateAt, weekDays } from '#lib/time/dates.ts';
import { mulberry32 } from '#lib/random.ts';
import { earnWeek, type EarnDay } from '#lib/scoring/bells.ts';
import { reduce } from './state.ts';
import { bellsLedger, SPLIT_DAY, walletAt } from './bells.ts';

const jstMs = (date: string, hm: string) => Date.parse(`${date}T${hm}:00+09:00`);
const iso = (ms: number) => new Date(ms).toISOString();
const PEOPLE: PersonId[] = ['A', 'B'];
const ITEMS = [...SHOP.map((x) => x.id), 'cafe'];

interface Buy { at: number; by: PersonId; spendId: string; item: string; bells: number }
interface Void { at: number; by: PersonId; spendId: string }

/** A random sheet: 4 weeks of metrics, buys at the right price or not, voids. */
function randomSheet(seed: number) {
  const rand = mulberry32(seed);
  const pick = <T>(xs: readonly T[]): T => xs[Math.floor(rand() * xs.length)];
  const metrics: MetricRow[] = [];
  const events: EventRow[] = [];
  const first = '2026-11-02';
  for (let d = 0; d < 28; d++) {
    const date = addDays(first, d);
    for (const p of PEOPLE) {
      if (rand() < 0.15) continue; // a day without a sync
      const at = iso(jstMs(date, '21:00') + Math.floor(rand() * 3_600_000));
      metrics.push(
        [at, p, date, 'steps', Math.floor(rand() * 15_000)], [at, p, date, 'exercise_min', Math.floor(rand() * 110)],
        [at, p, date, 'move_kcal', Math.floor(rand() * 1100)], [at, p, date, 'stand_min', Math.floor(rand() * 220)]
      );
    }
  }
  // Events at strictly increasing server times (like LAST_AT), from the Wednesday of the first week.
  let t = jstMs('2026-11-04', '08:00');
  const buys: Buy[] = [];
  const voids: Void[] = [];
  let id = 0;
  for (let i = 0; i < 60; i++) {
    t += Math.floor(rand() * 14 * 3_600_000) + 1;
    const by = pick(PEOPLE);
    if (rand() < 0.6 || buys.length === 0) {
      const item = pick(ITEMS);
      // Mostly the price; sometimes another (the other item's, the other side of the split's).
      const bells = rand() < 0.85 ? (shopPrice(item, t) ?? 8) : pick([8, 15, 20, 35, 40, 70]);
      const b = { at: t, by, spendId: `s${id++}`, item, bells };
      buys.push(b);
      events.push([iso(t), by, `e${i}`, 'spend', JSON.stringify({ spendId: b.spendId, item, bells })]);
    } else {
      const target = pick(buys);
      // A void of an earlier buy, by the buyer or the partner (either counts), sometimes a second one (ignored).
      const v = { at: t, by: rand() < 0.75 ? target.by : by, spendId: target.spendId };
      voids.push(v);
      events.push([iso(t), v.by, `e${i}`, 'spend_void', JSON.stringify({ spendId: v.spendId })]);
    }
  }
  return { rows: { metrics, events }, buys, voids, end: t };
}

/**
 * The rule written out plainly, against the ledger's earnings: a buy counts if it is a reward at its price then and its
 * wallet covers it: before the split the shared one (the pair's days before SPLIT_DAY up to its date − live buys), after
 * it the buyer's (half of what the shared one held at the split, rounded down, + their own days from SPLIT_DAY up to its
 * date with half of each ふたりでぜんぶ − their live buys + their older buys undone since). The first void after a buy
 * (either of us) gives it back.
 */
function oracle(s: ReturnType<typeof randomSheet>, now: number) {
  const st = reduce(s.rows);
  const ledger = bellsLedger(st, now);
  const upTo = (t: number) => ledger.days.filter((d) => d.date <= localDateAt(t));
  const sharedDays = ledger.days.filter((d) => d.date < SPLIT_DAY);
  const ownBy = (p: PersonId, t: number) => upTo(t).filter((d) => d.date >= SPLIT_DAY)
    .reduce((n, d) => n + d.people[p].bells + (d.together ? RULES.together / 2 : 0), 0);
  const theVoid = new Map<string, number>();
  for (const v of s.voids) {
    const b = s.buys.find((x) => x.spendId === v.spendId)!;
    if (v.at >= b.at && !theVoid.has(v.spendId)) theVoid.set(v.spendId, v.at);
  }
  const voidedBefore = (x: Buy, t: number) => theVoid.has(x.spendId) && theVoid.get(x.spendId)! < t;
  const pre = (x: Buy) => x.at < WALLET_SPLIT_MS;
  const sum = (xs: Buy[]) => xs.reduce((n, x) => n + x.bells, 0);
  const accepted: Buy[] = [];
  const half = () => Math.floor((sharedDays.reduce((n, d) => n + d.bells, 0) - sum(accepted.filter((x) => pre(x) && !voidedBefore(x, WALLET_SPLIT_MS)))) / 2);
  /** What p's own wallet holds just before t (voids strictly before it). */
  const own = (p: PersonId, t: number) => half() + ownBy(p, t)
    - sum(accepted.filter((x) => !pre(x) && x.by === p && !voidedBefore(x, t)))
    + sum(accepted.filter((x) => pre(x) && x.by === p && voidedBefore(x, t) && !voidedBefore(x, WALLET_SPLIT_MS)));
  for (const b of s.buys) {
    if (shopPrice(b.item, b.at) !== b.bells) continue;
    const room = pre(b)
      ? upTo(b.at).filter((d) => d.date < SPLIT_DAY).reduce((n, d) => n + d.bells, 0) - sum(accepted.filter((x) => !voidedBefore(x, b.at)))
      : own(b.by, b.at);
    if (room < b.bells) continue;
    accepted.push(b);
  }
  const voidedBy = (x: Buy) => theVoid.has(x.spendId) && theVoid.get(x.spendId)! <= now;
  /** Each wallet at now, once every event is in (the shared one's balance for both before the split). */
  const balance = (p: PersonId) => now >= WALLET_SPLIT_MS ? own(p, now + 1)
    : sharedDays.reduce((n, d) => n + d.bells, 0) - sum(accepted.filter((x) => !voidedBefore(x, now + 1)));
  return { st, accepted, voidedBy, earned: ledger.earned, ledger, balance };
}

describe('the wallets over random buys and voids', () => {
  it('the sheets cross the split: buys accepted on both sides, older ones undone after it', () => {
    const all = Array.from({ length: 60 }, (_, i) => randomSheet(i + 1)).map((x) => ({ x, o: oracle(x, x.end) }));
    expect(all.filter(({ o }) => o.accepted.some((b) => b.at < WALLET_SPLIT_MS) && o.accepted.some((b) => b.at >= WALLET_SPLIT_MS)).length).toBeGreaterThan(20);
    expect(all.some(({ x, o }) => o.accepted.some((b) => b.at < WALLET_SPLIT_MS && x.voids.some((v) => v.spendId === b.spendId && v.at >= WALLET_SPLIT_MS)))).toBe(true);
  });

  for (let seed = 1; seed <= 60; seed++) {
    it(`seed ${seed}: the replay follows the rule and the balance never goes negative`, () => {
      const sheet = randomSheet(seed);
      for (const now of [jstMs('2026-11-08', '12:00'), jstMs('2026-11-22', '20:00'), sheet.end, sheet.end + 30 * 86_400_000]) {
        const o = oracle(sheet, now);
        const w = walletAt(o.st, now);
        const due = o.accepted.filter((x) => x.at <= now);
        expect(w.spends.filter((x) => x.at <= now).map((x) => [x.spendId, x.bells, x.voided && x.voidedAt! <= now])).toEqual(
          due.map((x) => [x.spendId, x.bells, o.voidedBy(x)])
        );
        expect(w.earned).toBe(o.earned);
        for (const p of PEOPLE) expect(w.balance[p]).toBeGreaterThanOrEqual(0);
        if (now >= sheet.end) {
          expect(w.balance).toEqual({ A: o.balance('A'), B: o.balance('B') });
          expect(w.total).toBe(now >= WALLET_SPLIT_MS ? w.balance.A + w.balance.B : w.balance.A);
        }
        // A day pays 0–4 per person + がんばり 0–2, plus 2 when both met all four.
        for (const d of o.ledger.days) {
          for (const p of PEOPLE) {
            const met = RING_FRUITS.filter((f) => d.people[p].met[f]).length;
            expect(d.people[p].stretch).toBeGreaterThanOrEqual(0), expect(d.people[p].stretch).toBeLessThanOrEqual(STRETCH.cap);
            expect(d.people[p].bells).toBe(met + d.people[p].stretch);
          }
          expect(d.together).toBe(PEOPLE.every((p) => RING_FRUITS.every((f) => d.people[p].met[f])));
          expect(d.bells).toBeLessThanOrEqual(14);
          expect(d.bells).toBe(d.people.A.bells + d.people.B.bells + (d.together ? RULES.together : 0));
        }
      }
    });
  }
});

describe('a day: more never pays less', () => {
  /** One day's ベル for a fruit, with only that metric set to `v`. */
  const pay = (f: RingFruit, v: number): number => {
    const wk = '2026-11-02';
    const date = weekDays(wk)[2];
    const day: EarnDay = {
      date, steps: f === 'apple' ? v : null, exerciseMin: f === 'peach' ? v : null, moveKcal: f === 'pear' ? v : null,
      standMin: f === 'cherry' ? v : null, moveGoal: 600, stepsGoal: 8000
    };
    return earnWeek({ person: 'A', weekKey: wk, days: [day] }).days[2].bells;
  };
  const goalOf = (f: RingFruit): number =>
    f === 'peach' ? RULES.goals.exerciseMin : f === 'pear' ? 600 : f === 'cherry' ? RULES.goals.standMin : 8000;

  for (const f of RING_FRUITS) {
    it(`${f}: 0 below the goal, 1 from the goal on, 2 from 1.5× on`, () => {
      const goal = goalOf(f);
      for (let i = 0; i <= 400; i++) {
        const v = (goal * i) / 200; // 0 … 2 × the goal, fractions included
        expect(pay(f, v)).toBe(v >= stretchOf(goal) ? 2 : v >= goal ? 1 : 0);
      }
    });
  }
});
