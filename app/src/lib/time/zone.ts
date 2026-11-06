// Wall clocks in a named zone (IANA): a trip's own (りょこう, components/travel/when.ts: its dates and row times are
// local to the trip's zone) and the wedding board's (けっこんしき: its today, turning at the venue's midnight). One
// formatter a zone, cached (a zone name that isn't one: null), read into its parts; everything else is arithmetic.
// Pure: an instant (ms) is handed in.

/** The board's zone when it has none (or names none that exists). */
const FALLBACK_TIME_ZONE = 'Asia/Tokyo';

const fmts = new Map<string, Intl.DateTimeFormat | null>();
function fmtOf(tz: string): Intl.DateTimeFormat | null {
  let f = fmts.get(tz);
  if (f === undefined) {
    try {
      f = new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' });
    } catch {
      f = null;
    }
    fmts.set(tz, f);
  }
  return f;
}

/** An instant's wall clock in a zone, by part (a zone that isn't one throws, as Intl does). */
function parts(tz: string, ms: number): { y: number; mo: number; d: number; h: number; mi: number; s: number } {
  const f = fmtOf(tz);
  if (!f) throw new RangeError(`Invalid time zone: ${tz}`);
  const o: Record<string, number> = {};
  for (const p of f.formatToParts(ms)) if (p.type !== 'literal') o[p.type] = Number(p.value);
  return { y: o.year, mo: o.month, d: o.day, h: o.hour % 24, mi: o.minute, s: o.second };
}

/** The zone's offset from UTC at an instant (ms; Tokyo +9 h). */
function offsetOf(tz: string, ms: number): number {
  const p = parts(tz, ms);
  return Date.UTC(p.y, p.mo - 1, p.d, p.h, p.mi, p.s) - Math.floor(ms / 1000) * 1000;
}

const pad = (n: number) => String(n).padStart(2, '0');

/** The wall clock of an instant in a zone: `YYYY-MM-DD` and the minutes after midnight. */
export function wallIn(tz: string, ms: number): { date: string; min: number } {
  const p = parts(tz, ms);
  return { date: `${p.y}-${pad(p.mo)}-${pad(p.d)}`, min: p.h * 60 + p.mi };
}

/** The instant a local wall time in `tz` is (`date` YYYY-MM-DD, `min` minutes after its midnight, may run past 24 h
 *  or below 0). Across a DST change: a wall time the jump skips (02:30 as Auckland's clocks spring 02:00 → 03:00)
 *  is read on the old offset, so it lands where the clock reads an hour on (03:30); one the fall-back repeats
 *  (02:30 as they go 03:00 → 02:00) is its first, still on summer time. (No zone changes twice within a day.) */
export function instantIn(tz: string, date: string, min: number): number {
  const [y, mo, d] = date.split('-').map(Number);
  const wall = Date.UTC(y, mo - 1, d) + min * 60_000;
  const before = offsetOf(tz, wall - 86_400_000), after = offsetOf(tz, wall + 86_400_000);
  const fits = [before, after].map((o) => wall - o).filter((at) => wall - offsetOf(tz, at) === at);
  return fits.length ? Math.min(...fits) : wall - before;
}

/** The zone a setting names, else Asia/Tokyo (a board with none, or a name no zone has). */
export function resolveTimeZone(name: unknown): string {
  return typeof name === 'string' && name !== '' && fmtOf(name) ? name : FALLBACK_TIME_ZONE;
}

/** Today's date (YYYY-MM-DD) in a zone (resolveTimeZone's). `nowMs` is passed in (the relay's clock). */
export const todayIn = (tz: unknown, nowMs: number): string => wallIn(resolveTimeZone(tz), nowMs).date;

const HOUR_MS = 3_600_000;

/** Ms from `nowMs` to the next midnight in a zone (resolveTimeZone's), at most an hour (a day a clock change shortens
 *  or lengthens: the caller looks again, todayIn deciding). */
export function untilMidnight(tz: unknown, nowMs: number): number {
  const p = parts(resolveTimeZone(tz), nowMs);
  const into = ((p.h * 60 + p.mi) * 60 + p.s) * 1000 + (((nowMs % 1000) + 1000) % 1000);
  return Math.max(1, Math.min(24 * HOUR_MS - into, HOUR_MS));
}
