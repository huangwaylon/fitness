// Health Auto Export (JSON, export version 2) ingest: store raw → lenient parse → idempotent upserts.
import { gzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import { sql } from 'drizzle-orm';
import { z } from 'zod';
import type { PersonId } from '#lib/types.ts';
import { toLocalDate } from '#lib/scoring/index.ts';
import type { Db } from '#lib/server/db/index.ts';
import { dailyMetric, rawPayload, workout } from '#lib/server/db/schema.ts';
import { now } from '#lib/server/clock.ts';

type MetricKey = 'steps' | 'exercise_min' | 'resting_hr' | 'walking_hr';

/** HAE metric name → our metric, and how multiple points on one day combine. */
const METRICS: Record<string, { key: MetricKey; agg: 'sum' | 'avg' }> = {
  step_count: { key: 'steps', agg: 'sum' },
  apple_exercise_time: { key: 'exercise_min', agg: 'sum' },
  resting_heart_rate: { key: 'resting_hr', agg: 'avg' },
  walking_heart_rate_average: { key: 'walking_hr', agg: 'avg' }
};

const num = z.union([z.number(), z.string().regex(/^-?\d+(\.\d+)?$/).transform(Number)]);
const qtyObj = z.object({ qty: num }).loose();

const pointSchema = z.object({ date: z.string(), qty: num.optional(), Avg: num.optional(), avg: num.optional() }).loose();
const metricSchema = z.object({ name: z.string(), units: z.string().optional(), data: z.array(z.unknown()).default([]) }).loose();
const workoutSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  start: z.string(),
  end: z.string(),
  duration: num.optional(),
  avgHeartRate: z.union([num, qtyObj]).optional(),
  heartRate: z.object({ avg: z.union([num, qtyObj]).optional() }).loose().optional(),
  heartRateData: z.array(z.unknown()).optional()
}).loose();
const bodySchema = z.object({ metrics: z.array(z.unknown()).optional(), workouts: z.array(z.unknown()).optional() }).loose();

/** `2026-11-02 07:00:00 +0900` (HAE) or ISO → ISO 8601 with offset; null if unparseable. */
export function haeDateToIso(s: string): string | null {
  const m = s.trim().match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}(?::\d{2})?)(?:\.\d+)?\s*(Z|[+-]\d{2}:?\d{2})?$/);
  if (m) {
    const time = m[2].length === 5 ? `${m[2]}:00` : m[2];
    let off = m[3] ?? '+09:00'; // no offset → assume Tokyo
    if (off !== 'Z' && !off.includes(':')) off = `${off.slice(0, 3)}:${off.slice(3)}`;
    const iso = `${m[1]}T${time}${off}`;
    return Number.isNaN(Date.parse(iso)) ? null : iso;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(s.trim())) return `${s.trim()}T00:00:00+09:00`;
  return null;
}

function qtyOf(v: unknown): number | null {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  const r = qtyObj.safeParse(v);
  return r.success && Number.isFinite(r.data.qty) ? r.data.qty : null;
}

function avgHrOf(w: z.infer<typeof workoutSchema>): number | null {
  const direct = qtyOf(w.avgHeartRate) ?? qtyOf(w.heartRate?.avg);
  if (direct !== null) return direct;
  const vals = (w.heartRateData ?? [])
    .map((p) => {
      const r = pointSchema.safeParse(p);
      return r.success ? (r.data.Avg ?? r.data.avg ?? r.data.qty ?? null) : null;
    })
    .filter((x): x is number => x !== null && Number.isFinite(x));
  return vals.length ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 : null;
}

export interface ParsedHae {
  metrics: { localDate: string; metric: MetricKey; value: number }[];
  workouts: { extId: string; localDate: string; type: string; startAt: string; endAt: string; durationMin: number; avgHr: number | null }[];
  skipped: number;
}

/** Pure parse. Throws only if the top level isn't a HAE body at all. */
export function parseHae(raw: unknown): ParsedHae {
  const inner = (raw && typeof raw === 'object' && 'data' in raw && (raw as { data: unknown }).data) || raw;
  const body = bodySchema.parse(inner);
  if (!body.metrics && !body.workouts) throw new Error('no metrics or workouts');
  let skipped = 0;

  const buckets = new Map<string, { metric: MetricKey; localDate: string; agg: 'sum' | 'avg'; values: number[] }>();
  for (const m of body.metrics ?? []) {
    const mr = metricSchema.safeParse(m);
    if (!mr.success) { skipped++; continue; }
    const def = METRICS[mr.data.name];
    if (!def) continue; // metrics we don't use
    for (const p of mr.data.data) {
      const pr = pointSchema.safeParse(p);
      const iso = pr.success ? haeDateToIso(pr.data.date) : null;
      const value = pr.success ? (pr.data.qty ?? pr.data.Avg ?? pr.data.avg) : undefined;
      if (!iso || value === undefined || !Number.isFinite(value)) { skipped++; continue; }
      const localDate = toLocalDate(iso);
      const k = `${def.key}|${localDate}`;
      const b = buckets.get(k) ?? { metric: def.key, localDate, agg: def.agg, values: [] };
      b.values.push(value);
      buckets.set(k, b);
    }
  }
  const metrics = [...buckets.values()].map((b) => {
    const sum = b.values.reduce((a, c) => a + c, 0);
    const v = b.agg === 'sum' ? sum : sum / b.values.length;
    return { localDate: b.localDate, metric: b.metric, value: Math.round(v * 100) / 100 };
  });

  const workouts: ParsedHae['workouts'] = [];
  for (const w of body.workouts ?? []) {
    const wr = workoutSchema.safeParse(w);
    if (!wr.success) { skipped++; continue; }
    const startAt = haeDateToIso(wr.data.start);
    const endAt = haeDateToIso(wr.data.end);
    if (!startAt || !endAt) { skipped++; continue; }
    const durS = wr.data.duration ?? (Date.parse(endAt) - Date.parse(startAt)) / 1000;
    const extId = wr.data.id ?? `hash:${createHash('sha256').update(`${wr.data.name}|${startAt}`).digest('hex').slice(0, 24)}`;
    workouts.push({
      extId, localDate: toLocalDate(startAt), type: wr.data.name, startAt, endAt,
      durationMin: Math.round((durS / 60) * 10) / 10, avgHr: avgHrOf(wr.data)
    });
  }
  return { metrics, workouts, skipped };
}

export interface IngestResult { ok: boolean; metrics: number; workouts: number; status: 'ok' | 'partial' | 'error'; error?: string }

/** Store the raw body (gzipped) and apply it. Re-sending the same payload yields the same state. */
export function ingestHae(db: Db, person: PersonId, bodyText: string): IngestResult {
  const bodyGz = gzipSync(Buffer.from(bodyText, 'utf8')).toString('base64');
  let parsed: ParsedHae;
  try {
    parsed = parseHae(JSON.parse(bodyText));
  } catch (e) {
    const msg = (e instanceof Error ? e.message : String(e)).slice(0, 500);
    db.insert(rawPayload).values({ person, source: 'hae', bodyGz, parseStatus: 'error', parseError: msg }).run();
    return { ok: false, metrics: 0, workouts: 0, status: 'error', error: msg };
  }
  const status = parsed.skipped > 0 ? 'partial' : 'ok';
  const t = now().toISOString();
  db.transaction((tx) => {
    tx.insert(rawPayload).values({
      person, source: 'hae', bodyGz, parseStatus: status, parseError: parsed.skipped ? `${parsed.skipped} items skipped` : null, receivedAt: t
    }).run();
    for (const m of parsed.metrics) {
      tx.insert(dailyMetric).values({ person, ...m, updatedAt: t })
        .onConflictDoUpdate({ target: [dailyMetric.person, dailyMetric.localDate, dailyMetric.metric], set: { value: m.value, updatedAt: t } })
        .run();
    }
    for (const w of parsed.workouts) {
      tx.insert(workout).values({ person, ...w, includesStrength: null, updatedAt: t })
        .onConflictDoUpdate({
          target: [workout.person, workout.extId],
          // includesStrength is the person's answer: never overwritten by ingest.
          set: { localDate: w.localDate, type: w.type, startAt: w.startAt, endAt: w.endAt, durationMin: w.durationMin, avgHr: sql`coalesce(excluded.avg_hr, ${workout.avgHr})`, updatedAt: t }
        })
        .run();
    }
  });
  return { ok: true, metrics: parsed.metrics.length, workouts: parsed.workouts.length, status };
}
