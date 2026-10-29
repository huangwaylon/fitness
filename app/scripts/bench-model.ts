// Usage: npm run bench   (plain Node ≥ 24, no build step)
// Times the compute-on-read model on (1) the golden 10-week rows, (2) the same rows viewed 52 weeks in, and (3) a
// synthetic full year of rows (daily metrics, a workout every other day, three check-ins a day, both people).
import { performance } from 'node:perf_hooks';
import { buildWeekView } from '#lib/model/week.ts';
import { historyWeeks, moneyLog, weekDetail } from '#lib/model/history.ts';
import { reduce, type State } from '#lib/model/state.ts';
import { SEASONS } from '#lib/config/rules.ts';
import { addDays, weekKeyOf } from '#lib/scoring/index.ts';
import type { EventRow, MetricRow, SnapshotRows, WorkoutRow } from '#lib/ingest/sheet-api.ts';
import golden from '../src/lib/model/fixtures/timeline-rows.json' with { type: 'json' };

const FIRST = '2026-11-02';
const jst = (date: string, hm: string) => new Date(`${date}T${hm}:00+09:00`).toISOString();

function yearOfRows(): SnapshotRows {
  const metrics: MetricRow[] = [];
  const workouts: WorkoutRow[] = [];
  const events: EventRow[] = [];
  for (let i = 0; i < 364; i++) {
    const date = addDays(FIRST, i);
    for (const p of ['A', 'B'] as const) {
      metrics.push([jst(date, '22:00'), p, date, 'steps', 5000 + ((i * 37) % 6000)]);
      metrics.push([jst(date, '22:00'), p, date, 'exercise_min', (i * 13) % 60]);
      if (i % 2 === 0) {
        const start = jst(date, '07:00');
        workouts.push([jst(date, '22:00'), p, `w:${p}${i}`, date, 'Traditional Strength Training', start, jst(date, '07:40'), 40, 120]);
      }
      SEASONS[0].targets[p].habits.forEach((habit, h) => {
        events.push([jst(date, '21:00'), p, `c:${p}${i}${h}`, 'checkin', JSON.stringify({ date, habit, done: true })]);
      });
    }
  }
  return { metrics, workouts, presence: [], events };
}

const RUNS = 5;
function time(label: string, fn: (i: number) => unknown): void {
  fn(RUNS); // warm up
  const t0 = performance.now();
  for (let i = 0; i < RUNS; i++) fn(i);
  console.log(`  ${label.padEnd(18)} ${((performance.now() - t0) / RUNS).toFixed(1).padStart(7)} ms`);
}

const cases: [string, SnapshotRows, number][] = [
  ['golden rows, end of the timeline', golden as unknown as SnapshotRows, Date.parse('2027-01-12T15:00:00Z')],
  ['golden rows, week 52', golden as unknown as SnapshotRows, Date.parse(jst(addDays(FIRST, 52 * 7 + 2), '12:00'))],
  ['a year of rows, week 52', yearOfRows(), Date.parse(jst(addDays(FIRST, 52 * 7 - 3), '12:00'))]
];
for (const [name, rows, now] of cases) {
  const n = rows.metrics.length + rows.workouts.length + rows.presence.length + rows.events.length;
  console.log(`${name} (${n} rows):`);
  time('reduce', () => reduce(rows));
  const wk = weekKeyOf(new Date(now + 9 * 3600_000).toISOString().slice(0, 10));
  // A fresh State per call (like the app after each poll), so per-State caches only help within one State.
  const fresh = () => Array.from({ length: RUNS + 1 }, () => reduce(rows));
  for (const [label, fn] of [
    ['buildWeekView', (st) => buildWeekView(st, 'A', now)],
    ['historyWeeks', (st) => historyWeeks(st, now)],
    ['moneyLog', (st) => moneyLog(st, now)],
    ['weekDetail', (st) => weekDetail(st, addDays(wk, -7), now)],
    ['all four, 1 State', (st) => { buildWeekView(st, 'A', now); historyWeeks(st, now); moneyLog(st, now); weekDetail(st, addDays(wk, -7), now); }]
  ] as [string, (st: State) => unknown][]) {
    const states = fresh();
    time(label, (i) => fn(states[i]));
  }
}
