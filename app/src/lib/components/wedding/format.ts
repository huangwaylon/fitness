// けっこんしき's due line (its months: i18n/format.ts monthLabel). Dates are `YYYY-MM-DD` calendar days (no zone: the
// board's today is already the board's).
import { t } from '#lib/i18n/index.ts';
import type { Task } from './view.ts';


/** A row's due line by its state (lib/wedding/progress.ts): past due (coral), soon (within SOON_DAYS), nothing
 *  further out, undated or done. */
export function dueLine(task: Task): { text: string; tone: 'over' | 'soon' } | null {
  const { state, days: n } = task.progress;
  if (n === null) return null;
  if (state === 'overdue') return { text: t(n === -1 ? 'wed.due.over1' : 'wed.due.over', { n: -n }), tone: 'over' };
  if (state !== 'soon') return null;
  return { text: n === 0 ? t('wed.due.today') : t(n === 1 ? 'wed.due.soon1' : 'wed.due.soon', { n }), tone: 'soon' };
}
