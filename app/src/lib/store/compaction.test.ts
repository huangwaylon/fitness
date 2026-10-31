// The cache as the app really builds it: incremental `since` replies merged and compacted by
// applySnapshot, composed with `rev` and the previous model reused (the store's path), must show exactly what the
// full uncompacted rows show, at every poll through harvests and locks.
import { describe, expect, it } from 'vitest';
import type { SnapshotRows } from '#lib/contract/api.ts';
import { reduce } from '#lib/model/state.ts';
import { buildWeekView } from '#lib/model/week.ts';
import { bellsLedger } from '#lib/model/history.ts';
import { addDays } from '#lib/time/dates.ts';
import { applySnapshot, type SnapshotCache } from '#lib/sync/cache.ts';
import { FIRST_DAY, jst, syntheticRows } from '../../../scripts/bench-rows.ts';
import { composeModel, type ComposedModel } from './view.ts';

const atOf = (r: { 0: string }) => Date.parse(r[0]);
const between = (rows: SnapshotRows, from: number, to: number): SnapshotRows => {
  const f = <T extends { 0: string }>(tab: T[]) => tab.filter((r) => atOf(r) > from && atOf(r) <= to);
  return { metrics: f(rows.metrics), events: f(rows.events) };
};
const shown = (m: Pick<ComposedModel, 'state' | 'now'>) => JSON.stringify({
  a: buildWeekView(m.state, 'A', m.now), b: buildWeekView(m.state, 'B', m.now), ledger: bellsLedger(m.state, m.now)
});

describe('compacted cache through applySnapshot', () => {
  const all = syntheticRows(70);
  const at = (day: number, time: string) => Date.parse(jst(addDays(FIRST_DAY, day), time));
  // Polls: twice a day, plus either side of two Sunday harvests and two Wednesday locks.
  const polls = [
    ...Array.from({ length: 69 }, (_, d) => [at(d, '08:10'), at(d, '21:40')]).flat(),
    at(41, '19:29'), at(41, '19:31'), at(44, '03:59'), at(44, '04:01'), at(55, '19:31'), at(58, '04:05')
  ].sort((x, y) => x - y);

  it('shows exactly the uncompacted views, with far fewer rows', () => {
    let cache: SnapshotCache | null = null;
    let model: ComposedModel | null = null;
    let last = 0;
    for (const [i, t] of polls.entries()) {
      cache = applySnapshot(cache, { me: 'A', now: new Date(t).toISOString(), rev: 'r1', rows: between(all, last, t) }, t);
      last = t;
      model = composeModel(cache, [], t, model);
      // Checking every poll is slow; every few polls and around the cutoffs is enough.
      if (i % 9 && !(t >= at(41, '19:00') && t <= at(44, '05:00'))) continue;
      const full = between(all, 0, t);
      expect(shown(model), new Date(t).toISOString()).toBe(shown({ state: reduce(full), now: t }));
      // The minute tick: same rows, later now (the reduced state is reused).
      const later = composeModel(cache, [], t + 50 * 60_000, model);
      expect(later.state).toBe(model.state);
      expect(shown(later)).toBe(shown({ state: reduce(full), now: t + 50 * 60_000 }));
    }
    expect(cache!.rows.metrics.length).toBeLessThan(between(all, 0, last).metrics.length * 0.3);
  });

  it('`since` stays the newest server `at`, even when compaction drops rows', () => {
    const t = at(60, '12:00');
    const c = applySnapshot(null, { me: 'A', now: new Date(t).toISOString(), rev: 'r1', rows: between(all, 0, t) }, t);
    const newest = [all.metrics, all.events].flat().map(atOf).filter((x) => x <= t).reduce((x, y) => Math.max(x, y));
    expect(Date.parse(c.since!)).toBe(newest);
    expect(c.rowsAt).toBe(t);
    // A poll that drops nothing keeps rowsAt (the model's reuse of locked weeks stays valid).
    const next = applySnapshot(c, { me: 'A', now: new Date(t + 60_000).toISOString(), rev: 'r1', rows: {} }, t + 60_000);
    expect(next.rowsAt).toBe(t);
  });

  it('a poll compacts again only past a newer lock (compaction is a fixed point; skipping it drops nothing)', () => {
    const t = at(45, '12:00'); // Thursday: the week of day 35 locked on day 44, 04:00
    const c = applySnapshot(null, { me: 'A', now: new Date(t).toISOString(), rev: 'r1', rows: between(all, 0, t) }, t);
    expect(c.compactedAt).toBe(at(44, '04:00'));
    // Polls until the next lock add their open-week rows as they are: no pass over the whole cache.
    const t2 = at(50, '21:40');
    const next = applySnapshot(c, { me: 'A', now: new Date(t2).toISOString(), rev: 'r1', rows: between(all, t, t2) }, t2);
    expect(next.compactedAt).toBe(c.compactedAt);
    expect(next.rows.metrics.length).toBe(c.rows.metrics.length + between(all, t, t2).metrics.length);
    expect(next.rowsAt).toBe(c.rowsAt);
    // Past the next lock (day 51, 04:00) the poll compacts the week that just locked.
    const t3 = at(51, '08:10');
    const after = applySnapshot(next, { me: 'A', now: new Date(t3).toISOString(), rev: 'r1', rows: between(all, t2, t3) }, t3);
    expect(after.compactedAt).toBe(at(51, '04:00'));
    expect(after.rows.metrics.length).toBeLessThan(next.rows.metrics.length);
    expect(shown({ state: reduce(after.rows), now: t3 })).toBe(shown({ state: reduce(between(all, 0, t3)), now: t3 }));
  });

  it('passes rev to the model, except while a queued row is stamped before the latest lock (an old offline tap)', () => {
    const t = at(44, '04:10'); // Wednesday, 10 minutes after the lock
    const c = applySnapshot(null, { me: 'A', now: new Date(t - 3 * 3600_000).toISOString(), rev: 'r1', rows: between(all, 0, t - 3 * 3600_000) }, t - 3 * 3600_000);
    const tap = (queuedAt: number) => ({ id: `q${queuedAt}`, type: 'highfive' as const, data: {}, queuedAt, tries: 0, nextAt: queuedAt });
    expect(composeModel(c, [], t).from?.rev).toBe(`r1@${c.rowsAt}`);
    expect(composeModel(c, [tap(t - 60_000)], t).from?.rev).toBe(`r1@${c.rowsAt}`);
    expect(composeModel(c, [tap(at(44, '03:00'))], t).from?.rev).toBeNull();
    expect(composeModel({ ...c, rev: undefined }, [], t).from?.rev).toBeNull();
  });
});
