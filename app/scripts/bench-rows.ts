// Realistic synthetic sheet rows for `npm run bench` and model/compact.test.ts: both people, the Shortcut syncing
// every waking hour (round 9 review: ~21 metric rows per person-day, ~53k rows and ~3.7 MB of JSON by year 3).
// Deterministic (seeded), so runs compare.
import { addDays, targetsFor, weekKeyOf } from '#lib/scoring/index.ts';
import type { EventRow, MetricRow, PresenceRow, SnapshotRows, WorkoutRow } from '#lib/contract/api.ts';
import type { PersonId } from '#lib/types.ts';

export const FIRST_DAY = '2026-11-02';
export const jst = (date: string, hm: string): string => new Date(`${date}T${hm}:00+09:00`).toISOString();
const hm = (h: number, m = 0) => `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

/** `days` days of rows from FIRST_DAY. Rows are in server `at` order within each tab, as the sheet returns them. */
export function syntheticRows(days: number): SnapshotRows {
  let seed = 42;
  const rand = () => ((seed = (seed * 1103515245 + 12345) % 2 ** 31) / 2 ** 31);
  const metrics: MetricRow[] = [];
  const workouts: WorkoutRow[] = [];
  const presence: PresenceRow[] = [];
  const events: EventRow[] = [];
  let ms = 0;
  // Strictly increasing server `at`s, like LAST_AT.
  const at = (date: string, time: string) => {
    ms = Math.max(Date.parse(jst(date, time)), ms + 1);
    return new Date(ms).toISOString();
  };
  const people: PersonId[] = ['A', 'B'];
  const last: Record<PersonId, { date: string; steps: number } | null> = { A: null, B: null };
  for (let d = 0; d < days; d++) {
    const date = addDays(FIRST_DAY, d);
    const wk = weekKeyOf(date);
    const habits = { A: targetsFor('A', wk).habits, B: targetsFor('B', wk).habits };
    const total = { A: 4000 + Math.floor(rand() * 9000), B: 3000 + Math.floor(rand() * 8000) };
    const exTotal = { A: Math.floor(rand() * 70), B: Math.floor(rand() * 50) };
    const gym = { A: d % 2 === 0, B: d % 7 === 1 || d % 7 === 4 };
    const steps = { A: 0, B: 0 };
    const ex = { A: 0, B: 0 };
    for (let h = 7; h <= 22; h++) {
      for (const p of people) {
        const m = (p === 'A' ? 5 : 35) + Math.floor(rand() * 10);
        // The first sync of the day also brings yesterday's late steps.
        if (h === 7 && last[p] && rand() < 0.7) metrics.push([at(date, hm(h, m)), p, last[p]!.date, 'steps', last[p]!.steps + 50 + Math.floor(rand() * 400)]);
        steps[p] = Math.round((total[p] * (h - 6)) / 16);
        metrics.push([at(date, hm(h, m)), p, date, 'steps', steps[p]]);
        if (rand() < 0.3 && ex[p] < exTotal[p]) {
          ex[p] = Math.min(exTotal[p], ex[p] + 5 + Math.floor(rand() * 20));
          metrics.push([at(date, hm(h, m)), p, date, 'exercise_min', ex[p]]);
        }
        const place = p === 'A' ? 'anytime' : 'pt_studio';
        if (gym[p] && h === 18) presence.push([at(date, hm(18, 0)), p, place, 'arrive', jst(date, '18:00')]);
        if (gym[p] && h === 19) {
          presence.push([at(date, hm(19, 0)), p, place, 'leave', jst(date, '19:00')]);
          workouts.push([at(date, hm(h, m)), p, `w:${p}${d}`, date, 'Traditional Strength Training', jst(date, '18:05'), jst(date, '18:55'), 50, 118]);
        }
        if (h === 21) {
          habits[p].forEach((habit, i) => {
            if (rand() < 0.85) events.push([at(date, hm(21, 10 + i)), p, `c:${p}${d}${i}`, 'checkin', JSON.stringify({ date, habit, done: true })]);
          });
        }
      }
    }
    for (const p of people) last[p] = { date, steps: steps[p] };
    if (d % 7 === 6) {
      for (const p of people) events.push([at(date, '20:00'), p, `h:${p}${d}`, 'harvest', JSON.stringify({ week: wk })]);
      events.push([at(date, '20:01'), 'A', `hf:${d}`, 'highfive', '{}']);
    }
    if (d % 30 === 10) {
      events.push([at(date, '22:30'), 'B', `s:${d}`, 'spend', JSON.stringify({ spendId: `s${d}`, label: 'ケーキ', amountYen: 800 })]);
      events.push([at(date, '22:40'), 'A', `a:${d}`, 'approve', JSON.stringify({ spendId: `s${d}` })]);
    }
    if (d % 30 === 20) {
      events.push([at(date, '22:50'), 'A', `ms:${d}`, 'metric_set', JSON.stringify({ date: addDays(date, -1), metric: 'steps', value: 3000 })]);
    }
  }
  return { metrics, workouts, presence, events };
}
