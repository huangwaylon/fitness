// iOS Shortcuts ingest (docs/ops/shortcut-health-sync.md). The Shortcut sends what "Find Health Samples" returns
// with as little work on the phone as possible: parallel lists of sample values / start dates / sources (no
// Repeat loops), or pre-totalled days. The server totals per day.
import { z } from 'zod';
import type { PersonId } from '#lib/types.ts';
import { toLocalDate } from '#lib/scoring/index.ts';
import type { Db } from '#lib/server/db/index.ts';
import { ingestWith, toIsoDate, type IngestResult, type ParsedIngest } from '#lib/server/ingest/common.ts';
import { canonicalWorkoutType, isUnknownLocalisedType, workoutKey } from '#lib/server/ingest/workout-names.ts';

/** "8,123", "8123 歩", 8123 → 8123; null if there's no number. */
export function looseNumber(v: unknown): number | null {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  if (typeof v !== 'string') return null;
  const m = v.replace(/[,，\s]/g, '').match(/-?\d+(\.\d+)?/);
  return m ? Number(m[0]) : null;
}

const MONTHS: Record<string, number> = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };

/** Shortcuts' default date text (when no Format Date step is used): English or Japanese locale. */
function shortcutsDefaultDate(v: string): string | null {
  const pad = (n: number | string) => String(n).padStart(2, '0');
  const hm = (h: string, m: string, sec: string | undefined, ap: string | undefined) => {
    let hour = Number(h);
    const a = ap?.toLowerCase();
    if (a === 'pm' || a === '午後') hour = hour % 12 + 12;
    if (a === 'am' || a === '午前') hour = hour % 12;
    return `${pad(hour)}:${m}:${sec ?? '00'}`;
  };
  // "Oct 28, 2026 at 8:10 AM" / "October 28, 2026 at 8:10:05 PM" / "Oct 28, 2026"
  let m = v.match(/^([A-Za-z]{3})[a-z]*\.? (\d{1,2}), (\d{4})(?:,? (?:at )?(\d{1,2}):(\d{2})(?::(\d{2}))?\s*([AaPp][Mm])?)?$/);
  if (m && MONTHS[m[1].toLowerCase()]) {
    const t = m[4] ? hm(m[4], m[5], m[6], m[7]) : '00:00:00';
    return `${m[3]}-${pad(MONTHS[m[1].toLowerCase()])}-${pad(m[2])}T${t}+09:00`;
  }
  // "28 Oct 2026 at 08:10"
  m = v.match(/^(\d{1,2}) ([A-Za-z]{3})[a-z]* (\d{4})(?:,? (?:at )?(\d{1,2}):(\d{2})(?::(\d{2}))?\s*([AaPp][Mm])?)?$/);
  if (m && MONTHS[m[2].toLowerCase()]) {
    const t = m[4] ? hm(m[4], m[5], m[6], m[7]) : '00:00:00';
    return `${m[3]}-${pad(MONTHS[m[2].toLowerCase()])}-${pad(m[1])}T${t}+09:00`;
  }
  // "2026年10月28日 8:10" / "2026年10月28日 午後8:10"
  m = v.match(/^(\d{4})年(\d{1,2})月(\d{1,2})日(?:\s*(午前|午後)?\s*(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/);
  if (m) {
    const t = m[5] ? hm(m[5], m[6], m[7], m[4]) : '00:00:00';
    return `${m[1]}-${pad(m[2])}-${pad(m[3])}T${t}+09:00`;
  }
  return null;
}

/** ISO 8601, `2026-10-28 07:05:00 +0900`, `2026/10/28 7:05`, or Shortcuts' default text (no offset → Tokyo). */
export function looseDate(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  const native = shortcutsDefaultDate(v.trim().replace(/\u202f|\u00a0/g, ' '));
  if (native) return native;
  let s = v.trim().replace(/\//g, '-');
  s = s.replace(/^(\d{4})-(\d{1,2})-(\d{1,2})/, (_, y, m, d) => `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`);
  s = s.replace(/([ T])(\d):/, '$10$2:');
  return toIsoDate(s);
}

/** Shortcuts turns a list into newline-joined text when a Dictionary field is typed as Text: accept both. */
const splitLines = (v: unknown) => (typeof v === 'string' ? (v.trim() === '' ? [] : v.split(/\r?\n/)) : v);
const list = z.preprocess(splitLines, z.array(z.unknown())).default([]);
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
  if (s.values.length > 0 && s.starts.length !== s.values.length) throw new Error(`got ${s.values.length} values but ${s.starts.length} start dates: ${SHAPE_HINT}`);
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

export interface ParsedShortcut extends ParsedIngest { unknownTypes: string[] }

const SHAPE_HINT = 'steps must be {"values": [...], "starts": [...], "sources": [...]} with one start date per value (docs/ops/shortcut-health-sync.md step 12)';

export function parseShortcut(raw: unknown): ParsedShortcut {
  let r = raw as Record<string, unknown> | null;
  // Simple form: {"date": "2026-10-28", "steps": "12\n3\n…"}: every value belongs to that one day. (Filter the
  // samples to one source in the Shortcut, or Watch + iPhone steps are counted twice.)
  const day = typeof r?.date === 'string' ? looseDate(r.date) : null;
  if (r && day) {
    const asSeries = (v: unknown) => {
      const values = splitLines(v);
      return Array.isArray(values) ? { values, starts: values.map(() => day) } : v;
    };
    r = { ...r };
    for (const k of ['steps', 'exercise'] as const) if (typeof r[k] === 'string' || Array.isArray(r[k])) r[k] = asSeries(r[k]);
  }
  for (const k of ['steps', 'exercise'] as const) {
    const v = r?.[k];
    if (typeof v === 'string' || Array.isArray(v)) {
      throw new Error(`${k} has values but no start dates: add "date": "YYYY-MM-DD" for one day, or ${SHAPE_HINT.replace('steps', k)}`);
    }
  }
  const parsed = bodySchema.safeParse(r);
  if (!parsed.success) throw new Error(`unexpected shape: ${parsed.error.issues.map((i) => `${i.path.join('.') || 'body'}: ${i.message}`).join('; ')}`);
  const body = parsed.data;
  if (!body.steps && !body.exercise && !body.days && !body.workouts) throw new Error('no steps, exercise, days or workouts');
  let skipped = 0;
  const skip = () => void skipped++;
  const metrics: ParsedIngest['metrics'] = [];
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
  const workouts: ParsedIngest['workouts'] = [];
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
  });
  return unknownTypes.length ? { ...r, unknownTypes } : r;
}
