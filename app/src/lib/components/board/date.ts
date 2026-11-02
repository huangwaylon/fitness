// A board post's date as its note shows it: NH's month/day (Tokyo's).
import { jst } from '#lib/time/clock.ts';

export function postDate(ms: number): string {
  const d = jst(new Date(ms));
  return `${d.month}/${d.day}`;
}
