import { beforeEach, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { and, eq } from 'drizzle-orm';
import type { Db } from '#lib/server/db/index.ts';
import { dailyMetric, rawPayload, workout } from '#lib/server/db/schema.ts';
import { haeDateToIso, ingestHae } from '#lib/server/ingest/hae.ts';
import { freshDb } from '#lib/server/test-utils.ts';

const fixture = (name: string) => readFileSync(new URL(`../fixtures/${name}`, import.meta.url), 'utf8');
let db: Db;

function snapshot() {
  return {
    metrics: db.select({ p: dailyMetric.person, d: dailyMetric.localDate, m: dailyMetric.metric, v: dailyMetric.value }).from(dailyMetric).orderBy(dailyMetric.localDate, dailyMetric.metric).all(),
    workouts: db.select({ id: workout.extId, d: workout.localDate, t: workout.type, min: workout.durationMin, hr: workout.avgHr, s: workout.includesStrength }).from(workout).orderBy(workout.extId).all()
  };
}

beforeEach(() => {
  db = freshDb();
});

describe('HAE ingest', () => {
  it('parses HAE timestamps', () => {
    expect(haeDateToIso('2026-11-02 07:15:00 +0900')).toBe('2026-11-02T07:15:00+09:00');
    expect(haeDateToIso('2026-11-01 23:30:00 +0000')).toBe('2026-11-01T23:30:00+00:00');
    expect(haeDateToIso('garbage')).toBeNull();
  });

  it('maps metrics to daily rows (wrapped shape), ignoring unused metrics', () => {
    const r = ingestHae(db, 'A', fixture('hae-metrics-a.json'));
    expect(r).toMatchObject({ ok: true, status: 'ok', metrics: 7, workouts: 0 });
    const s = snapshot().metrics;
    expect(s).toContainEqual({ p: 'A', d: '2026-11-02', m: 'steps', v: 8412 });
    expect(s).toContainEqual({ p: 'A', d: '2026-11-02', m: 'exercise_min', v: 47 });
    expect(s).toContainEqual({ p: 'A', d: '2026-11-03', m: 'resting_hr', v: 60 });
    expect(s).toContainEqual({ p: 'A', d: '2026-11-02', m: 'walking_hr', v: 97.5 });
  });

  it('is idempotent: the same payloads ×3 give the same state', () => {
    for (const f of ['hae-metrics-a.json', 'hae-workouts-a.json']) ingestHae(db, 'A', fixture(f));
    const once = snapshot();
    for (let i = 0; i < 2; i++) for (const f of ['hae-metrics-a.json', 'hae-workouts-a.json']) ingestHae(db, 'A', fixture(f));
    expect(snapshot()).toEqual(once);
    expect(db.select().from(rawPayload).all()).toHaveLength(6); // raw kept per delivery
  });

  it('maps workouts to the Tokyo local date and reads avg HR leniently', () => {
    ingestHae(db, 'A', fixture('hae-workouts-a.json'));
    const ws = snapshot().workouts;
    const strength = ws.find((w) => w.t === 'Traditional Strength Training')!;
    expect(strength.d).toBe('2026-11-02'); // 23:30 UTC Nov 1 = 08:30 JST Nov 2
    expect(strength.min).toBe(52);
    expect(strength.hr).toBe(118);
    expect(ws.find((w) => w.t === 'Yoga')!.hr).toBe(95); // mean of heartRateData Avg
    expect(ws.find((w) => w.t === 'Outdoor Walk')!.hr).toBeNull();
  });

  it('keeps includesStrength on re-ingest', () => {
    ingestHae(db, 'A', fixture('hae-workouts-a.json'));
    db.update(workout).set({ includesStrength: true }).where(and(eq(workout.person, 'A'), eq(workout.type, 'Yoga'))).run();
    ingestHae(db, 'A', fixture('hae-workouts-a.json'));
    expect(snapshot().workouts.find((w) => w.t === 'Yoga')!.s).toBe(true);
  });

  it('accepts the bare shape and skips bad items (partial)', () => {
    const r = ingestHae(db, 'B', fixture('hae-bare-b.json'));
    expect(r).toMatchObject({ ok: true, status: 'partial', metrics: 2, workouts: 1 });
    expect(snapshot().workouts[0]).toMatchObject({ t: 'Functional Strength Training', hr: 124, d: '2026-11-02' });
  });

  it('stores unparseable payloads with status error', () => {
    const r = ingestHae(db, 'A', '{"hello": ');
    expect(r.ok).toBe(false);
    const row = db.select().from(rawPayload).get()!;
    expect(row.parseStatus).toBe('error');
    expect(gunzipSync(Buffer.from(row.bodyGz, 'base64')).toString()).toBe('{"hello": ');
  });

  it('route rejects a token for the other person', async () => {
    const { POST } = await import('../../../routes/ingest/hae/[person]/+server.ts');
    const res = await POST({ request: new Request('https://x/ingest/hae/B', { method: 'POST', body: fixture('hae-bare-b.json') }), locals: { person: 'A', deviceId: 1 }, params: { person: 'B' } } as never);
    expect(res.status).toBe(403);
    const ok = await POST({ request: new Request('https://x/ingest/hae/B', { method: 'POST', body: fixture('hae-bare-b.json') }), locals: { person: 'B', deviceId: 1 }, params: { person: 'B' } } as never);
    expect(await ok.json()).toMatchObject({ ok: true, metrics: 2, workouts: 1 });
  });
});
