import { describe, expect, it } from 'vitest';
import { parseShortcut, shortcutDate, ShapeError } from './parse.ts';

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
  it('reads the calendar day as written (Tokyo), whatever the time', () => {
    expect(shortcutDate('Sep 30, 2026 at 8:59 AM')).toBe('2026-09-30');
    expect(shortcutDate('Oct 28, 2026 at 12:05 AM')).toBe('2026-10-28');
    expect(shortcutDate('Oct 28, 2026 at 8:10 PM')).toBe('2026-10-28');
    expect(shortcutDate('2026/10/28 7:05')).toBe('2026-10-28');
    expect(shortcutDate('2026年10月28日 午後8:10')).toBe('2026-10-28');
    expect(shortcutDate('2026-10-28')).toBeNull();
    expect(shortcutDate('Feb 30, 2026')).toBeNull();
    expect(shortcutDate('soon')).toBeNull();
  });

  it('refuses a time that does not exist (seconds included)', () => {
    expect(shortcutDate('2026/10/28 8:59:30')).toBe('2026-10-28');
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
    expect(r).toEqual({ metrics: r.metrics, skipped: 0, warnings: [] });
  });

  it('a list whose length differs from dates is dropped with a warning; the rest is kept', () => {
    const r = parseShortcut({ ...BODY, weight: '68.4' });
    expect(r.warnings).toEqual(['weight: 1 lines but 3 dates; weight not saved']);
    expect(r.metrics.filter((m) => m.metric === 'weight')).toEqual([]);
    expect(r.metrics).toHaveLength(12);
  });

  it('calories or stand_minutes with a different length are dropped with a warning; each field is optional', () => {
    const r = parseShortcut({ ...BODY, calories: '120\n249', stand_minutes: '1\n2\n3\n4' });
    expect(r.warnings).toEqual(['calories: 2 lines but 3 dates; calories not saved', 'stand_minutes: 4 lines but 3 dates; stand_minutes not saved']);
    expect(r.metrics.filter((m) => m.metric === 'move_kcal' || m.metric === 'stand_min')).toEqual([]);
    expect(r.metrics).toHaveLength(7);
    const { calories: _c, stand_minutes: _s, ...some } = BODY;
    expect(parseShortcut(some).metrics.map((m) => m.metric)).not.toContain('move_kcal');
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

  it('steps_watch: each day\'s steps are max(iPhone, Watch), one row in the steps position; one side unreadable = the other', () => {
    const r = parseShortcut({ ...BODY, steps: '4963\n13172\nx', steps_watch: '5200\n12900\n1658' });
    expect(r.metrics.filter((m) => m.metric === 'steps')).toEqual([
      { date: '2026-10-28', metric: 'steps', value: 5200 },
      { date: '2026-10-29', metric: 'steps', value: 13172 },
      { date: '2026-10-30', metric: 'steps', value: 1658 }
    ]);
    expect(r.metrics[0].metric).toBe('steps');
    expect(r.skipped).toBe(1);
    expect(parseShortcut({ dates: 'Oct 28, 2026', steps_watch: '9000' }).metrics).toEqual([{ date: '2026-10-28', metric: 'steps', value: 9000 }]);
    expect(() => parseShortcut({ dates: 'Oct 28, 2026', steps_watch: ['9000'] })).toThrow(/steps_watch: expected Text/);
  });
});

describe('parseShortcut: the body metrics (body_fat_percentage, body_mass_index, lean_body_mass)', () => {
  const DATES = 'Oct 28, 2026\nOct 29, 2026\nOct 30, 2026';

  it('aligned to dates like weight, 0 = no sample; one decimal; body_fat_percentage → body_fat_pct, lean_body_mass → lean_kg', () => {
    const r = parseShortcut({ dates: DATES, body_fat_percentage: '0\n22.34\n21.9', body_mass_index: '22.81\n0\n0', lean_body_mass: '0\n0\n52.06' });
    expect(r).toEqual({
      metrics: [
        { date: '2026-10-29', metric: 'body_fat_pct', value: 22.3 },
        { date: '2026-10-30', metric: 'body_fat_pct', value: 21.9 },
        { date: '2026-10-28', metric: 'bmi', value: 22.8 },
        { date: '2026-10-30', metric: 'lean_kg', value: 52.1 }
      ],
      skipped: 0,
      warnings: []
    });
  });

  it('body fat as a fraction (≤ 1) is ×100; as a percent, with or without its sign, as is', () => {
    const r = parseShortcut({ dates: DATES, body_fat_percentage: '0.223\n22.3%\n0.2' });
    expect(r.metrics.map((m) => m.value)).toEqual([22.3, 22.3, 20]);
    expect(r.skipped).toBe(0);
    // a percent sign means a percent: 0.5 % is no body fat anyone has
    expect(parseShortcut({ dates: 'Oct 28, 2026', body_fat_percentage: '0.5%' }).metrics).toEqual([]);
  });

  it('outside the bounds (body fat 2–70 %, BMI 10–60, lean 10–150 kg) is skipped with a warning; unreadable lines too', () => {
    const r = parseShortcut({ dates: DATES, body_fat_percentage: '1.5\n70\n71', body_mass_index: '9.9\n60\n61', lean_body_mass: '10\n151\nabc' });
    expect(r.metrics).toEqual([
      { date: '2026-10-29', metric: 'body_fat_pct', value: 70 },
      { date: '2026-10-29', metric: 'bmi', value: 60 },
      { date: '2026-10-28', metric: 'lean_kg', value: 10 }
    ]);
    expect(r.skipped).toBe(6);
    expect(r.warnings).toEqual([
      'body_fat_percentage: 1.5 on 2026-10-28 is outside 2–70; skipped',
      'body_fat_percentage: 71 on 2026-10-30 is outside 2–70; skipped',
      'body_mass_index: 9.9 on 2026-10-28 is outside 10–60; skipped',
      'body_mass_index: 61 on 2026-10-30 is outside 10–60; skipped',
      'lean_body_mass: 151 on 2026-10-29 is outside 10–150; skipped'
    ]);
  });

  it('a list whose length differs from dates is dropped with a warning; a body without them (an older Shortcut) is as before', () => {
    const r = parseShortcut({ ...BODY, body_mass_index: '22.8', lean_body_mass: '0\n0\n52' });
    expect(r.warnings).toEqual(['body_mass_index: 1 lines but 3 dates; body_mass_index not saved']);
    expect(r.metrics.filter((m) => m.metric === 'bmi')).toEqual([]);
    expect(r.metrics.at(-1)).toEqual({ date: '2026-10-30', metric: 'lean_kg', value: 52 });
    expect(parseShortcut(BODY).metrics.map((m) => m.metric)).not.toContain('bmi');
    expect(parseShortcut({ dates: 'Oct 28, 2026', lean_body_mass: '50' }).metrics).toEqual([{ date: '2026-10-28', metric: 'lean_kg', value: 50 }]);
    expect(() => parseShortcut({ dates: 'Oct 28, 2026', body_fat_percentage: [0.2] })).toThrow(/body_fat_percentage: expected Text/);
  });
});
