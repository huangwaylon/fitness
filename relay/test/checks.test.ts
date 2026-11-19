// The tree popup's daily checks on the record (docs/backend.md "Events" `check`, "Ingest" workouts): the Shortcut's
// workouts counted per Tokyo day as `hiit_n` / `core_n` (HIIT and Core Training only, every other type read past),
// and a member's own hand-set `check` (one row per sender, day and check: the latest wins; the guest's refused; its day
// from 35 days back to tomorrow). The guest sees the workout rows (activity, not からだ). Made-up data only.
import { beforeEach, describe, expect, it } from 'vitest';
import { StoreCore } from '../src/store.ts';
import { parseShortcut } from '../src/parse.ts';
import { workoutKind } from '../src/workouts.ts';
import { memSql } from './sqlite.ts';

const KEY_A = 'a'.repeat(64);
const KEY_B = 'b'.repeat(64);
const KEY_C = 'c'.repeat(64);
const T0 = Date.parse('2026-11-19T03:00:00.000Z'); // 12:00 Tokyo, 2026-11-19

describe('workouts in the Shortcut body', () => {
  it('maps HIIT and Core Training, English, Japanese or HealthKit’s name; nothing else', () => {
    expect(workoutKind('High Intensity Interval Training')).toBe('hiit_n');
    expect(workoutKind('高強度インターバルトレーニング')).toBe('hiit_n');
    expect(workoutKind('HKWorkoutActivityTypeHighIntensityIntervalTraining')).toBe('hiit_n');
    expect(workoutKind('HIIT')).toBe('hiit_n');
    expect(workoutKind('Core Training')).toBe('core_n');
    expect(workoutKind('コアトレーニング')).toBe('core_n');
    expect(workoutKind('Functional Strength Training')).toBeNull();
    expect(workoutKind('Outdoor Run')).toBeNull();
  });

  it('counts each kind per calendar day of its start (23:50 and 00:10 fall on two days); other types are not stored', () => {
    const r = parseShortcut({
      workout_types: 'High Intensity Interval Training\nCore Training\nOutdoor Walk\nHigh Intensity Interval Training\nコアトレーニング',
      workout_dates: 'Nov 18, 2026 at 11:50 PM\nNov 18, 2026 at 11:55 PM\nNov 19, 2026 at 7:00 AM\nNov 19, 2026 at 12:10 AM\n2026/11/19 7:30'
    });
    expect(r.metrics.sort((a, b) => (a.date + a.metric).localeCompare(b.date + b.metric))).toEqual([
      { date: '2026-11-18', metric: 'core_n', value: 1 },
      { date: '2026-11-18', metric: 'hiit_n', value: 1 },
      { date: '2026-11-19', metric: 'core_n', value: 1 },
      { date: '2026-11-19', metric: 'hiit_n', value: 1 }
    ]);
    expect(r.warnings).toEqual([]);
  });

  it('two in a day count 2; a bad date is skipped; mismatched lists are dropped with a warning, the rest kept', () => {
    expect(parseShortcut({ workout_types: 'Core Training\nCore Training', workout_dates: 'Nov 19, 2026 at 7:00 AM\nNov 19, 2026 at 8:00 PM' }).metrics)
      .toEqual([{ date: '2026-11-19', metric: 'core_n', value: 2 }]);
    expect(parseShortcut({ workout_types: 'Core Training', workout_dates: 'Feb 30, 2026 at 7:00 AM' }).skipped).toBe(1);
    const r = parseShortcut({ dates: 'Nov 19, 2026 at 8:00 AM', steps: '5000', workout_types: 'Core Training', workout_dates: '' });
    expect(r.metrics).toEqual([{ date: '2026-11-19', metric: 'steps', value: 5000 }]);
    expect(r.warnings[0]).toMatch(/^workouts: 1 types but 0 dates/);
    // an empty pair (no workouts this month) is a body of its own
    expect(parseShortcut({ workout_types: '', workout_dates: '' }).metrics).toEqual([]);
    expect(() => parseShortcut({ workout_types: 3, workout_dates: '' })).toThrow(/expected Text/);
  });
});

describe('the record: workouts and checks', () => {
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

  it('ingests the workouts as metric rows the guest sees too; a re-send adds nothing', () => {
    const body = { workout_types: 'High Intensity Interval Training\nCore Training', workout_dates: 'Nov 19, 2026 at 7:00 AM\nNov 19, 2026 at 7:30 AM' };
    expect(call(KEY_A, 'ingest', body)).toMatchObject({ ok: true, metrics: 2 });
    expect(call(KEY_A, 'ingest', body)).toMatchObject({ ok: true, metrics: 0 });
    for (const key of [KEY_B, KEY_C]) {
      const rows = (call(key, 'snapshot').rows.metrics as unknown[][]).map((r) => [r[1], r[2], r[3], r[4]]);
      expect(rows).toEqual(expect.arrayContaining([['A', '2026-11-19', 'hiit_n', 1], ['A', '2026-11-19', 'core_n', 1]]));
    }
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
    // the guest sees them, never writes one
    expect(checks(KEY_C)).toHaveLength(3);
    expect(check(KEY_C, { d: '2026-11-19', k: 'face', v: true })).toMatchObject({ ok: false, error: 'forbidden' });
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
