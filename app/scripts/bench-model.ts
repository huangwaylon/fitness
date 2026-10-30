// Usage: npm run bench   (plain Node ≥ 24, no build step)
// Times the compute-on-read model on (1) the golden 10-week rows and (2) realistic synthetic rows (scripts/bench-rows.ts:
// both people, hourly syncs) at year 1 and year 3, raw and after `compactRows` (what the client caches, round 9).
// Acceptance (round 9): year 3, compacted, reduce + buildWeekView ≤ 15 ms on a laptop.
import { performance } from 'node:perf_hooks';
import { buildWeekView } from '#lib/model/week.ts';
import { bellsLedger, historyWeeks, moneyLog, weekDetail } from '#lib/model/history.ts';
import { compactRows } from '#lib/model/compact.ts';
import { reduce, type State } from '#lib/model/state.ts';
import { addDays, weekKeyOf } from '#lib/scoring/index.ts';
import type { SnapshotRows } from '#lib/contract/api.ts';
import golden from '../src/lib/model/fixtures/timeline-rows.json' with { type: 'json' };
import { FIRST_DAY, jst, syntheticRows } from './bench-rows.ts';

const RUNS = 5;
function time(label: string, fn: (i: number) => unknown): void {
  fn(RUNS); // warm up
  const t0 = performance.now();
  for (let i = 0; i < RUNS; i++) fn(i);
  console.log(`  ${label.padEnd(24)} ${((performance.now() - t0) / RUNS).toFixed(1).padStart(7)} ms`);
}

const count = (r: SnapshotRows) => r.metrics.length + r.workouts.length + r.presence.length + r.events.length;
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
  // What the app pays per poll or tick once the snapshot carries `rev`: past cutoffs' payouts are reused.
  time('… with a rev', () => buildWeekView(reduce(rows, null, 'bench'), 'A', now));
  const wk = weekKeyOf(new Date(now + 9 * 3600_000).toISOString().slice(0, 10));
  // A fresh State per call (like the app after each poll), so per-State caches only help within one State.
  const fresh = () => Array.from({ length: RUNS + 1 }, () => reduce(rows));
  for (const [label, fn] of [
    ['buildWeekView', (st) => buildWeekView(st, 'A', now)],
    ['historyWeeks', (st) => historyWeeks(st, now)],
    ['moneyLog', (st) => moneyLog(st, now)],
    ['bellsLedger', (st) => bellsLedger(st, now)],
    ['weekDetail', (st) => weekDetail(st, addDays(wk, -7), now)]
  ] as [string, (st: State) => unknown][]) {
    const states = fresh();
    time(label, (i) => fn(states[i]));
  }
}
console.log('compactRows on year 3:');
time('compactRows', () => compactRows(year3, midweek(3 * 364)));
