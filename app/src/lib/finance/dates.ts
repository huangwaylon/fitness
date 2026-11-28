// The money app's months, on Tokyo's calendar (contract/tokyo.ts): an entry's date is a plain `YYYY-MM-DD`, a month a
// `YYYY-MM` (contract/finance.ts isMonthKey), and every step here is string or number arithmetic, never a Date in the
// device's zone (ported from the shared-expense app's dates.js, whose local Dates shifted a day west of UTC). Pure.
import { isMonthKey } from '#lib/contract/finance.ts';
import { localDateAt } from '#lib/contract/tokyo.ts';

const pad = (n: number): string => String(n).padStart(2, '0');

/** Tokyo's month of an instant (ms), `YYYY-MM`. */
export const monthAt = (ms: number): string => localDateAt(ms).slice(0, 7);

/** A month's number, 1–12 (a template's `months` list holds these), or null for anything not a month. */
export const monthNumber = (month: unknown): number | null => (isMonthKey(month) ? Number(month.slice(5, 7)) : null);

/** A month `n` months on (n < 0: back); '' for anything not a month. */
export function shiftMonth(month: string, n: number): string {
  if (!isMonthKey(month)) return '';
  const i = Number(month.slice(0, 4)) * 12 + Number(month.slice(5, 7)) - 1 + n;
  return `${String(Math.floor(i / 12)).padStart(4, '0')}-${pad((((i % 12) + 12) % 12) + 1)}`;
}

/** A month's days: 28–31, February's by the Gregorian leap rule. */
function daysIn(month: string): number {
  const y = Number(month.slice(0, 4)), m = Number(month.slice(5, 7));
  if (m === 2) return y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0) ? 29 : 28;
  return m === 4 || m === 6 || m === 9 || m === 11 ? 30 : 31;
}

/** A day of a month as its date, clamped to the month's last (a template's 31st is February's 28th or 29th, never
 *  March's 3rd); a day that isn't an integer is the 1st. '' for anything not a month. */
export function dayInMonth(month: string, day: number): string {
  if (!isMonthKey(month)) return '';
  const d = Math.min(Math.max(Number.isInteger(day) ? day : 1, 1), daysIn(month));
  return `${month}-${pad(d)}`;
}
