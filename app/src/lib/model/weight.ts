// Body weight: each person's weigh-ins. Shown only: nothing here feeds the ベル economy (bells.ts never imports this
// file, and weight rows live in their own State maps).
//
// A day's weight is its latest ingested row stamped at or before T. The Shortcut sends the day's Body Mass from Apple
// Health (relay/src/parse.ts), and the server appends a row whenever it differs from the day's last row, so the latest
// row is the current one (unlike steps, which take the max).
import type { LocalDate, PersonId } from '#lib/types.ts';
import { daysBetween, localDateAt } from '#lib/time/dates.ts';
import { latestAt, type State } from './state.ts';

export interface WeighIn { date: LocalDate; kg: number }

/** Every day with a weight as of T (none after T's own date), ascending: each day's latest row stamped at or before T. */
export function weighIns(s: State, p: PersonId, t: number): WeighIn[] {
  const today = localDateAt(t);
  const out: WeighIn[] = [];
  for (const date of [...s.weights[p].keys()].sort()) {
    if (date > today) continue;
    const kg = latestAt(s.weights[p].get(date), t);
    if (kg !== undefined) out.push({ date, kg });
  }
  return out;
}

/** The trend line's half-window: days either side of a measurement (体重's line, model/pace.ts; the からだ cards' change,
 *  model/health.ts dotStats). */
const SMOOTH_DAYS = 21;

/** The line through the weigh-ins (ascending): at each, a weighted least-squares line over the weigh-ins within
 *  SMOOTH_DAYS days of it (tricube weights by days apart), evaluated there; alone in its window: its own weight. */
export function smoothLine(ws: readonly WeighIn[]): WeighIn[] {
  const h = SMOOTH_DAYS + 1, xs = ws.map((w) => daysBetween(ws[0]?.date ?? '2000-01-01', w.date));
  const out: WeighIn[] = [];
  for (let i = 0, lo = 0; i < ws.length; i++) {
    while (xs[i] - xs[lo] > SMOOTH_DAYS) lo++;
    let sw = 0, sx = 0, sy = 0, sxx = 0, sxy = 0;
    for (let j = lo; j < ws.length && xs[j] - xs[i] <= SMOOTH_DAYS; j++) {
      const d = xs[j] - xs[i], u = Math.abs(d) / h, v = 1 - u * u * u, w = v * v * v;
      sw += w, sx += w * d, sy += w * ws[j].kg, sxx += w * d * d, sxy += w * d * ws[j].kg;
    }
    // the fit at d = 0: its intercept (a single day: the weighted mean)
    const den = sw * sxx - sx * sx;
    out.push({ date: ws[i].date, kg: den > 1e-9 ? (sy * sxx - sx * sxy) / den : sy / sw });
  }
  return out;
}
