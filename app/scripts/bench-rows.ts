// Realistic synthetic sheet rows for `npm run bench` and model/compact.test.ts: both people, the Shortcut syncing
// every waking hour.
// Deterministic (seeded), so runs compare.
import { addDays, weekKeyOf } from '#lib/time/dates.ts';
import type { EventRow, MetricRow, SnapshotRows } from '#lib/contract/api.ts';
import type { PersonId } from '#lib/types.ts';

export const FIRST_DAY = '2026-11-02';
export const jst = (date: string, hm: string): string => new Date(`${date}T${hm}:00+09:00`).toISOString();
const hm = (h: number, m = 0) => `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

/** `days` days of rows from FIRST_DAY. Rows are in server `at` order within each tab, as the sheet returns them. */
export function syntheticRows(days: number): SnapshotRows {
  let seed = 42;
  const rand = () => ((seed = (seed * 1103515245 + 12345) % 2 ** 31) / 2 ** 31);
  const metrics: MetricRow[] = [];
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
    const total = { A: 4000 + Math.floor(rand() * 9000), B: 3000 + Math.floor(rand() * 8000) };
    const exTotal = { A: Math.floor(rand() * 70), B: Math.floor(rand() * 50) };
    const steps = { A: 0, B: 0 };
    const ex = { A: 0, B: 0 };
    const kcalTotal = { A: 350 + Math.floor(rand() * 450), B: 250 + Math.floor(rand() * 300) };
    const standTotal = { A: 100 + Math.floor(rand() * 160), B: 120 + Math.floor(rand() * 140) };
    for (let h = 7; h <= 22; h++) {
      for (const p of people) {
        const m = (p === 'A' ? 5 : 35) + Math.floor(rand() * 10);
        // The first sync of the day also brings yesterday's late steps, now and then lower (Health re-counted: latest wins).
        const late = h === 7 && last[p] ? rand() : 1;
        if (late < 0.7) metrics.push([at(date, hm(h, m)), p, last[p]!.date, 'steps', last[p]!.steps + (late < 0.1 ? -100 - Math.floor(rand() * 400) : 50 + Math.floor(rand() * 400))]);
        steps[p] = Math.round((total[p] * (h - 6)) / 16);
        metrics.push([at(date, hm(h, m)), p, date, 'steps', steps[p]]);
        metrics.push([at(date, hm(h, m)), p, date, 'move_kcal', Math.round((kcalTotal[p] * (h - 6)) / 16)]);
        metrics.push([at(date, hm(h, m)), p, date, 'stand_min', Math.round((standTotal[p] * (h - 6)) / 16)]);
        if (rand() < 0.3 && ex[p] < exTotal[p]) {
          ex[p] = Math.min(exTotal[p], ex[p] + 5 + Math.floor(rand() * 20));
          metrics.push([at(date, hm(h, m)), p, date, 'exercise_min', ex[p]]);
        }
      }
    }
    for (const p of people) last[p] = { date, steps: steps[p] };
    if (d % 7 === 6) {
      for (const p of people) events.push([at(date, '20:00'), p, `h:${p}${d}`, 'harvest', JSON.stringify({ week: wk })]);
      events.push([at(date, '20:01'), 'A', `hf:${d}`, 'highfive', '{}']);
    }
    if (d % 30 === 10) {
      events.push([at(date, '22:30'), 'B', `s:${d}`, 'spend', JSON.stringify({ spendId: `s${d}`, item: 'snack', bells: 8 })]);
    }
    if (d % 90 === 5) events.push([at(date, '21:30'), 'B', `mg:${d}`, 'pref', JSON.stringify({ key: 'moveGoal', value: 400 + (d % 180 === 5 ? 50 : 0) })]);
  }
  return { metrics, events };
}
