// Parser of the iOS Shortcut's health body (docs/ops/shortcut-health-sync.md §1). One format, the one the
// Shortcut sends (read from the `uploads` log, 2026-10-30): daily totals as newline-joined Text, one line per day.
//
//   { "key": "…", "action": "ingest",
//     "dates": "Sep 30, 2026 at 8:59 AM\n…",   one line per day (Shortcuts' date text; only the calendar day is used)
//     "steps": "8564\n…",                       that day's total
//     "exercise_minutes": "22\n…",              that day's total
//     "calories": "251.3\n…",                   that day's active energy in kcal (the Move ring) → metric move_kcal
//     "stand_minutes": "58\n…",                 that day's Stand Time in minutes → metric stand_min
//     "weight": "0\n68.4\n…" }                 that day's Body Mass in kg; 0 = no weigh-in
//
// Other fields are ignored (an old Shortcut's `workouts` too). Every daily field is optional. A list whose length differs from `dates` is dropped with a
// warning and the rest is kept; a value above METRIC_BOUNDS (e.g. kcal > 10,000, stand > 1,440) is skipped. It runs in Apps Script (bundled into apps-script/Code.js) and in Node tests: plain ES2019 only.
import { isRec, METRIC_BOUNDS, roundKg, WEIGHT_KG, type MetricKey } from '../src/lib/contract/api.ts';

interface ParsedMetric { date: string; metric: MetricKey; value: number }
interface ParsedBody {
  metrics: ParsedMetric[];
  /** Lines dropped because a value or date was unreadable. */
  skipped: number;
  /** Lists that were dropped (and why), while the rest of the body was kept. */
  warnings: string[];
}

/** Thrown for a body with the wrong shape; the message says what to fix in the Shortcut. */
export class ShapeError extends Error {}

// ---------------------------------------------------------------- dates

const MONTHS: Record<string, number> = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };
const pad = (n: number | string) => String(n).padStart(2, '0');

/**
 * Shortcuts' date text in the phone's language and zone (Tokyo), English or Japanese:
 * "Sep 30, 2026 at 8:59 AM", "2026/09/30 8:59", "2026年9月30日 午後8:59". Returns the calendar day (`YYYY-MM-DD`), or null
 * for text that isn't a real date and time (Feb 30, 8:61).
 */
export function shortcutDate(v: string): string | null {
  const s = v.trim().replace(/[  ]/g, ' ');
  const en = s.match(/^([A-Za-z]{3})[a-z]*\.? (\d{1,2}), (\d{4})(?:,? (?:at )?(\d{1,2}):(\d{2})(?::(\d{2}))?\s*([AaPp][Mm])?)?$/);
  const ja = s.match(/^(\d{4})[/年](\d{1,2})[/月](\d{1,2})日?(?:\s*(午前|午後)?\s*(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/);
  let y: string, mo: number, d: string, h: string | undefined, mi: string | undefined, sec: string | undefined, ap: string | undefined;
  if (en && MONTHS[en[1].toLowerCase()]) [y, mo, d, h, mi, sec, ap] = [en[3], MONTHS[en[1].toLowerCase()], en[2], en[4], en[5], en[6], en[7]?.toLowerCase()];
  else if (ja) [y, mo, d, ap, h, mi, sec] = [ja[1], Number(ja[2]), ja[3], ja[4], ja[5], ja[6], ja[7]];
  else return null;
  let hour = Number(h ?? 0);
  if (ap === 'pm' || ap === '午後') hour = (hour % 12) + 12;
  if (ap === 'am' || ap === '午前') hour %= 12;
  const day = `${y}-${pad(mo)}-${pad(d)}`;
  // A real calendar day (no Feb 30) and a real time (no 08:59:75): anything else isn't what Shortcuts writes.
  if (new Date(Date.UTC(Number(y), mo - 1, Number(d))).toISOString().slice(0, 10) !== day || hour > 23 || Number(mi ?? 0) > 59 || Number(sec ?? 0) > 59) return null;
  return day;
}

// ---------------------------------------------------------------- body

/** A Text field → its lines ('' = no lines). */
function lines(v: unknown, field: string): string[] {
  if (typeof v !== 'string') throw new ShapeError(`${field}: expected Text (one line per item)`);
  return v === '' ? [] : v.split('\n').map((l) => l.trim());
}

/** A non-negative number written as plain digits ("8564", "22", "68.4"); null otherwise. */
const amount = (s: string): number | null => (/^\d+(\.\d+)?$/.test(s) ? Number(s) : null);

const COLUMNS = [
  { field: 'steps', metric: 'steps' },
  { field: 'exercise_minutes', metric: 'exercise_min' },
  { field: 'calories', metric: 'move_kcal' },
  { field: 'stand_minutes', metric: 'stand_min' },
  { field: 'weight', metric: 'weight' }
] as const;

/** Parse a Shortcut body (already JSON-parsed). Throws ShapeError when nothing usable or the shape is wrong. */
export function parseShortcut(body: unknown): ParsedBody {
  if (!isRec(body)) throw new ShapeError('body: expected a JSON object');
  const warnings: string[] = [];
  let skipped = 0;
  const metrics: ParsedMetric[] = [];
  const days = body.dates === undefined ? [] : lines(body.dates, 'dates').map(shortcutDate);
  const sent = COLUMNS.filter(({ field }) => body[field] !== undefined);

  for (const { field, metric } of sent) {
    const values = lines(body[field], field);
    if (values.length !== days.length) {
      warnings.push(`${field}: ${values.length} lines but ${days.length} dates; ${field} not saved`);
      continue;
    }
    values.forEach((raw, i) => {
      const day = days[i];
      const n = amount(raw);
      if (!day || n === null) { skipped++; return; }
      if (metric !== 'weight') {
        // a ceiling: one bad line must not become the day's permanent maximum
        const v = Math.round(n);
        if (v > METRIC_BOUNDS[metric]) { skipped++; warnings.push(`${field}: ${v} on ${day} is above ${METRIC_BOUNDS[metric]}; skipped`); return; }
        metrics.push({ date: day, metric, value: v });
        return;
      }
      if (n === 0) return; // no weigh-in that day
      const kg = roundKg(n);
      if (kg < WEIGHT_KG.min || kg > WEIGHT_KG.max) { skipped++; return; }
      metrics.push({ date: day, metric, value: kg });
    });
  }

  if (!sent.length) throw new ShapeError('nothing to save: send dates with steps, exercise_minutes, calories, stand_minutes or weight');
  return { metrics, skipped, warnings };
}
