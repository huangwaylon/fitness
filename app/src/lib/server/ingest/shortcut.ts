// iOS Shortcuts ingest (docs/ops/shortcut-health-sync.md). The Shortcut sends what "Find Health Samples" returns
// with as little work on the phone as possible: parallel lists of sample values / start dates / sources (no
// Repeat loops), or pre-totalled days. The server totals per day.
import { z } from 'zod';
import type { PersonId } from '#lib/types.ts';
import { toLocalDate } from '#lib/scoring/index.ts';
import type { Db } from '#lib/server/db/index.ts';
import { haeDateToIso, ingestWith, type IngestResult, type ParsedHae } from '#lib/server/ingest/hae.ts';
import { canonicalWorkoutType, isUnknownLocalisedType, workoutKey } from '#lib/server/ingest/workout-names.ts';

/** "8,123", "8123 歩", 8123 → 8123; null if there's no number. */
export function looseNumber(v: unknown): number | null {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  if (typeof v !== 'string') return null;
  const m = v.replace(/[,，\s]/g, '').match(/-?\d+(\.\d+)?/);
  return m ? Number(m[0]) : null;
}

/** ISO 8601, HAE (`2026-10-28 07:05:00 +0900`) or `2026/10/28 7:05` (no offset → Tokyo). */
export function looseDate(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  let s = v.trim().replace(/\//g, '-');
  s = s.replace(/^(\d{4})-(\d{1,2})-(\d{1,2})/, (_, y, m, d) => `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`);
  s = s.replace(/([ T])(\d):/, '$10$2:');
  return haeDateToIso(s);
}

const list = z.array(z.unknown()).default([]);
const series = z.object({ values: list, starts: list, sources: list.optional() }).loose();
const workoutObj = z.object({
  type: z.string(), start: z.unknown(), end: z.unknown(), avgHr: z.unknown().optional(), durationMin: z.unknown().optional()
}).loose();
const workoutLists = z.object({ types: list, starts: list, ends: list, avgHrs: list.optional() }).loose();
const bodySchema = z.object({
  steps: series.optional(),
  exercise: series.optional(),
  days: z.array(z.object({ date: z.string(), steps: z.unknown().optional(), exerciseMin: z.unknown().optional() }).loose()).optional(),
  workouts: z.union([z.array(z.unknown()), workoutLists]).optional()
}).loose();

/**
 * Per-day total of raw samples. The Watch and the iPhone both record steps, so summing everything double-counts;
 * Health merges them, but Shortcuts returns raw samples. Approximation: total per source, then take the larger.
 */
function dailyTotals(s: z.infer<typeof series>, onSkip: () => void): Map<string, number> {
  const bySource = new Map<string, number>();
  for (let i = 0; i < s.values.length; i++) {
    const v = looseNumber(s.values[i]);
    const iso = looseDate(s.starts[i]);
    if (v === null || !iso) { onSkip(); continue; }
    const k = `${toLocalDate(iso)}|${String(s.sources?.[i] ?? '')}`;
    bySource.set(k, (bySource.get(k) ?? 0) + v);
  }
  const out = new Map<string, number>();
  for (const [k, v] of bySource) {
    const date = k.slice(0, 10);
    out.set(date, Math.max(out.get(date) ?? 0, v));
  }
  return out;
}

export interface ParsedShortcut extends ParsedHae { unknownTypes: string[] }

export function parseShortcut(raw: unknown): ParsedShortcut {
  const body = bodySchema.parse(raw);
  if (!body.steps && !body.exercise && !body.days && !body.workouts) throw new Error('no steps, exercise, days or workouts');
  let skipped = 0;
  const skip = () => void skipped++;
  const metrics: ParsedHae['metrics'] = [];
  const round = (v: number) => Math.round(v * 100) / 100;
  for (const [key, s] of [['steps', body.steps], ['exercise_min', body.exercise]] as const) {
    if (!s) continue;
    for (const [localDate, v] of dailyTotals(s, skip)) metrics.push({ localDate, metric: key, value: round(v) });
  }
  for (const d of body.days ?? []) {
    const date = looseDate(d.date);
    if (!date) { skip(); continue; }
    const localDate = date.slice(0, 10);
    const steps = looseNumber(d.steps);
    const ex = looseNumber(d.exerciseMin);
    if (steps !== null) metrics.push({ localDate, metric: 'steps', value: round(steps) });
    if (ex !== null) metrics.push({ localDate, metric: 'exercise_min', value: round(ex) });
  }

  const items: { type: unknown; start: unknown; end: unknown; avgHr?: unknown }[] = Array.isArray(body.workouts)
    ? body.workouts.map((w) => {
        const r = workoutObj.safeParse(w);
        return r.success ? r.data : { type: null, start: null, end: null };
      })
    : body.workouts
      ? body.workouts.types.map((type, i) => ({
          type, start: (body.workouts as z.infer<typeof workoutLists>).starts[i],
          end: (body.workouts as z.infer<typeof workoutLists>).ends[i], avgHr: (body.workouts as z.infer<typeof workoutLists>).avgHrs?.[i]
        }))
      : [];
  const workouts: ParsedHae['workouts'] = [];
  const unknownTypes = new Set<string>();
  for (const w of items) {
    const startAt = looseDate(w.start);
    const endAt = looseDate(w.end);
    if (typeof w.type !== 'string' || !startAt || !endAt || Date.parse(endAt) < Date.parse(startAt)) { skip(); continue; }
    if (isUnknownLocalisedType(w.type)) unknownTypes.add(w.type.trim());
    const type = canonicalWorkoutType(w.type);
    workouts.push({
      extId: workoutKey(type, startAt), localDate: toLocalDate(startAt), type, startAt, endAt,
      durationMin: Math.round(((Date.parse(endAt) - Date.parse(startAt)) / 60000) * 10) / 10,
      avgHr: looseNumber(w.avgHr)
    });
  }
  return { metrics, workouts, skipped, unknownTypes: [...unknownTypes] };
}

export function ingestShortcut(db: Db, person: PersonId, bodyText: string): IngestResult & { unknownTypes?: string[] } {
  let unknownTypes: string[] = [];
  const r = ingestWith(db, person, 'shortcut', bodyText, (raw) => {
    const p = parseShortcut(raw);
    unknownTypes = p.unknownTypes;
    return p;
  }, 'max');
  return unknownTypes.length ? { ...r, unknownTypes } : r;
}
