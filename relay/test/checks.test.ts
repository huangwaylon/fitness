// The tree popup's daily checks on the record (docs/backend.md "Events" `check`): a member's own hand-set `check` (one
// row per sender, day and check: the latest wins; the guest's refused; its day from 35 days back to tomorrow), and an
// old Shortcut's workout fields ignored (HIIT and Core are by hand: the user, 2026-11-20). Made-up data only.
import { beforeEach, describe, expect, it } from 'vitest';
import { StoreCore } from '../src/store.ts';
import { parseShortcut } from '../src/parse.ts';
import { memSql } from './sqlite.ts';

const KEY_A = 'a'.repeat(64);
const KEY_B = 'b'.repeat(64);
const KEY_C = 'c'.repeat(64);
const T0 = Date.parse('2026-11-19T03:00:00.000Z'); // 12:00 Tokyo, 2026-11-19

describe('the record: checks', () => {
  let now: number;
  let store: StoreCore;
  beforeEach(() => {
    now = T0;
    const db = memSql();
    store = new StoreCore({ sql: db.sql, tx: db.tx, keys: { KEY_A, KEY_B, KEY_C }, now: () => now, notify: () => {} });
  });
  const call = (key: string, action: string, extra: object = {}) => store.handle({ key, action, ...extra }, 100) as Record<string, any>;
  let n = 0;
  const check = (key: string, data: object) => {
    now += 1000;
    return call(key, 'event', { id: `c${++n}`, type: 'check', data });
  };
  const checks = (key: string) => (call(key, 'snapshot').rows.events as string[][]).filter((r) => r[3] === 'check').map((r) => [r[1], JSON.parse(r[4])]);

  it('an old Shortcut’s workout fields are accepted and ignored: no metric rows of them, the rest saved', () => {
    const body = {
      dates: 'Nov 19, 2026 at 8:00 AM', steps: '5000',
      workout_types: 'High Intensity Interval Training\nCore Training', workout_dates: 'Nov 19, 2026 at 7:00 AM\nNov 19, 2026 at 7:30 AM'
    };
    expect(parseShortcut(body)).toEqual({ metrics: [{ date: '2026-11-19', metric: 'steps', value: 5000 }], skipped: 0, warnings: [] });
    // a bad shape of them is ignored too, never refused
    expect(parseShortcut({ ...body, workout_types: 3, workout_dates: '' }).warnings).toEqual([]);
    expect(call(KEY_A, 'ingest', body)).toMatchObject({ ok: true, metrics: 1 });
    const rows = (call(KEY_A, 'snapshot').rows.metrics as unknown[][]).map((r) => [r[1], r[2], r[3], r[4]]);
    expect(rows).toEqual([['A', '2026-11-19', 'steps', 5000]]);
  });

  it('keeps one check per sender, day and check (the latest), each member’s own', () => {
    expect(check(KEY_A, { d: '2026-11-19', k: 'face', v: true }).ok).toBe(true);
    expect(check(KEY_A, { d: '2026-11-19', k: 'face', v: false }).ok).toBe(true);
    expect(check(KEY_A, { d: '2026-11-19', k: 'hiit', v: null }).ok).toBe(true);
    expect(check(KEY_B, { d: '2026-11-19', k: 'face', v: true }).ok).toBe(true);
    expect(checks(KEY_A)).toEqual([
      ['A', { d: '2026-11-19', k: 'face', v: false }],
      ['A', { d: '2026-11-19', k: 'hiit', v: null }],
      ['B', { d: '2026-11-19', k: 'face', v: true }]
    ]);
    // the guest sees them, and writes its own as anyone (it has no tree to show them)
    expect(checks(KEY_C)).toHaveLength(3);
    expect(check(KEY_C, { d: '2026-11-19', k: 'face', v: true })).toMatchObject({ ok: true });
  });

  it('refuses a bad shape, another check, a day after tomorrow or more than 35 days back', () => {
    const bad: unknown[] = [];
    const ok = (data: object, want: boolean) => {
      const r = check(KEY_A, data);
      if (r.ok !== want) bad.push([data, r]);
    };
    ok({ d: '2026-11-20', k: 'core', v: true }, true); // tomorrow (a clock a little ahead)
    ok({ d: '2026-10-15', k: 'core', v: true }, true); // 35 days back
    ok({ d: '2026-11-21', k: 'core', v: true }, false);
    ok({ d: '2026-10-14', k: 'core', v: true }, false);
    ok({ d: '2026-02-30', k: 'core', v: true }, false);
    ok({ d: '2026-11-19', k: 'yoga', v: true }, false);
    ok({ d: '2026-11-19', k: 'core', v: 1 }, false);
    ok({ d: '2026-11-19', k: 'core' }, false);
    ok({ d: '2026-11-19', k: 'core', v: true, person: 'B' }, false);
    expect(bad).toEqual([]);
  });
});
