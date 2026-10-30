import { describe, expect, it } from 'vitest';
import { parseShortcut, shortcutDate, ShapeError, workoutKey } from './parse.ts';

// The Shortcut's real body (the `uploads` log, 2026-10-30): daily totals, one line per day, every list as Text.
const BODY = {
  action: 'ingest',
  dates: 'Oct 28, 2026 at 12:00 AM\nOct 29, 2026 at 8:59 AM\nOct 30, 2026 at 7:05 AM',
  steps: '4963\n23836\n1658',
  exercise_minutes: '0\n58\n6',
  calories: '120.5\n249.2640000000001\n30',
  stand_minutes: '12\n58\n4',
  weight: '0\n0\n68.4'
};

describe('shortcutDate: Shortcuts date text, English or Japanese', () => {
  it('reads the calendar day and time as written (Tokyo)', () => {
    expect(shortcutDate('Sep 30, 2026 at 8:59 AM')).toEqual({ day: '2026-09-30', time: '08:59:00' });
    expect(shortcutDate('Oct 28, 2026 at 12:05 AM')).toEqual({ day: '2026-10-28', time: '00:05:00' });
    expect(shortcutDate('Oct 28, 2026 at 8:10 PM')).toEqual({ day: '2026-10-28', time: '20:10:00' });
    expect(shortcutDate('2026/10/28 7:05')).toEqual({ day: '2026-10-28', time: '07:05:00' });
    expect(shortcutDate('2026年10月28日 午後8:10')).toEqual({ day: '2026-10-28', time: '20:10:00' });
    expect(shortcutDate('2026-10-28')).toBeNull();
    expect(shortcutDate('Feb 30, 2026')).toBeNull();
    expect(shortcutDate('soon')).toBeNull();
  });

  it('refuses a time that does not exist (seconds included)', () => {
    expect(shortcutDate('2026/10/28 8:59:30')).toEqual({ day: '2026-10-28', time: '08:59:30' });
    expect(shortcutDate('2026/10/28 8:59:75')).toBeNull();
    expect(shortcutDate('Oct 28, 2026 at 8:61 AM')).toBeNull();
    expect(shortcutDate('2026/10/28 24:00')).toBeNull();
  });
});

describe('parseShortcut: the official body', () => {
  it('one row per day per metric; calories → move_kcal and stand_minutes → stand_min (rounded); weight 0 = no weigh-in', () => {
    const r = parseShortcut(BODY);
    expect(r.metrics).toEqual([
      { date: '2026-10-28', metric: 'steps', value: 4963 },
      { date: '2026-10-29', metric: 'steps', value: 23836 },
      { date: '2026-10-30', metric: 'steps', value: 1658 },
      { date: '2026-10-28', metric: 'exercise_min', value: 0 },
      { date: '2026-10-29', metric: 'exercise_min', value: 58 },
      { date: '2026-10-30', metric: 'exercise_min', value: 6 },
      { date: '2026-10-28', metric: 'move_kcal', value: 121 },
      { date: '2026-10-29', metric: 'move_kcal', value: 249 },
      { date: '2026-10-30', metric: 'move_kcal', value: 30 },
      { date: '2026-10-28', metric: 'stand_min', value: 12 },
      { date: '2026-10-29', metric: 'stand_min', value: 58 },
      { date: '2026-10-30', metric: 'stand_min', value: 4 },
      { date: '2026-10-30', metric: 'weight', value: 68.4 }
    ]);
    expect(r).toMatchObject({ workouts: [], skipped: 0, warnings: [], unknownTypes: [] });
  });

  it('a list whose length differs from dates is dropped with a warning; the rest is kept', () => {
    const r = parseShortcut({ ...BODY, weight: '68.4' });
    expect(r.warnings).toEqual(['weight: 1 lines but 3 dates; weight not saved']);
    expect(r.metrics.filter((m) => m.metric === 'weight')).toEqual([]);
    expect(r.metrics).toHaveLength(12);
  });

  it('calories or stand_minutes with a different length are dropped with a warning; an older body without them still works', () => {
    const r = parseShortcut({ ...BODY, calories: '120\n249', stand_minutes: '1\n2\n3\n4' });
    expect(r.warnings).toEqual(['calories: 2 lines but 3 dates; calories not saved', 'stand_minutes: 4 lines but 3 dates; stand_minutes not saved']);
    expect(r.metrics.filter((m) => m.metric === 'move_kcal' || m.metric === 'stand_min')).toEqual([]);
    expect(r.metrics).toHaveLength(7);
    const { calories: _c, stand_minutes: _s, ...old } = BODY;
    expect(parseShortcut(old).metrics.map((m) => m.metric)).not.toContain('move_kcal');
    expect(parseShortcut({ dates: 'Oct 28, 2026', stand_minutes: '30' }).metrics).toEqual([{ date: '2026-10-28', metric: 'stand_min', value: 30 }]);
  });

  it('kcal above 10,000 and stand minutes above 1,440 are skipped with a warning', () => {
    const r = parseShortcut({ dates: 'Oct 28, 2026\nOct 29, 2026', calories: '10000.4\n10000.6', stand_minutes: '1440\n1441' });
    expect(r.metrics).toEqual([
      { date: '2026-10-28', metric: 'move_kcal', value: 10000 },
      { date: '2026-10-28', metric: 'stand_min', value: 1440 }
    ]);
    expect(r.skipped).toBe(2);
    expect(r.warnings).toEqual(['calories: 10001 on 2026-10-29 is above 10000; skipped', 'stand_minutes: 1441 on 2026-10-29 is above 1440; skipped']);
  });

  it('an unreadable value or date skips that line only; weight outside 20–300 kg is skipped', () => {
    const r = parseShortcut({ dates: 'Oct 28, 2026\nsoon\nOct 30, 2026', steps: '100\n200\n8,000', weight: '0\n70\n400' });
    expect(r.metrics).toEqual([{ date: '2026-10-28', metric: 'steps', value: 100 }]);
    expect(r.skipped).toBe(4); // the bad date (steps, weight), "8,000", 400 kg
  });

  it('a step or minute value above METRIC_BOUNDS is skipped with a warning', () => {
    const r = parseShortcut({ dates: 'Oct 28, 2026\nOct 29, 2026', steps: '856400\n100000', exercise_minutes: '1441\n1440' });
    expect(r.metrics).toEqual([
      { date: '2026-10-29', metric: 'steps', value: 100000 },
      { date: '2026-10-29', metric: 'exercise_min', value: 1440 }
    ]);
    expect(r.skipped).toBe(2);
    expect(r.warnings).toEqual(['steps: 856400 on 2026-10-28 is above 100000; skipped', 'exercise_minutes: 1441 on 2026-10-28 is above 1440; skipped']);
  });

  it('every list is Text; nothing to save is refused with what to send', () => {
    expect(() => parseShortcut({ dates: ['Oct 28, 2026'], steps: ['1'] })).toThrow(/dates: expected Text/);
    expect(() => parseShortcut({ dates: 'Oct 28, 2026' })).toThrow(ShapeError);
    expect(() => parseShortcut('steps')).toThrow(/expected a JSON object/);
    expect(parseShortcut({ dates: '', steps: '' }).metrics).toEqual([]);
  });

  it('workouts: one line per workout; Japanese names map to the canonical English ones', () => {
    const r = parseShortcut({
      workouts: {
        types: '伝統的な筋力トレーニング\nヨガ\nカバディ',
        starts: 'Oct 28, 2026 at 7:00 AM\n2026/10/28 19:00\nOct 29, 2026 at 6:00 PM',
        ends: 'Oct 28, 2026 at 7:45 AM\n2026/10/28 19:30\nOct 29, 2026 at 6:20 PM',
        avgHrs: '118\n95\n130'
      }
    });
    expect(r.workouts.map((w) => [w.type, w.date, w.durationMin, w.avgHr])).toEqual([
      ['Traditional Strength Training', '2026-10-28', 45, 118], ['Yoga', '2026-10-28', 30, 95], ['カバディ', '2026-10-29', 20, 130]
    ]);
    expect(r.unknownTypes).toEqual(['カバディ']);
    expect(r.workouts[0].id).toBe(workoutKey('Traditional Strength Training', '2026-10-28T07:00:00+09:00'));
  });

  it('workout ids are stable across re-sends and phone languages, and differ by type or minute', () => {
    const a = workoutKey('Yoga', '2026-10-28T19:00:00+09:00');
    expect(a).toMatch(/^w:[0-9a-f]{16}$/);
    expect(workoutKey('ヨガ', '2026-10-28T19:00:30+09:00')).toBe(a);
    expect(workoutKey('Yoga', '2026-10-28T19:01:00+09:00')).not.toBe(a);
    expect(workoutKey('Pilates', '2026-10-28T19:00:00+09:00')).not.toBe(a);
  });

  it('a workout with an impossible time is skipped, never stored with a NaN duration', () => {
    const r = parseShortcut({ workouts: { types: 'Yoga\nYoga', starts: '2026/10/28 8:59:75\n2026/10/28 9:00', ends: '2026/10/28 9:30\n2026/10/28 9:30' } });
    expect(r.workouts.map((w) => w.durationMin)).toEqual([30]);
    expect(r.skipped).toBe(1);
  });

  it('mismatched workout lists are dropped with a warning', () => {
    const r = parseShortcut({ workouts: { types: 'Yoga\nYoga', starts: 'Oct 28, 2026 at 7:00 AM', ends: 'Oct 28, 2026 at 7:30 AM' } });
    expect(r.workouts).toEqual([]);
    expect(r.warnings[0]).toMatch(/^workouts: 2 types, 1 starts/);
  });
});
