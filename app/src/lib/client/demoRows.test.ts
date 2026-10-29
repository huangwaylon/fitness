// The demo runs the real model on generated rows: it must show a believable, consistent history.
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { composeView } from './view.ts';
import { demoCache } from './demoRows.ts';
import { reduce, setDemoCalendar } from '#lib/model/state.ts';
import { editLog, historyWeeks, moneyLog } from '#lib/model/history.ts';

afterAll(() => setDemoCalendar(null));

describe.each(['2026-10-29T08:00:00.000Z', '2026-11-02T01:00:00.000Z', '2026-11-08T11:00:00.000Z', '2026-12-20T13:00:00.000Z'])('demo at %s', (iso) => {
  const now = Date.parse(iso);
  let cache: ReturnType<typeof demoCache>;
  let s: ReturnType<typeof reduce>;
  beforeEach(() => {
    cache = demoCache(now); // also moves the model's calendar to this demo's weeks
    s = reduce(cache.rows);
  });

  it('has 9 weeks of history for both people, with scores, yen and edits by both', () => {
    const weeks = historyWeeks(s, now);
    expect(weeks).toHaveLength(9);
    const past = weeks.filter((w) => w.settled);
    expect(past.length).toBeGreaterThanOrEqual(8);
    for (const w of past) {
      expect(w.people.A.score).toBeGreaterThan(30);
      expect(w.people.B.score).toBeGreaterThan(30);
      expect(w.yen).toBeGreaterThan(0);
    }
    const by = new Set(editLog(s).map((e) => e.by));
    expect([...by].sort()).toEqual(['A', 'B']);
    if (process.env.DEMO_DEBUG) console.log(iso, weeks.map((w) => `${w.weekKey} ${w.people.A.score}/${w.people.B.score} ¥${w.yen}`));
  });

  it('the treats were all accepted (one voided), the island asks about the yoga', () => {
    const money = moneyLog(s, now);
    const spends = money.months.flatMap((m) => m.spends);
    expect(Object.fromEntries(spends.map((x) => [x.label, x.status]))).toEqual({ カフェ: 'done', カラオケ: 'done', 映画: 'voided', 温泉: 'done' });
    const view = composeView(cache, [], now);
    expect(view.pending.some((p) => p.kind === 'workout')).toBe(true);
    expect(view.jar.totalYen).toBe(money.totalYen);
    expect(view.jar.purseYen).toBeGreaterThanOrEqual(0);
  });
});
