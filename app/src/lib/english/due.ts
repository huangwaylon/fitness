// The leaf menu's 英語 dot (review 11-24): a calm leaf dot on the pill while today has no まとめ yet and this week
// hasn't its 3 days (progress.ts WEEK_TARGET), a pull back to English with no push (the island stays push-free).
// Kept tiny and apart from progress.ts: the menu is in the island's first load.
import { listenOf } from '#lib/contract/listen.ts';
import { listensOf } from './listens.ts';
import type { EventRow } from '#lib/contract/api.ts';
import type { LocalDate, Who } from '#lib/types.ts';

/** Whether `me` has English Study to do today: no まとめ today and under 3 days this week (weeks start on Monday). */
export function englishDue(rows: readonly EventRow[], me: Who, today: LocalDate): boolean {
  const t = Date.parse(`${today}T00:00:00Z`);
  const monday = new Date(t - ((new Date(t).getUTCDay() + 6) % 7) * 86_400_000).toISOString().slice(0, 10);
  const days = new Set<string>();
  for (const row of listensOf(rows, me, listenOf)) if (row.f === 1 && row.d >= monday && row.d <= today) days.add(row.d);
  return !days.has(today) && days.size < 3;
}
