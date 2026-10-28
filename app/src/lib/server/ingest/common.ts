// Ingest plumbing for the Shortcuts sync: date parsing, the parsed shape, and the store-raw-then-upsert transaction.
import { gzipSync } from 'node:zlib';
import { sql } from 'drizzle-orm';
import type { PersonId } from '#lib/types.ts';
import type { Db } from '#lib/server/db/index.ts';
import { dailyMetric, rawPayload, workout } from '#lib/server/db/schema.ts';
import { now } from '#lib/server/clock.ts';

export type MetricKey = 'steps' | 'exercise_min';

/** `2026-11-02 07:00:00 +0900`, ISO 8601, or a bare date → ISO 8601 with offset (no offset → Tokyo); null if unparseable. */
export function toIsoDate(s: string): string | null {
  const m = s.trim().match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}(?::\d{2})?)(?:\.\d+)?\s*(Z|[+-]\d{2}:?\d{2})?$/);
  if (m) {
    const time = m[2].length === 5 ? `${m[2]}:00` : m[2];
    let off = m[3] ?? '+09:00';
    if (off !== 'Z' && !off.includes(':')) off = `${off.slice(0, 3)}:${off.slice(3)}`;
    const iso = `${m[1]}T${time}${off}`;
    return Number.isNaN(Date.parse(iso)) ? null : iso;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(s.trim())) return `${s.trim()}T00:00:00+09:00`;
  return null;
}

export interface ParsedIngest {
  metrics: { localDate: string; metric: MetricKey; value: number }[];
  workouts: { extId: string; localDate: string; type: string; startAt: string; endAt: string; durationMin: number; avgHr: number | null }[];
  skipped: number;
}

export interface IngestResult { ok: boolean; metrics: number; workouts: number; status: 'ok' | 'partial' | 'error'; error?: string }

/**
 * Parse, keep the raw payload (also on failure), then upsert daily metrics and workouts in one transaction.
 * Day values only ever rise: an upload may see a partial first day of its window. Re-sending is idempotent.
 */
export function ingestWith(db: Db, person: PersonId, bodyText: string, parse: (raw: unknown) => ParsedIngest): IngestResult {
  const source = 'shortcut';
  const bodyGz = gzipSync(Buffer.from(bodyText, 'utf8')).toString('base64');
  let parsed: ParsedIngest;
  try {
    parsed = parse(JSON.parse(bodyText));
  } catch (e) {
    const msg = (e instanceof Error ? e.message : String(e)).slice(0, 500);
    db.insert(rawPayload).values({ person, source, bodyGz, parseStatus: 'error', parseError: msg }).run();
    return { ok: false, metrics: 0, workouts: 0, status: 'error', error: msg };
  }
  const status = parsed.skipped > 0 ? 'partial' : 'ok';
  const t = now().toISOString();
  db.transaction((tx) => {
    tx.insert(rawPayload).values({
      person, source, bodyGz, parseStatus: status, parseError: parsed.skipped ? `${parsed.skipped} items skipped` : null, receivedAt: t
    }).run();
    for (const m of parsed.metrics) {
      tx.insert(dailyMetric).values({ person, ...m, updatedAt: t })
        .onConflictDoUpdate({
          target: [dailyMetric.person, dailyMetric.localDate, dailyMetric.metric],
          set: { value: sql`max(${dailyMetric.value}, excluded.value)`, updatedAt: t }
        })
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
