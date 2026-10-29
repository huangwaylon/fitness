import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { canonicalWorkoutType, looseDate, looseNumber, parseShortcut, sha256Hex, ShapeError, workoutKey } from './parse.ts';

const byDate = (ms: { date: string; metric: string; value: number }[]) =>
  [...ms].sort((a, b) => (a.date + a.metric).localeCompare(b.date + b.metric));

describe('parse: loose values', () => {
  it('reads loose numbers and dates from Shortcuts', () => {
    expect(looseNumber('8,123')).toBe(8123);
    expect(looseNumber('8123 歩')).toBe(8123);
    expect(looseNumber(42.5)).toBe(42.5);
    expect(looseNumber('—')).toBeNull();
    expect(looseDate('2026-10-28T07:05:00+09:00')).toBe('2026-10-28T07:05:00+09:00');
    expect(looseDate('2026/10/28 7:05')).toBe('2026-10-28T07:05:00+09:00');
    expect(looseDate('2026-10-27 23:30:00 +0000')).toBe('2026-10-27T23:30:00+00:00');
    expect(looseDate('Oct 28, 2026 at 8:10 PM')).toBe('2026-10-28T20:10:00+09:00');
    expect(looseDate('Oct 28, 2026 at 12:05 AM')).toBe('2026-10-28T00:05:00+09:00');
    expect(looseDate('October 3, 2026')).toBe('2026-10-03T00:00:00+09:00');
    expect(looseDate('28 Oct 2026 at 08:10')).toBe('2026-10-28T08:10:00+09:00');
    expect(looseDate('2026年10月28日 午後8:10')).toBe('2026-10-28T20:10:00+09:00');
    expect(looseDate('2026年10月3日 7:05')).toBe('2026-10-03T07:05:00+09:00');
    expect(looseDate('soon')).toBeNull();
    expect(looseDate(12)).toBeNull();
  });

  it('canonical names leave English alone', () => {
    expect(canonicalWorkoutType('Yoga')).toBe('Yoga');
    expect(canonicalWorkoutType(' ヨガ ')).toBe('Yoga');
  });
});

describe('parse: workoutKey', () => {
  it('pure SHA-256 matches node:crypto, including non-ASCII and multi-block input', () => {
    for (const s of ['', 'abc', 'Traditional Strength Training|2026-11-01T23:30:00.000Z', 'カバディ🏉'.repeat(30)]) {
      expect(sha256Hex(s)).toBe(createHash('sha256').update(s).digest('hex'));
    }
  });

  it('is the same id the Mac server computed (migrated workouts keep their ids)', () => {
    const minute = '2026-11-01T23:30:00.000Z';
    const server = `w:${createHash('sha256').update(`Traditional Strength Training|${minute}`).digest('hex').slice(0, 24)}`;
    expect(workoutKey('伝統的な筋力トレーニング', '2026-11-02T08:30:10+09:00')).toBe(server);
  });

  // Pinned before the name tables were merged (round 8): every alias keeps its canonical name and id.
  it.each([
    ['伝統的な筋力トレーニング', 'Traditional Strength Training', 'w:8ffdf3351f556125b9a5c057'],
    ['筋力トレーニング', 'Traditional Strength Training', 'w:8ffdf3351f556125b9a5c057'],
    ['機能的な筋力トレーニング', 'Functional Strength Training', 'w:23e01791179957e69307895d'],
    ['コアトレーニング', 'Core Training', 'w:311046d3f686ec136c89e943'],
    ['ピラティス', 'Pilates', 'w:fec8b6ac8125ef0f7af27bb5'],
    ['ヨガ', 'Yoga', 'w:8fa64fe652f984aa2ed2c3d8'],
    ['高強度インターバルトレーニング', 'High Intensity Interval Training', 'w:e509860e77edd5555f3e91d8'],
    ['HIIT', 'High Intensity Interval Training', 'w:e509860e77edd5555f3e91d8'],
    ['ミックスカーディオ', 'Mixed Cardio', 'w:794d983389f48a438b391d62'],
    ['クロストレーニング', 'Cross Training', 'w:1ceda21009a71ec89aaa28ed'],
    ['ウォーキング', 'Walking', 'w:eff997f3e53b3e0937beef2e'],
    ['屋外ウォーキング', 'Outdoor Walk', 'w:841810fa334039e00ac614e6'],
    ['室内ウォーキング', 'Indoor Walk', 'w:f8461cb1d054ca5858585f10'],
    ['ハイキング', 'Hiking', 'w:2238b42cacc274ca572a51c9'],
    ['ランニング', 'Running', 'w:f8819bdd79c855d470ecdea2'],
    ['屋外ランニング', 'Outdoor Run', 'w:b10bb35eff39ca838481c4df'],
    ['室内ランニング', 'Indoor Run', 'w:2b713c689a6cc3d8a64d773d'],
    ['サイクリング', 'Cycling', 'w:10d2c06fbe1e3477e5cd4570'],
    ['水泳', 'Swimming', 'w:31194cfbc6716fdf949525e3'],
    ['ダンス', 'Dance', 'w:d4aff47fc027120c4608dc9c'],
    ['エリプティカル', 'Elliptical', 'w:5b1270cf260be7ab8f3439b8'],
    ['ローイング', 'Rowing', 'w:88fd19c957ab2f0cb0b67070']
  ])('%s → %s → %s', (ja, en, id) => {
    expect(canonicalWorkoutType(ja)).toBe(en);
    expect(workoutKey(ja, '2026-11-02T07:00:00+09:00')).toBe(id);
    expect(workoutKey(en, '2026-11-02T07:00:00+09:00')).toBe(id);
  });
});

describe('parse: shapes', () => {
  it("the user's real payload: daily form with Shortcuts date text, calories ignored", () => {
    const r = parseShortcut({
      key: 'k', action: 'ingest',
      dates: 'Sep 28, 2026 at 7:11 AM\nSep 29, 2026 at 7:55 AM\nSep 29, 2026 at 8:00 PM',
      steps: '855\n9106\n100',
      exercise_minutes: '0\n23\n7',
      calories: '0\n248.2\n10'
    });
    expect(r.skipped).toBe(0);
    expect(byDate(r.metrics)).toEqual([
      { date: '2026-09-28', metric: 'exercise_min', value: 0 }, { date: '2026-09-28', metric: 'steps', value: 855 },
      { date: '2026-09-29', metric: 'exercise_min', value: 30 }, { date: '2026-09-29', metric: 'steps', value: 9206 }
    ]);
  });

  it('daily form also takes arrays', () => {
    const r = parseShortcut({ dates: ['2026-10-01', '2026-10-02'], steps: [100, '2,000'] });
    expect(byDate(r.metrics)).toEqual([{ date: '2026-10-01', metric: 'steps', value: 100 }, { date: '2026-10-02', metric: 'steps', value: 2000 }]);
  });

  it('totals raw samples per day; Watch + iPhone steps are not double-counted', () => {
    const r = parseShortcut({
      steps: {
        values: [3000, 2000, 2800, 2100, '1,500'],
        starts: ['2026-10-27T08:00:00+09:00', '2026-10-27T18:00:00+09:00', '2026-10-27T08:00:00+09:00', '2026-10-27T18:00:00+09:00', '2026-10-28T09:00:00+09:00'],
        sources: ['Apple Watch', 'Apple Watch', 'iPhone', 'iPhone', 'Apple Watch']
      },
      exercise: { values: [1, 1, 1, 30], starts: ['2026-10-27T08:00:00+09:00', '2026-10-27T08:01:00+09:00', '2026-10-27T08:02:00+09:00', '2026-10-28T07:00:00+09:00'] }
    });
    expect(byDate(r.metrics)).toEqual([
      { date: '2026-10-27', metric: 'exercise_min', value: 3 },
      { date: '2026-10-27', metric: 'steps', value: 5000 }, // max(Watch 5000, iPhone 4900), not 9900
      { date: '2026-10-28', metric: 'exercise_min', value: 30 },
      { date: '2026-10-28', metric: 'steps', value: 1500 }
    ]);
  });

  it('a UTC sample late in the evening lands on the next Tokyo day', () => {
    const r = parseShortcut({ steps: { values: [10], starts: ['2026-10-27T16:00:00Z'] } });
    expect(r.metrics).toEqual([{ date: '2026-10-28', metric: 'steps', value: 10 }]);
  });

  it('days form, skipping unreadable entries', () => {
    const r = parseShortcut({ days: [{ date: '2026-10-27', steps: 9000, exerciseMin: '40' }, { date: 'nope', steps: 1 }, 7] });
    expect(byDate(r.metrics)).toEqual([{ date: '2026-10-27', metric: 'exercise_min', value: 40 }, { date: '2026-10-27', metric: 'steps', value: 9000 }]);
    expect(r.skipped).toBe(2);
  });

  it('days form: a timestamp with an offset lands on its Tokyo date, not the UTC one', () => {
    const r = parseShortcut({ days: [{ date: '2026-10-28T20:00:00Z', steps: 500 }, { date: '2026-10-29 08:00:00 +0900', steps: 600 }] });
    expect(r.metrics).toEqual([{ date: '2026-10-29', metric: 'steps', value: 500 }, { date: '2026-10-29', metric: 'steps', value: 600 }]);
  });

  it('workouts: Japanese names normalised, unknown ones reported, ids stable across language and zone', () => {
    const r = parseShortcut({
      workouts: {
        types: ['伝統的な筋力トレーニング', '屋外ウォーキング', 'カバディ'],
        starts: ['2026-11-02T08:30:10+09:00', '2026-11-03T12:10:00+09:00', '2026-11-03T18:00:00+09:00'],
        ends: ['2026-11-02T09:22:10+09:00', '2026-11-03T12:41:30+09:00', '2026-11-03T18:30:00+09:00'],
        avgHrs: ['118', '', null]
      }
    });
    expect(r.unknownTypes).toEqual(['カバディ']);
    expect(r.workouts.map((w) => [w.type, w.date, w.durationMin, w.avgHr])).toEqual([
      ['Traditional Strength Training', '2026-11-02', 52, 118], ['Outdoor Walk', '2026-11-03', 31.5, null], ['カバディ', '2026-11-03', 30, null]
    ]);
    const again = parseShortcut({ workouts: [{ type: 'Traditional Strength Training', start: '2026-11-01 23:30:40 +0000', end: '2026-11-02 00:22:10 +0000' }] });
    expect(again.workouts[0].id).toBe(r.workouts[0].id);
  });

  it('workouts as newline text; bad items are skipped', () => {
    const r = parseShortcut({
      workouts: { types: 'ヨガ\nRunning', starts: '2026-11-02T08:00:00+09:00\nnot a date', ends: '2026-11-02T08:30:00+09:00\n2026-11-02T09:00:00+09:00' }
    });
    expect(r.workouts.map((w) => w.type)).toEqual(['Yoga']);
    expect(r.skipped).toBe(1);
    const r2 = parseShortcut({ workouts: [{ type: 'Yoga', start: '2026-11-02T09:00:00+09:00', end: '2026-11-02T08:00:00+09:00' }, 'x'] });
    expect(r2.workouts).toEqual([]);
    expect(r2.skipped).toBe(2);
  });

  it('accepts newline-joined text lists (Dictionary fields typed as Text)', () => {
    const r = parseShortcut({
      steps: { values: '300\n700', starts: '2026-10-28T08:00:00+09:00\n2026-10-28T12:00:00+09:00', sources: 'Apple Watch\nApple Watch' },
      calories: ''
    });
    expect(r.metrics).toEqual([{ date: '2026-10-28', metric: 'steps', value: 1000 }]);
  });

  it('simple form: values + one date', () => {
    expect(parseShortcut({ date: '2026-10-28', steps: '12\n3\n27', calories: '' }).metrics).toEqual([{ date: '2026-10-28', metric: 'steps', value: 42 }]);
    expect(parseShortcut({ date: '2026/10/28 21:30', exercise: ['20', '15'] }).metrics).toEqual([{ date: '2026-10-28', metric: 'exercise_min', value: 35 }]);
  });

  it('explains what is missing', () => {
    expect(() => parseShortcut({ hello: 1 })).toThrow(/no steps, exercise, days or workouts/);
    expect(() => parseShortcut({ steps: '12\n3\n27', calories: '' })).toThrow(/steps has values but no start dates/);
    expect(() => parseShortcut({ steps: { values: '1\n2', starts: '2026-10-28T08:00:00+09:00' } })).toThrow(/got 2 values but 1 start dates/);
    expect(() => parseShortcut({ steps: { values: 5 } })).toThrow(/steps.values: expected a list/);
    expect(() => parseShortcut({ workouts: 3 })).toThrow(ShapeError);
    expect(() => parseShortcut(null)).toThrow(ShapeError);
    expect(() => parseShortcut([1])).toThrow(ShapeError);
  });
});
