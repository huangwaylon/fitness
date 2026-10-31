// The demo runs the real model on generated rows: it must show a believable, consistent history.
import { beforeEach, describe, expect, it } from 'vitest';
import { composeModel } from '../view.ts';
import { demoCache } from './rows.ts';
import { buildWeekView } from '#lib/model/week.ts';
import { provisionalMs, reduce } from '#lib/model/state.ts';
import { economyWeeks, weekBells, weekSum } from '#lib/model/bells.ts';
import { bellsLedger, dayDetail } from '#lib/model/history.ts';
import { addDays } from '#lib/time/dates.ts';

describe.each(['2026-10-29T08:00:00.000Z', '2026-11-02T01:00:00.000Z', '2026-11-08T11:00:00.000Z', '2026-12-20T13:00:00.000Z'])('demo at %s', (iso) => {
  const now = Date.parse(iso);
  let cache: ReturnType<typeof demoCache>;
  let s: ReturnType<typeof reduce>;
  beforeEach(() => {
    cache = demoCache(now);
    s = reduce(cache.rows);
  });

  it('has 9 weeks of history for both people, with ベル and some ふたりでぜんぶ days', () => {
    const weeks = economyWeeks(s, now);
    expect(weeks).toHaveLength(9);
    const past = weeks.filter((wk) => provisionalMs(wk) <= now);
    expect(past.length).toBeGreaterThanOrEqual(8);
    const sums = past.map((wk) => weekSum(weekBells(s, wk, now), addDays(wk, 6)));
    for (const w of sums) {
      expect(w.A).toBeGreaterThan(8);
      expect(w.B).toBeGreaterThan(8);
      expect(w.total).toBeLessThanOrEqual(70);
    }
    expect(sums.some((w) => w.togetherDays > 0)).toBe(true);
  });

  it('four fruits only, and no rows of the old workouts / presence tabs', () => {
    expect(Object.keys(cache.rows).sort()).toEqual(['events', 'metrics']);
    const d = dayDetail(s, economyWeeks(s, now)[0], now);
    expect(Object.keys(d.people.A.met)).toEqual(['pear', 'peach', 'cherry', 'apple']);
  });

  it('the buys were all accepted (one voided); the wallet adds up', () => {
    const ledger = bellsLedger(s, now);
    const sent = cache.rows.events.filter((e) => e[3] === 'spend').map((e) => JSON.parse(e[4]).spendId);
    expect(ledger.spends.map((x) => x.spendId).sort()).toEqual([...sent].sort());
    expect(ledger.spends.filter((x) => x.voided).map((x) => x.spendId)).toEqual(sent.includes('demo-snack-void') ? ['demo-snack-void'] : []);
    const m = composeModel(cache, [], now);
    const view = buildWeekView(m.state, m.me, m.now);
    expect(view.wallet.balance).toBe(ledger.earned - ledger.spends.reduce((n, x) => (x.voided ? n : n + x.bells), 0));
    expect(view.wallet.balance).toBeGreaterThan(20);
    if (process.env.DEMO_DEBUG) console.log(iso, view.wallet, view.people.A.today, view.together);
  });

  it('Move and Stand every day, no check-ins or questions; うめ’s Move goal applies from its day', () => {
    expect(cache.rows.events.filter((e) => !['spend', 'spend_void', 'harvest', 'highfive', 'pref'].includes(e[3]))).toEqual([]);
    const metrics = new Set(cache.rows.metrics.map((m) => m[3]));
    expect([...metrics].sort()).toEqual(['exercise_min', 'move_kcal', 'stand_min', 'steps', 'weight']);
    const settled = economyWeeks(s, now).filter((wk) => provisionalMs(wk) <= now);
    const goals = new Set(settled.flatMap((wk) => [0, 1, 2, 3, 4, 5, 6].map((i) => dayDetail(s, addDays(wk, i), now).people.B.move.goal)));
    expect([...goals].sort()).toEqual([400, 450]);
  });
});
