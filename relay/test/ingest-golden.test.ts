// Golden: the record's ingest (src/store.ts) gives exactly what the Apps Script's did when the sheet was the record:
// the same replies, the same metrics rows with the same `at`, the same audit rows, for a run of Shortcut bodies in the
// shapes the two phones really send (the `uploads` audit of 2026-11-02: A's iPhone-only body with English dates, B's
// with the Watch's steps, Japanese dates and kcal to three decimals; the values are made up, not anyone's health data).
// fixtures/ingest-golden.json is what app/gas/main.ts's ingest answered and wrote for these runs on 2026-11-02 (on its
// fakes, before step 5 removed it); the record matched it then, run for run, and must go on matching it. One change
// since, on purpose (2026-11-05, store.ts ingest): a past day's 0 over a value above it is ignored, so four rows went
// (B's exercise on 10-03 and 10-04 shifted to 0, A's steps on 10-07 and 10-08 read 0 from an unreadable line) and
// three audit rows say `N past zeros ignored`.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { StoreCore } from '../src/store.ts';
import { memSql } from './sqlite.ts';

const KEY_A = 'a'.repeat(64);
const KEY_B = 'b'.repeat(64);

let db: ReturnType<typeof memSql>;
let store: StoreCore;

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-11-01T22:30:00.000Z'));
  db = memSql();
  store = new StoreCore({ sql: db.sql, tx: db.tx, keys: { KEY_A, KEY_B }, now: () => Date.now(), notify: () => {} });
});
afterEach(() => vi.useRealTimers());

/** Day i (0 = the oldest) of a 32-day body ending on `end` (Tokyo). */
const days = (end: string, n = 32) => Array.from({ length: n }, (_, i) => new Date(Date.parse(`${end}T00:00:00Z`) - (n - 1 - i) * 86400_000));
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const en = (d: Date) => `${MON[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()} at 7:25 AM`;
const ja = (d: Date) => `${d.getUTCFullYear()}/${String(d.getUTCMonth() + 1).padStart(2, '0')}/${String(d.getUTCDate()).padStart(2, '0')} 8:05`;
const lines = (n: number, f: (i: number) => string) => Array.from({ length: n }, (_, i) => f(i)).join('\n');

/** A's body (field order as the audit shows it): the iPhone's steps only, every other list zeros. */
function bodyA(end: string, bump = 0, extra: Record<string, string> = {}) {
  const ds = days(end);
  const z = lines(ds.length, () => '0');
  return {
    stand_minutes: z, body_mass_index: z, steps: lines(ds.length, (i) => String(3000 + ((i * 7919) % 9000) + (i === ds.length - 1 ? bump : 0))),
    calories: z, weight: z, steps_watch: z, lean_body_mass: z, action: 'ingest', body_fat_percentage: z, dates: ds.map(en).join('\n'), exercise_minutes: z,
    ...extra
  };
}

/** B's body: the iPhone's and the Watch's steps (the day's is the larger), Move kcal, Stand and Exercise minutes. */
function bodyB(end: string, bump = 0, extra: Record<string, string> = {}) {
  const ds = days(end);
  const z = lines(ds.length, () => '0');
  const last = (i: number) => (i === ds.length - 1 ? bump : 0);
  return {
    stand_minutes: lines(ds.length, (i) => String(60 + (i % 90))), body_mass_index: z,
    steps: lines(ds.length, (i) => String(4000 + ((i * 104729) % 7000) + last(i))),
    calories: lines(ds.length, (i) => (i % 5 ? (300 + i * 7.123 + last(i)).toFixed(3) : '544.857')),
    weight: z, steps_watch: lines(ds.length, (i) => (i % 4 ? String(6000 + ((i * 7907) % 6000) + last(i)) : '0')), lean_body_mass: z,
    action: 'ingest', body_fat_percentage: z, dates: ds.map(ja).join('\n'), exercise_minutes: lines(ds.length, (i) => String((i * 13) % 90))
  , ...extra };
}

const GOLDEN = JSON.parse(String(readFileSync(fileURLToPath(import.meta.resolve('./fixtures/ingest-golden.json'))))) as { replies: unknown[]; metrics: unknown[][]; uploads: unknown[][] };

describe('ingest: the record answers and writes as the Apps Script did', () => {
  it('a week of both phones’ runs: replies, rows and audit rows identical', () => {
    const z32 = lines(32, () => '0');
    const runs: [string, object][] = [
      [KEY_A, bodyA('2026-11-02')],
      [KEY_B, bodyB('2026-11-02')],
      [KEY_A, bodyA('2026-11-02')], // the same run again: nothing new
      [KEY_B, bodyB('2026-11-02', 812)], // later that day: today's totals grew
      [KEY_A, bodyA('2026-11-03', 0, { weight: lines(32, (i) => (i === 31 ? '68.4' : '0')), body_fat_percentage: lines(32, (i) => (i === 31 ? '0.223' : '0')), body_mass_index: lines(32, (i) => (i === 31 ? '22.8' : '0')), lean_body_mass: lines(32, (i) => (i === 31 ? '52.1' : '0')) })],
      [KEY_B, bodyB('2026-11-03', 0, { body_fat_percentage: lines(32, (i) => (i === 31 ? '22.3%' : '0')), weight: lines(32, (i) => (i === 30 ? '51.7' : '0')) })],
      [KEY_A, bodyA('2026-11-03', -500)], // a re-sync lowered today's steps
      [KEY_B, bodyB('2026-11-04', 0, { calories: lines(31, () => '1') })], // a list one line short: dropped with a warning
      [KEY_A, bodyA('2026-11-04', 0, { steps: lines(32, (i) => (i === 3 ? '250000' : i === 4 ? 'n/a' : '5000')) })], // out of bounds, unreadable
      [KEY_B, { action: 'ingest', nothing: 'here' }], // no fields: bad_request, audited
      [KEY_A, { action: 'ingest', dates: z32, steps: z32 }],
      [KEY_A, { action: 'ingest', dates: 'Sep 28, 2026 at 7:11 AM\nSep 29, 2026 at 7:55 AM', steps: '855\n9106', exercise_minutes: '0\n23', calories: '0\n248.2' }] // app/gas/main.test.ts REAL
    ];
    for (const [i, [key, body]] of runs.entries()) {
      const text = JSON.stringify({ key, ...body });
      expect(store.handle({ key, ...body }, new TextEncoder().encode(text).length), `run ${i}`).toEqual(GOLDEN.replies[i]);
      vi.setSystemTime(Date.now() + 37 * 60_000);
    }
    const sMetrics = db.sql.exec('SELECT at, person, date, metric, value FROM metrics ORDER BY at, seq').toArray().map((r) => Object.values(r));
    const sUploads = db.sql.exec('SELECT at, person, status, bytes, notes FROM uploads ORDER BY seq').toArray().map((r) => Object.values(r));
    expect(GOLDEN.replies.map((r) => (r as { metrics?: number; error?: string }).metrics ?? (r as { error?: string }).error)).toEqual([128, 128, 0, 2, 39, 129, 1, 95, 33, 'bad_request', 0, 6]);
    expect(sMetrics).toEqual(GOLDEN.metrics);
    expect(sUploads).toEqual(GOLDEN.uploads);
    expect(store.rowsSince('').metrics).toEqual(GOLDEN.metrics);
  });
});
