// Body weight: each person's weigh-ins. Shown only: nothing here feeds the ベル economy (bells.ts never imports this
// file, and weight rows live in their own State maps).
//
// A day's weight is its latest ingested row stamped at or before T. The Shortcut sends the day's Body Mass from Apple
// Health (relay/src/parse.ts), and the server appends a row whenever it differs from the day's last row, so the latest
// row is the current one (unlike steps, which take the max).
import type { LocalDate, PersonId } from '#lib/types.ts';
import { localDateAt } from '#lib/time/dates.ts';
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
