// Property-style checks of the economy over seeded random histories (cheap: a few hundred small sheets).
// - The wallet: over random buys, voids (by the buyer, the partner, twice, early) and edits, the replay matches a
//   plain re-implementation of the rule (bells.ts `walletAt`), and the balance never goes negative.
// - The milestone curve: more of a metric never pays less, the pay never passes the fruit's max, and the goal pays it.
import { describe, expect, it } from 'vitest';
import type { EventRow, MetricRow } from '#lib/contract/api.ts';
import type { PersonId, RingFruit } from '#lib/types.ts';
import { DEFAULT_MENU, ESCALATING_ITEMS, ESCALATION, RING_FRUITS, rulesFor } from '#lib/config/rules.ts';
import { addDays, localDateAt, weekDays, weekKeyOf } from '#lib/time/dates.ts';
import { mulberry32 } from '#lib/random.ts';
import { earnWeek, milestoneBells, type EarnDay } from '#lib/scoring/bells.ts';
import { reduce } from './state.ts';
import { bellsLedger, menuView, treatPrice, walletAt } from './bells.ts';

const jstMs = (date: string, hm: string) => Date.parse(`${date}T${hm}:00+09:00`);
const iso = (ms: number) => new Date(ms).toISOString();
const PEOPLE: PersonId[] = ['A', 'B'];
const ITEMS = [...DEFAULT_MENU.map((x) => x.id), 'ice'];
const BASE = new Map<string, number>(DEFAULT_MENU.map((x) => [x.id, x.bells]));

interface Buy { at: number; by: PersonId; spendId: string; item: string; bells: number }
interface Void { at: number; by: PersonId; spendId: string }

/** A random sheet: 4 weeks of metrics (v1's last week and three v2 weeks), buys at the right price or not, voids, edits. */
function randomSheet(seed: number) {
  const rand = mulberry32(seed);
  const pick = <T>(xs: readonly T[]): T => xs[Math.floor(rand() * xs.length)];
  const metrics: MetricRow[] = [];
  const events: EventRow[] = [];
  const first = '2026-10-26';
  for (let d = 0; d < 28; d++) {
    const date = addDays(first, d);
    for (const p of PEOPLE) {
      if (rand() < 0.15) continue; // a day without a sync
      const at = iso(jstMs(date, '21:00') + Math.floor(rand() * 3_600_000));
      metrics.push(
        [at, p, date, 'steps', Math.floor(rand() * 12_000)], [at, p, date, 'exercise_min', Math.floor(rand() * 80)],
        [at, p, date, 'move_kcal', Math.floor(rand() * 900)], [at, p, date, 'stand_min', Math.floor(rand() * 240)]
      );
    }
  }
  // Events at strictly increasing server times (like LAST_AT), from the Wednesday of the first week.
  let t = jstMs('2026-10-28', '08:00');
  const buys: Buy[] = [];
  const voids: Void[] = [];
  const counts = new Map<string, number>(); // a naive client's count (it can be wrong: that's the point)
  let id = 0;
  for (let i = 0; i < 60; i++) {
    t += Math.floor(rand() * 14 * 3_600_000) + 1;
    const by = pick(PEOPLE);
    const r = rand();
    if (r < 0.6 || buys.length === 0) {
      const item = pick(ITEMS);
      const base = BASE.get(item) ?? 900;
      const key = `${weekKeyOf(localDateAt(t))}|${item}`;
      const n = counts.get(key) ?? 0;
      // Mostly the price the client would show; sometimes a stale price, sometimes a random one.
      const bells = rand() < 0.7 ? treatPrice(base, n) : rand() < 0.5 ? treatPrice(base, Math.max(0, n - 1)) : 1 + Math.floor(rand() * 9000);
      counts.set(key, n + 1);
      const b = { at: t, by, spendId: `s${id++}`, item, bells };
      buys.push(b);
      events.push([iso(t), by, `e${i}`, 'spend', JSON.stringify({ spendId: b.spendId, item, label: item, bells })]);
    } else {
      const target = pick(buys);
      // A void of an earlier buy, by the buyer or the partner (ignored), sometimes a second one (ignored).
      const v = { at: t, by: rand() < 0.75 ? target.by : by, spendId: target.spendId };
      voids.push(v);
      events.push([iso(t), v.by, `e${i}`, 'spend_void', JSON.stringify({ spendId: v.spendId })]);
    }
  }
  return { rows: { metrics, events }, buys, voids, end: t };
}

/**
 * The rule written out plainly (one wallet, escalating treats), against the ledger's earnings: a buy counts if
 * it is at this week's price (from ESCALATION.enforceFrom) and the wallet covers it; the buyer's first void after it
 * gives it back.
 */
function oracle(s: ReturnType<typeof randomSheet>, now: number) {
  const st = reduce(s.rows);
  const ledger = bellsLedger(st, now);
  const earnedBy = (t: number) =>
    ledger.days.filter((d) => d.date <= localDateAt(t)).reduce((n, d) => n + d.bells, 0) +
    ledger.bonuses.filter((b) => b.at <= t).reduce((n, b) => n + b.bells, 0);
  const theVoid = new Map<string, number>();
  for (const v of s.voids) {
    const b = s.buys.find((x) => x.spendId === v.spendId)!;
    if (v.by === b.by && v.at >= b.at && !theVoid.has(v.spendId)) theVoid.set(v.spendId, v.at);
  }
  const accepted: Buy[] = [];
  const live = (t: number) => accepted.filter((x) => !(theVoid.get(x.spendId)! < t)); // voided strictly before t
  for (const b of s.buys) {
    const ok = live(b.at);
    if (ESCALATING_ITEMS.includes(b.item) && b.at >= Date.parse(ESCALATION.enforceFrom)) {
      const n = ok.filter((x) => x.item === b.item && weekKeyOf(localDateAt(x.at)) === weekKeyOf(localDateAt(b.at))).length;
      if (b.bells !== treatPrice(BASE.get(b.item)!, n)) continue;
    }
    if (earnedBy(b.at) - ok.reduce((n, x) => n + x.bells, 0) < b.bells) continue;
    accepted.push(b);
  }
  const voidedBy = (x: Buy) => theVoid.has(x.spendId) && theVoid.get(x.spendId)! <= now;
  return { st, accepted, voidedBy, earned: ledger.earned };
}

describe('the wallet over random buys, voids and edits', () => {
  for (let seed = 1; seed <= 60; seed++) {
    it(`seed ${seed}: the replay follows the rule and the balance never goes negative`, () => {
      const sheet = randomSheet(seed);
      for (const now of [jstMs('2026-11-02', '12:00'), jstMs('2026-11-15', '20:00'), sheet.end, sheet.end + 30 * 86_400_000]) {
        const o = oracle(sheet, now);
        const w = walletAt(o.st, now);
        const due = o.accepted.filter((x) => x.at <= now);
        expect(w.spends.filter((x) => x.at <= now).map((x) => [x.spendId, x.bells, x.voided && x.voidedAt! <= now])).toEqual(
          due.map((x) => [x.spendId, x.bells, o.voidedBy(x)])
        );
        expect(w.wallet.earned).toBe(o.earned);
        expect(w.wallet.balance).toBe(w.wallet.earned - w.wallet.spent);
        expect(w.wallet.balance).toBeGreaterThanOrEqual(0);
        expect(w.wallet.spent).toBe(w.spends.filter((x) => !x.voided).reduce((n, x) => n + x.bells, 0));
        // The menu's next price is this week's count of live buys of the item, both people.
        const cur = weekKeyOf(localDateAt(now));
        for (const m of menuView(o.st, 'ja', now)) {
          const n = w.spends.filter((x) => !x.voided && x.item === m.id && weekKeyOf(localDateAt(x.at)) === cur).length;
          expect([m.boughtThisWeek, m.price]).toEqual([n, m.escalates ? treatPrice(m.basePrice, n) : m.basePrice]);
        }
      }
    });
  }
});

describe('treatPrice', () => {
  it('never falls below the base, never falls as n grows, and lands on the 50s from the first repeat', () => {
    for (const base of [1, 10, 49, 50, 800, 1200, 1234, 2500, 6000, 9999]) {
      let prev = 0;
      for (let n = 0; n <= 12; n++) {
        const p = treatPrice(base, n);
        expect(p).toBeGreaterThanOrEqual(Math.max(base, prev));
        if (n > 0 && p !== base) expect(p % ESCALATION.roundTo).toBe(0);
        prev = p;
      }
    }
  });
});

describe('the milestone curve (v2) and the linear rules (v1): more never pays less', () => {
  /** One day's ベル for a fruit, with only that metric set to `v`. */
  const pay = (wk: string, f: RingFruit, v: number): number => {
    const date = weekDays(wk)[2];
    const day: EarnDay = {
      date, steps: f === 'apple' ? v : null, exerciseMin: f === 'peach' ? v : null, moveKcal: f === 'pear' ? v : null,
      standMin: f === 'cherry' ? v : null, moveGoal: 600
    };
    return earnWeek({ person: 'A', weekKey: wk, days: [day] }).days[2].rings[f];
  };
  const goalOf = (wk: string, f: RingFruit): number => {
    const g = rulesFor(wk).goals;
    return f === 'peach' ? g.exerciseMin : f === 'pear' ? 600 : f === 'cherry' ? g.standMin : g.steps;
  };

  for (const wk of ['2026-10-26', '2026-11-02']) {
    for (const f of RING_FRUITS) {
      it(`${wk} ${f}: non-decreasing up to the max at the goal, flat above it`, () => {
        const goal = goalOf(wk, f);
        const steps = milestoneBells(wk, f);
        const max = pay(wk, f, goal);
        if (steps) expect(max).toBe(steps.at(-1));
        let prev = 0;
        for (let i = 0; i <= 400; i++) {
          const v = (goal * i) / 200; // 0 … 2 × the goal, fractions included
          const p = pay(wk, f, v);
          expect(p).toBeGreaterThanOrEqual(prev);
          expect(p).toBeLessThanOrEqual(max);
          if (v >= goal) expect(p).toBe(max);
          prev = p;
        }
        // The steps ascend strictly (each milestone pays more than the last).
        if (steps) for (let i = 1; i < steps.length; i++) expect(steps[i]).toBeGreaterThan(steps[i - 1]);
      });
    }
  }
});
