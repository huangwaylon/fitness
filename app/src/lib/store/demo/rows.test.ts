// The demo runs the real model on generated rows: it must show a believable, consistent history.
import { beforeEach, describe, expect, it } from 'vitest';
import { composeModel } from '../view.ts';
import { demoCache } from './rows.ts';
import { buildWeekView } from '#lib/model/week.ts';
import { reduce } from '#lib/model/state.ts';
import { bellsLedger, editLog, historyWeeks } from '#lib/model/history.ts';

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
    expect(past.some((w) => Object.values(w.people.A.badges).some(Boolean))).toBe(true);
    const by = new Set(editLog(s).map((e) => e.by));
    expect([...by].sort()).toEqual(['A', 'B']);
    if (process.env.DEMO_DEBUG) console.log(iso, weeks.map((w) => `${w.weekKey} ${w.people.A.bells}/${w.people.B.bells} = ${w.bells}`));
  });

  it('the spends were all accepted (one voided), the menu was edited, the island asks about the yoga', () => {
    const ledger = bellsLedger(s, now);
    const spends = Object.fromEntries(ledger.spends.map((x) => [x.spendId, x.voided]));
    expect(spends).toMatchObject({ 'demo-ice-1': false, 'demo-cafe-1': false, 'demo-snack-void': true, 'demo-parfait': false, 'demo-daytrip': false, 'demo-cafe-2': false });
    const m = composeModel(cache, [], now);
    const view = buildWeekView(m.state, m.me, m.now);
    expect(view.pending.some((p) => p.kind === 'workout')).toBe(true);
    expect(view.menus.treat.map((x) => x.id)).toContain('parfait');
    expect(view.pots.treat).toEqual(ledger.pots.treat);
    expect(view.pots.trip.spent).toBe(12000);
    expect(view.pots.treat.balance).toBeGreaterThan(0);
    expect(view.pots.trip.balance).toBeGreaterThan(0);
    if (process.env.DEMO_DEBUG) console.log(iso, view.pots, view.people.A.today);
  });
});
