// The Shortcut's workouts (docs/ops/shortcut-health-sync.md "Workouts"): two optional Text lists, one line per
// workout, from Find Workouts → Get Details of Workouts:
//
//   "workout_types": "High Intensity Interval Training\nCore Training\n…",   its Type (English or Japanese)
//   "workout_dates": "Nov 19, 2026 at 7:10 AM\n…"                            its Start Date (Shortcuts' date text)
//
// Only two kinds are kept, counted per Tokyo day (the date text is the phone's, Tokyo's: its calendar day): HIIT →
// `hiit_n`, Core Training → `core_n` (contract/checks.ts: the tree popup's HIIT and Core). Every other type is read
// past and never stored. A day with none of a kind writes nothing (a deleted workout stays counted: the popup's check
// can be unset by hand). Pure.
import { METRIC_BOUNDS, type WorkoutMetric } from '../../app/src/lib/contract/api.ts';
import { shortcutDate, ShapeError } from './parse.ts';

/** A workout type as Shortcuts writes it (English or Japanese, or HealthKit's name), squashed: lower case, no spaces,
 *  dashes or dots. */
const squash = (s: string) => s.toLowerCase().replace(/^hkworkoutactivitytype/, '').replace(/[\s\-_.・]/g, '');
const KINDS: Record<string, WorkoutMetric> = {
  highintensityintervaltraining: 'hiit_n', hiit: 'hiit_n', 高強度インターバルトレーニング: 'hiit_n',
  coretraining: 'core_n', core: 'core_n', コアトレーニング: 'core_n'
};
/** A workout type's metric, or null (a kind not kept). @public (relay/test) */
export const workoutKind = (type: string): WorkoutMetric | null => KINDS[squash(type)] ?? null;

const lines = (v: unknown, field: string): string[] => {
  if (typeof v !== 'string') throw new ShapeError(`${field}: expected Text (one line per workout)`);
  return v === '' ? [] : v.split('\n').map((l) => l.trim());
};

/** The body's workouts as metric rows (one per day and kind, its count), or null when it sends none. A list without
 *  its pair, or of another length, is dropped with a warning. */
export function parseWorkouts(body: Record<string, unknown>, warnings: string[]): { metrics: { date: string; metric: WorkoutMetric; value: number }[]; skipped: number } | null {
  if (body.workout_types === undefined && body.workout_dates === undefined) return null;
  const types = body.workout_types === undefined ? null : lines(body.workout_types, 'workout_types');
  const dates = body.workout_dates === undefined ? null : lines(body.workout_dates, 'workout_dates');
  if (!types || !dates || types.length !== dates.length) {
    warnings.push(`workouts: ${types?.length ?? 0} types but ${dates?.length ?? 0} dates; workouts not saved`);
    return { metrics: [], skipped: 0 };
  }
  const count = new Map<string, number>();
  let skipped = 0;
  types.forEach((type, i) => {
    const metric = workoutKind(type);
    if (!metric) return;
    const day = shortcutDate(dates[i]);
    if (!day) { skipped++; return; }
    const k = `${day}|${metric}`;
    count.set(k, (count.get(k) ?? 0) + 1);
  });
  const metrics = [...count].flatMap(([k, value]) => {
    const [date, metric] = k.split('|') as [string, WorkoutMetric];
    if (value <= METRIC_BOUNDS[metric]) return [{ date, metric, value }];
    skipped++;
    warnings.push(`workouts: ${value} ${metric} on ${date} is above ${METRIC_BOUNDS[metric]}; skipped`);
    return [];
  });
  return { metrics, skipped };
}
