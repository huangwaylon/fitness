// けっこんしき's date words: a month's heading, a card's month column, a task's due line. Dates are `YYYY-MM-DD`
// calendar days (no zone: the board's today is already the board's).
import { t } from '#lib/i18n/index.ts';
import type { Task } from './view.ts';

const EN_MONTH = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const words = (m: number) => ({ m, mon: EN_MONTH[m - 1], short: EN_MONTH[m - 1].slice(0, 3) });

/** A month's heading: `2027年 6月` / `June 2027`. */
export const monthTitle = (ym: string): string => t('wed.month', { y: ym.slice(0, 4), ...words(Number(ym.slice(5, 7))) });

/** A card's month line: `6月` / `Jun`. */
export const monthShort = (d: string): string => t('wed.monthShort', words(Number(d.slice(5, 7))));

/** A card's due line by its state (lib/wedding/progress.ts): past due (coral), soon (within SOON_DAYS), nothing
 *  further out, undated or done. */
export function dueLine(task: Task): { text: string; tone: 'over' | 'soon' } | null {
  const { state, days: n } = task.progress;
  if (n === null) return null;
  if (state === 'overdue') return { text: t(n === -1 ? 'wed.due.over1' : 'wed.due.over', { n: -n }), tone: 'over' };
  if (state !== 'soon') return null;
  return { text: n === 0 ? t('wed.due.today') : t(n === 1 ? 'wed.due.soon1' : 'wed.due.soon', { n }), tone: 'soon' };
}
