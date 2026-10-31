// Usage: npm run bench   (plain Node ≥ 24, no build step)
// Times the compute-on-read model on (1) the golden 10-week rows and (2) realistic synthetic rows (scripts/bench-rows.ts:
// both people, hourly syncs) at year 1 and year 3, raw and after `compactRows` (what the client caches), then (3) the
// app's own paths at year 3: a poll, the minute tick, the IndexedDB write and the cold start from the cache.
// Acceptance: year 3, compacted, reduce + buildWeekView ≤ 15 ms on a laptop.
import { performance } from 'node:perf_hooks';
import { buildWeekView } from '#lib/model/week.ts';
import { bellsLedger, historyWeeks, weekDetail } from '#lib/model/history.ts';
import { compactRows } from '#lib/model/compact.ts';
import { reduce, type State } from '#lib/model/state.ts';
import { addDays, weekKeyOf } from '#lib/time/dates.ts';
import type { SnapshotRows } from '#lib/contract/api.ts';
import { applySnapshot, configureCache, loadCache, saveCache, cacheWritten, type SnapshotCache } from '#lib/sync/cache.ts';
import { composeModel } from '#lib/store/view.ts';
import { IDBFactory } from 'fake-indexeddb';
import golden from '../src/lib/model/fixtures/timeline-rows.json' with { type: 'json' };
import { FIRST_DAY, jst, syntheticRows } from './bench-rows.ts';

const RUNS = 5;
function time(label: string, fn: (i: number) => unknown): void {
  fn(RUNS); // warm up
  const t0 = performance.now();
  for (let i = 0; i < RUNS; i++) fn(i);
  console.log(`  ${label.padEnd(24)} ${((performance.now() - t0) / RUNS).toFixed(1).padStart(7)} ms`);
}
async function timeAsync(label: string, fn: (i: number) => Promise<unknown>): Promise<void> {
  await fn(RUNS);
  const t0 = performance.now();
  for (let i = 0; i < RUNS; i++) await fn(i);
  console.log(`  ${label.padEnd(24)} ${((performance.now() - t0) / RUNS).toFixed(1).padStart(7)} ms`);
}

const count = (r: SnapshotRows) => r.metrics.length + r.events.length;
const mb = (r: SnapshotRows) => (Buffer.byteLength(JSON.stringify(r)) / 1e6).toFixed(2);
const midweek = (days: number) => Date.parse(jst(addDays(FIRST_DAY, days - 4), '12:00'));

const year3 = syntheticRows(3 * 364);
const cases: [string, SnapshotRows, number][] = [
  ['golden rows, end of the timeline', golden as unknown as SnapshotRows, Date.parse('2027-01-12T15:00:00Z')]
];
for (const [label, days] of [['year 1', 364], ['year 3', 3 * 364]] as const) {
  const now = midweek(days);
  const raw = days === 3 * 364 ? year3 : syntheticRows(days);
  const small = compactRows(raw, now);
  cases.push([`${label}, hourly syncs, raw`, raw, now], [`${label}, hourly syncs, compacted`, small, now]);
}

for (const [name, rows, now] of cases) {
  console.log(`${name}: ${count(rows)} rows (${rows.metrics.length} metrics), ${mb(rows)} MB of JSON`);
  time('reduce', () => reduce(rows));
  time('reduce + buildWeekView', () => buildWeekView(reduce(rows), 'A', now));
  // What the app pays per poll or tick once the snapshot carries `rev`: locked weeks' earnings are reused.
  time('… with a rev', () => buildWeekView(reduce(rows, null, 'bench'), 'A', now));
  const wk = weekKeyOf(new Date(now + 9 * 3600_000).toISOString().slice(0, 10));
  // A fresh State per call (like the app after each poll), so per-State caches only help within one State.
  const fresh = () => Array.from({ length: RUNS + 1 }, () => reduce(rows));
  for (const [label, fn] of [
    ['buildWeekView', (st) => buildWeekView(st, 'A', now)],
    ['historyWeeks', (st) => historyWeeks(st, now)],
    ['bellsLedger', (st) => bellsLedger(st, now)],
    ['weekDetail', (st) => weekDetail(st, addDays(wk, -7), now)]
  ] as [string, (st: State) => unknown][]) {
    const states = fresh();
    time(label, (i) => fn(states[i]));
  }
}
console.log('compactRows on year 3:');
time('compactRows', () => compactRows(year3, midweek(3 * 364)));

// The app's paths at year 3, with a rev (as live): what a poll, the minute tick and a cold start cost.
console.log('app paths, year 3 (the cache as the client keeps it):');
const now3 = midweek(3 * 364);
const iso = (t: number) => new Date(t).toISOString();
const first = () => applySnapshot(null, { me: 'A', now: iso(now3), rev: 'bench', rows: year3 }, now3);
time('first fetch → cache', first);
const cache = first();
const empty = { metrics: [], events: [] };
time('empty poll → cache', (i) => applySnapshot(cache, { me: 'A', now: iso(now3 + (i + 1) * 60_000), rev: 'bench', rows: empty }, now3));
const lastMetric = cache.rows.metrics.at(-1)!;
const oneRow = (i: number) => ({ metrics: [[iso(now3 + i * 1000 + 1), lastMetric[1], lastMetric[2], lastMetric[3], Number(lastMetric[4]) + i + 1]], events: [] }) as SnapshotRows;
time('poll + 1 row → view', (i) => {
  const c = applySnapshot(cache, { me: 'A', now: iso(now3 + i * 1000 + 2), rev: 'bench', rows: oneRow(i) }, now3);
  const m = composeModel(c, [], now3);
  return buildWeekView(m.state, m.me, m.now);
});
const model = composeModel(cache, [], now3);
time('minute tick → view', (i) => buildWeekView(model.state, 'A', now3 + (i + 1) * 60_000));
const idb = new IDBFactory();
configureCache({ indexedDB: idb });
await timeAsync('saveCache (IndexedDB)', async (i) => {
  await saveCache({ ...cache, fetchedAt: now3 + i } as SnapshotCache);
  await cacheWritten();
});
await timeAsync('cold start → view', async () => {
  configureCache({ indexedDB: idb }); // a new page load: nothing in memory
  const c = (await loadCache())!;
  const m = composeModel(c, [], now3);
  return buildWeekView(m.state, m.me, m.now);
});
