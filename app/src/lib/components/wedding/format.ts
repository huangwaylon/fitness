// けっこんしき's date words: a month's heading, a card's month column, a task's due line. Dates are `YYYY-MM-DD`
// calendar days (no zone: the board's today is already the board's).
import { i18n, t } from '#lib/i18n/index.ts';
import type { Task } from './view.ts';

const EN_MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const EN_MONTH = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/** A month's heading: `2027年 6月` / `June 2027`. */
export function monthTitle(ym: string): string {
  const y = ym.slice(0, 4), m = Number(ym.slice(5, 7));
  return t('wed.month', { y, m, mon: EN_MONTH[m - 1] });
}

/** A card's month line: `6月` / `Jun`. */
export const monthShort = (d: string): string => (i18n.locale === 'ja' ? t('wed.monthShort', { m: Number(d.slice(5, 7)) }) : EN_MON[Number(d.slice(5, 7)) - 1]);

/** `6/19` (a start date on a card). */
export const shortDay = (d: string): string => `${Number(d.slice(5, 7))}/${Number(d.slice(8, 10))}`;

/** A card's due line by its state (lib/wedding/progress.ts): past due (coral), soon (within SOON_DAYS), nothing
 *  further out, undated or done. */
export function dueLine(task: Task): { text: string; tone: 'over' | 'soon' } | null {
  const { state, days: n } = task.progress;
  if (n === null) return null;
  if (state === 'overdue') return { text: t('wed.due.over', { n: -n }), tone: 'over' };
  if (state !== 'soon') return null;
  return n === 0 ? { text: t('wed.due.today'), tone: 'soon' } : { text: t('wed.due.soon', { n }), tone: 'soon' };
}
