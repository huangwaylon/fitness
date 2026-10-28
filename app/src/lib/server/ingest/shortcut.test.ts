import { beforeEach, describe, expect, it } from 'vitest';
import type { Db } from '#lib/server/db/index.ts';
import { dailyMetric, rawPayload, workout } from '#lib/server/db/schema.ts';
import { ingestHae } from '#lib/server/ingest/hae.ts';
import { ingestShortcut, looseDate, looseNumber } from '#lib/server/ingest/shortcut.ts';
import { canonicalWorkoutType } from '#lib/server/ingest/workout-names.ts';
import { guard } from '#lib/server/guard.ts';
import { createDeviceToken } from '#lib/server/auth.ts';
import { fakeEvent, freshDb } from '#lib/server/test-utils.ts';

let db: Db;
beforeEach(() => {
  db = freshDb();
});

const metrics = () => db.select({ d: dailyMetric.localDate, m: dailyMetric.metric, v: dailyMetric.value }).from(dailyMetric)
  .orderBy(dailyMetric.localDate, dailyMetric.metric).all();

describe('Shortcut ingest', () => {
  it('reads loose numbers and dates from Shortcuts', () => {
    expect(looseNumber('8,123')).toBe(8123);
    expect(looseNumber('8123 歩')).toBe(8123);
    expect(looseNumber(42.5)).toBe(42.5);
    expect(looseNumber('—')).toBeNull();
    expect(looseDate('2026-10-28T07:05:00+09:00')).toBe('2026-10-28T07:05:00+09:00');
    expect(looseDate('2026/10/28 7:05')).toBe('2026-10-28T07:05:00+09:00');
    expect(looseDate('2026-10-27 23:30:00 +0000')).toBe('2026-10-27T23:30:00+00:00');
  });

  it('totals raw samples per day; Watch + iPhone steps are not double-counted', () => {
    const body = {
      steps: {
        values: [3000, 2000, 2800, 2100, '1,500'],
        starts: ['2026-10-27T08:00:00+09:00', '2026-10-27T18:00:00+09:00', '2026-10-27T08:00:00+09:00', '2026-10-27T18:00:00+09:00', '2026-10-28T09:00:00+09:00'],
        sources: ['Apple Watch', 'Apple Watch', 'iPhone', 'iPhone', 'Apple Watch']
      },
      exercise: { values: [1, 1, 1, 30], starts: ['2026-10-27T08:00:00+09:00', '2026-10-27T08:01:00+09:00', '2026-10-27T08:02:00+09:00', '2026-10-28T07:00:00+09:00'] }
    };
    const r = ingestShortcut(db, 'A', JSON.stringify(body));
    expect(r).toMatchObject({ ok: true, status: 'ok', metrics: 4 });
    expect(metrics()).toEqual([
      { d: '2026-10-27', m: 'exercise_min', v: 3 },
      { d: '2026-10-27', m: 'steps', v: 5000 }, // max(Watch 5000, iPhone 4900), not 9900
      { d: '2026-10-28', m: 'exercise_min', v: 30 },
      { d: '2026-10-28', m: 'steps', v: 1500 }
    ]);
    expect(db.select().from(rawPayload).get()!.source).toBe('shortcut');
  });

  it('a partial first day never lowers an existing total; re-sending is idempotent', () => {
    ingestShortcut(db, 'A', JSON.stringify({ days: [{ date: '2026-10-27', steps: 9000, exerciseMin: 40 }] }));
    ingestShortcut(db, 'A', JSON.stringify({ days: [{ date: '2026-10-27', steps: 1200, exerciseMin: 5 }] }));
    expect(metrics()).toEqual([{ d: '2026-10-27', m: 'exercise_min', v: 40 }, { d: '2026-10-27', m: 'steps', v: 9000 }]);
  });

  it('workouts: Japanese names normalised, unknown ones reported, same row as HAE for the same workout', () => {
    const r = ingestShortcut(db, 'A', JSON.stringify({
      workouts: {
        types: ['伝統的な筋力トレーニング', '屋外ウォーキング', 'カバディ'],
        starts: ['2026-11-02T08:30:10+09:00', '2026-11-03T12:10:00+09:00', '2026-11-03T18:00:00+09:00'],
        ends: ['2026-11-02T09:22:10+09:00', '2026-11-03T12:41:30+09:00', '2026-11-03T18:30:00+09:00'],
        avgHrs: ['118', '', null]
      }
    }));
    expect(r).toMatchObject({ ok: true, workouts: 3, unknownTypes: ['カバディ'] });
    const ws = db.select().from(workout).orderBy(workout.startAt).all();
    expect(ws.map((w) => [w.type, w.durationMin, w.avgHr])).toEqual([
      ['Traditional Strength Training', 52, 118], ['Outdoor Walk', 31.5, null], ['カバディ', 30, null]
    ]);
    // HAE sends the same strength workout (23:30 UTC Nov 1 = 08:30 JST, English name): still one row.
    ingestHae(db, 'A', JSON.stringify({ data: { workouts: [{ id: 'hae-1', name: 'Traditional Strength Training', start: '2026-11-01 23:30:00 +0000', end: '2026-11-02 00:22:00 +0000', duration: 3120 }] } }));
    expect(db.select().from(workout).all()).toHaveLength(3);
  });

  it('rejects a body with nothing usable, keeping the raw payload', () => {
    expect(ingestShortcut(db, 'A', '{"hello":1}').ok).toBe(false);
    expect(db.select().from(rawPayload).get()!.parseStatus).toBe('error');
  });

  it('only the Shortcuts token may post to /ingest/shortcut', async () => {
    const sc = createDeviceToken(db, 'A', 'shortcut', 'iPhone').token;
    const hae = createDeviceToken(db, 'A', 'hae', 'iPhone').token;
    expect(await guard(fakeEvent('/ingest/shortcut/A', { method: 'POST', headers: { authorization: `Bearer ${sc}` } }), { db: () => db })).toBeNull();
    expect((await guard(fakeEvent('/ingest/shortcut/A', { method: 'POST', headers: { authorization: `Bearer ${hae}` } }), { db: () => db }))?.status).toBe(401);
    expect((await guard(fakeEvent('/ingest/hae/A', { method: 'POST', headers: { authorization: `Bearer ${sc}` } }), { db: () => db }))?.status).toBe(401);
  });

  it('canonical names leave English alone', () => {
    expect(canonicalWorkoutType('Yoga')).toBe('Yoga');
    expect(canonicalWorkoutType(' ヨガ ')).toBe('Yoga');
  });
});
