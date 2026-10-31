// The demo runs the real model on generated rows: it must show a believable, consistent history.
import { beforeEach, describe, expect, it } from 'vitest';
import { composeModel } from '../view.ts';
import { demoCache } from './rows.ts';
import { buildWeekView } from '#lib/model/week.ts';
import { reduce } from '#lib/model/state.ts';
import { bellsLedger, dayDetail, editLog, historyWeeks } from '#lib/model/history.ts';
import { addDays } from '#lib/time/dates.ts';

describe.each(['2026-10-29T08:00:00.000Z', '2026-11-02T01:00:00.000Z', '2026-11-08T11:00:00.000Z', '2026-12-20T13:00:00.000Z'])('demo at %s', (iso) => {
  const now = Date.parse(iso);
  let cache: ReturnType<typeof demoCache>;
  let s: ReturnType<typeof reduce>;
  beforeEach(() => {
    cache = demoCache(now);
    s = reduce(cache.rows, cache.demo);
  });

  it('has 9 weeks of history for both people, with ベル, badges and edits by both', () => {
    const weeks = historyWeeks(s, now);
    expect(weeks).toHaveLength(9);
    const past = weeks.filter((w) => w.settled);
    expect(past.length).toBeGreaterThanOrEqual(8);
    for (const w of past) {
      expect(w.people.A.bells).toBeGreaterThan(2000);
      expect(w.people.B.bells).toBeGreaterThan(2000);
    }
    expect(past.some((w) => Object.values(w.people.A.ringBadges).some(Boolean))).toBe(true);
    const by = new Set(editLog(s).map((e) => e.by));
    expect([...by].sort()).toEqual(['A', 'B']);
    if (process.env.DEMO_DEBUG) console.log(iso, weeks.map((w) => `${w.weekKey} ${w.people.A.bells}/${w.people.B.bells} = ${w.bells}`));
  });

  it('four fruits only: no day earns anything but 🍑🍐🍒🍎, and no rows of the old workouts / presence tabs', () => {
    expect(Object.keys(cache.rows).sort()).toEqual(['events', 'metrics']);
    const settled = historyWeeks(s, now).filter((w) => w.settled);
    const days = settled.flatMap((w) => [0, 1, 2, 3, 4, 5, 6].map((i) => dayDetail(s, addDays(w.weekKey, i), now)));
    for (const d of days) expect(Object.keys(d.people.A.rings)).toEqual(['peach', 'pear', 'cherry', 'apple']);
  });

  it('the buys were all accepted (one voided); the menu is the default one', () => {
    const ledger = bellsLedger(s, now);
    const spends = Object.fromEntries(ledger.spends.map((x) => [x.spendId, x.voided]));
    expect(spends).toMatchObject({
      'demo-ice-1': false, 'demo-cafe-1': false, 'demo-snack-void': true, 'demo-snack-2': false, 'demo-dinner': false, 'demo-meal': false, 'demo-cafe-2': false
    });
    const m = composeModel(cache, [], now);
    const view = buildWeekView(m.state, m.me, m.now);
    expect(view.menu.map((x) => x.id)).toEqual(['snack', 'cafe', 'dinner', 'want', 'trip']); // the defaults, nothing custom
    expect(view.wallet).toMatchObject(ledger.wallet);
    expect(view.wallet.balance).toBeGreaterThan(0);
    if (process.env.DEMO_DEBUG) console.log(iso, view.wallet, view.people.A.today);
  });

  it('ADR 0021 rows: Move and Stand every day, no check-ins or questions; うめ’s Move goal applies from its day', () => {
    expect(cache.rows.events.filter((e) => !['spend', 'harvest', 'highfive', 'pref', 'metric_set', 'workout_edit', 'workout_add', 'spend_void'].includes(e[3]))).toEqual([]);
    const metrics = new Set(cache.rows.metrics.map((m) => m[3]));
    expect([...metrics].sort()).toEqual(['exercise_min', 'move_kcal', 'stand_min', 'steps', 'weight']);
    const settled = historyWeeks(s, now).filter((w) => w.settled);
    expect(settled.some((w) => Object.values(w.people.B.ringBadges).some(Boolean))).toBe(true);
    const goals = new Set(settled.flatMap((w) => [0, 1, 2, 3, 4, 5, 6].map((i) => dayDetail(s, addDays(w.weekKey, i), now).people.B.move.goal)));
    expect([...goals].sort()).toEqual([400, 450]);
  });
});
