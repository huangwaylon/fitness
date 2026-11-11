// A poll's rows folded over the last State (model/state.ts foldRows) are the State a whole reduce gives: the activity,
// the weight and body metrics, the events, the guest's, the raw meal-log rows, rows a check refuses, and a batch that
// comes out of order (reduced whole). Every Apple Health row the record sent is in it, as a whole reduce has it. A fold
// copies only the lists it writes (the rest the base's own: the memos keyed on them hold), never touching an older one.
import { describe, expect, it } from 'vitest';
import { syntheticRows } from '../../../scripts/bench-rows.ts';
import type { EventRow, MetricRow, SnapshotRows } from '#lib/contract/api.ts';
import type { Who } from '#lib/types.ts';
import { mergeRows } from './snapshot.ts';
import { foldEvents, reduce, reduceStats, type State } from './state.ts';

const iso = (ms: number) => new Date(ms).toISOString();

/** A few rows of every kind after `t0`, one a second. */
function extras(t0: number, n: number, date: string): { metrics: MetricRow[]; events: EventRow[] } {
  let t = t0;
  const at = () => iso((t += 1000));
  const metrics: MetricRow[] = [], events: EventRow[] = [];
  for (let i = 0; i < n; i++) {
    metrics.push([at(), 'A', date, 'steps', 9000 + i], [at(), 'B', date, 'move_kcal', 300 + i], [at(), 'A', date, 'weight', 61.23 + i / 10], [at(), 'B', date, 'body_fat_pct', 24.56],
      [at(), 'A', date, 'bmi', 21.1], [at(), 'B', date, 'lean_kg', 40.2], [at(), 'A', date, 'weight', 900], [at(), 'G', date, 'steps', 5] as unknown as MetricRow, [at(), 'A', 'not-a-date', 'steps', 1], [at(), 'B', date, 'stand_min', '' as unknown as number]);
    events.push(
      [at(), 'A', `p${t}`, 'pref', JSON.stringify({ key: 'locale', value: i % 2 ? 'en' : 'ja' })],
      [at(), 'G', `g${t}`, 'pref', JSON.stringify({ key: 'villagerName', value: 'ゲスト' })],
      [at(), 'B', `f${t}`, 'find', JSON.stringify({ kind: 'fish', id: 'koi' })],
      [at(), 'A', `m${t}`, 'food', JSON.stringify({ op: 'x' })],
      [at(), 'B', `s${t}`, 'spend', JSON.stringify({ spendId: `x${t}`, item: 'snack', bells: 40 })],
      [at(), 'A', `bad${t}`, 'nonsense', '{}'] as unknown as EventRow,
      [at(), 'B', `mg${t}`, 'pref', JSON.stringify({ key: 'moveGoal', value: 450 })]
    );
  }
  return { metrics, events };
}
const lastMs = (rows: SnapshotRows) => Math.max(Date.parse(String(rows.metrics.at(-1)![0])), Date.parse(String(rows.events.at(-1)![0])));

describe('a poll folded over the last State (reduce, foldRows)', () => {
  it('is the State a whole reduce of the same rows gives, batch after batch; a batch out of order is reduced whole', () => {
    const all = syntheticRows(200);
    let rows: SnapshotRows = { metrics: all.metrics.slice(0, 20_000), events: all.events.slice(0, 40) };
    reduce(rows, 'r0');
    const batches: Partial<SnapshotRows>[] = [
      { metrics: all.metrics.slice(20_000, 20_050), events: all.events.slice(40, 45) },
      { metrics: all.metrics.slice(20_050, 20_051) },
      { events: all.events.slice(45, 50) },
      {}
    ];
    let n = 0;
    for (const [i, b] of batches.entries()) {
      rows = mergeRows(rows, b);
      const folds = reduceStats.folds;
      const folded = reduce(rows, `r${i + 1}`);
      expect(reduceStats.folds, `batch ${i} folded`).toBe(folds + 1);
      expect(folded).toEqual(reduce(structuredClone(rows), `r${i + 1}`));
      reduce(rows, `r${i + 1}`);
      n++;
    }
    // every kind of row after them
    const date = String(rows.metrics.at(-1)![2]);
    rows = mergeRows(rows, extras(lastMs(rows), 3, date));
    let folds = reduceStats.folds;
    const folded = reduce(rows, 'rx');
    expect(reduceStats.folds).toBe(folds + 1);
    const whole = reduce(structuredClone(rows), 'rx');
    expect(folded).toEqual(whole);
    // (every weight row a check takes is there: the record's Apple Health data, whole)
    const day = folded.weights.A.get(date as never) ?? [];
    expect(day.map((w) => w.v)).toEqual([61.2, 61.3, 61.4]);
    expect(folded.food.length).toBe(whole.food.length);
    reduce(rows, 'rx');
    // a late row (stamped before the last): no fold, reduced whole, the same State
    const late: MetricRow = [iso(lastMs(rows) - 3_600_000), 'A', date, 'steps', 12345];
    rows = mergeRows(rows, { metrics: [late] });
    folds = reduceStats.folds;
    const again = reduce(rows, 'ry');
    expect(reduceStats.folds).toBe(folds);
    expect(again).toEqual(reduce(structuredClone(rows), 'ry'));
    expect(n).toBe(4);
  });

  it('never touches the State it folds over (bells.ts caches per State)', () => {
    const all = syntheticRows(60);
    let rows: SnapshotRows = { metrics: all.metrics.slice(0, 3000), events: all.events.slice(0, 10) };
    const base = reduce(rows, 'a');
    const before = structuredClone(base);
    rows = mergeRows(rows, extras(lastMs(rows), 2, String(rows.metrics.at(-1)![2])));
    const folded = reduce(rows, 'b');
    expect(folded).not.toBe(base);
    expect(base).toEqual(before);
  });

  it('copies only the lists a row writes (copy-on-write): the rest keep their identity, and no fold reaches an older State', () => {
    const all = syntheticRows(60);
    let rows: SnapshotRows = { metrics: all.metrics.slice(0, 3000), events: all.events.slice(0, 10) };
    const base = reduce(rows, 'a');
    const before = structuredClone(base);
    const t = lastMs(rows);
    const D = String(rows.metrics.at(-1)![2]);
    const ev = (i: number, type: string, data: object, person: Who = 'A'): EventRow => [iso(t + i * 1000), person, `cow${i}`, type as EventRow[3], JSON.stringify(data)];
    const farm = ev(1, 'farm', { d: D, ops: [{ o: 'plant', p: 'fd:field-A.0.0', c: 'tomato', src: 'start' }] });
    // a queued farm tap (foldEvents), then the poll that brings it (reduce's foldRows), then a catch and a pref over that
    const queued = foldEvents(base, [farm], null)!;
    rows = mergeRows(rows, { events: [farm] });
    const polled = reduce(rows, 'b');
    const polledBefore = structuredClone(polled);
    rows = mergeRows(rows, { events: [ev(2, 'tally', { date: D, counts: { 'fish:koi': 2 } }), ev(3, 'pref', { key: 'locale', value: 'en' }, 'B')] });
    const caught = reduce(rows, 'c');
    const health = reduce(mergeRows(rows, { metrics: [[iso(t + 4000), 'A', D, 'steps', 12345]] }), 'd');
    expect(reduceStats.folds).toBeGreaterThanOrEqual(3);
    // the older States as they were
    expect(base).toEqual(before);
    expect(polled).toEqual(polledBefore);
    // each fold copied what it wrote, and shares the rest
    const lists = ['farm', 'tallies', 'shop', 'islandDays', 'finds', 'food', 'bellSpends', 'harvests', 'decor', 'tent', 'layout', 'board', 'pack', 'wedding', 'wet', 'prefs', 'dailyGoals'] as const;
    const changed = (a: State, b: State) => lists.filter((k) => a[k] !== b[k]);
    expect(changed(base, queued)).toEqual(['farm']);
    expect(changed(base, polled)).toEqual(['farm']);
    expect(changed(polled, caught)).toEqual(['tallies', 'prefs']);
    expect(caught.prefs.A).toBe(polled.prefs.A);
    expect(caught.prefs.B).not.toBe(polled.prefs.B);
    expect(changed(caught, health)).toEqual([]);
    expect(queued.farm.length).toBe(base.farm.length + 1);
    expect(queued.farm.at(-1)!.queued).toBe(true);
    expect(polled.farm.at(-1)!.queued).toBeUndefined();
    expect(caught).toEqual(reduce(structuredClone(rows), 'c'));
  });
});
