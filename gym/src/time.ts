// Tokyo time, as the bot reads and saves it. A day is 'YYYY-MM-DD' and a clock time 'HH:MM': both compare as text.
// An instant is ms since the epoch, saved as ISO with +09:00 ('2026-11-12T11:30:00+09:00').

export type Day = string;
export type Clock = string;

const JST_MS = 9 * 3_600_000;
const DAY_MS = 86_400_000;

/** The Tokyo day of an instant. */
export const dayOf = (ms: number): Day => new Date(ms + JST_MS).toISOString().slice(0, 10);

/** The Tokyo clock time of an instant (seconds dropped). */
export const clockOf = (ms: number): Clock => new Date(ms + JST_MS).toISOString().slice(11, 16);

/** The instant of a Tokyo day and clock time. */
export const at = (day: Day, clock: Clock): number => Date.parse(`${day}T${clock}:00+09:00`);

/** An instant as ISO in Tokyo time, to the second. */
export const isoJst = (ms: number): string => `${new Date(ms + JST_MS).toISOString().slice(0, 19)}+09:00`;

export const addDays = (day: Day, n: number): Day => new Date(Date.parse(day) + n * DAY_MS).toISOString().slice(0, 10);

/** 0 = Monday … 6 = Sunday. */
export const weekday = (day: Day): number => (new Date(day).getUTCDay() + 6) % 7;

export const minutesOf = (clock: Clock): number => Number(clock.slice(0, 2)) * 60 + Number(clock.slice(3, 5));

/** Minutes since midnight as a clock time (kept within the day: 23:59 at most). */
export const clockFrom = (minutes: number): Clock => {
  const m = Math.max(0, Math.min(minutes, 24 * 60 - 1));
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
};
