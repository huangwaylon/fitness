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
    }
    if (d % 30 === 10) {
      events.push([at(date, '22:30'), 'B', `s:${d}`, 'spend', JSON.stringify({ spendId: `s${d}`, item: 'snack', bells: 40 })]);
    }
    if (d % 90 === 5) events.push([at(date, '21:30'), 'B', `mg:${d}`, 'pref', JSON.stringify({ key: 'moveGoal', value: 400 + (d % 180 === 5 ? 50 : 0) })]);
  }
  return { metrics, events };
}

// The meal log (ごはん) on top: 3 people (the guest too) × ~10 entries a day, as a polling phone gets them (every op,
// edits and removals included: 20 % of entries edited once, 4 % removed) and a few repeats (いつもの: one set and
// then skipped now and then). Foods are synthetic but sized like the catalog's snapshots (~180 B of data a row).
const FOODS: [id: string, n: string, k: number, u?: string][] = [
  ['mext:01088', 'こめ　［水稲めし］　精白米　うるち米', 156, '1杯'], ['mext:04046', '納豆　糸引き納豆', 190, '1パック'],
  ['dish:miso-soup', 'みそ汁（豆腐とわかめ）', 30, '1杯'], ['mext:12004', '鶏卵　全卵　生', 142, '1個'],
  ['dish:karaage', '鶏のから揚げ', 290, '1皿'], ['eatout:gyudon-m', '牛丼　並盛', 180, '1杯'],
  ['prod:4901777300446', 'サントリー　伊右衛門　特茶　500ml', 0, '1本'], ['mext:07148', 'バナナ　生', 93, '1本'],
  ['dish:salad', 'グリーンサラダ（ドレッシング付き）', 75], ['prod:4902102072618', 'カップヌードル　しょうゆ', 446, '1食']
];
const hex = (n: number, len: number) => n.toString(16).padStart(len, '0').slice(-len);
export function foodRows(days: number): EventRow[] {
  let seed = 7;
  const rand = () => ((seed = (seed * 1103515245 + 12345) % 2 ** 31) / 2 ** 31);
  const out: EventRow[] = [];
  let ms = 0;
  let n = 0;
  const row = (who: 'A' | 'B' | 'G', type: 'food' | 'food_repeat', data: Record<string, unknown>) => {
    const uuid = `${hex(++n, 8)}-${hex(n * 7919, 4)}-4${hex(n, 3)}-a${hex(n * 31, 3)}-${hex(n * 104729, 12)}`;
    out.push([new Date(data.at as number).toISOString(), who, uuid, type, JSON.stringify(data)]);
  };
  const snap = () => {
    const [id, name, k, u] = FOODS[Math.floor(rand() * FOODS.length)];
    const r1 = (v: number) => Math.round(v * 10) / 10;
    return { id, n: name, k, p: r1(rand() * 20), fa: r1(rand() * 15), c: r1(rand() * 40), s: r1(rand() * 2), ...(u ? { u } : {}) };
  };
  const repeats: Record<string, Record<string, unknown> | null> = { A: null, B: null, G: null };
  for (let d = 0; d < days; d++) {
    const date = addDays(FIRST_DAY, d);
    for (const who of ['A', 'B', 'G'] as const) {
      const count = 8 + Math.floor(rand() * 5);
      for (let i = 0; i < count; i++) {
        ms = Math.max(Date.parse(jst(date, hm(7 + i, 30))), ms + 1);
        const op = { id: `f${ms.toString(36)}${hex(n, 4)}`, at: ms, d: date, m: 'blds'[Math.min(3, Math.floor(i / 3))], g: Math.round(50 + rand() * 300), f: snap() };
        row(who, 'food', op);
        const r = rand();
        if (r < 0.2) row(who, 'food', { ...op, at: (ms += 1000), g: Math.round(op.g * 1.5) });
        else if (r < 0.24) row(who, 'food', { id: op.id, at: (ms += 1000), rm: true });
      }
      // A breakfast repeat set every ~60 days, a day skipped now and then (each skip re-sends it whole).
      if (d % 60 === (who === 'A' ? 1 : who === 'B' ? 21 : 41)) {
        repeats[who] = { id: `r${(ms + 1).toString(36)}${who.toLowerCase()}`, at: ++ms, m: 'b', it: [{ g: 150, f: snap() }, { g: 45, f: snap() }], w: 127, from: date };
        row(who, 'food_repeat', repeats[who]!);
      } else if (repeats[who] && rand() < 0.05) {
        const rep = repeats[who]!;
        repeats[who] = { ...rep, at: ++ms, sk: [...((rep.sk as string[]) ?? []), date] };
        row(who, 'food_repeat', repeats[who]!);
      }
    }
  }
  return out;
}

/** `rows` with `extra` events merged in server `at` order (both sorted). */
export function withEvents(rows: SnapshotRows, extra: EventRow[]): SnapshotRows {
  const events: EventRow[] = [];
  let i = 0;
  for (const e of rows.events) {
    while (i < extra.length && extra[i][0] <= e[0]) events.push(extra[i++]);
    events.push(e);
  }
  while (i < extra.length) events.push(extra[i++]);
  return { ...rows, events };
}
