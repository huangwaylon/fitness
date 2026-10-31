// NH's dated events on the island (docs/design.md "Halloween", "Holiday hosts"): a date rule per event, on the Tokyo
// calendar, with the hour its main part starts (Halloween's evening; a host's arrival). Pure. Every rule verified on
// Nookipedia: Halloween Oct 31 (Jack 17:00–24:00); Turkey Day the fourth Thursday of November (Franklin 09:00–24:00);
// Toy Day Dec 24 (Jingle, all day in NH); Festivale on Shrove Monday, 48 days before Easter (Pavé, all day); Bunny Day
// on Easter Sunday, its celebrations the seven days before (Zipper on the first and the last day, eggs all week).
// Another event is one more rule here, and whatever it shows reads `eventAt`. `?event=<id>` (dev or ?demo) forces one
// on, its main part included.

export type EventId = 'halloween' | 'turkey-day' | 'toy-day' | 'festivale' | 'bunny-day' | 'bunny-week';

interface Rule {
  /** Whether a Tokyo date (YYYY-MM-DD) is its day. */
  on: (date: string) => boolean;
  /** The hour (Tokyo) its main part starts (the evening, the host's arrival); it runs to midnight. */
  night: number;
}

const ymd = (date: string): [number, number, number] => date.split('-').map(Number) as [number, number, number];
const iso = (y: number, m: number, d: number): string => `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
const shift = (date: string, days: number): string => {
  const [y, m, d] = ymd(date);
  const t = new Date(Date.UTC(y, m - 1, d + days));
  return iso(t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate());
};

/** A fixed day every year, 'MM-DD'. */
const fixedDay = (md: string) => (date: string): boolean => date.slice(5) === md;

/** The date of the `n`th `weekday` (0 = Sunday) of a month. */
export function nthWeekday(year: number, month: number, weekday: number, n: number): string {
  const first = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  return iso(year, month, 1 + ((weekday - first + 7) % 7) + (n - 1) * 7);
}

/** Western Easter Sunday of a year (the Gregorian computus, Meeus/Jones/Butcher). */
export function easter(year: number): string {
  const a = year % 19, b = Math.floor(year / 100), c = year % 100, d = Math.floor(b / 4), e = b % 4;
  const f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31), day = ((h + l - 7 * m + 114) % 31) + 1;
  return iso(year, month, day);
}
/** Days from that year's Easter Sunday (negative: before). */
const fromEaster = (date: string): number => {
  const [y] = ymd(date);
  const [ey, em, ed] = ymd(easter(y));
  const [, m, d] = ymd(date);
  return Math.round((Date.UTC(y, m - 1, d) - Date.UTC(ey, em - 1, ed)) / 86_400_000);
};

/** Turkey Day: the fourth Thursday of November. */
export const turkeyDay = (year: number): string => nthWeekday(year, 11, 4, 4);
/** Festivale: Shrove Monday, the Monday before Ash Wednesday (48 days before Easter). */
export const festivale = (year: number): string => shift(easter(year), -48);

// the order is the priority when two fall on one day (Bunny Day's Zipper days before its week)
const RULES: Record<EventId, Rule> = {
  halloween: { on: fixedDay('10-31'), night: 17 },
  'turkey-day': { on: (d) => d === turkeyDay(ymd(d)[0]), night: 9 },
  'toy-day': { on: fixedDay('12-24'), night: 5 },
  festivale: { on: (d) => d === festivale(ymd(d)[0]), night: 5 },
  'bunny-day': { on: (d) => fromEaster(d) === 0 || fromEaster(d) === -7, night: 5 },
  'bunny-week': { on: (d) => fromEaster(d) > -7 && fromEaster(d) < 0, night: 24 }
};
const IDS = Object.keys(RULES) as EventId[];

export interface EventNow {
  id: EventId;
  /** Its main part (Halloween: Jack, the lit jack-o'-lanterns, the villagers' lines; a host's day: the host). */
  night: boolean;
}

/** The event on a Tokyo date (YYYY-MM-DD) at a Tokyo hour, or null. `force`: an event id to have on (the dev hook). */
export function eventAt(date: string, hour: number, force?: string | null): EventNow | null {
  if (force && IDS.includes(force as EventId)) return { id: force as EventId, night: RULES[force as EventId].night < 24 };
  const id = IDS.find((k) => RULES[k].on(date));
  return id ? { id, night: hour >= RULES[id].night } : null;
}

/** Bunny Day's celebrations (its week and its two Zipper days): eggs turn up. */
export const eggTime = (ev: EventNow | null): boolean => ev?.id === 'bunny-day' || ev?.id === 'bunny-week';

/** The forced event of `?event=<id>` (dev or ?demo), or null. */
export function forcedEvent(): string | null {
  if (typeof location === 'undefined') return null;
  const q = new URLSearchParams(location.search);
  return import.meta.env.DEV || q.has('demo') ? q.get('event') : null;
}
