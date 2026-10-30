// The hot paths at year-3 volume (round 13): the hourly Shortcut ingest (31 days × steps, minutes, weight) and a
// client poll (`snapshot` with `since`) against an uncompacted sheet of three years of hourly syncs (`bench-rows.ts`:
// ~53k metrics rows). The sheet is the fake, so time is only indicative; what is asserted is how many cells each
// request reads, which is what costs time in Apps Script (a `getValues` is ~linear in cells).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { doPost } from './main.ts';
import { install, makeGas, type FakeSheet, type Gas } from './fakes.ts';
import { syntheticRows } from '../scripts/bench-rows.ts';

const KEY_A = 'a'.repeat(64);
const DAYS = 3 * 365;

let gas: Gas;
let cells = 0;
const post = (body: object) => JSON.parse((doPost({ postData: { contents: JSON.stringify({ key: KEY_A, ...body }) } }) as unknown as { text: string }).text);

/** Run `fn` and return its reply, the cells it read and the time it took. */
function measure<T>(fn: () => T): { reply: T; cells: number; ms: number } {
  cells = 0;
  const t = performance.now();
  const reply = fn();
  return { reply, cells, ms: Math.round(performance.now() - t) };
}

beforeEach(() => {
  gas = makeGas();
  install(gas);
  vi.useFakeTimers({ toFake: ['Date'] });
  const rows = syntheticRows(DAYS);
  const lastAt = [rows.metrics, rows.workouts, rows.presence, rows.events].flat().map((r) => r[0]).sort().at(-1)!;
  vi.setSystemTime(Date.parse(lastAt) + 3600_000);
  post({ action: 'whoami' }); // creates the tabs
  for (const [name, list] of Object.entries(rows) as [string, unknown[][]][]) {
    const sh = gas.sheets.get(name) as FakeSheet;
    sh.rows.push(...list.map((r) => [...r]));
    sh.maxRows = sh.rows.length + 1000;
    const getRange = sh.getRange.bind(sh);
    sh.getRange = (row: number, col: number, n = 1, c = 1) => {
      const range = getRange(row, col, n, c);
      const getValues = range.getValues;
      range.getValues = () => { cells += n * c; return getValues(); };
      return range;
    };
  }
  gas.props.set('LAST_AT', lastAt);
  post({ action: 'snapshot' }); // learns ROWS, like the live sheet after its first request
});
afterEach(() => vi.useRealTimers());

describe('year-3 volume', () => {
  it('the hourly ingest (31 days × 3 metrics) and a since-poll read only the tail of the sheet', () => {
    const metricRows = gas.sheets.get('metrics')!.data().length;
    const today = Date.now();
    const days = Array.from({ length: 31 }, (_, i) => new Date(today - (30 - i) * 86400_000 + 9 * 3600_000));
    const body = {
      action: 'ingest',
      dates: days.map((d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }) + ' at 8:00 AM').join('\n'),
      steps: days.map((_, i) => String(20000 + i)).join('\n'),
      exercise_minutes: days.map(() => '200').join('\n'),
      weight: days.map((_, i) => (i % 3 ? '0' : '68.4')).join('\n')
    };
    const ingest = measure(() => post(body));
    expect(ingest.reply).toMatchObject({ ok: true, metrics: 31 * 2 + 11 });
    const resend = measure(() => post(body));
    expect(resend.reply).toMatchObject({ ok: true, metrics: 0 });

    const since = new Date(Date.now() - 3600_000).toISOString();
    vi.setSystemTime(Date.now() + 1000);
    const poll = measure(() => post({ action: 'snapshot', since }));
    expect(poll.reply.rows.metrics).toHaveLength(31 * 2 + 11);

    const full = measure(() => post({ action: 'snapshot' }));
    expect(full.reply.rows.metrics).toHaveLength(metricRows + 31 * 2 + 11);

    console.log([
      `metrics rows: ${metricRows}`,
      `ingest: ${ingest.cells} cells, ${ingest.ms} ms; re-send: ${resend.cells} cells, ${resend.ms} ms`,
      `snapshot since: ${poll.cells} cells, ${poll.ms} ms; full: ${full.cells} cells, ${full.ms} ms`
    ].join('\n'));
    // The hourly paths read a month of rows at most, not three years.
    expect(ingest.cells).toBeLessThan(25_000);
    expect(poll.cells).toBeLessThan(10_000);
  });
});
